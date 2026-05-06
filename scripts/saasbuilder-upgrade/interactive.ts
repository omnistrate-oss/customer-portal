import { checkbox, confirm, input, password, select } from "@inquirer/prompts";

import {
  ENV_CONFIG,
  EnvKey,
  IMAGE_PREFIX,
  Instance,
  MODIFY_DELAY_MS,
  UpgradePath,
  createUpgradePath,
  fetchImageParam,
  groupByImage,
  listAllInstances,
  listInstancesByVersion,
  listVersionSets,
  modifyInstance,
  patchImageParam,
  releaseVersion,
  signIn,
  sleep,
  waitForUpgrade,
  withBackoffRetry,
} from "./lib";

async function loginWithRetry(apiBase: string): Promise<string> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const email = (await input({ message: "Omnistrate email:" })).trim();
    const pw = await password({ message: "Omnistrate password:", mask: "*" });
    try {
      const token = await signIn(apiBase, email, pw);
      console.log("  signed in\n");
      return token;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  login failed (${attempt}/3): ${msg}\n`);
    }
  }
  throw new Error("Unable to sign in after 3 attempts");
}

async function main() {
  console.log("\nSaaSBuilder Upgrade Tool\n");

  const envKey = await select<EnvKey>({
    message: "Which environment?",
    choices: [
      { name: ENV_CONFIG.dev.label, value: "dev" },
      { name: ENV_CONFIG.prod.label, value: "prod" },
    ],
  });
  const cfg = ENV_CONFIG[envKey];

  console.log(`\nSigning in to ${cfg.apiBase}`);
  const token = await loginWithRetry(cfg.apiBase);

  const version = (
    await input({
      message: "New image tag (e.g. 0.3.116):",
      validate: function (v) {
        return v.trim() ? true : "Required";
      },
    })
  ).trim();
  const newImage = `${IMAGE_PREFIX}:${version}`;
  const versionSetName = `Image v${version}`;

  console.log(`\nStep 1: update imageName default to '${newImage}'`);
  if (
    await confirm({
      message: `PATCH imageName param to '${newImage}'?`,
      default: true,
    })
  ) {
    const current = await fetchImageParam(cfg, token);
    console.log(`  current default: ${current.defaultValue}`);
    await patchImageParam(cfg, token, current, newImage);
    console.log("  updated");
  } else {
    console.log("  skipped");
  }

  console.log(`\nStep 2: release new version set '${versionSetName}'`);
  if (
    await confirm({
      message: `POST release with name '${versionSetName}' (Major, preferred)?`,
      default: true,
    })
  ) {
    await releaseVersion(cfg, token, versionSetName);
    console.log("  released");
  } else {
    console.log("  skipped");
  }

  console.log("\nStep 3: pick a source version to upgrade instances from");
  const versions = await listVersionSets(cfg, token);
  if (versions.length === 0) {
    console.log("  no version sets found");
    return;
  }
  const sourceVersion = await select<string>({
    message: "Source version (upgrade FROM):",
    choices: versions.map(function (v) {
      const count = typeof v.instanceCount === "number" ? v.instanceCount : 0;
      return {
        name: `${v.name}  —  v${v.version}  [${v.status}]  instances=${count}`,
        value: v.version,
      };
    }),
  });

  const releasedMatch = versions.find(function (v) {
    return v.name === versionSetName;
  });
  const targetVersions = versions.filter(function (v) {
    return v.version !== sourceVersion;
  });
  if (targetVersions.length === 0) {
    console.log("  no other version sets available to upgrade to; stopping");
    return;
  }
  const targetChoice = await select<string>({
    message: "Target version (upgrade TO):",
    choices: targetVersions.map(function (v) {
      return {
        name: `${v.name}  —  v${v.version}  [${v.status}]`,
        value: v.version,
      };
    }),
    default: releasedMatch && releasedMatch.version !== sourceVersion ? releasedMatch.version : undefined,
  });

  console.log(`\nStep 4: list RUNNING instances on v${sourceVersion}`);
  const sourceInstances = await listInstancesByVersion(cfg, token, sourceVersion);
  const running = sourceInstances.filter(function (i) {
    const cri = i.consumptionResourceInstanceResult;
    return !!cri && cri.status === "RUNNING" && !!cri.id;
  });
  console.log(`  found ${sourceInstances.length} total, ${running.length} RUNNING (upgrading only RUNNING)`);

  let upgradePath: UpgradePath | null = null;
  if (running.length === 0) {
    console.log("  no RUNNING instances to upgrade; skipping upgrade step");
  } else {
    const ids = running.map(function (i) {
      return (i.consumptionResourceInstanceResult as { id: string }).id;
    });
    for (const id of ids) console.log(`    - ${id}`);
    if (
      await confirm({
        message: `Create upgrade-path v${sourceVersion} → v${targetChoice} for ${ids.length} instance(s)? (customers will be notified)`,
        default: true,
      })
    ) {
      upgradePath = await createUpgradePath(cfg, token, sourceVersion, targetChoice, ids);
      console.log(`  created upgradePathId=${upgradePath.upgradePathId}`);
      upgradePath = await waitForUpgrade(cfg, token, upgradePath.upgradePathId);
      const upper = upgradePath.status.toUpperCase();
      if (upper !== "COMPLETE" && upper !== "COMPLETED") {
        const go = await confirm({
          message: `Upgrade finished as ${upgradePath.status}. Continue to modify step anyway?`,
          default: false,
        });
        if (!go) {
          console.log("  aborting");
          return;
        }
      } else {
        console.log("  upgrade complete");
      }
    } else {
      console.log("  skipped upgrade");
    }
  }

  console.log("\nStep 5: modify instances (update imageName input param)");
  if (
    !(await confirm({
      message: "Proceed to modify-instances step?",
      default: true,
    }))
  ) {
    console.log("  done (stopped before modify)");
    return;
  }

  const all = await listAllInstances(cfg, token);
  const groups = groupByImage(all);
  const groupEntries = Array.from(groups.entries()).sort(function (a, b) {
    return b[1].length - a[1].length;
  });
  console.log("\n  image groups:");
  for (const entry of groupEntries) {
    const img = entry[0];
    const insts = entry[1];
    console.log(`    ${insts.length.toString().padStart(3)}  ${img}`);
  }

  const selectableEntries = groupEntries.filter(function (entry) {
    return entry[0] !== newImage;
  });
  if (selectableEntries.length === 0) {
    console.log(`\n  all instances are already on '${newImage}'; nothing to modify`);
    return;
  }

  const selectedImages = await checkbox<string>({
    message: `Select image groups to modify to '${newImage}':`,
    choices: groupEntries.map(function (entry) {
      const img = entry[0];
      const insts = entry[1];
      return {
        name: `${img}  (${insts.length} instance${insts.length === 1 ? "" : "s"})`,
        value: img,
        disabled: img === newImage ? "already on target image" : false,
      };
    }),
    required: true,
  });

  const toModify: Instance[] = [];
  for (const img of selectedImages) {
    const list = groups.get(img);
    if (list) for (const inst of list) toModify.push(inst);
  }
  const modifiableIds: string[] = [];
  for (const inst of toModify) {
    const cri = inst.consumptionResourceInstanceResult;
    if (cri && cri.id) modifiableIds.push(cri.id);
  }

  console.log(`\n  will modify ${modifiableIds.length} instance(s) to '${newImage}'`);
  if (
    !(await confirm({
      message: `Modify ${modifiableIds.length} instance(s)?`,
      default: true,
    }))
  ) {
    console.log("  aborted");
    return;
  }

  let ok = 0;
  let failed = 0;
  for (const id of modifiableIds) {
    try {
      await withBackoffRetry(function () {
        return modifyInstance(cfg, token, id, newImage);
      }, id);
      ok++;
      console.log(`    ✓ ${id}`);
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message.split("\n")[0] : String(err);
      console.error(`    ✗ ${id}: ${msg}`);
    }
    await sleep(MODIFY_DELAY_MS);
  }

  console.log(`\nDone. modified=${ok} failed=${failed}`);
}

main().catch(function (err) {
  const name = err && typeof err === "object" && "name" in err ? (err as { name?: string }).name : undefined;
  if (name === "ExitPromptError") {
    console.log("\nCancelled.");
    process.exit(130);
  }
  const msg = err instanceof Error ? err.message : String(err);
  console.error("\nError:", msg);
  process.exit(1);
});

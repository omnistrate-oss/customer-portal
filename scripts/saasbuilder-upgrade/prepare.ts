import { appendFileSync, writeFileSync } from "node:fs";

import {
  ApiError,
  ENV_CONFIG,
  envFlag,
  fetchImageParam,
  getInstanceImageName,
  groupByImage,
  IMAGE_PREFIX,
  listAllInstances,
  listVersionSets,
  parseEnvKey,
  patchImageParam,
  releaseVersion,
  requireEnv,
  signIn,
  withBackoffRetry,
} from "./lib";

// Repo is public — never put full API URLs/response bodies in messages that
// reach the public Actions log. Reduce errors to status/name only.
function sanitizeError(err: unknown): string {
  if (err instanceof ApiError) return `HTTP ${err.status}`;
  if (err instanceof Error) return err.name || "Error";
  return "Error";
}

// Repo is public — keep this summary count-only. Operator can re-query the API
// with their fleet-admin credentials to get specific instance IDs.
type ImageGroupSummary = {
  image: string;
  count: number;
};

type PrepareSummary = {
  env: "dev" | "prod";
  apiBase: string;
  imageTag: string;
  newImage: string;
  versionSetName: string;
  step1: { skipped: boolean; previousDefault?: string; newDefault?: string };
  step2: { skipped: boolean };
  versionSets: { name: string; version: string; type: string; status: string; instanceCount: number }[];
  imageGroups: ImageGroupSummary[];
  totalInstances: number;
  generatedAt: string;
};

function writeStepSummary(md: string): void {
  const target = process.env.GITHUB_STEP_SUMMARY;
  if (!target) return;
  appendFileSync(target, md);
}

function escapeJsonForMarkdown(value: unknown): string {
  return JSON.stringify(value).replace(/`/g, "\\`");
}

async function main(): Promise<void> {
  const envKey = parseEnvKey(process.env.OMNI_ENV);
  const cfg = ENV_CONFIG[envKey];
  const email = requireEnv("OMNI_EMAIL");
  const pwd = requireEnv("OMNI_PASSWORD");
  const imageTag = requireEnv("IMAGE_TAG");
  const skipPatchDefault = envFlag("SKIP_PATCH_DEFAULT");
  const skipRelease = envFlag("SKIP_RELEASE");

  const newImage = `${IMAGE_PREFIX}:${imageTag}`;
  const versionSetName = `Image v${imageTag}`;

  console.log(`SaaSBuilder Upgrade — Prepare`);
  console.log(`  env:           ${envKey} (${cfg.apiBase})`);
  console.log(`  image tag:     ${imageTag}`);
  console.log(`  new image:     ${newImage}`);
  console.log(`  version set:   ${versionSetName}`);
  console.log(`  skip step 1:   ${skipPatchDefault}`);
  console.log(`  skip step 2:   ${skipRelease}`);

  console.log(`\nSigning in to ${cfg.apiBase}`);
  const token = await signIn(cfg.apiBase, email, pwd);
  console.log(`  signed in`);

  const summary: PrepareSummary = {
    env: envKey,
    apiBase: cfg.apiBase,
    imageTag: imageTag,
    newImage: newImage,
    versionSetName: versionSetName,
    step1: { skipped: skipPatchDefault },
    step2: { skipped: skipRelease },
    versionSets: [],
    imageGroups: [],
    totalInstances: 0,
    generatedAt: new Date().toISOString(),
  };

  console.log(`\nStep 1: PATCH imageName default → '${newImage}'`);
  if (skipPatchDefault) {
    console.log(`  skipped (SKIP_PATCH_DEFAULT=true)`);
  } else {
    const current = await withBackoffRetry(function () {
      return fetchImageParam(cfg, token);
    }, "fetchImageParam");
    summary.step1.previousDefault = current.defaultValue;
    console.log(`  current default: ${current.defaultValue}`);
    if (current.defaultValue === newImage) {
      console.log(`  already on '${newImage}', no change`);
    } else {
      await withBackoffRetry(function () {
        return patchImageParam(cfg, token, current, newImage);
      }, "patchImageParam");
      console.log(`  updated → ${newImage}`);
    }
    summary.step1.newDefault = newImage;
  }

  console.log(`\nStep 2: release version set '${versionSetName}'`);
  if (skipRelease) {
    console.log(`  skipped (SKIP_RELEASE=true)`);
  } else {
    try {
      await withBackoffRetry(function () {
        return releaseVersion(cfg, token, versionSetName);
      }, "releaseVersion");
      console.log(`  released`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Treat "already exists" as benign — the version set was released previously.
      if (/already exists|duplicate|conflict/i.test(msg)) {
        console.log(`  already released (${msg.split("\n")[0]})`);
      } else {
        throw err;
      }
    }
  }

  console.log(`\nListing version sets`);
  const versions = await withBackoffRetry(function () {
    return listVersionSets(cfg, token);
  }, "listVersionSets");
  summary.versionSets = versions.map(function (v) {
    return {
      name: v.name,
      version: v.version,
      type: v.type,
      status: v.status,
      instanceCount: typeof v.instanceCount === "number" ? v.instanceCount : 0,
    };
  });
  for (const v of summary.versionSets) {
    console.log(`  ${v.name.padEnd(20)} v${v.version.padEnd(12)} [${v.status}] instances=${v.instanceCount}`);
  }

  console.log(`\nListing all fleet instances and grouping by image`);
  const instances = await withBackoffRetry(function () {
    return listAllInstances(cfg, token);
  }, "listAllInstances");
  summary.totalInstances = instances.length;
  const groups = groupByImage(instances);
  const groupEntries = Array.from(groups.entries()).sort(function (a, b) {
    return b[1].length - a[1].length;
  });
  summary.imageGroups = groupEntries.map(function (entry) {
    return { image: entry[0], count: entry[1].length };
  });
  for (const g of summary.imageGroups) {
    console.log(`  ${g.count.toString().padStart(3)}  ${g.image}`);
  }

  const outputPath = "upgrade-prepare-summary.json";
  writeFileSync(outputPath, JSON.stringify(summary, null, 2));
  console.log(`\nWrote ${outputPath}`);

  // Build markdown for $GITHUB_STEP_SUMMARY so the operator can copy values
  // straight from the run summary into the Execute workflow inputs.
  // Include the "(no imageName)" bucket so the suggested input matches what
  // the interactive flow would PATCH; execute.ts looks groups up by exact
  // string and the operator can edit the JSON if they want to skip them.
  const groupsToModify = summary.imageGroups
    .filter(function (g) {
      return g.image !== newImage;
    })
    .map(function (g) {
      return g.image;
    });
  const suggestedSource =
    summary.versionSets
      .filter(function (v) {
        return (v.instanceCount || 0) > 0 && v.version !== imageTag;
      })
      .sort(function (a, b) {
        return (b.instanceCount || 0) - (a.instanceCount || 0);
      })[0]?.version || "";
  // Derive target_version from the actual version set (matched by name) so the
  // suggested input points at a real version even if the backend assigned a
  // version that doesn't equal imageTag, or the release was skipped/reused.
  const releasedMatch = summary.versionSets.find(function (v) {
    return v.name === versionSetName;
  });
  const suggestedTarget = releasedMatch?.version || imageTag;

  const md = [
    `## SaaSBuilder Upgrade — Prepare`,
    ``,
    `| Field | Value |`,
    `| --- | --- |`,
    `| Environment | \`${envKey}\` (${cfg.apiBase}) |`,
    `| Image tag | \`${imageTag}\` |`,
    `| New image | \`${newImage}\` |`,
    `| Version set name | \`${versionSetName}\` |`,
    `| Step 1 (PATCH default) | ${summary.step1.skipped ? "skipped" : "done"} |`,
    `| Step 2 (release) | ${summary.step2.skipped ? "skipped" : "done"} |`,
    `| Total fleet instances | ${summary.totalInstances} |`,
    ``,
    `### Version sets`,
    ``,
    `| Name | Version | Status | Instances |`,
    `| --- | --- | --- | --- |`,
    ...summary.versionSets.map(function (v) {
      return `| ${v.name} | \`${v.version}\` | ${v.status} | ${v.instanceCount} |`;
    }),
    ``,
    `### Image groups`,
    ``,
    `| Count | Image |`,
    `| ---: | --- |`,
    ...summary.imageGroups.map(function (g) {
      return `| ${g.count} | \`${g.image}\` |`;
    }),
    ``,
    `### Suggested Execute inputs`,
    ``,
    `Copy these into **SaaSBuilder Upgrade — Execute** (\`workflow_dispatch\`):`,
    ``,
    `- \`environment\`: \`${envKey}\``,
    `- \`image_tag\`: \`${imageTag}\``,
    `- \`source_version\`: \`${suggestedSource || "<pick from table above>"}\``,
    `- \`target_version\`: \`${suggestedTarget}\``,
    `- \`image_groups_json\`: \`${escapeJsonForMarkdown(groupsToModify)}\``,
    ``,
    `_The artifact \`upgrade-prepare-summary.json\` has the full data in machine-readable form._`,
    ``,
  ].join("\n");
  writeStepSummary(md);

  console.log(`\nPrepare done.`);
}

main().catch(function (err) {
  console.error(`\nError: ${sanitizeError(err)}`);
  process.exit(1);
});

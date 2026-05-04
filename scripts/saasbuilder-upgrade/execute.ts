import { appendFileSync, writeFileSync } from "node:fs";

import {
  ApiError,
  ENV_CONFIG,
  IMAGE_PREFIX,
  MODIFY_DELAY_MS,
  UpgradePath,
  createUpgradePath,
  envFlag,
  groupByImage,
  listAllInstances,
  listInstancesByVersion,
  modifyInstance,
  parseEnvKey,
  requireEnv,
  signIn,
  sleep,
  waitForUpgrade,
  withBackoffRetry,
} from "./lib";

// Repo is public — never put customer instance IDs or full API URLs/bodies in
// strings that end up in logs, artifacts, or step summaries. Sanitize errors
// down to the HTTP status only.
function sanitizeError(err: unknown): string {
  if (err instanceof ApiError) return `HTTP ${err.status}`;
  if (err instanceof Error) return err.name || "Error";
  return "Error";
}

type ExecuteSummary = {
  env: "dev" | "prod";
  apiBase: string;
  imageTag: string;
  newImage: string;
  sourceVersion: string;
  targetVersion: string;
  selectedImageGroups: string[];
  step4: {
    skipped: boolean;
    sourceInstanceCount: number;
    runningInstanceCount: number;
    upgradePathCreated: boolean;
    finalStatus?: string;
    completedCount?: number;
    failedCount?: number;
    totalCount?: number;
  };
  step5: {
    skipped: boolean;
    skipReason?: string;
    targetedInstanceCount: number;
    modified: number;
    failed: number;
    // No instance IDs — repo is public and the artifact would expose them.
    failureReasons: { reason: string; count: number }[];
  };
  generatedAt: string;
};

function writeStepSummary(md: string): void {
  const target = process.env.GITHUB_STEP_SUMMARY;
  if (!target) return;
  appendFileSync(target, md);
}

function parseImageGroups(raw: string): string[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`IMAGE_GROUPS_JSON is not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error(`IMAGE_GROUPS_JSON must be a JSON array of strings, got: ${typeof parsed}`);
  }
  for (const v of parsed) {
    if (typeof v !== "string") {
      throw new Error(`IMAGE_GROUPS_JSON entries must be strings, got: ${typeof v}`);
    }
  }
  return parsed as string[];
}

async function main(): Promise<void> {
  const envKey = parseEnvKey(process.env.OMNI_ENV);
  const cfg = ENV_CONFIG[envKey];
  const email = requireEnv("OMNI_EMAIL");
  const pwd = requireEnv("OMNI_PASSWORD");
  const imageTag = requireEnv("IMAGE_TAG");
  const sourceVersion = requireEnv("SOURCE_VERSION");
  const targetVersion = requireEnv("TARGET_VERSION");
  const imageGroupsRaw = requireEnv("IMAGE_GROUPS_JSON");
  const skipUpgradePath = envFlag("SKIP_UPGRADE_PATH");
  const skipModify = envFlag("SKIP_MODIFY");
  const continueOnUpgradeFailure = envFlag("CONTINUE_ON_UPGRADE_FAILURE");

  const newImage = `${IMAGE_PREFIX}:${imageTag}`;
  const selectedImageGroups = parseImageGroups(imageGroupsRaw);

  console.log(`SaaSBuilder Upgrade — Execute`);
  console.log(`  env:                ${envKey} (${cfg.apiBase})`);
  console.log(`  image tag:          ${imageTag}`);
  console.log(`  new image:          ${newImage}`);
  console.log(`  source version:     ${sourceVersion}`);
  console.log(`  target version:     ${targetVersion}`);
  console.log(`  image groups:       ${JSON.stringify(selectedImageGroups)}`);
  console.log(`  skip step 4:        ${skipUpgradePath}`);
  console.log(`  skip step 5:        ${skipModify}`);
  console.log(`  continue on upgrade failure: ${continueOnUpgradeFailure}`);

  console.log(`\nSigning in to ${cfg.apiBase}`);
  const token = await signIn(cfg.apiBase, email, pwd);
  console.log(`  signed in`);

  const summary: ExecuteSummary = {
    env: envKey,
    apiBase: cfg.apiBase,
    imageTag: imageTag,
    newImage: newImage,
    sourceVersion: sourceVersion,
    targetVersion: targetVersion,
    selectedImageGroups: selectedImageGroups,
    step4: { skipped: skipUpgradePath, sourceInstanceCount: 0, runningInstanceCount: 0, upgradePathCreated: false },
    step5: { skipped: skipModify, targetedInstanceCount: 0, modified: 0, failed: 0, failureReasons: [] },
    generatedAt: new Date().toISOString(),
  };

  let upgradeOutcome: UpgradePath | null = null;

  console.log(`\nStep 4: list RUNNING instances on v${sourceVersion} and create upgrade-path`);
  if (skipUpgradePath) {
    console.log(`  skipped (SKIP_UPGRADE_PATH=true)`);
  } else {
    const sourceInstances = await withBackoffRetry(function () {
      return listInstancesByVersion(cfg, token, sourceVersion);
    }, "listInstancesByVersion");
    summary.step4.sourceInstanceCount = sourceInstances.length;
    const running = sourceInstances.filter(function (i) {
      const cri = i.consumptionResourceInstanceResult;
      return !!cri && cri.status === "RUNNING" && !!cri.id;
    });
    summary.step4.runningInstanceCount = running.length;
    console.log(`  found ${sourceInstances.length} total, ${running.length} RUNNING`);

    if (running.length === 0) {
      console.log(`  no RUNNING instances on v${sourceVersion}; nothing to upgrade`);
    } else {
      const ids = running.map(function (i) {
        return (i.consumptionResourceInstanceResult as { id: string }).id;
      });
      const created = await withBackoffRetry(function () {
        return createUpgradePath(cfg, token, sourceVersion, targetVersion, ids);
      }, "createUpgradePath");
      summary.step4.upgradePathCreated = true;
      console.log(`  upgrade-path created`);
      // waitForUpgrade already wraps each poll in withBackoffRetry inside lib.ts.
      upgradeOutcome = await waitForUpgrade(cfg, token, created.upgradePathId);
      summary.step4.finalStatus = upgradeOutcome.status;
      summary.step4.completedCount = upgradeOutcome.completedCount;
      summary.step4.failedCount = upgradeOutcome.failedCount;
      summary.step4.totalCount = upgradeOutcome.totalCount;
      const upper = upgradeOutcome.status.toUpperCase();
      if (upper === "COMPLETE" || upper === "COMPLETED") {
        console.log(`  upgrade-path complete`);
      } else {
        console.log(`  upgrade-path ended as ${upgradeOutcome.status}`);
      }
    }
  }

  console.log(`\nStep 5: PATCH selected fleet instances → '${newImage}'`);
  if (skipModify) {
    summary.step5.skipReason = "SKIP_MODIFY=true";
    console.log(`  skipped (SKIP_MODIFY=true)`);
  } else if (
    upgradeOutcome &&
    !["COMPLETE", "COMPLETED"].includes(upgradeOutcome.status.toUpperCase()) &&
    !continueOnUpgradeFailure
  ) {
    summary.step5.skipped = true;
    summary.step5.skipReason = `upgrade-path ended as ${upgradeOutcome.status}; set CONTINUE_ON_UPGRADE_FAILURE=true to override`;
    console.log(`  skipped (${summary.step5.skipReason})`);
  } else if (selectedImageGroups.length === 0) {
    summary.step5.skipped = true;
    summary.step5.skipReason = "IMAGE_GROUPS_JSON is an empty array";
    console.log(`  skipped (no image groups selected)`);
  } else {
    const all = await withBackoffRetry(function () {
      return listAllInstances(cfg, token);
    }, "listAllInstances");
    const groups = groupByImage(all);
    // Dedupe the input — IMAGE_GROUPS_JSON is a free-form workflow input so an
    // operator could easily paste the same image string twice. Without this,
    // duplicates would PATCH the same fleet instances multiple times in one run.
    const uniqueSelectedGroups = Array.from(new Set(selectedImageGroups));
    const seenIds = new Set<string>();
    const ids: string[] = [];
    const missingGroups: string[] = [];
    for (const img of uniqueSelectedGroups) {
      const list = groups.get(img);
      if (!list || list.length === 0) {
        missingGroups.push(img);
        continue;
      }
      for (const inst of list) {
        const cri = inst.consumptionResourceInstanceResult;
        if (cri && cri.id && !seenIds.has(cri.id)) {
          seenIds.add(cri.id);
          ids.push(cri.id);
        }
      }
    }
    if (missingGroups.length > 0) {
      console.log(`  warning: these selected groups had no current instances: ${JSON.stringify(missingGroups)}`);
    }
    summary.step5.targetedInstanceCount = ids.length;
    console.log(`  modifying ${ids.length} instance(s)`);

    const reasonCounts = new Map<string, number>();
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const progress = `${i + 1}/${ids.length}`;
      try {
        await withBackoffRetry(function () {
          return modifyInstance(cfg, token, id, newImage);
        }, "modifyInstance");
        summary.step5.modified++;
        console.log(`    ✓ ${progress}`);
      } catch (err) {
        summary.step5.failed++;
        const reason = sanitizeError(err);
        reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
        console.error(`    ✗ ${progress}: ${reason}`);
      }
      await sleep(MODIFY_DELAY_MS);
    }
    summary.step5.failureReasons = Array.from(reasonCounts.entries())
      .map(function (e) {
        return { reason: e[0], count: e[1] };
      })
      .sort(function (a, b) {
        return b.count - a.count;
      });
  }

  const outputPath = "upgrade-execute-summary.json";
  writeFileSync(outputPath, JSON.stringify(summary, null, 2));
  console.log(`\nWrote ${outputPath}`);

  const upgradeLine = summary.step4.skipped
    ? "skipped"
    : summary.step4.upgradePathCreated
      ? `${summary.step4.finalStatus} (${summary.step4.completedCount}/${summary.step4.totalCount} completed, ${summary.step4.failedCount} failed)`
      : "no RUNNING instances on source version";
  const modifyLine = summary.step5.skipped
    ? `skipped — ${summary.step5.skipReason}`
    : `modified ${summary.step5.modified}, failed ${summary.step5.failed} of ${summary.step5.targetedInstanceCount}`;

  const md = [
    `## SaaSBuilder Upgrade — Execute`,
    ``,
    `| Field | Value |`,
    `| --- | --- |`,
    `| Environment | \`${envKey}\` (${cfg.apiBase}) |`,
    `| Image tag | \`${imageTag}\` → \`${newImage}\` |`,
    `| Source version | \`${sourceVersion}\` |`,
    `| Target version | \`${targetVersion}\` |`,
    `| Image groups selected | ${selectedImageGroups.length} |`,
    ``,
    `### Step 4 — Upgrade-path`,
    ``,
    `${upgradeLine}`,
    ``,
    `### Step 5 — Modify instances`,
    ``,
    `${modifyLine}`,
    ``,
    summary.step5.failureReasons.length > 0 ? `**Failure breakdown** (counts only — re-query the API for specific IDs):` : "",
    summary.step5.failureReasons.length > 0 ? "" : "",
    ...summary.step5.failureReasons.map(function (f) {
      return `- ${f.reason}: ${f.count}`;
    }),
    ``,
    `_Full machine-readable detail in artifact \`upgrade-execute-summary.json\`._`,
    ``,
  ].join("\n");
  writeStepSummary(md);

  console.log(`\nExecute done.`);
}

main().catch(function (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`\nError: ${msg}`);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Fails when a Playwright spec exists that no project in the root playwright.config.ts runs,
 * or when another Playwright config appears. CI only runs what the root config discovers, so
 * anything else is a test that silently never runs.
 *
 *   yarn check:playwright-discovery
 */
import { execFileSync } from "node:child_process";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(REPO_ROOT);

// Specs or configs that are deliberately outside playwright.config.ts. Keep this empty.
const EXCEPTIONS = new Set([]);

const report = JSON.parse(
  execFileSync("yarn", ["playwright", "test", "--list", "--reporter=json"], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  })
);
for (const error of report.errors ?? []) console.error(error.message);
if (report.errors?.length) process.exit(1);

const discovered = new Set();
const collect = (suite) => {
  if (suite.file) discovered.add(join(relative(REPO_ROOT, report.config.rootDir), suite.file));
  suite.suites?.forEach(collect);
};
report.suites.forEach(collect);

const problems = [];
const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" });
for (const file of files.split("\n")) {
  if (EXCEPTIONS.has(file)) continue;
  if (/\.spec\.[cm]?[jt]sx?$/.test(file) && !discovered.has(file)) {
    problems.push(
      `${file} is not run by any project in playwright.config.ts. Move it where a project's testDir picks it up, or add a project.`
    );
  }
  if (/(^|\/)([\w.-]+\.)?playwright\.config\.[cm]?[jt]s$/.test(file) && file !== "playwright.config.ts") {
    problems.push(`${file}: CI only runs the root playwright.config.ts. Add a project there instead.`);
  }
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`✗ ${problem}`);
  process.exit(1);
}
console.log(`✓ All ${discovered.size} spec files are discovered by playwright.config.ts`);

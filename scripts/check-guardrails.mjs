#!/usr/bin/env node
/**
 * Checks that keep the AI guidance honest and the lint allowlists shrinking.
 *
 *   yarn check:guardrails                 static checks
 *   yarn check:guardrails --base <ref>    static checks plus checks on the diff since <ref>
 *
 * Static:
 *   - every repo path quoted in backticks in the guidance files exists
 *   - every file on an ESLint allowlist exists
 * Diff (CI passes --base on pull requests):
 *   - allowlists only shrink (renames, including .jsx -> .tsx, carry their entry over)
 *   - no new eslint-disable comments for guarded rules
 *   - no new files in the legacy src/components/Icons/
 *   - changed files are Prettier-formatted
 *   - new Playwright specs opt into strict HAR replay (when CONFIG.strictReplay is set)
 *   - no agent or IDE artifacts
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Repo-specific settings. Everything below this block is shared with the customer-portal copy.
const CONFIG = {
  allowlistFile: "eslint.migration-allowlists.cjs",
  guidance: [
    "AGENTS.md",
    "README.md",
    "tests/GUIDE.md",
    ".github/copilot-instructions.md",
    ".github/instructions",
    ".agents/skills",
  ],
  legacyIconDirs: ["src/components/Icons/"],
  artifacts: [
    /(^|\/)\.idea\//,
    /(^|\/)\.playwright-mcp\//,
    /(^|\/)\.omx\//,
    /^mockups\//,
    /^docs\/superpowers\//,
    /\.plan\.md$/,
  ],
  // Added specs must match this; null when the repo has no strict HAR replay.
  newSpec: /^tests\/.*\.spec\.tsx?$/,
  strictReplay: null,
  // Core rules that only guardrails use, so disabling them is disabling a guardrail.
  guardedCoreRules: ["no-restricted-imports", "no-restricted-syntax"],
};

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(REPO_ROOT);

const CODE_FILE = /\.(c|m)?(j|t)sx?$/;
const DISABLE_DIRECTIVE = /eslint-disable(?:-next-line|-line)?(?=\s|\*|$)(.*)$/;
const PATH_EXTENSIONS = ["", ".ts", ".tsx", ".js", ".jsx", ".mjs", "/index.ts", "/index.tsx", "/index.js"];

const failures = [];
const fail = (message) => failures.push(message);
const git = (...args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
const withoutExtension = (file) => file.replace(/\.(c|m)?(j|t)sx?$/, "");

/** Flattens the allowlist module into { listName: files[] }, e.g. { axiosAllowlist: [], "guard/no-hex-colors": [...] }. */
const flattenAllowlists = (module) =>
  Object.fromEntries(
    Object.entries(module.default ?? module).flatMap(([name, value]) =>
      Array.isArray(value) ? [[name, value]] : Object.entries(value)
    )
  );

const importAllowlists = async (source) => {
  const file = join(mkdtempSync(join(tmpdir(), "guardrails-")), CONFIG.allowlistFile);
  writeFileSync(file, source);
  return flattenAllowlists(await import(pathToFileURL(file).href));
};

const markdownFiles = CONFIG.guidance
  .filter((entry) => existsSync(entry))
  .flatMap((entry) =>
    statSync(entry).isDirectory()
      ? readdirSync(entry, { recursive: true })
          .filter((file) => file.endsWith(".md"))
          .map((file) => join(entry, file))
      : [entry]
  );
const topLevelEntries = new Set(readdirSync("."));
const submodules = [...readFileSync(".gitmodules", "utf8").matchAll(/path = (.+)/g)].map(([, path]) => path.trim());

for (const file of markdownFiles) {
  for (const [, token] of readFileSync(file, "utf8").matchAll(/`([^`\n]+)`/g)) {
    const candidate = token
      .trim()
      .replace(/:\d+(-\d+)?$/, "")
      .replace(/\/$/, "");
    if (/[<>*{}\s$]/.test(candidate) || !candidate.includes("/")) continue;
    if (!topLevelEntries.has(candidate.split("/")[0])) continue;
    if (submodules.some((submodule) => candidate.startsWith(`${submodule}/`))) continue;
    if (!PATH_EXTENSIONS.some((extension) => existsSync(candidate + extension))) {
      fail(`${file}: \`${token}\` does not exist. Fix the reference or the guidance.`);
    }
  }
}

const allowlists = flattenAllowlists(await import(pathToFileURL(join(REPO_ROOT, CONFIG.allowlistFile)).href));
for (const [list, files] of Object.entries(allowlists)) {
  for (const file of files) {
    if (!existsSync(file)) {
      fail(`${CONFIG.allowlistFile}: ${list} lists ${file}, which does not exist. Delete the entry.`);
    }
  }
}

const baseIndex = process.argv.indexOf("--base");
if (baseIndex !== -1) {
  const base = git("merge-base", process.argv[baseIndex + 1], "HEAD").trim();
  const changes = git("diff", "--name-status", "-M", base)
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [status, ...paths] = line.split("\t");
      return { status: status[0], from: paths[0], path: paths.at(-1) };
    });
  const renamedFrom = new Map(changes.filter(({ status }) => status === "R").map(({ from, path }) => [path, from]));

  const baseSource = git("ls-tree", "--name-only", base, CONFIG.allowlistFile).trim()
    ? git("show", `${base}:${CONFIG.allowlistFile}`)
    : "";
  const baseAllowlists = baseSource ? await importAllowlists(baseSource) : {};
  for (const [list, files] of Object.entries(allowlists)) {
    // A guardrail introduced in this diff starts from today's debt.
    if (!baseAllowlists[list]) continue;
    const before = new Set(baseAllowlists[list].map(withoutExtension));
    for (const file of files) {
      const origin = renamedFrom.get(file) ?? file;
      if (!before.has(withoutExtension(origin))) {
        fail(`${CONFIG.allowlistFile}: ${file} was added to ${list}. Allowlists only shrink: fix the file instead.`);
      }
    }
  }

  const guardedRules = new Set([...Object.keys(allowlists), ...CONFIG.guardedCoreRules]);
  const isGuarded = (rule) => rule.startsWith("guard/") || guardedRules.has(rule);
  let currentFile = "";
  for (const line of git("diff", "-U0", base).split("\n")) {
    if (line.startsWith("+++ ")) currentFile = line.replace(/^\+\+\+ (b\/)?/, "");
    if (!line.startsWith("+") || line.startsWith("+++") || !CODE_FILE.test(currentFile)) continue;
    if (currentFile === "scripts/check-guardrails.mjs") continue;
    const directive = line.match(DISABLE_DIRECTIVE);
    if (!directive) continue;
    const rules = directive[1]
      .split(/--|\*\//)[0]
      .split(",")
      .map((rule) => rule.trim())
      .filter(Boolean);
    if (rules.length === 0 || rules.some(isGuarded)) {
      fail(`${currentFile}: "${line.slice(1).trim()}" disables a guardrail. Fix the code instead.`);
    }
  }

  for (const { status, from, path } of changes) {
    const legacyIconDir = CONFIG.legacyIconDirs.find((dir) => path.startsWith(dir));
    if (legacyIconDir && (status === "A" || status === "C" || (status === "R" && !from.startsWith(legacyIconDir)))) {
      fail(`${path}: add new icons to src/icons/svg/ and run yarn icons:build, not ${legacyIconDir}.`);
    }
    if (
      CONFIG.strictReplay &&
      status === "A" &&
      CONFIG.newSpec.test(path) &&
      !CONFIG.strictReplay.test(readFileSync(path, "utf8"))
    ) {
      fail(
        `${path}: new specs must call test.use({ strictHarReplay: true }), or harModeOverride: "off" when fully mocked.`
      );
    }
    if (status !== "D" && status !== "M" && CONFIG.artifacts.some((pattern) => pattern.test(path))) {
      fail(`${path}: agent and IDE artifacts don't belong in the repository.`);
    }
  }

  const formattable = changes
    .filter(({ status, path }) => status !== "D" && existsSync(path) && statSync(path).isFile())
    .map(({ path }) => path);
  if (formattable.length > 0) {
    try {
      execFileSync("yarn", ["prettier", "--check", "--ignore-unknown", ...formattable], { stdio: "inherit" });
    } catch {
      fail("Prettier: run `yarn prettier --write` on the files listed above.");
    }
  }
}

if (failures.length > 0) {
  for (const message of failures) console.error(`✗ ${message}`);
  process.exit(1);
}
console.log("✓ Guardrails OK");

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
 *   - allowlists only shrink and keep their keys (renames, including .jsx -> .tsx, carry their entry over)
 *   - no new eslint-disable or inline eslint config comments for guarded rules
 *   - no new files in CONFIG.legacyIconDirs
 *   - changed files are Prettier-formatted
 *   - new Playwright specs opt into strict HAR replay (when CONFIG.strictReplay is set)
 *   - no agent or IDE artifacts
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

// Repo-specific settings. This script is identical in another repository except for CONFIG; keep the copies in sync.
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
  legacyIconDirs: [],
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
const INLINE_CONFIG = /\/\*\s*eslint(\s[\s\S]*?)\*\//g;
const DISABLE_BLOCK = /\/\*\s*eslint-disable(?:-next-line|-line)?(\s[\s\S]*?)\*\//g;
const PATH_EXTENSIONS = ["", ".ts", ".tsx", ".js", ".jsx", ".mjs", "/index.ts", "/index.tsx", "/index.js"];

const failures = [];
const fail = (message) => failures.push(message);
const git = (...args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
// Pinned so the user's diff.external, color and prefix settings can't change the output parsed below.
const gitDiff = (...args) =>
  git("diff", "--no-ext-diff", "--no-color", "--src-prefix=a/", "--dst-prefix=b/", "-M", ...args);
const withoutExtension = (file) => file.replace(/\.(c|m)?(j|t)sx?$/, "");
// ESLint accepts quoted rule names in directives: ` "no-console" ` -> no-console.
const ruleName = (text) => text.trim().replace(/^(["']?)(.*)\1$/s, "$2");

/** Flattens the allowlist module into { listName: files[] }, e.g. { axiosAllowlist: [], "guard/no-hex-colors": [...] }. */
const flattenAllowlists = (module) =>
  Object.fromEntries(
    Object.entries(module.default ?? module).flatMap(([name, value]) =>
      Array.isArray(value) ? [[name, value]] : Object.entries(value)
    )
  );
const guardrailsOf = (module) => (module.default ?? module).guardrailAllowlists;

const importAllowlists = async (source) => {
  const dir = mkdtempSync(join(tmpdir(), "guardrails-"));
  try {
    const file = join(dir, CONFIG.allowlistFile);
    writeFileSync(file, source);
    return await import(pathToFileURL(file).href);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

/** Rules set by inline config comments, e.g. `eslint no-console: "off", curly: 2` -> ["no-console", "curly"]. */
const inlineConfigRules = (source) =>
  [...source.matchAll(INLINE_CONFIG)].flatMap(([, body]) =>
    [...body.split(/\s-{2,}\s/)[0].matchAll(/([\w@/.-]+)["']?\s*:/g)].map(([, rule]) => rule)
  );

/** Rules named by eslint-disable block comments that span lines (single-line ones are checked on added lines). */
const multiLineDisabledRules = (source) =>
  [...source.matchAll(DISABLE_BLOCK)]
    .filter(([comment]) => comment.includes("\n"))
    .flatMap(([, body]) => body.split(/\s-{2,}\s/)[0].split(","))
    .map(ruleName)
    .filter(Boolean);

let baseRef;
try {
  baseRef = parseArgs({ options: { base: { type: "string" } } }).values.base;
  if (baseRef === "") throw new Error("Option '--base <value>' argument missing");
} catch (error) {
  console.error(`✗ ${error.message}`);
  process.exit(1);
}

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

const allowlistModule = await import(pathToFileURL(join(REPO_ROOT, CONFIG.allowlistFile)).href);
const allowlists = flattenAllowlists(allowlistModule);
for (const [list, files] of Object.entries(allowlists)) {
  for (const file of files) {
    if (!existsSync(file)) {
      fail(`${CONFIG.allowlistFile}: ${list} lists ${file}, which does not exist. Delete the entry.`);
    }
  }
}

if (baseRef !== undefined) {
  const base = git("merge-base", baseRef, "HEAD").trim();
  const changes = gitDiff("--name-status", base)
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
  const baseModule = baseSource ? await importAllowlists(baseSource) : {};
  const baseAllowlists = flattenAllowlists(baseModule);
  const baseGuardrails = guardrailsOf(baseModule);
  const headGuardrails = guardrailsOf(allowlistModule) ?? {};
  for (const list of Object.keys(baseGuardrails ?? {})) {
    if (!Object.hasOwn(headGuardrails, list)) {
      fail(`${CONFIG.allowlistFile}: ${list} was removed. Keep the key with an empty array so the rule stays guarded.`);
    }
  }
  for (const [list, files] of Object.entries(allowlists)) {
    // A list the base lacks starts empty, unless the base predates guardrailAllowlists.
    const before = baseAllowlists[list] ?? (baseGuardrails ? [] : undefined);
    if (!before) continue;
    for (const file of files) {
      const origin = renamedFrom.get(file) ?? file;
      // A rename git didn't pair (.jsx -> .tsx) keeps its entry; a new sibling of a listed file doesn't.
      const renamed = before.some(
        (entry) => withoutExtension(entry) === withoutExtension(origin) && !existsSync(entry)
      );
      if (!before.includes(origin) && !renamed) {
        fail(`${CONFIG.allowlistFile}: ${file} was added to ${list}. Allowlists only shrink: fix the file instead.`);
      }
    }
  }

  const guardedRules = new Set([
    ...Object.keys(baseAllowlists),
    ...Object.keys(allowlists),
    ...CONFIG.guardedCoreRules,
  ]);
  const isGuarded = (rule) => rule.startsWith("guard/") || guardedRules.has(rule);
  let currentFile = "";
  for (const line of gitDiff("-U0", base).split("\n")) {
    if (line.startsWith("+++ ")) currentFile = line.replace(/^\+\+\+ (b\/)?/, "");
    if (!line.startsWith("+") || line.startsWith("+++") || !CODE_FILE.test(currentFile)) continue;
    if (currentFile === "scripts/check-guardrails.mjs") continue;
    const directive = line.match(DISABLE_DIRECTIVE);
    if (!directive) continue;
    const rules = directive[1]
      .split(/--|\*\//)[0]
      .split(",")
      .map(ruleName)
      .filter(Boolean);
    if (rules.length === 0 || rules.some(isGuarded)) {
      fail(`${currentFile}: "${line.slice(1).trim()}" disables a guardrail. Fix the code instead.`);
    }
  }

  // Whole files, not added lines: a block comment can span lines or gain a rule on an unchanged line.
  const blockDirectives = (source) => [
    ...inlineConfigRules(source)
      .filter(isGuarded)
      .map((rule) => `an inline eslint config comment sets ${rule}`),
    ...multiLineDisabledRules(source)
      .filter(isGuarded)
      .map((rule) => `a multi-line eslint-disable comment disables ${rule}`),
  ];
  const count = (items, item) => items.filter((other) => other === item).length;
  const present = changes.filter(({ status, path }) => status !== "D" && existsSync(path) && statSync(path).isFile());
  for (const { status, from, path } of present) {
    if (!CODE_FILE.test(path) || path === "scripts/check-guardrails.mjs") continue;
    const now = blockDirectives(readFileSync(path, "utf8"));
    const before = now.length > 0 && status !== "A" ? blockDirectives(git("show", `${base}:${from}`)) : [];
    for (const directive of new Set(now)) {
      if (count(now, directive) > count(before, directive)) {
        fail(`${path}: ${directive}, which is a guardrail. Fix the code instead.`);
      }
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
    if (status !== "D" && CONFIG.artifacts.some((pattern) => pattern.test(path))) {
      fail(`${path}: agent and IDE artifacts don't belong in the repository.`);
    }
  }

  const formattable = present.map(({ path }) => path);
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

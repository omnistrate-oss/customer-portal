#!/usr/bin/env -S yarn tsx

import { checkbox, confirm, select, Separator } from "@inquirer/prompts";
import { execFileSync, execSync, type ExecSyncOptions } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ─── Constants ───
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TESTS_DIR = path.resolve(__dirname, "../tests");
const HAR_SUBMODULE = "tests/fixtures/hars";

// Map from directory names under tests/ to Playwright project names
const MODULE_TO_PROJECT: Record<string, string> = {
  auth: "auth-tests",
  deployments: "deployment-tests",
};

// ─── Helpers ───
const run = (cmd: string, opts?: ExecSyncOptions) => {
  execSync(cmd, { stdio: "inherit", ...opts });
};

const runSilent = (cmd: string): string => execSync(cmd, { encoding: "utf-8" }).trim();

// Use execFileSync to avoid shell interpolation when arguments include values
// derived from git output or other environment-dependent sources.
const git = (args: string[], opts?: ExecSyncOptions) => {
  execFileSync("git", args, { stdio: "inherit", ...opts });
};

const gitSilent = (args: string[]): string => execFileSync("git", args, { encoding: "utf-8" }).trim();

const heading = (msg: string) => console.log(`\n── ${msg} ──`);

const dim = (msg: string) => `\x1b[2m${msg}\x1b[0m`;
const bold = (msg: string) => `\x1b[1m${msg}\x1b[0m`;
const green = (msg: string) => `\x1b[32m${msg}\x1b[0m`;
const yellow = (msg: string) => `\x1b[33m${msg}\x1b[0m`;

/**
 * Discover all module directories under tests/
 */
const getModules = (): string[] =>
  readdirSync(TESTS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

/**
 * Discover all spec files under a module directory (recursive)
 */
const getSpecFiles = (modulePath: string): string[] => {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith(".spec.ts")) {
        files.push(full);
      }
    }
  };
  walk(modulePath);
  return files;
};

// ─── Parse CLI args ───
const printUsage = () => {
  const modules = getModules();
  console.log(`
Usage: yarn record [options]

Run with no options for ${bold("interactive mode")}.

Options:
  --module, -m <names>   Comma-separated module names to record
  --file, -f <paths>     Comma-separated spec file paths to record
  --all                  Record all modules (no prompts)
  --skip-push            Run tests but don't push HAR files
  --help, -h             Show this help

Available modules:
  ${modules.join(", ")}

Examples:
  yarn record                                              # Interactive mode
  yarn record --all                                        # Record everything
  yarn record -m auth,deployments                          # Record specific modules
  yarn record -f tests/auth/signin.spec.ts                 # Record specific file(s)
  yarn record --all --skip-push                            # Record without pushing
`);
};

interface Options {
  modules: string[];
  files: string[];
  all: boolean;
  skipPush: boolean;
  interactive: boolean;
}

const parseArgs = (): Options => {
  const args = process.argv.slice(2);
  const opts: Options = { modules: [], files: [], all: false, skipPush: false, interactive: false };

  if (args.length === 0) {
    opts.interactive = true;
    return opts;
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--module":
      case "-m":
        opts.modules = args[++i]?.split(",").map((s) => s.trim()) ?? [];
        break;
      case "--file":
      case "-f":
        opts.files = args[++i]?.split(",").map((s) => s.trim()) ?? [];
        break;
      case "--all":
        opts.all = true;
        break;
      case "--skip-push":
        opts.skipPush = true;
        break;
      case "--help":
      case "-h":
        printUsage();
        process.exit(0);
      default:
        console.error(`Unknown option: ${arg}`);
        printUsage();
        process.exit(1);
    }
  }

  return opts;
};

// ─── Validation ───
const validateModules = (requested: string[]): void => {
  const available = getModules();
  const invalid = requested.filter((m) => !available.includes(m));
  if (invalid.length) {
    console.error(`Unknown module(s): ${invalid.join(", ")}`);
    console.error(`Available: ${available.join(", ")}`);
    process.exit(1);
  }
};

const validateFiles = (requested: string[]): void => {
  for (const f of requested) {
    const resolved = path.resolve(f);
    if (!existsSync(resolved)) {
      console.error(`File not found: ${f}`);
      process.exit(1);
    }
    if (!resolved.endsWith(".spec.ts")) {
      console.error(`Not a spec file: ${f}`);
      process.exit(1);
    }
  }
};

// ─── Interactive mode ───
const interactiveMode = async (): Promise<Options> => {
  console.log(`\n${bold("HAR Recorder")} ${dim("— Interactive Mode")}\n`);

  const mode = await select({
    message: "What do you want to record?",
    choices: [
      { name: "All modules", value: "all" as const },
      { name: "Select modules", value: "modules" as const },
      { name: "Select specific files", value: "files" as const },
    ],
  });

  const opts: Options = { modules: [], files: [], all: false, skipPush: false, interactive: true };

  if (mode === "all") {
    opts.all = true;
  } else if (mode === "modules") {
    const modules = getModules();
    opts.modules = await checkbox({
      message: "Select modules to record",
      choices: modules.map((mod) => {
        const specs = getSpecFiles(path.join(TESTS_DIR, mod));
        return {
          name: `${mod} ${dim(`(${specs.length} spec${specs.length !== 1 ? "s" : ""})`)}`,
          value: mod,
        };
      }),
      required: true,
    });
  } else {
    // Single grouped checkbox — all files across all modules in one prompt
    const modules = getModules();
    const choices: (Separator | { name: string; value: string })[] = [];

    for (const mod of modules) {
      const specs = getSpecFiles(path.join(TESTS_DIR, mod));
      if (specs.length === 0) continue;
      choices.push(new Separator(`── ${mod} ──`));
      for (const spec of specs) {
        choices.push({ name: path.relative(TESTS_DIR, spec), value: spec });
      }
    }

    opts.files = await checkbox({
      message: "Select spec files to record",
      choices,
      required: true,
    });
  }

  opts.skipPush = !(await confirm({
    message: "Push HAR files after recording?",
    default: true,
  }));

  // Show summary
  console.log(`\n${bold("Summary:")}`);
  if (opts.all) {
    console.log(`  Scope:  ${green("All modules")}`);
  } else if (opts.modules.length) {
    console.log(`  Scope:  ${green(opts.modules.join(", "))}`);
  } else {
    console.log(`  Files:`);
    for (const f of opts.files) {
      console.log(`    ${green(path.relative(process.cwd(), f))}`);
    }
  }
  console.log(`  Push:   ${opts.skipPush ? yellow("No") : green("Yes")}`);

  const proceed = await confirm({ message: "Start recording?", default: true });
  if (!proceed) {
    console.log("Aborted.");
    process.exit(0);
  }

  return opts;
};

// ─── Build Playwright command ───
const buildPlaywrightArgs = (opts: Options): string[] => {
  const args: string[] = [];

  if (opts.files.length > 0) {
    // Running specific files — figure out which projects they belong to
    const projects = new Set<string>();
    for (const f of opts.files) {
      const resolved = path.resolve(f);
      const rel = path.relative(TESTS_DIR, resolved);
      const modName = rel.split(path.sep)[0];
      const projectName = MODULE_TO_PROJECT[modName] || modName;
      projects.add(projectName);
    }

    // Always include user-setup when running non-auth projects
    const projectList = Array.from(projects);
    const needsUserSetup = projectList.some((p) => p !== "auth-tests");

    if (needsUserSetup) args.push("--project", "user-setup");

    for (const p of projectList) {
      args.push("--project", p);
    }

    // "--" separates options from positional args
    args.push("--");

    for (const f of opts.files) {
      args.push(path.resolve(f));
    }
  } else if (opts.modules.length > 0) {
    const needsUserSetup = opts.modules.some((m) => m !== "auth");

    if (needsUserSetup) args.push("--project", "user-setup");

    for (const mod of opts.modules) {
      const projectName = MODULE_TO_PROJECT[mod] || mod;
      args.push("--project", projectName);
    }
  }
  // If --all or no filter, run everything (no --project flag)

  return args;
};

// ─── Main ───
const main = async () => {
  let opts = parseArgs();

  if (opts.interactive) {
    opts = await interactiveMode();
  }

  // Validate inputs
  if (opts.modules.length) validateModules(opts.modules);
  if (opts.files.length) validateFiles(opts.files);

  const repoRoot = runSilent("git rev-parse --show-toplevel");
  process.chdir(repoRoot);
  process.env.GIT_TERMINAL_PROMPT = "0";

  // ─── 1. Check main repo ───
  heading("Checking main repo");
  run("git fetch origin master --quiet");

  const hasLocalChanges = runSilent("git status --porcelain").length > 0;
  const localHead = runSilent("git rev-parse HEAD");
  const masterHead = runSilent("git rev-parse origin/master");

  // Check if local HEAD is behind origin/master
  let isBehindMaster = false;
  if (localHead !== masterHead) {
    try {
      execSync(`git merge-base --is-ancestor ${masterHead} ${localHead}`, { stdio: "ignore" });
    } catch {
      isBehindMaster = true;
    }
  }

  if (hasLocalChanges && isBehindMaster) {
    console.error(
      "\nYour branch has uncommitted changes and is behind origin/master.\n" +
        "Please commit or stash your changes and merge/rebase with master before recording.\n"
    );
    process.exit(1);
  }
  console.log("Main repo looks good.");

  // ─── 2. Reset HAR submodule ───
  heading("Preparing HAR submodule");

  run("git submodule update --init tests/fixtures/hars");

  process.chdir(HAR_SUBMODULE);
  run("git fetch origin master --quiet");

  const harLocalHead = runSilent("git rev-parse HEAD");
  const harMasterHead = runSilent("git rev-parse origin/master");
  const harMasterHasNewCommits = harLocalHead !== harMasterHead;

  if (harMasterHasNewCommits) {
    console.log("HAR submodule is behind origin/master — discarding local changes and resetting...");
    run("git checkout master --quiet");
    run("git reset --hard origin/master --quiet");
    run("git clean -fd --quiet");
    console.log("HAR submodule reset to origin/master.");
  } else {
    const hasLocalHarChanges = runSilent("git status --porcelain").length > 0;
    if (hasLocalHarChanges) {
      console.log("HAR submodule has local changes from a previous run — keeping them.");
    } else {
      console.log("HAR submodule is up to date with origin/master.");
    }
  }
  process.chdir(repoRoot);

  // ─── 3. Run tests in record mode ───
  heading("Running Playwright tests in record mode");

  const pwArgs = buildPlaywrightArgs(opts);

  // execFileSync (not execSync) — pwArgs include resolved spec paths that may
  // contain spaces or shell metacharacters. Avoid the shell entirely.
  console.log(`> HAR_MODE=record yarn playwright test ${pwArgs.join(" ")}\n`);
  execFileSync("yarn", ["playwright", "test", ...pwArgs], {
    stdio: "inherit",
    env: { ...process.env, HAR_MODE: "record" },
  });

  console.log("\nTests passed.");

  // ─── 4. Push HAR files ───
  if (opts.skipPush) {
    heading("Skipping push (--skip-push)");
    console.log("HAR files recorded locally but not pushed.");
    process.exit(0);
  }

  heading("Pushing updated HAR files");
  process.chdir(HAR_SUBMODULE);

  try {
    runSilent("git config user.name");
  } catch {
    const name = gitSilent(["-C", repoRoot, "config", "user.name"]);
    const email = gitSilent(["-C", repoRoot, "config", "user.email"]);
    git(["config", "user.name", name]);
    git(["config", "user.email", email]);
  }

  run("git add -A");

  try {
    runSilent("git diff --staged --quiet");
    console.log("No HAR file changes to push.");
    process.exit(0);
  } catch {
    // diff --staged --quiet exits non-zero when there are changes
  }

  const date = new Date().toISOString().slice(0, 10);
  run("git --no-pager diff --staged --stat");
  git(["commit", "-m", `chore: update HAR files (${date})`]);
  run("git --no-pager push origin master");

  process.chdir(repoRoot);
  console.log("\nHAR files updated and pushed successfully.");
};

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});

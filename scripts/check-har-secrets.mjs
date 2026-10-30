#!/usr/bin/env node
import { inspectTrackedAuth, scanFixtures, scanStagedFixtures, trackedAuthRoots } from "./har-security.mjs";

const usage =
  "Usage: node scripts/check-har-secrets.mjs [--sanitize | --staged] [--require-hars] [--tracked-auth] [--] [roots...]";
async function main(args) {
  const options = { sanitize: false, requireHars: false };
  const paths = [];
  let trackedAuth = false;
  let staged = false;
  let positional = false;
  for (const arg of args) {
    if (positional) paths.push(arg);
    else if (arg === "--") positional = true;
    else if (arg === "--sanitize") options.sanitize = true;
    else if (arg === "--require-hars") options.requireHars = true;
    else if (arg === "--tracked-auth") trackedAuth = true;
    else if (arg === "--staged") staged = true;
    else if (arg === "--help" || arg === "-h") {
      process.stdout.write(usage + "\n");
      return;
    } else if (arg.startsWith("-")) {
      process.stderr.write("Invalid checker arguments.\n" + usage + "\n");
      process.exitCode = 2;
      return;
    } else paths.push(arg);
  }
  if (!paths.length) paths.push(".");
  if (staged && options.sanitize) {
    process.stderr.write("Staged checking cannot sanitize fixture bytes.\n" + usage + "\n");
    process.exitCode = 2;
    return;
  }
  if (trackedAuth) {
    const indexIssues = await inspectTrackedAuth(paths);
    if (indexIssues.length) {
      for (const issue of indexIssues) process.stderr.write(`${issue.path}: ${issue.reason}\n`);
      process.exitCode = 1;
      return;
    }
    if (!staged) paths.push(...(await trackedAuthRoots(paths)));
  }
  const result = await (staged ? scanStagedFixtures(paths, options) : scanFixtures(paths, options));
  process.stdout.write(
    `HAR files: ${result.harFiles}; JSON fixtures: ${result.fixtureFiles}; sanitized files: ${result.changedFiles.length}; issues: ${result.issues.length}\n`
  );
  if (result.issues.length) {
    for (const issue of result.issues) process.stderr.write(`${issue.path}: ${issue.reason}\n`);
    process.exitCode = 1;
  }
}
try {
  await main(process.argv.slice(2));
} catch {
  process.stderr.write("Fixture security check failed safely.\n");
  process.exitCode = 1;
}

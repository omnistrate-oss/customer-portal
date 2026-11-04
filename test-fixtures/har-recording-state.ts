import fs from "node:fs";
import path from "node:path";

const GLOBAL_SETUP = "fixtures/global-setup.fixture.json.gz";

export const RECORDING_OWNERS: Record<string, { harDirectory: string; fixtures: string[] }> = {
  "auth/auth-validation.spec.ts": { harDirectory: "auth-tests/auth-validation", fixtures: [] },
  "auth/auth-validation-lifecycle.spec.ts": { harDirectory: "auth-tests/auth-validation-lifecycle", fixtures: [] },
  "auth/signin.spec.ts": { harDirectory: "auth-tests/signin", fixtures: [] },
  "auth/reset-password.spec.ts": { harDirectory: "auth-tests/reset-password", fixtures: [] },
  "user-setup.spec.ts": { harDirectory: "user-setup/user-setup", fixtures: [] },
  "deployments/instances/basic-tests.spec.ts": {
    harDirectory: "deployment-tests/basic-tests",
    fixtures: [GLOBAL_SETUP, "fixtures/subscriptions.fixture.json.gz"],
  },
  "deployments/instances/byoa-instance.spec.ts": {
    harDirectory: "deployment-tests/byoa-instance",
    fixtures: [GLOBAL_SETUP],
  },
  "deployments/instances/helm-instance.spec.ts": {
    harDirectory: "deployment-tests/helm-instance",
    fixtures: [GLOBAL_SETUP],
  },
  "deployments/instances/operational-tests.spec.ts": {
    harDirectory: "deployment-tests/operational-tests",
    fixtures: [GLOBAL_SETUP, "fixtures/operational-tests.fixture.json.gz"],
  },
};

const recordingFiles = (root: string): string[] => {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(root, entry.name);
    if (entry.isDirectory() && entry.name !== ".git") return recordingFiles(file);
    return entry.isFile() && /\.(har|fixture\.json)\.gz$/.test(entry.name) ? [file] : [];
  });
};

export const snapshotRecordings = (root: string): Map<string, Uint8Array> =>
  new Map(recordingFiles(root).map((file) => [path.relative(root, file), new Uint8Array(fs.readFileSync(file))]));

/** Restores retained recordings together with their explicit direct-API dependencies. */
export const restoreRecordings = (
  root: string,
  before: Map<string, Uint8Array>,
  retainedSpecs: Set<string>,
  failedRun: boolean
): void => {
  // A spec sharing a restored fixture recorded against the new values, so it is retained too.
  const specs = new Set(retainedSpecs);
  for (let grew = true; grew; ) {
    grew = false;
    const shared = new Set([...specs].flatMap((spec) => RECORDING_OWNERS[spec]?.fixtures ?? []));
    for (const [spec, owner] of Object.entries(RECORDING_OWNERS)) {
      if (specs.has(spec) || !owner.fixtures.some((fixture) => shared.has(fixture))) continue;
      specs.add(spec);
      grew = true;
    }
  }
  const owners = [...specs].map((spec) => RECORDING_OWNERS[spec]);
  // An unknown owner or interrupted run cannot safely publish a partial recording.
  const restoreAll = failedRun || owners.some((owner) => !owner);
  const fixtures = new Set(owners.flatMap((owner) => owner?.fixtures ?? []));
  const directories = owners.flatMap((owner) => (owner ? [owner.harDirectory] : []));
  const files = new Set([...before.keys(), ...recordingFiles(root).map((file) => path.relative(root, file))]);
  for (const relative of files) {
    if (!restoreAll && !fixtures.has(relative) && !directories.some((dir) => relative.startsWith(`${dir}/`))) continue;
    const file = path.join(root, relative);
    const bytes = before.get(relative);
    if (bytes) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, bytes, { mode: 0o600 });
    } else {
      fs.rmSync(file, { force: true });
    }
  }
};

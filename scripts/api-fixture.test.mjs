import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import zlib from "node:zlib";

import { ApiFixture } from "../test-fixtures/api-fixture.ts";

const withFixture = async (run) => {
  const originalMode = process.env.HAR_MODE;
  const name = `har-security-test-${randomUUID()}`;
  const gzPath = path.resolve("tests/fixtures/hars/fixtures", `${name}.fixture.json.gz`);
  process.env.HAR_MODE = "record";
  try {
    await run(name, gzPath);
  } finally {
    if (originalMode === undefined) delete process.env.HAR_MODE;
    else process.env.HAR_MODE = originalMode;
    fs.rmSync(gzPath, { force: true });
  }
};

test("ApiFixture persists sanitized values and returns the original factory value for live use", async () => {
  await withFixture(async (name, gzPath) => {
    const fixture = new ApiFixture(name);
    const liveValue = { id: "public-instance-id", settings: { password: "synthetic-live-password" } };
    const returned = await fixture.getOrCreate("instance", () => liveValue);
    assert.equal(returned, liveValue);
    assert.equal(returned.settings.password, "synthetic-live-password");
    const persisted = JSON.parse(zlib.gunzipSync(fs.readFileSync(gzPath)).toString("utf8"));
    assert.deepEqual(persisted, {
      instance: { id: "public-instance-id", settings: { password: "REDACTED_PLAYWRIGHT_HAR" } },
    });
    assert.equal(liveValue.settings.password, "synthetic-live-password");
  });
});

test("ApiFixture rejects malformed retained data without replacing the prior file", async () => {
  await withFixture(async (name, gzPath) => {
    fs.mkdirSync(path.dirname(gzPath), { recursive: true });
    const previous = zlib.gzipSync(Buffer.from("{synthetic-malformed-secret"));
    fs.writeFileSync(gzPath, previous);
    const fixture = new ApiFixture(name);
    await assert.rejects(
      () => fixture.getOrCreate("instance", () => ({ id: "new-id" })),
      (error) => {
        assert.equal(error.message, `[ApiFixture] Fixture rejected: ${gzPath}`);
        return true;
      }
    );
    assert.deepEqual(fs.readFileSync(gzPath), previous);
    assert.equal(
      fs
        .readdirSync(path.dirname(gzPath))
        .some((file) => file.startsWith(path.basename(gzPath)) && file.endsWith(".tmp")),
      false
    );
  });
});

test("ApiFixture rejects contaminated replay data before any factory can run", async () => {
  await withFixture(async (name, gzPath) => {
    fs.mkdirSync(path.dirname(gzPath), { recursive: true });
    const previous = zlib.gzipSync(Buffer.from(JSON.stringify({ password: "synthetic-retained-password" })));
    fs.writeFileSync(gzPath, previous);
    process.env.HAR_MODE = "replay";
    assert.throws(
      () => new ApiFixture(name),
      (error) => {
        assert.equal(error.message, `[ApiFixture] Fixture rejected: ${gzPath}`);
        return true;
      }
    );
    assert.deepEqual(fs.readFileSync(gzPath), previous);
  });
});

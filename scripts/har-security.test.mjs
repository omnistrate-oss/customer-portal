import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { gunzipSync, gzipSync } from "node:zlib";

import * as security from "./har-security.mjs";
const marker = "REDACTED_PLAYWRIGHT_HAR";
// Synthetic test material is constructed here; no live credential is used.
const jwt = [
  JSON.stringify({ alg: "HS256", typ: "JWT" }),
  JSON.stringify({ sub: "synthetic-test", exp: 1 }),
  "synthetic-signature-only",
]
  .map((part) => Buffer.from(part).toString("base64url"))
  .join(".");
const opaque = "synthetic-private-value";
const cli = fileURLToPath(new URL("./check-har-secrets.mjs", import.meta.url));
const har = () => {
  return {
    log: {
      version: "1.2",
      creator: { name: "test", version: "1" },
      entries: [
        {
          startedDateTime: "2026-01-01T00:00:00Z",
          time: 10,
          request: {
            method: "POST",
            url: "https://example.test/api/v1/items?region=us-west-2",
            httpVersion: "HTTP/1.1",
            headers: [{ name: "Content-Type", value: "application/json" }],
            cookies: [],
            queryString: [{ name: "region", value: "us-west-2" }],
            headersSize: -1,
            bodySize: 2,
            postData: {
              mimeType: "application/json",
              text: '{"name":"public"}',
            },
          },
          response: {
            status: 201,
            statusText: "Created",
            httpVersion: "HTTP/1.1",
            headers: [{ name: "Content-Type", value: "application/json" }],
            cookies: [],
            content: {
              size: 2,
              mimeType: "application/json",
              text: '{"id":"item-1","name":"public"}',
            },
            redirectURL: "",
            headersSize: -1,
            bodySize: 2,
          },
          cache: {},
          timings: { send: 1, wait: 8, receive: 1 },
        },
      ],
    },
  };
};
const temp = async (t) => {
  const root = await mkdtemp(join(tmpdir(), "har-security-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
};
const run = (args, cwd) => {
  return spawnSync(process.execPath, [cli, ...args], { cwd, encoding: "utf8" });
};
const entry = (value) => {
  return value.log.entries[0];
};
const noSecret = (value) => {
  const serialized = JSON.stringify(value);
  assert.equal(serialized.includes(jwt), false, "synthetic JWT survived");
  assert.equal(serialized.includes(opaque), false, "synthetic opaque credential survived");
};

test("removes case-insensitive credential headers and both cookie arrays while preserving replay essentials", () => {
  const input = har();
  const e = entry(input);
  for (const name of ["AUTHORIZATION", "proxy-Authorization", "cOoKiE"])
    e.request.headers.push({ name, value: opaque });
  e.response.headers.push({ name: "sEt-CoOkIe", value: opaque });
  e.request.cookies = [{ name: "session", value: opaque }];
  e.response.cookies = [{ name: "session", value: opaque }];
  assert.ok(security.inspectHar(input).length >= 5);
  const clean = security.sanitizeHar(input);
  const c = entry(clean);
  noSecret(clean);
  assert.equal(c.request.cookies, undefined);
  assert.equal(c.response.cookies, undefined);
  assert.equal(c.request.headers, undefined);
  assert.equal(c.request.method, "POST");
  assert.equal(c.request.url, e.request.url);
  assert.equal(c.response.status, 201);
  assert.equal(c.response.content.text, e.response.content.text);
  assert.equal(e.request.headers.length, 4);
  assert.deepEqual(security.inspectHar(clean), []);
  assert.deepEqual(security.sanitizeHar(clean), clean);
});

test("scrubs sensitive URL, queryString and nested encoded query values without normalizing public URL data", () => {
  const input = har();
  const e = entry(input);
  const nested = "https://example.test/callback?access_token=" + opaque + "&public=a%20b";
  e.request.url =
    "https://example.test/api/v1/items?region=us%2Dwest&token=" +
    opaque +
    "&next=" +
    encodeURIComponent(encodeURIComponent(nested));
  e.request.queryString.push({ name: "API_KEY", value: opaque });
  const clean = security.sanitizeHar(input);
  noSecret(clean);
  assert.ok(entry(clean).request.url.startsWith("https://example.test/api/v1/items?region=us%2Dwest&token=" + marker));
  assert.equal(entry(clean).request.queryString, undefined);
  assert.deepEqual(security.inspectHar(clean), []);
});

test("canonicalizes replay URLs with stable paths, nested encoded secrets and idempotence", () => {
  const publicUrl = "https://example.test/api/items?region=us%2Dwest&space=a%20b";
  assert.equal(security.sanitizeUrl(publicUrl), publicUrl);
  const nested = "https://example.test/callback?access_token=" + opaque + "&public=a%20b";
  const url = publicUrl + "&password=" + opaque + "&next=" + encodeURIComponent(encodeURIComponent(nested));
  const clean = security.sanitizeUrl(url);
  noSecret(clean);
  assert.equal(security.sanitizeUrl(clean), clean);
  assert.ok(clean.startsWith(publicUrl + "&password=" + marker));
});

test("sanitizes credentials in JSON bodies and nested JSON strings while retaining public token metadata", () => {
  const input = har();
  const e = entry(input);
  e.request.postData.text = JSON.stringify({
    password: opaque,
    accessToken: jwt,
    publicKey: "ssh-public-example",
    tokenId: "token-123",
    token: { id: "token-456", name: "CI token" },
    metadata: { token_id: "token-789" },
    config: JSON.stringify({ client_secret: opaque, public: true }),
    values: [jwt],
  });
  const clean = security.sanitizeHar(input);
  noSecret(clean);
  const body = JSON.parse(entry(clean).request.postData.text);
  assert.equal(body.password, marker);
  assert.equal(body.accessToken, marker);
  assert.equal(body.tokenId, "token-123");
  assert.deepEqual(body.token, { id: "token-456", name: "CI token" });
  assert.deepEqual(body.metadata, { token_id: "token-789" });
  assert.equal(body.publicKey, "ssh-public-example");
  assert.deepEqual(JSON.parse(body.config), {
    client_secret: marker,
    public: true,
  });
});

test("redacts create API-key response key while keeping its om_ consumer prefix and response shape", () => {
  const input = har();
  const e = entry(input);
  e.request.url = "https://example.test/api/v1/api-key";
  e.response.content.text = JSON.stringify({
    key: "om_synthetic_private_key_for_testing",
    id: "token-id",
    name: "public",
  });
  const clean = security.sanitizeHar(input);
  assert.deepEqual(JSON.parse(entry(clean).response.content.text), {
    key: "om_" + marker,
    id: "token-id",
    name: "public",
  });
  assert.deepEqual(security.inspectHar(clean), []);
  assert.deepEqual(security.sanitizeHar(clean), clean);
});

test("handles form text and HAR params including nested sensitive leaves", () => {
  const input = har();
  const e = entry(input);
  e.request.postData = {
    mimeType: "application/x-www-form-urlencoded",
    text: "name=public&password=" + opaque + "&return=" + encodeURIComponent("https://example.test/?token=" + opaque),
    params: [
      { name: "PASSWORD", value: opaque },
      { name: "name", value: "public" },
    ],
  };
  const clean = security.sanitizeHar(input);
  noSecret(clean);
  assert.equal(entry(clean).request.postData.params, undefined);
  assert.ok(entry(clean).request.postData.text.startsWith("name=public&password=" + marker));
});

test("decodes, sanitizes and reencodes base64 JSON response bodies", () => {
  const input = har();
  const e = entry(input);
  e.response.content = {
    size: 40,
    mimeType: "application/problem+json",
    encoding: "base64",
    text: Buffer.from(JSON.stringify({ token: jwt, password: opaque, public: 7 })).toString("base64"),
  };
  assert.ok(security.inspectHar(input).length > 0);
  const clean = security.sanitizeHar(input);
  assert.equal(entry(clean).response.content.encoding, "base64");
  assert.deepEqual(JSON.parse(Buffer.from(entry(clean).response.content.text, "base64").toString()), {
    token: marker,
    password: marker,
    public: 7,
  });
  assert.deepEqual(security.inspectHar(clean), []);
});

test("redacts JWTs with short empty-object payloads in arbitrary text", () => {
  const short = [Buffer.from('{"alg":"none"}').toString("base64url"), Buffer.from("{}").toString("base64url"), ""].join(
    "."
  );
  const input = har();
  input.log.comment = "prefix " + short;
  assert.ok(security.inspectHar(input).some(({ reason }) => reason === "JWT literal"));
  assert.equal(security.sanitizeHar(input).log.comment, undefined);
});

test("rejects malformed nested URL encoding and malformed path encoding without exposing labels", () => {
  for (const url of [
    "https://example.test/?next=" + encodeURIComponent("https://example.test/%ZZ"),
    "https://example.test/%ZZ?public=ok",
  ])
    assert.throws(
      () => security.sanitizeUrl(url),
      (error) => {
        noSecret(error.message);
        return true;
      }
    );
  assert.throws(
    () =>
      security.assertSafeHar(
        { bad: true },
        {
          toString() {
            throw new Error(opaque);
          },
        }
      ),
    (error) => {
      noSecret(error.message);
      return true;
    }
  );
});

test("all malformed values fail closed with safe errors and path-only inspection issues", () => {
  const cases = [null, {}, { log: { entries: "bad" } }, { log: { entries: [{ request: {}, response: {} }] } }];
  const badBase64 = har();
  entry(badBase64).response.content = {
    mimeType: "application/json",
    encoding: "base64",
    text: "***" + opaque,
  };
  cases.push(badBase64);
  const badJson = har();
  entry(badJson).response.content.text = '{"' + jwt + '":' + opaque;
  cases.push(badJson);
  const badUtf8 = har();
  entry(badUtf8).response.content = {
    mimeType: "application/json",
    encoding: "base64",
    text: "/w==",
  };
  cases.push(badUtf8);
  const badQuery = har();
  entry(badQuery).request.url = "https://example.test/?token=%ZZ" + opaque;
  cases.push(badQuery);
  const badEncoding = har();
  entry(badEncoding).response.content.encoding = opaque;
  cases.push(badEncoding);
  for (const input of cases) {
    const issues = security.inspectHar(input);
    assert.ok(issues.length > 0);
    noSecret(issues);
    assert.throws(
      () => security.sanitizeHar(input),
      (error) => {
        noSecret(error.message);
        return true;
      }
    );
    assert.throws(
      () => security.assertSafeHar(input, jwt + "/" + opaque),
      (error) => {
        noSecret(error.message);
        return true;
      }
    );
  }
});

test("inspects credential fixtures without flagging public token IDs or leaking hostile field names", () => {
  assert.deepEqual(
    security.inspectFixture({
      tokenId: "token-public",
      metadata: { token_id: "token-42" },
      publicKey: "ssh-rsa-public",
      token: { id: "token-55", name: "CI" },
    }),
    []
  );
  const issues = security.inspectFixture({
    [jwt]: { password: opaque },
    access_token: jwt,
    cookies: [{ name: "session", value: opaque }],
    origins: [
      {
        origin: "https://example.test",
        localStorage: [{ name: "token", value: jwt }],
      },
    ],
  });
  assert.ok(issues.length >= 4);
  noSecret(issues);
  for (const issue of issues) assert.deepEqual(Object.keys(issue).sort(), ["path", "reason"]);
});

test("fixture persistence sanitizes a clone and safely rejects contaminated fixture output", () => {
  const input = {
    instanceOrgPassword: opaque,
    tokenId: "token-123",
    token: { id: "token-456", name: "CI" },
    public: [{ name: "public" }],
    nested: { accessToken: jwt },
  };
  const original = structuredClone(input);
  const clean = security.sanitizeFixture(input);
  assert.deepEqual(clean, {
    ...input,
    instanceOrgPassword: marker,
    nested: { accessToken: marker },
  });
  assert.deepEqual(input, original);
  assert.notEqual(clean, input);
  assert.notEqual(clean.public, input.public);
  assert.deepEqual(security.inspectFixture(clean), []);
  security.assertSafeFixture(clean);
  assert.deepEqual(security.sanitizeFixture(clean), clean);
  assert.throws(
    () => security.assertSafeFixture(input, jwt + "/" + opaque),
    (error) => {
      noSecret(error.message);
      return true;
    }
  );
  assert.throws(
    () => security.sanitizeFixture({ bad: 1n }),
    (error) => {
      noSecret(error.message);
      return true;
    }
  );
});

test("redacts opaque jwtToken signin fields in HAR bodies and persisted ordinary fixtures", () => {
  const input = har();
  entry(input).response.content.text = JSON.stringify({ jwtToken: opaque, tokenId: "token-public" });
  assert.ok(security.inspectHar(input).length > 0);
  assert.deepEqual(JSON.parse(entry(security.sanitizeHar(input)).response.content.text), {
    jwtToken: marker,
    tokenId: "token-public",
  });
  assert.deepEqual(security.sanitizeFixture({ jwtToken: opaque, providerJwtToken: opaque, tokenId: "token-public" }), {
    jwtToken: marker,
    providerJwtToken: marker,
    tokenId: "token-public",
  });
});

test("redacts credential container values while preserving names, IDs, labels, flags and numeric schema metadata", () => {
  const input = {
    token: {
      id: 42,
      name: "Authorization Bearer token",
      label: "Basic authentication",
      type: "Bearer",
      enabled: false,
      value: opaque,
    },
    secrets: [{ name: "DB_PASSWORD", id: "secret-1", type: "string", required: true, value: opaque }],
    signingSecret: opaque,
    portBSigningSecret: opaque,
    metadata: { tokenCount: 12, apiKey: false, authentication: false },
    authentication: "Bearer",
    schema: { headers: [{ name: "Authorization", required: false, type: "string" }], cookies: ["session", "public"] },
  };
  const clean = security.sanitizeFixture(input);
  noSecret(clean);
  assert.deepEqual(clean, {
    ...input,
    token: { ...input.token, value: marker },
    secrets: [{ ...input.secrets[0], value: marker }],
    signingSecret: marker,
    portBSigningSecret: marker,
  });
  assert.deepEqual(security.inspectFixture(clean), []);
  assert.deepEqual(security.sanitizeFixture(clean), clean);
});

test("redacts API-key headers and bare secret endpoint request and response values", () => {
  const input = har();
  const e = entry(input);
  e.request.url = "https://example.test/api/v1/environment/DEV/secret/DB_PASSWORD";
  e.request.headers.push({ name: "X-API-Key", value: opaque });
  e.request.postData.text = JSON.stringify({ name: "DB_PASSWORD", value: opaque, enabled: false });
  e.response.content.text = JSON.stringify({ id: "secret-1", value: opaque, type: "string" });
  const clean = security.sanitizeHar(input);
  noSecret(clean);
  assert.equal(
    (entry(clean).request.headers ?? []).some((h) => h.name === "X-API-Key"),
    false
  );
  assert.deepEqual(JSON.parse(entry(clean).request.postData.text), {
    name: "DB_PASSWORD",
    value: marker,
    enabled: false,
  });
  assert.deepEqual(JSON.parse(entry(clean).response.content.text), { id: "secret-1", value: marker, type: "string" });
});

test("redacts percent-encoded path JWTs and embedded secret URLs in free text without changing surrounding prose", () => {
  const encoded = jwt.replaceAll(".", "%2E");
  const url = "https://example.test/api/items/" + encoded + "?public=a%20b";
  assert.equal(security.sanitizeUrl(url), "https://example.test/api/items/" + marker + "?public=a%20b");
  const input = {
    description: "Visit https://example.test/callback?token=" + opaque + "&public=ok for details.",
    name: "Bearer token",
    label: "Basic authentication",
  };
  assert.deepEqual(security.sanitizeFixture(input), {
    ...input,
    description: "Visit https://example.test/callback?token=" + marker + "&public=ok for details.",
  });
  assert.equal(
    security.sanitizeFixture({ notice: "Open https://example.test/?access_token=" + opaque + "." }).notice,
    "Open https://example.test/?access_token=" + marker + "."
  );
  assert.equal(
    security.sanitizeFixture({ notice: "prefix " + encoded + " suffix" }).notice,
    "prefix " + marker + " suffix"
  );
});

test("full corpus check rejects directory symlinks rather than silently skipping recordings", async (t) => {
  const root = await temp(t);
  const outside = await temp(t);
  await writeFile(join(root, "safe.har"), JSON.stringify(har()));
  await writeFile(join(outside, "hidden.har"), JSON.stringify(har()));
  await symlink(outside, join(root, "linked-recordings"), "dir");
  const result = await security.scanFixtures([root], { requireHars: true });
  assert.ok(result.issues.length > 0);
});

test("tracked auth check rejects credential bytes staged in the git index even after clean worktree overwrite", async (t) => {
  const root = await temp(t);
  spawnSync("git", ["init", "-q", root]);
  await mkdir(join(root, ".auth"));
  await mkdir(join(root, "hars"));
  await writeFile(join(root, "hars", "one.har"), JSON.stringify(har()));
  await writeFile(
    join(root, ".auth", "user.json"),
    JSON.stringify({ cookies: [{ name: "session", value: opaque }], origins: [] })
  );
  spawnSync("git", ["-C", root, "add", "-f", ".auth/user.json"]);
  await writeFile(join(root, ".auth", "user.json"), JSON.stringify({ cookies: [], origins: [] }));
  const result = run(["--tracked-auth", "--require-hars", "hars"], root);
  assert.notEqual(result.status, 0);
  noSecret(result.stdout + result.stderr);
});

test("redacts numeric passwords and nested credential material while retaining numeric metadata flags", () => {
  const input = {
    password: 123,
    token: { id: 3, name: "CI", value: { raw: opaque, id: "public-id", enabled: false } },
    secrets: [{ name: "OTP", value: 123 }],
  };
  assert.deepEqual(security.sanitizeFixture(input), {
    password: Number.MIN_SAFE_INTEGER,
    token: { ...input.token, value: { raw: marker, id: "public-id", enabled: false } },
    secrets: [{ name: "OTP", value: Number.MIN_SAFE_INTEGER }],
  });
});

test("full scanner checks HAR gzip and JSON fixtures, sanitizes only valid HARs and is idempotent", async (t) => {
  const root = await temp(t);
  const input = har();
  entry(input).request.headers.push({ name: "Authorization", value: opaque });
  await writeFile(join(root, "one.har.gz"), gzipSync(JSON.stringify(input)));
  await writeFile(join(root, "public.json"), JSON.stringify({ tokenId: "token-public" }));
  const before = await security.scanFixtures([root], { requireHars: true });
  assert.equal(before.harFiles, 1);
  assert.equal(before.fixtureFiles, 1);
  assert.ok(before.issues.length > 0);
  noSecret(before.issues);
  const fixed = await security.scanFixtures([root], {
    sanitize: true,
    requireHars: true,
  });
  assert.deepEqual(fixed.issues, []);
  assert.equal(fixed.changedFiles.length, 1);
  assert.deepEqual(security.inspectHar(JSON.parse(gunzipSync(await readFile(join(root, "one.har.gz"))))), []);
  const again = await security.scanFixtures([root], {
    sanitize: true,
    requireHars: true,
  });
  assert.deepEqual(again.changedFiles, []);
});

test("scanner sanitizes compressed JSON fixtures while preserving public token metadata", async (t) => {
  const root = await temp(t);
  const input = {
    password: opaque,
    tokenId: "token-12",
    public: "name",
    token: { id: "token-13", name: "CI" },
  };
  await writeFile(join(root, "generated.json.gz"), gzipSync(JSON.stringify(input)));
  const before = await security.scanFixtures([root]);
  assert.equal(before.fixtureFiles, 1);
  assert.ok(before.issues.length > 0);
  const clean = await security.scanFixtures([root], { sanitize: true });
  assert.deepEqual(clean.issues, []);
  assert.equal(clean.changedFiles.length, 1);
  assert.deepEqual(JSON.parse(gunzipSync(await readFile(join(root, "generated.json.gz")))), {
    ...input,
    password: marker,
  });
});

test("sanitizes prefixed password fields and preserves public bracketed strings and secret metadata", async (t) => {
  const root = await temp(t);
  const input = {
    instanceOrgPassword: opaque,
    serviceAccountPassword: opaque,
    serviceProviderOrgPassword: opaque,
    apiKeyId: "key-id",
    secretName: "public-name",
    tokenId: "token-1",
    public: "[public]",
    placeholder: "[REDACTED]",
  };
  await writeFile(join(root, "fields.json.gz"), gzipSync(JSON.stringify(input)));
  const clean = await security.scanFixtures([root], { sanitize: true });
  assert.deepEqual(clean.issues, []);
  assert.deepEqual(JSON.parse(gunzipSync(await readFile(join(root, "fields.json.gz")))), {
    ...input,
    instanceOrgPassword: marker,
    serviceAccountPassword: marker,
    serviceProviderOrgPassword: marker,
  });
});

test("scanner fails nonexistent roots and empty required corpus, and skips only git metadata", async (t) => {
  const root = await temp(t);
  assert.ok((await security.scanFixtures([join(root, "missing")], {})).issues.length > 0);
  assert.ok((await security.scanFixtures([root], { requireHars: true })).issues.length > 0);
  for (const name of [".git"]) {
    await mkdir(join(root, name));
    await writeFile(join(root, name, "bad.har"), opaque);
  }
  assert.deepEqual((await security.scanFixtures([root], {})).issues, []);
});

test("required corpus rejects HAR files that contain no replay entries", async (t) => {
  const root = await temp(t);
  await writeFile(join(root, "empty.har"), JSON.stringify({ log: { entries: [] } }));
  const result = await security.scanFixtures([root], { requireHars: true });
  assert.equal(result.harFiles, 1);
  assert.ok(result.issues.length > 0);
});

test("scanner leaves every input untouched when a malformed file prevents safe sanitation", async (t) => {
  const root = await temp(t);
  const input = har();
  entry(input).request.headers.push({ name: "Cookie", value: opaque });
  const serialized = JSON.stringify(input);
  await writeFile(join(root, "good.har"), serialized);
  await writeFile(join(root, "bad.har"), opaque);
  const result = await security.scanFixtures([root], { sanitize: true });
  assert.ok(result.issues.length > 0);
  assert.deepEqual(result.changedFiles, []);
  assert.equal(await readFile(join(root, "good.har"), "utf8"), serialized);
  noSecret(result.issues);
});

test("CLI gives safe failure diagnostics for malformed files, hostile filenames and unknown arguments", async (t) => {
  const root = await temp(t);
  const badName = opaque + ".har";
  await writeFile(join(root, badName), '{"' + jwt + '":');
  for (const args of [[root], ["--" + opaque], ["--require-hars", join(root, opaque + "-missing")]]) {
    const result = run(args, root);
    assert.notEqual(result.status, 0);
    noSecret(result.stdout + result.stderr);
  }
  const empty = await temp(t);
  assert.notEqual(run(["--require-hars", empty], empty).status, 0);
});

test("CLI sanitizes output and validates the full retained corpus before success", async (t) => {
  const root = await temp(t);
  const input = har();
  entry(input).request.headers.push({ name: "Authorization", value: opaque });
  await writeFile(join(root, "one.har"), JSON.stringify(input));
  assert.notEqual(run(["--require-hars", root], root).status, 0);
  assert.equal(run(["--sanitize", "--require-hars", root], root).status, 0);
  assert.equal(run(["--require-hars", root], root).status, 0);
  await writeFile(join(root, "retained.har"), "{");
  assert.notEqual(run(["--require-hars", root], root).status, 0);
});

test("staged corpus guard inspects every indexed fixture and permits sanitation of contaminated old snapshots", async (t) => {
  const root = await temp(t);
  spawnSync("git", ["init", "-q", root]);
  await mkdir(join(root, "hars"));
  const dirty = har();
  entry(dirty).request.headers.push({ name: "Authorization", value: opaque });
  await writeFile(join(root, "hars", "one.har"), JSON.stringify(dirty));
  await writeFile(join(root, "hars", "retained.har"), JSON.stringify(har()));
  spawnSync("git", ["-C", root, "add", "hars"]);
  const cleaned = run(["--sanitize", "--require-hars", "--tracked-auth", "hars"], root);
  assert.equal(cleaned.status, 0);
  const blocked = run(["--staged", "--require-hars", "--tracked-auth", "hars"], root);
  assert.notEqual(blocked.status, 0);
  noSecret(blocked.stdout + blocked.stderr);
  spawnSync("git", ["-C", root, "add", "hars"]);
  assert.equal(run(["--staged", "--require-hars", "--tracked-auth", "hars"], root).status, 0);
  await writeFile(join(root, "hars", "retained.har"), JSON.stringify(dirty));
  assert.equal(run(["--staged", "--require-hars", "hars"], root).status, 0);
  assert.notEqual(run(["--require-hars", "hars"], root).status, 0);
  spawnSync("git", ["-C", root, "add", "hars/retained.har"]);
  await writeFile(join(root, "hars", "retained.har"), JSON.stringify(har()));
  assert.notEqual(run(["--staged", "--require-hars", "hars"], root).status, 0);
  assert.notEqual(run(["--staged", "--sanitize", "hars"], root).status, 0);
});

test("staged corpus checks compressed HAR and JSON fixtures independently of the worktree", async (t) => {
  const root = await temp(t);
  spawnSync("git", ["init", "-q", root]);
  await writeFile(join(root, "one.har.gz"), gzipSync(JSON.stringify(har())));
  await writeFile(join(root, "generated.json.gz"), gzipSync(JSON.stringify({ password: opaque, tokenId: "public" })));
  spawnSync("git", ["-C", root, "add", "."]);
  await writeFile(join(root, "generated.json.gz"), gzipSync(JSON.stringify({ password: marker, tokenId: "public" })));
  const blocked = run(["--staged", "--require-hars", "."], root);
  assert.notEqual(blocked.status, 0);
  noSecret(blocked.stdout + blocked.stderr);
  spawnSync("git", ["-C", root, "add", "."]);
  const safe = run(["--staged", "--require-hars", "."], root);
  assert.equal(safe.status, 0);
  assert.ok(safe.stdout.includes("HAR files: 1; JSON fixtures: 1"));
});

test("malformed optional response bodySize is rejected before typed HAR acceptance", () => {
  const input = har();
  entry(input).response.bodySize = opaque;
  assert.throws(
    () => security.sanitizeHar(input),
    (error) => {
      noSecret(error.message);
      return true;
    }
  );
});

test("redacts raw password-object leaves and apiToken aliases without losing metadata", () => {
  const input = {
    password: { raw: opaque, id: "public", type: "string" },
    credentials: { id: "public", apiToken: opaque, enabled: false },
  };
  assert.ok(security.inspectFixture(input).length > 0);
  const clean = security.sanitizeFixture(input);
  noSecret(clean);
  assert.deepEqual(clean, {
    password: { raw: marker, id: "public", type: "string" },
    credentials: { id: "public", apiToken: marker, enabled: false },
  });
});

test("redacts high-confidence Basic base64 credentials while preserving public Basic prose", () => {
  const credential = Buffer.from("syntheticUser:syntheticPassword").toString("base64");
  const input = {
    authenticationHeader: "Basic " + credential,
    name: "Basic authentication",
    description: "Basic authentication is supported.",
  };
  const clean = security.sanitizeFixture(input);
  assert.equal(clean.authenticationHeader, "Basic " + marker);
  assert.equal(JSON.stringify(clean).includes(credential), false);
  assert.equal(clean.name, input.name);
  assert.equal(clean.description, input.description);
  assert.deepEqual(security.inspectFixture(clean), []);
});

test("tracked auth detects mixed-case JSON suffixes in index bytes outside the selected HAR root", async (t) => {
  const root = await temp(t);
  spawnSync("git", ["init", "-q", root]);
  await mkdir(join(root, ".auth"));
  await mkdir(join(root, "hars"));
  await writeFile(join(root, "hars", "one.har"), JSON.stringify(har()));
  await writeFile(
    join(root, ".auth", "user.JSON"),
    JSON.stringify({ cookies: [{ name: "session", value: opaque }], origins: [] })
  );
  spawnSync("git", ["-C", root, "add", "-f", ".auth/user.JSON"]);
  await writeFile(join(root, ".auth", "user.JSON"), JSON.stringify({ cookies: [], origins: [] }));
  const result = run(["--tracked-auth", "--require-hars", "hars"], root);
  assert.notEqual(result.status, 0);
  noSecret(result.stdout + result.stderr);
});

test("tracked auth state blocks checking while untracked runtime auth stays available", async (t) => {
  const root = await temp(t);
  spawnSync("git", ["init", "-q", root]);
  await mkdir(join(root, ".auth"));
  await mkdir(join(root, "hars"));
  await writeFile(join(root, "hars", "one.har"), JSON.stringify(har()));
  const state = {
    cookies: [{ name: "session", value: opaque, domain: "example.test", path: "/" }],
    origins: [],
  };
  await writeFile(join(root, ".auth", "user.json"), JSON.stringify(state));
  assert.equal(run(["--tracked-auth", "--require-hars", "hars"], root).status, 0);
  assert.notEqual(run(["--tracked-auth", "--require-hars", "."], root).status, 0);
  spawnSync("git", ["-C", root, "add", "-f", ".auth/user.json"]);
  const rejected = run(["--tracked-auth", "--require-hars", "hars"], root);
  assert.notEqual(rejected.status, 0);
  noSecret(rejected.stdout + rejected.stderr);
  assert.notEqual(run(["--sanitize", "--tracked-auth", "hars"], root).status, 0);
  assert.equal(await readFile(join(root, ".auth", "user.json"), "utf8"), JSON.stringify(state));
});

const aliases = [
  "secretValue",
  "secretAccessKey",
  "sessionToken",
  "handoffToken",
  "clientKeyData",
  "clientKeyDataBase64",
  "clientCertificateData",
  "clientCertificateDataBase64",
  "serviceAccountToken",
  "tokenValue",
  "providerToken",
  "userToken",
  "privateKey",
  "privateKeyPEM",
  "currentPassword",
  "currentPasswordHash",
  "hashedPassword",
  "certificateBase64",
  "omnistrateSecret",
  "rehearsalHandoffToken",
  "awsAccessKey",
  "awsSecretKey",
  "smtpPassword",
];
for (const alias of aliases)
  test(`redacts credential alias ${alias} and case/separator variants`, () => {
    const variants = [
      alias,
      alias.toUpperCase(),
      alias.replace(/[A-Z]/g, (char) => "_" + char.toLowerCase()),
      alias.replace(/[A-Z]/g, (char) => "-" + char.toLowerCase()),
    ];
    for (const key of variants) {
      const input = { [key]: opaque, tokenId: "public-id", tokenCount: 12 };
      assert.ok(security.inspectFixture(input).length > 0);
      assert.deepEqual(security.sanitizeFixture(input), { ...input, [key]: marker });
      assert.deepEqual(security.inspectFixture(security.sanitizeFixture(input)), []);
    }
  });
for (const container of ["credentials", "secret", "secrets", "auth", "password", "kubeconfig"])
  test(`propagates credential context in ${container}`, () => {
    const input = {
      [container]: {
        provider: {
          pass: opaque,
          nested: [opaque, { arbitrary: opaque, enabled: false }],
          id: "public-id",
          name: "public",
          type: "string",
          status: "READY",
          createdAt: "2026-01-01",
        },
      },
    };
    assert.ok(security.inspectFixture(input).length > 0);
    const clean = security.sanitizeFixture(input);
    noSecret(clean);
    if (container !== "secrets") assert.equal(clean[container].provider.id, "public-id");
    assert.deepEqual(security.inspectFixture(clean), []);
  });
test("redacts secret dictionary values, including base64, while keeping names", () => {
  const input = { secrets: { DB_CONNECTION: opaque, ENCODED: Buffer.from(opaque).toString("base64"), name: opaque } };
  assert.ok(security.inspectFixture(input).length >= 3);
  assert.deepEqual(security.sanitizeFixture(input), {
    secrets: { DB_CONNECTION: marker, ENCODED: marker, name: marker },
  });
});
const signedQueries = [
  "X-Amz-Signature=private&X-Amz-Credential=private&X-Amz-Security-Token=private&region=us-east-1",
  "X-Goog-Signature=private&X-Goog-Credential=private&region=us-east-1",
  "sig=private&se=2030-01-01&sp=r&sv=2025-01-01",
  "code=private&state=public",
];
for (const query of signedQueries)
  test(`redacts signed/callback URLs (${query.split("=")[0]}) in every retained URL channel`, () => {
    const url = `https://example.test/callback?${query}`;
    const input = har();
    entry(input).request.url = url;
    entry(input).response.headers.push({ name: "Location", value: url });
    entry(input).response.redirectURL = url;
    entry(input).response.content.text = JSON.stringify({
      redirectURL: url,
      nested: JSON.stringify({ link: url }),
      notice: `Open ${url} for details.`,
    });
    assert.ok(security.inspectHar(input).length >= 4);
    const clean = security.sanitizeHar(input);
    assert.equal(JSON.stringify(clean).includes("private"), false);
    assert.equal(security.sanitizeUrl(url).includes("private"), false);
    assert.deepEqual(security.inspectHar(clean), []);
    assert.deepEqual(security.sanitizeHar(clean), clean);
  });
test("recognizes hoff_ handoff literals and preserves ordinary code queries", () => {
  const input = { notice: "hoff_synthetic-handoff" };
  assert.ok(security.inspectFixture(input).length > 0);
  assert.deepEqual(security.sanitizeFixture(input), { notice: `hoff_${marker}` });
  assert.equal(
    security.sanitizeUrl("https://example.test/items?code=public"),
    "https://example.test/items?code=public"
  );
});
for (const name of ["X-Access-Token", "X-Session-Token", "X-Amz-Security-Token", "X-Api-Key", "Proxy-Authorization"])
  test(`inspects credential header ${name} in older HARs`, () => {
    const input = har();
    entry(input).request.headers.push({ name, value: opaque });
    assert.ok(security.inspectHar(input).some(({ reason }) => reason === "credential header"));
    assert.equal(entry(security.sanitizeHar(input)).request.headers, undefined);
  });
for (const encoded of [false, true])
  test(`sanitizes multipart text and params (base64=${encoded})`, () => {
    const text = `--test-boundary\r\nContent-Disposition: form-data; name="name"\r\n\r\npublic\r\n--test-boundary\r\nContent-Disposition: form-data; name="password"\r\n\r\n${opaque}\r\n--test-boundary\r\nContent-Disposition: form-data; name="fileContent"; filename="config.json"\r\n\r\n{"password":"${opaque}"}\r\n--test-boundary--\r\n`;
    const input = har();
    entry(input).request.postData = {
      mimeType: "multipart/form-data; boundary=test-boundary",
      text: encoded ? Buffer.from(text).toString("base64") : text,
      ...(encoded ? { encoding: "base64" } : {}),
      params: [{ name: "password", value: opaque }],
    };
    assert.ok(security.inspectHar(input).length > 0);
    const clean = security.sanitizeHar(input);
    noSecret(clean);
    assert.ok(entry(clean).request.postData.text.includes("public"));
    assert.equal(entry(clean).request.postData.mimeType, "multipart/form-data; boundary=HAR_REDACTED_BOUNDARY");
    assert.ok(entry(clean).request.postData.text.startsWith("--HAR_REDACTED_BOUNDARY\r\n"));
    assert.deepEqual(security.inspectHar(clean), []);
    const inferred = { mimeType: "multipart/form-data", text };
    assert.equal(security.sanitizePostData(inferred).text, entry(clean).request.postData.text);
  });
for (const encoded of [false, true])
  test(`keeps multipart response boundaries while scrubbing parts (base64=${encoded})`, () => {
    const input = har();
    const mimeType = "multipart/form-data; boundary=B";
    const fileContent = Buffer.from(JSON.stringify({ password: opaque, public: "value" })).toString("base64");
    const text = `--B\r\nContent-Disposition: form-data; name="password"\r\n\r\n${opaque}\r\n--B\r\nContent-Disposition: form-data; name="fileContent"\r\n\r\n${fileContent}\r\n--B--\r\n`;
    entry(input).response.headers = [{ name: "Content-Type", value: mimeType }];
    entry(input).response.content = {
      mimeType,
      text: encoded ? Buffer.from(text).toString("base64") : text,
      ...(encoded ? { encoding: "base64" } : {}),
    };
    assert.ok(security.inspectHar(input).length > 0);
    const clean = security.sanitizeHar(input);
    const content = entry(clean).response.content;
    const body = encoded ? Buffer.from(content.text, "base64").toString() : content.text;
    const cleanFile = Buffer.from(JSON.stringify({ password: marker, public: "value" })).toString("base64");
    assert.equal(body, text.replace(opaque, marker).replace(fileContent, cleanFile));
    assert.equal(content.mimeType, mimeType);
    assert.deepEqual(entry(clean).response.headers, entry(input).response.headers);
    assert.deepEqual(security.inspectHar(clean), []);
    assert.deepEqual(security.sanitizeHar(clean), clean);
  });
test("replaces unparseable multipart with a fixed placeholder", () => {
  const input = har();
  entry(input).request.postData = { mimeType: "multipart/form-data", text: opaque };
  assert.ok(security.inspectHar(input).some(({ reason }) => reason === "unparseable multipart body"));
  assert.equal(entry(security.sanitizeHar(input)).request.postData.text, marker);
});
for (const field of ["fileContent", "content", "data"])
  test(`inspects and redacts textual base64 config-file field ${field}`, () => {
    const text = `password: ${opaque}\npublic: value`;
    const input = { configFile: { [field]: Buffer.from(text).toString("base64"), name: "public-config" } };
    assert.ok(security.inspectFixture(input).length > 0);
    const clean = security.sanitizeFixture(input);
    assert.equal(Buffer.from(clean.configFile[field], "base64").toString(), `password: ${marker}\npublic: value`);
    assert.deepEqual(security.inspectFixture(clean), []);
  });
for (const label of ["PRIVATE KEY", "RSA PRIVATE KEY", "EC PRIVATE KEY", "ENCRYPTED PRIVATE KEY"])
  test(`redacts PEM ${label} anywhere in text`, () => {
    const input = { notice: `prefix -----BEGIN ${label}-----\n${opaque}\n-----END ${label}----- suffix` };
    assert.ok(security.inspectFixture(input).some(({ reason }) => reason === "PEM private key"));
    assert.deepEqual(security.sanitizeFixture(input), { notice: `prefix ${marker} suffix` });
  });
for (const mimeType of ["x-unknown", "application/octet-stream"])
  test(`keeps base64 UTF-8 response text (${mimeType})`, () => {
    const input = har();
    const content = {
      mimeType,
      encoding: "base64",
      text: Buffer.from("sub-abc123XYZ").toString("base64"),
    };
    entry(input).response.content = content;
    const clean = security.sanitizeHar(input);
    assert.deepEqual(entry(clean).response.content, content);
    assert.deepEqual(security.inspectHar(clean), []);
    assert.deepEqual(security.sanitizeHar(clean), clean);
  });
for (const encoded of [false, true])
  test(`keeps and scrubs x-unknown response text (base64=${encoded})`, () => {
    const input = har();
    const text = `password=opaque-secret ${jwt} Bearer abc.def public`;
    entry(input).response.content = {
      mimeType: "x-unknown",
      text: encoded ? Buffer.from(text).toString("base64") : text,
      ...(encoded ? { encoding: "base64" } : {}),
    };
    assert.deepEqual(
      security
        .inspectHar(input)
        .map(({ reason }) => reason)
        .sort(),
      ["credential text field", "JWT literal", "Bearer credential literal"].sort()
    );
    const clean = security.sanitizeHar(input);
    const content = entry(clean).response.content;
    const expected = `password=${marker} ${marker} Bearer ${marker} public`;
    assert.equal(content.text, encoded ? Buffer.from(expected).toString("base64") : expected);
    assert.equal(content.mimeType, "x-unknown");
    assert.equal(content.encoding, encoded ? "base64" : undefined);
    assert.deepEqual(security.inspectHar(clean), []);
    assert.deepEqual(security.sanitizeHar(clean), clean);
  });
for (const mimeType of [
  "image/png",
  "application/pdf",
  "application/zip",
  "application/octet-stream",
  "application/x-tar",
])
  test(`drops unsupported binary response text (${mimeType})`, () => {
    const input = har();
    entry(input).response.content = {
      mimeType,
      size: 5,
      encoding: "base64",
      text: Buffer.from([0, 255, 1, 254, 2]).toString("base64"),
    };
    assert.ok(security.inspectHar(input).some(({ reason }) => reason === "unsupported binary response body"));
    const clean = security.sanitizeHar(input);
    assert.deepEqual(entry(clean).response.content, { mimeType, size: 5, encoding: "base64" });
    assert.deepEqual(security.inspectHar(clean), []);
    assert.deepEqual(security.sanitizeHar(clean), clean);
  });
test("inspects base64 websocket extension data even though persistence drops it", () => {
  const input = har();
  entry(input)._webSocketMessages = [{ data: Buffer.from(JSON.stringify({ password: opaque })).toString("base64") }];
  assert.ok(security.inspectHar(input).length > 0);
  assert.equal(entry(security.sanitizeHar(input))._webSocketMessages, undefined);
});
for (const query of ["discount=100%25", "q=%25", "q=%25ZZ", "next=https%3A%2F%2Fexample.test%2F%3Fq%3D%2525"])
  test(`preserves valid percent encoding (${query})`, () => {
    const url = `https://example.test/?${query}`;
    const input = har();
    entry(input).request.url = url;
    assert.equal(security.sanitizeUrl(url), url);
    assert.deepEqual(security.inspectHar(input), []);
  });
for (const url of [
  "https://example.test/2022-09-01-00/secret/DB_PASSWORD",
  "https://example.test/api/action?endpoint=%2F2022-09-01-00%2Fsecret%2FDB_PASSWORD",
])
  test(`classifies direct/proxied secret results (${new URL(url).pathname})`, () => {
    const input = har();
    entry(input).request.url = url;
    entry(input).response.content.text = JSON.stringify({
      value: opaque,
      id: "secret-id",
      name: "DB_PASSWORD",
      status: "READY",
    });
    assert.ok(security.inspectHar(input).length > 0);
    assert.deepEqual(JSON.parse(entry(security.sanitizeHar(input)).response.content.text), {
      value: marker,
      id: "secret-id",
      name: "DB_PASSWORD",
      status: "READY",
    });
  });
test("redacts numeric credentials with a numeric placeholder and keeps explicit metadata", () => {
  const input = { token: 0, password: 456, tokenCount: 12, credentials: { token: 789, id: 42, enabled: false } };
  assert.ok(security.inspectFixture(input).length >= 3);
  const clean = {
    ...input,
    token: Number.MIN_SAFE_INTEGER,
    password: Number.MIN_SAFE_INTEGER,
    credentials: { ...input.credentials, token: Number.MIN_SAFE_INTEGER },
  };
  assert.deepEqual(security.sanitizeFixture(input), clean);
  assert.deepEqual(security.inspectFixture(clean), []);
});
test("inspects untracked corpus auth states and arbitrary files under generated directories", async (t) => {
  const root = await temp(t);
  spawnSync("git", ["init", "-q", root]);
  await mkdir(join(root, "reports"));
  await writeFile(
    join(root, "reports", "untracked.fixture.json"),
    JSON.stringify({ cookies: [{ name: "session", value: opaque }], origins: [] })
  );
  await writeFile(join(root, "untracked.txt"), `password: ${opaque}`);
  const result = await security.scanFixtures([root]);
  assert.ok(result.issues.some(({ reason }) => reason === "cookie state"));
  assert.ok(result.issues.some(({ reason }) => reason === "unexpected file in HAR corpus"));
});
test("sanitizes files whose names leave no room for a suffixed temporary name", async (t) => {
  const root = await temp(t);
  const name = `${"a".repeat(220)}.fixture.json`;
  await writeFile(join(root, name), JSON.stringify({ password: opaque }));
  const result = await security.scanFixtures([root], { sanitize: true });
  assert.deepEqual(result.issues, []);
  noSecret(await readFile(join(root, name), "utf8"));
});
test("checks staged corpora reached through a symlinked path", async (t) => {
  const real = await temp(t);
  spawnSync("git", ["init", "-q", real]);
  await mkdir(join(real, "p", "s"), { recursive: true });
  await writeFile(join(real, "p", "s", "x.har"), JSON.stringify(har()));
  spawnSync("git", ["-C", real, "add", "-A"]);
  const linked = `${real}-link`;
  await symlink(real, linked);
  t.after(() => rm(linked, { force: true }));
  const result = await security.scanStagedFixtures([linked], { requireHars: true });
  assert.deepEqual(result.issues, []);
  assert.equal(result.harFiles, 1);
});
test("scrubs malformed or templated URLs inside bodies instead of rejecting the recording", () => {
  const input = har();
  entry(input).response.content.text = JSON.stringify({
    links: ["http://:8080/health", `https://{{host}}/x?token=${opaque}&q=%zz`, "https://[bad/path"],
  });
  const clean = security.sanitizeHar(input);
  noSecret(JSON.stringify(clean));
  assert.deepEqual(security.inspectHar(clean), []);
  const text = entry(clean).response.content.text;
  assert.ok(text.includes("http://:8080/health") && text.includes("https://[bad/path"));
  const request = har();
  entry(request).request.url = "https://[bad/path";
  assert.throws(() => security.sanitizeHar(request));
});
test("skips corpus tooling and docs without reading them", async (t) => {
  const root = await temp(t);
  spawnSync("git", ["init", "-q", root]);
  await mkdir(join(root, "scripts"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(join(root, "scripts", "har-security.test.mjs"), `const fixture = "password: ${opaque}?q=%zz";`);
  await writeFile(join(root, ".github", "workflows", "har-security.yml"), "name: HAR security\n");
  await writeFile(join(root, "README.md"), `password: ${opaque}`);
  assert.deepEqual((await security.scanFixtures([root])).issues, []);
});
for (const artifact of ["test-results/auth/user.json", "test-results/global-state.json"])
  test(`refuses runtime artifact publication (${artifact})`, async (t) => {
    const root = await temp(t);
    const path = join(root, artifact);
    await mkdir(join(path, ".."), { recursive: true });
    await writeFile(path, JSON.stringify({ cookies: [], origins: [] }));
    assert.notEqual(run([artifact], root).status, 0);
    assert.ok(
      (await security.scanFixtures([root])).issues.some(
        ({ reason }) => reason === "runtime auth artifacts are not publishable"
      )
    );
  });
test("sanitizes backend diagnostics before truncation and fails safely on invalid input", () => {
  const input = { secretValue: opaque, message: "x".repeat(500) };
  const clean = security.sanitizeDiagnostic(input);
  noSecret(clean);
  assert.equal(clean.length, 300);
  assert.equal(security.sanitizeDiagnostic(`password: ${opaque}\n${"x".repeat(500)}`).length, 300);
  assert.equal(security.sanitizeDiagnostic(1n), marker);
});

for (const [text, expected] of [
  [`Login failed: password=${opaque}`, `Login failed: password=${marker}`],
  [`token: ${opaque}`, `token: ${marker}`],
  [`Notice: token: ${opaque}`, `Notice: token: ${marker}`],
  [`Header: Authorization: Bearer ${opaque}`, `Header: Authorization: ${marker}`],
  [`Notice: api_key = ${opaque}; retry later`, `Notice: api_key = ${marker}; retry later`],
  [`Invalid payload: "secret":"${opaque}", "name":"public"`, `Invalid payload: "secret":"${marker}", "name":"public"`],
  [`password="${opaque} with spaces" token='${opaque}'`, `password="${marker}" token='${marker}'`],
  ["password policy updated", "password policy updated"],
  ['Fields: password: \n token=\n api_key: ""', 'Fields: password: \n token=\n api_key: ""'],
  ["password: # field label\nname: public", "password: # field label\nname: public"],
  ["tokenId: public-id; api_key_label = public", "tokenId: public-id; api_key_label = public"],
]) {
  test(`sanitizes inline credential assignments: ${text.replaceAll(opaque, "synthetic")}`, () => {
    const input = har();
    entry(input).response.content = { mimeType: "text/plain", text };
    assert.equal(security.inspectHar(input).length > 0, text !== expected);
    const clean = security.sanitizeHar(input);
    assert.equal(entry(clean).response.content.text, expected);
    assert.equal(security.sanitizeDiagnostic(text), expected);
    assert.deepEqual(security.inspectHar(clean), []);
    assert.deepEqual(security.sanitizeHar(clean), clean);
  });
}

for (const text of [
  `env:\n  - name: DB_PASSWORD\n    value: ${opaque}\n  - name: REGION\n    value: public`,
  `- key: API_KEY\n  value: "${opaque}"\n- key: REGION\n  value: public`,
  `key: TOKEN\nvalue: ${opaque}\nkey: REGION\nvalue: public`,
  `name: 'ACCESS_TOKEN'\r\n  value: '${opaque}'\r\nname: public\r\n  value: public`,
  "env:\n  - name: DB_PASSWORD\n    value: \n  - name: REGION\n    value: public",
  "- key: API_KEY\n  value: # field label\n- key: REGION\n  value: public",
]) {
  test(`sanitizes YAML credential name-value pairs: ${text.replaceAll(opaque, "synthetic")}`, () => {
    const expected = text.replaceAll(opaque, marker);
    const input = har();
    entry(input).response.content = { mimeType: "application/yaml", text };
    assert.equal(security.inspectHar(input).length > 0, text !== expected);
    const clean = security.sanitizeHar(input);
    assert.equal(entry(clean).response.content.text, expected);
    assert.deepEqual(security.inspectHar(clean), []);
    entry(input).response.content.encoding = "base64";
    entry(input).response.content.text = Buffer.from(text).toString("base64");
    assert.equal(security.inspectHar(input).length > 0, text !== expected);
    const encodedClean = security.sanitizeHar(input);
    assert.equal(Buffer.from(entry(encodedClean).response.content.text, "base64").toString(), expected);
    assert.deepEqual(security.inspectHar(encodedClean), []);
    for (const field of ["fileContent", "content", "data"]) {
      const fixture = { configFile: { [field]: Buffer.from(text).toString("base64") } };
      assert.equal(security.inspectFixture(fixture).length > 0, text !== expected);
      const scrubbed = security.sanitizeFixture(fixture);
      assert.equal(Buffer.from(scrubbed.configFile[field], "base64").toString(), expected);
      assert.deepEqual(security.inspectFixture(scrubbed), []);
    }
  });
}

test("sanitizes structured env name-value and key-value credentials while preserving public values and labels", () => {
  const input = {
    env: [
      { name: "DB_PASSWORD", value: opaque },
      { key: "API_KEY", value: opaque },
      { name: "REGION", value: "public" },
      { name: "DB_PASSWORD", label: "Password" },
    ],
  };
  const expected = {
    env: [
      { name: "DB_PASSWORD", value: marker },
      { key: "API_KEY", value: marker },
      { name: "REGION", value: "public" },
      { name: "DB_PASSWORD", label: "Password" },
    ],
  };
  assert.ok(security.inspectFixture(input).length > 0);
  assert.deepEqual(security.sanitizeFixture(input), expected);
  assert.deepEqual(security.inspectFixture(expected), []);
  const recording = har();
  entry(recording).response.content.text = JSON.stringify(input);
  assert.ok(security.inspectHar(recording).length > 0);
  const clean = security.sanitizeHar(recording);
  assert.deepEqual(JSON.parse(entry(clean).response.content.text), expected);
  assert.deepEqual(security.inspectHar(clean), []);
});

test("persists only replay fields and the response header allowlist", () => {
  const input = har();
  const e = entry(input);
  e._initiator = { url: "https://example.test/?token=" + opaque };
  e._securityDetails = { protocol: "TLS" };
  e._resourceType = "fetch";
  e.response.headers.push(
    { name: "Content-Disposition", value: "attachment; filename=public.json" },
    { name: "X-Request-ID", value: "public-id" }
  );
  assert.ok(security.inspectHar(input).length > 0);
  const clean = security.sanitizeHar(input);
  assert.deepEqual(Object.keys(clean), ["log"]);
  assert.deepEqual(Object.keys(clean.log).sort(), ["creator", "entries", "version"]);
  assert.deepEqual(Object.keys(entry(clean)).sort(), ["request", "response"]);
  assert.deepEqual(Object.keys(entry(clean).request).sort(), ["method", "postData", "url"]);
  assert.deepEqual(Object.keys(entry(clean).request.postData).sort(), ["mimeType", "text"]);
  assert.deepEqual(Object.keys(entry(clean).response).sort(), [
    "bodySize",
    "content",
    "headers",
    "status",
    "statusText",
  ]);
  assert.deepEqual(Object.keys(entry(clean).response.content).sort(), ["mimeType", "size", "text"]);
  assert.deepEqual(
    entry(clean).response.headers.map(({ name }) => name),
    ["Content-Type", "Content-Disposition"]
  );
  assert.deepEqual(security.inspectHar(clean), []);
});

test("inspects and removes base64 fileContent multipart parts and params", () => {
  const input = har();
  const encoded = Buffer.from(JSON.stringify({ password: opaque })).toString("base64");
  entry(input).request.postData = {
    mimeType: "multipart/form-data; boundary=file",
    text: `--file\r\nContent-Disposition: form-data; name="fileContent"\r\n\r\n${encoded}\r\n--file--\r\n`,
    params: [{ name: "fileContent", value: encoded }],
  };
  const issues = security.inspectHar(input);
  assert.ok(issues.some(({ path }) => path.includes("postData.text")));
  assert.ok(issues.some(({ path }) => path.includes("params")));
  const clean = security.sanitizeHar(input);
  assert.equal(JSON.stringify(clean).includes(encoded), false);
  assert.deepEqual(security.inspectHar(clean), []);
});

test("keeps literal percents in ordinary text outside URL/form boundaries", () => {
  const input = { notice: "discount=100%", description: "The discount is 100%", query: "q=%25" };
  assert.deepEqual(security.sanitizeFixture(input), input);
  assert.deepEqual(security.inspectFixture(input), []);
});

test("keeps credential descriptions and non-credential scalar fields through nested containers", () => {
  const metadata = {
    name: "DB_PASSWORD",
    id: "secret-1",
    type: "password",
    kind: "secret",
    key: "DB_PASSWORD",
    description: "Database login",
    path: "/tmp/secret",
    mountPath: "/var/run/secret",
    region: "us-west-2",
    provider: "aws",
    cloudProvider: "aws",
    database: "d",
    username: "u",
    host: "localhost",
    port: 5432,
    status: "READY",
    state: "ACTIVE",
    version: 1,
    size: 12,
    environmentType: "DEV",
    resourceId: "resource-1",
    resourceID: "resource-2",
    displayName: "public",
    createdAt: "2026-01-01",
    expiryDate: "2026-01-02",
    retryCount: 2,
    filePath: "./config",
    $ref: "#/components/schemas/Password",
    enabled: true,
    retries: 3,
    notes: "public notes",
  };
  const input = { credentials: { ...metadata, nested: { ...metadata, password: opaque }, password: opaque } };
  const expected = { credentials: { ...metadata, nested: { ...metadata, password: marker }, password: marker } };
  assert.deepEqual(security.sanitizeFixture(input), expected);
  assert.equal(security.inspectFixture(input).length, 2);
  assert.deepEqual(security.inspectFixture(expected), []);
  assert.deepEqual(security.sanitizeFixture({ credentials: metadata, $ref: metadata.$ref }), {
    credentials: metadata,
    $ref: metadata.$ref,
  });
  assert.deepEqual(security.inspectFixture({ credentials: metadata, $ref: metadata.$ref }), []);
});

for (const key of [
  "value",
  "secretValue",
  "data",
  "content",
  "contents",
  "fileContent",
  "pass",
  "pwd",
  "passwd",
  "passphrase",
  ...aliases,
])
  test(`redacts credential material ${key} in nested provider containers`, () => {
    const input = { credentials: { provider: { [key]: opaque, username: "u", database: "d" } } };
    const expected = { credentials: { provider: { [key]: marker, username: "u", database: "d" } } };
    assert.ok(security.inspectFixture(input).length > 0);
    assert.deepEqual(security.sanitizeFixture(input), expected);
    assert.deepEqual(security.inspectFixture(expected), []);
  });

test("redacts only values in direct and proxied environment secret lists", () => {
  for (const url of [
    "https://example.test/environmentType/DEV/secrets",
    "https://example.test/api/action?endpoint=%2FenvironmentType%2FDEV%2Fsecrets",
  ]) {
    const input = har();
    entry(input).request.url = url;
    const body = { secrets: [{ environmentType: "DEV", name: "DB_PASSWORD", value: "x" }] };
    entry(input).response.content.text = JSON.stringify(body);
    const clean = security.sanitizeHar(input);
    assert.deepEqual(JSON.parse(entry(clean).response.content.text), {
      secrets: [{ ...body.secrets[0], value: marker }],
    });
    assert.equal(security.inspectHar(input).length, 1);
    assert.deepEqual(security.inspectHar(clean), []);
    assert.deepEqual(security.sanitizeHar(clean), clean);
  }
});

test("keeps secret schema descriptors while redacting every named secret dictionary value", () => {
  const input = {
    schema: { properties: { secrets: { type: "array", items: { $ref: "#/components/schemas/Password" } } } },
    reference: { secrets: { $ref: "#/components/schemas/Password" } },
    schemaMetadata: { properties: { secrets: { id: "secret-schema", type: "object", $ref: "Password" } } },
    actual: { secrets: { username: opaque, database: opaque, type: opaque, $ref: opaque } },
    properties: { secrets: { DB_CONNECTION: opaque } },
  };
  const expected = {
    ...input,
    actual: { secrets: { username: marker, database: marker, type: marker, $ref: marker } },
    properties: { secrets: { DB_CONNECTION: marker } },
  };
  assert.deepEqual(security.sanitizeFixture(input), expected);
  assert.equal(security.inspectFixture(input).length, 5);
  assert.deepEqual(security.inspectFixture(expected), []);
});

for (const reference of [
  "$var.dbPassword",
  "${DB_PASSWORD}",
  "{{ .Values.password }}",
  "$(read_password)",
  "/tmp/x-kubeconfig",
  "./config",
  "~/config",
  "",
])
  test(`preserves nonliteral credential assignments (${reference || "empty"})`, () => {
    for (const text of [
      `POSTGRES_PASSWORD: ${reference}\ntype: password`,
      `password="${reference}"`,
      `token: '${reference}'`,
      `env:\n  - name: DB_PASSWORD\n    value: ${reference}\n  - name: REGION\n    value: public`,
    ]) {
      const input = { specContent: text, dockerComposeYAML: text };
      assert.deepEqual(security.sanitizeFixture(input), input);
      assert.deepEqual(security.inspectFixture(input), []);
    }
  });

test("keeps kubeconfig paths and compose references beside literal credentials", () => {
  const compose =
    "services:\n  template:\n    environment:\n      POSTGRES_PASSWORD: $var.dbPassword\n  provided:\n    environment:\n      POSTGRES_PASSWORD: literal\n";
  const input = {
    instanceDebugCommands: "export KUBECONFIG=/tmp/x-kubeconfig",
    dockerComposeYAML: compose,
    specContent: compose,
    $ref: "#/components/schemas/Password",
    credentials: { username: "u", password: "p", database: "d" },
  };
  const expected = {
    ...input,
    dockerComposeYAML: compose.replace("literal", marker),
    specContent: compose.replace("literal", marker),
    credentials: { username: "u", password: marker, database: "d" },
  };
  assert.deepEqual(security.sanitizeFixture(input), expected);
  assert.deepEqual(security.inspectFixture(expected), []);
});

for (const type of ["string", "password", "secret", "boolean", "number", "integer", "object", "array"])
  test(`keeps credential schema type ${type}`, () => {
    const input = { credentials: { type }, specContent: `type: ${type}` };
    assert.deepEqual(security.sanitizeFixture(input), input);
    assert.deepEqual(security.inspectFixture(input), []);
  });

test("still redacts tokens, text assignments, Bearer literals and connection passwords", () => {
  const input = {
    password: opaque,
    jwtToken: opaque,
    rehearsalHandoffToken: opaque,
    rehearsalHandoffUrl: `https://example.test/arrival?token=${opaque}`,
    requestBody: `password=${opaque}`,
    statusMessage: `token: ${opaque}`,
    notice: `Bearer ${opaque}`,
    connection: `Connect to postgres://user:${opaque}@localhost/db`,
  };
  assert.ok(security.inspectFixture(input).length >= 8);
  const clean = security.sanitizeFixture(input);
  noSecret(clean);
  assert.deepEqual(security.inspectFixture(clean), []);
  assert.deepEqual(security.sanitizeFixture(clean), clean);
});

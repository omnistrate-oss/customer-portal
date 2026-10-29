import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { gunzipSync, gzipSync } from "node:zlib";

const loaded = await import("./har-security.mjs").catch(() => null);
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
const core = () => {
  assert.ok(loaded, "security helper has not been implemented");
  return loaded;
};
function har() {
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
}
async function temp(t) {
  const root = await mkdtemp(join(tmpdir(), "har-security-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}
function run(args, cwd) {
  return spawnSync(process.execPath, [cli, ...args], { cwd, encoding: "utf8" });
}
function entry(value) {
  return value.log.entries[0];
}
function noSecret(value) {
  const serialized = JSON.stringify(value);
  assert.equal(serialized.includes(jwt), false, "synthetic JWT survived");
  assert.equal(serialized.includes(opaque), false, "synthetic opaque credential survived");
}

test("removes case-insensitive credential headers and both cookie arrays while preserving replay essentials", () => {
  const input = har();
  const e = entry(input);
  for (const name of ["AUTHORIZATION", "proxy-Authorization", "cOoKiE"])
    e.request.headers.push({ name, value: opaque });
  e.response.headers.push({ name: "sEt-CoOkIe", value: opaque });
  e.request.cookies = [{ name: "session", value: opaque }];
  e.response.cookies = [{ name: "session", value: opaque }];
  assert.ok(core().inspectHar(input).length >= 5);
  const clean = core().sanitizeHar(input);
  const c = entry(clean);
  noSecret(clean);
  assert.deepEqual(c.request.cookies, []);
  assert.deepEqual(c.response.cookies, []);
  assert.deepEqual(c.request.headers, [{ name: "Content-Type", value: "application/json" }]);
  assert.equal(c.request.method, "POST");
  assert.equal(c.request.url, e.request.url);
  assert.equal(c.response.status, 201);
  assert.equal(c.response.content.text, e.response.content.text);
  assert.equal(e.request.headers.length, 4);
  assert.deepEqual(core().inspectHar(clean), []);
  assert.deepEqual(core().sanitizeHar(clean), clean);
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
  const clean = core().sanitizeHar(input);
  noSecret(clean);
  assert.ok(entry(clean).request.url.startsWith("https://example.test/api/v1/items?region=us%2Dwest&token=" + marker));
  assert.equal(entry(clean).request.queryString[1].value, marker);
  assert.deepEqual(core().inspectHar(clean), []);
});

test("canonicalizes replay URLs with stable paths, nested encoded secrets and idempotence", () => {
  const publicUrl = "https://example.test/api/items?region=us%2Dwest&space=a%20b";
  assert.equal(core().sanitizeUrl(publicUrl), publicUrl);
  const nested = "https://example.test/callback?access_token=" + opaque + "&public=a%20b";
  const url = publicUrl + "&password=" + opaque + "&next=" + encodeURIComponent(encodeURIComponent(nested));
  const clean = core().sanitizeUrl(url);
  noSecret(clean);
  assert.equal(core().sanitizeUrl(clean), clean);
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
  const clean = core().sanitizeHar(input);
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
  const clean = core().sanitizeHar(input);
  assert.deepEqual(JSON.parse(entry(clean).response.content.text), {
    key: "om_" + marker,
    id: "token-id",
    name: "public",
  });
  assert.deepEqual(core().inspectHar(clean), []);
  assert.deepEqual(core().sanitizeHar(clean), clean);
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
  const clean = core().sanitizeHar(input);
  noSecret(clean);
  assert.equal(entry(clean).request.postData.params[0].value, marker);
  assert.equal(entry(clean).request.postData.params[1].value, "public");
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
  assert.ok(core().inspectHar(input).length > 0);
  const clean = core().sanitizeHar(input);
  assert.equal(entry(clean).response.content.encoding, "base64");
  assert.deepEqual(JSON.parse(Buffer.from(entry(clean).response.content.text, "base64").toString()), {
    token: marker,
    password: marker,
    public: 7,
  });
  assert.deepEqual(core().inspectHar(clean), []);
});

test("retains valid binary base64 assets and scrubs JWTs in arbitrary strings and keys", () => {
  const input = har();
  const e = entry(input);
  e.response.content = {
    size: 4,
    mimeType: "image/png",
    encoding: "base64",
    text: Buffer.from([0, 255, 1, 254]).toString("base64"),
  };
  input.log.comment = "arbitrary prefix " + jwt + " trailing";
  input.log[jwt] = "public";
  const clean = core().sanitizeHar(input);
  noSecret(clean);
  assert.equal(entry(clean).response.content.text, e.response.content.text);
  assert.equal(clean.log.comment, "arbitrary prefix " + marker + " trailing");
  assert.equal(clean.log[marker], "public");
});

test("preserves PDF, ZIP and octet-stream binary base64 downloads byte for byte", () => {
  for (const mimeType of ["application/pdf", "application/zip", "application/octet-stream"]) {
    const input = har();
    entry(input).response.content = {
      size: 6,
      mimeType,
      encoding: "base64",
      text: Buffer.from([0, 255, 254, 1, 128, 127]).toString("base64"),
    };
    const clean = core().sanitizeHar(input);
    assert.deepEqual(entry(clean).response.content, entry(input).response.content);
    assert.deepEqual(core().inspectHar(clean), []);
  }
});

test("redacts JWTs with short empty-object payloads in arbitrary text", () => {
  const short = [Buffer.from('{"alg":"none"}').toString("base64url"), Buffer.from("{}").toString("base64url"), ""].join(
    "."
  );
  const input = har();
  input.log.comment = "prefix " + short;
  assert.equal(core().sanitizeHar(input).log.comment, "prefix " + marker);
});

test("rejects malformed nested URL encoding and malformed path encoding without exposing labels", () => {
  for (const url of ["https://example.test/?next=%25ZZ", "https://example.test/%ZZ?public=ok"])
    assert.throws(
      () => core().sanitizeUrl(url),
      (error) => {
        noSecret(error.message);
        return true;
      }
    );
  assert.throws(
    () =>
      core().assertSafeHar(
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
    const issues = core().inspectHar(input);
    assert.ok(issues.length > 0);
    noSecret(issues);
    assert.throws(
      () => core().sanitizeHar(input),
      (error) => {
        noSecret(error.message);
        return true;
      }
    );
    assert.throws(
      () => core().assertSafeHar(input, jwt + "/" + opaque),
      (error) => {
        noSecret(error.message);
        return true;
      }
    );
  }
});

test("inspects credential fixtures without flagging public token IDs or leaking hostile field names", () => {
  assert.deepEqual(
    core().inspectFixture({
      tokenId: "token-public",
      metadata: { token_id: "token-42" },
      publicKey: "ssh-rsa-public",
      token: { id: "token-55", name: "CI" },
    }),
    []
  );
  const issues = core().inspectFixture({
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
  const clean = core().sanitizeFixture(input);
  assert.deepEqual(clean, {
    ...input,
    instanceOrgPassword: marker,
    nested: { accessToken: marker },
  });
  assert.deepEqual(input, original);
  assert.notEqual(clean, input);
  assert.notEqual(clean.public, input.public);
  assert.deepEqual(core().inspectFixture(clean), []);
  core().assertSafeFixture(clean);
  assert.deepEqual(core().sanitizeFixture(clean), clean);
  assert.throws(
    () => core().assertSafeFixture(input, jwt + "/" + opaque),
    (error) => {
      noSecret(error.message);
      return true;
    }
  );
  assert.throws(
    () => core().sanitizeFixture({ bad: 1n }),
    (error) => {
      noSecret(error.message);
      return true;
    }
  );
});

test("redacts opaque jwtToken signin fields in HAR bodies and persisted ordinary fixtures", () => {
  const input = har();
  entry(input).response.content.text = JSON.stringify({ jwtToken: opaque, tokenId: "token-public" });
  assert.ok(core().inspectHar(input).length > 0);
  assert.deepEqual(JSON.parse(entry(core().sanitizeHar(input)).response.content.text), {
    jwtToken: marker,
    tokenId: "token-public",
  });
  assert.deepEqual(core().sanitizeFixture({ jwtToken: opaque, providerJwtToken: opaque, tokenId: "token-public" }), {
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
    metadata: { credential: 4, token: 12, apiKey: false, authentication: false, secret: 1 },
    authentication: "Bearer",
    schema: { headers: [{ name: "Authorization", required: false, type: "string" }], cookies: ["session", "public"] },
  };
  const clean = core().sanitizeFixture(input);
  noSecret(clean);
  assert.deepEqual(clean, {
    ...input,
    token: { ...input.token, value: marker },
    secrets: [{ ...input.secrets[0], value: marker }],
    signingSecret: marker,
    portBSigningSecret: marker,
  });
  assert.deepEqual(core().inspectFixture(clean), []);
  assert.deepEqual(core().sanitizeFixture(clean), clean);
});

test("redacts API-key headers and bare secret endpoint request and response values", () => {
  const input = har();
  const e = entry(input);
  e.request.url = "https://example.test/api/v1/environment/DEV/secret/DB_PASSWORD";
  e.request.headers.push({ name: "X-API-Key", value: opaque });
  e.request.postData.text = JSON.stringify({ name: "DB_PASSWORD", value: opaque, enabled: false });
  e.response.content.text = JSON.stringify({ id: "secret-1", value: opaque, type: "string" });
  const clean = core().sanitizeHar(input);
  noSecret(clean);
  assert.equal(
    entry(clean).request.headers.some((h) => h.name === "X-API-Key"),
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
  assert.equal(core().sanitizeUrl(url), "https://example.test/api/items/" + marker + "?public=a%20b");
  const input = {
    description: "Visit https://example.test/callback?token=" + opaque + "&public=ok for details.",
    name: "Bearer token",
    label: "Basic authentication",
  };
  assert.deepEqual(core().sanitizeFixture(input), {
    ...input,
    description: "Visit https://example.test/callback?token=" + marker + "&public=ok for details.",
  });
  assert.equal(
    core().sanitizeFixture({ notice: "Open https://example.test/?access_token=" + opaque + "." }).notice,
    "Open https://example.test/?access_token=" + marker + "."
  );
  assert.equal(
    core().sanitizeFixture({ notice: "prefix " + encoded + " suffix" }).notice,
    "prefix " + marker + " suffix"
  );
});

test("sanitizes UTF-8 JSON mislabeled octet-stream and preserves binary archives containing public auth prose", () => {
  const input = har();
  entry(input).response.content = {
    mimeType: "application/octet-stream",
    encoding: "base64",
    text: Buffer.from(JSON.stringify({ password: opaque, public: true })).toString("base64"),
  };
  const clean = core().sanitizeHar(input);
  assert.deepEqual(JSON.parse(Buffer.from(entry(clean).response.content.text, "base64").toString()), {
    password: marker,
    public: true,
  });
  // A real ZIP_STORED archive of documentation.txt, generated with Python zipfile and a fixed timestamp.
  const archive = Buffer.from(
    "UEsDBBQAAAAAAAAAIVxdtkAcSAAAAEgAAAARAAAAZG9jdW1lbnRhdGlvbi50eHQKQmFzaWMgYXV0aGVudGljYXRpb24gaXMgc3VwcG9ydGVkLiBObyBwcml2YXRlIGNyZWRlbnRpYWxzIGFyZSBwcmVzZW50LgpQSwECFAMUAAAAAAAAACFcXbZAHEgAAABIAAAAEQAAAAAAAAAAAAAAgAEAAAAAZG9jdW1lbnRhdGlvbi50eHRQSwUGAAAAAAEAAQA/AAAAdwAAAAAA",
    "base64"
  );
  entry(input).response.content = { mimeType: "application/zip", encoding: "base64", text: archive.toString("base64") };
  assert.deepEqual(entry(core().sanitizeHar(input)).response.content, entry(input).response.content);
  entry(input).response.content.text = Buffer.concat([archive, Buffer.from(jwt)]).toString("base64");
  assert.throws(
    () => core().sanitizeHar(input),
    (error) => {
      noSecret(error.message);
      return true;
    }
  );
});

test("full corpus check rejects directory symlinks rather than silently skipping recordings", async (t) => {
  const root = await temp(t);
  const outside = await temp(t);
  await writeFile(join(root, "safe.har"), JSON.stringify(har()));
  await writeFile(join(outside, "hidden.har"), JSON.stringify(har()));
  await symlink(outside, join(root, "linked-recordings"), "dir");
  const result = await core().scanFixtures([root], { requireHars: true });
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
  assert.deepEqual(core().sanitizeFixture(input), {
    password: marker,
    token: { ...input.token, value: { raw: marker, id: "public-id", enabled: false } },
    secrets: [{ name: "OTP", value: marker }],
  });
});

test("full scanner checks HAR gzip and JSON fixtures, sanitizes only valid HARs and is idempotent", async (t) => {
  const root = await temp(t);
  const input = har();
  entry(input).request.headers.push({ name: "Authorization", value: opaque });
  await writeFile(join(root, "one.har.gz"), gzipSync(JSON.stringify(input)));
  await writeFile(join(root, "public.json"), JSON.stringify({ tokenId: "token-public" }));
  const before = await core().scanFixtures([root], { requireHars: true });
  assert.equal(before.harFiles, 1);
  assert.equal(before.fixtureFiles, 1);
  assert.ok(before.issues.length > 0);
  noSecret(before.issues);
  const fixed = await core().scanFixtures([root], {
    sanitize: true,
    requireHars: true,
  });
  assert.deepEqual(fixed.issues, []);
  assert.equal(fixed.changedFiles.length, 1);
  assert.deepEqual(core().inspectHar(JSON.parse(gunzipSync(await readFile(join(root, "one.har.gz"))))), []);
  const again = await core().scanFixtures([root], {
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
  const before = await core().scanFixtures([root]);
  assert.equal(before.fixtureFiles, 1);
  assert.ok(before.issues.length > 0);
  const clean = await core().scanFixtures([root], { sanitize: true });
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
  const clean = await core().scanFixtures([root], { sanitize: true });
  assert.deepEqual(clean.issues, []);
  assert.deepEqual(JSON.parse(gunzipSync(await readFile(join(root, "fields.json.gz")))), {
    ...input,
    instanceOrgPassword: marker,
    serviceAccountPassword: marker,
    serviceProviderOrgPassword: marker,
  });
});

test("scanner fails nonexistent roots and empty required corpus, and excludes generated directories", async (t) => {
  const root = await temp(t);
  assert.ok((await core().scanFixtures([join(root, "missing")], {})).issues.length > 0);
  assert.ok((await core().scanFixtures([root], { requireHars: true })).issues.length > 0);
  for (const name of [".git", "node_modules", ".next"]) {
    await mkdir(join(root, name));
    await writeFile(join(root, name, "bad.har"), opaque);
  }
  assert.deepEqual((await core().scanFixtures([root], {})).issues, []);
});

test("required corpus rejects HAR files that contain no replay entries", async (t) => {
  const root = await temp(t);
  await writeFile(join(root, "empty.har"), JSON.stringify({ log: { entries: [] } }));
  const result = await core().scanFixtures([root], { requireHars: true });
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
  const result = await core().scanFixtures([root], { sanitize: true });
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
    () => core().sanitizeHar(input),
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
  assert.ok(core().inspectFixture(input).length > 0);
  const clean = core().sanitizeFixture(input);
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
  const clean = core().sanitizeFixture(input);
  assert.equal(clean.authenticationHeader, "Basic " + marker);
  assert.equal(JSON.stringify(clean).includes(credential), false);
  assert.equal(clean.name, input.name);
  assert.equal(clean.description, input.description);
  assert.deepEqual(core().inspectFixture(clean), []);
});

test("fails closed on credential-bearing form and URL text inside binary octet-stream base64", () => {
  for (const text of [
    "password=" + opaque,
    "https://example.test/?access_token=" + opaque,
    "Open https://example.test/?access_token=" + opaque,
  ]) {
    const input = har();
    entry(input).response.content = {
      mimeType: "application/octet-stream",
      encoding: "base64",
      text: Buffer.from(text).toString("base64"),
    };
    assert.ok(core().inspectHar(input).length > 0);
    assert.throws(
      () => core().sanitizeHar(input),
      (error) => {
        noSecret(error.message);
        return true;
      }
    );
  }
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
  assert.equal(run(["--tracked-auth", "--require-hars", "."], root).status, 0);
  spawnSync("git", ["-C", root, "add", "-f", ".auth/user.json"]);
  const rejected = run(["--tracked-auth", "--require-hars", "hars"], root);
  assert.notEqual(rejected.status, 0);
  noSecret(rejected.stdout + rejected.stderr);
  assert.notEqual(run(["--sanitize", "--tracked-auth", "hars"], root).status, 0);
  assert.equal(await readFile(join(root, ".auth", "user.json"), "utf8"), JSON.stringify(state));
});

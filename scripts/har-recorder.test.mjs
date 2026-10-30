import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import zlib from "node:zlib";

const withFiles = async (run) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "portal-har-test-"));
  try {
    await run(path.join(directory, "capture.har"), path.join(directory, "recording.har.gz"));
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
};

test("malformed sanitation fails before replacing persisted output and deletes raw capture", async () => {
  const { persistRecordedHar } = await import("../test-fixtures/har-recording.mjs");
  await withFiles(async (rawPath, gzPath) => {
    const previous = Buffer.from("previous-recording");
    fs.writeFileSync(gzPath, previous);
    fs.writeFileSync(
      rawPath,
      JSON.stringify({
        log: {
          version: "1.2",
          creator: { name: "synthetic", version: "1" },
          entries: [
            {
              request: {
                method: "GET",
                url: "https://example.invalid/api/example",
                headers: [],
                cookies: [],
                queryString: [],
              },
              response: {
                status: 200,
                headers: [],
                cookies: [],
                content: { text: "{synthetic-secret", mimeType: "application/json" },
              },
            },
          ],
        },
      })
    );
    assert.throws(
      () => persistRecordedHar(rawPath, gzPath, "passed"),
      (error) => {
        assert.equal(error.message, `[HAR] Recording rejected: ${gzPath}`);
        return true;
      }
    );
    assert.deepEqual(fs.readFileSync(gzPath), previous);
    assert.equal(fs.existsSync(rawPath), false);
    assert.deepEqual(fs.readdirSync(path.dirname(gzPath)), [path.basename(gzPath)]);
  });
});

for (const status of ["skipped", "failed", "timedOut", "interrupted", undefined]) {
  test(`${status} recording keeps retained output and deletes raw capture`, async () => {
    const { persistRecordedHar } = await import("../test-fixtures/har-recording.mjs");
    await withFiles(async (rawPath, gzPath) => {
      const previous = Buffer.from("previous-recording");
      fs.writeFileSync(gzPath, previous);
      fs.writeFileSync(rawPath, "synthetic-incomplete-secret");
      persistRecordedHar(rawPath, gzPath, status);
      assert.deepEqual(fs.readFileSync(gzPath), previous);
      assert.equal(fs.existsSync(rawPath), false);
    });
  });
}

test("a missing raw capture on a passed test fails closed without replacing retained output", async () => {
  const { persistRecordedHar } = await import("../test-fixtures/har-recording.mjs");
  await withFiles(async (rawPath, gzPath) => {
    fs.writeFileSync(gzPath, "previous-recording");
    assert.throws(() => persistRecordedHar(rawPath, gzPath, "passed"), /Recording rejected/);
    assert.equal(fs.readFileSync(gzPath, "utf8"), "previous-recording");
  });
});

test("invalid UTF-8 fails closed without replacing retained output", async () => {
  const { persistRecordedHar } = await import("../test-fixtures/har-recording.mjs");
  await withFiles(async (rawPath, gzPath) => {
    fs.writeFileSync(gzPath, "previous-recording");
    fs.writeFileSync(rawPath, Buffer.from([0x7b, 0x22, 0x78, 0x22, 0x3a, 0x22, 0xff, 0x22, 0x7d]));
    assert.throws(() => persistRecordedHar(rawPath, gzPath, "passed"), /Recording rejected/);
    assert.equal(fs.readFileSync(gzPath, "utf8"), "previous-recording");
    assert.equal(fs.existsSync(rawPath), false);
  });
});

test("replay matching uses the same sanitized secret query as the recording", async () => {
  const { normalizeHarReplayUrl } = await import("../test-fixtures/har-replay.mjs");
  const { sanitizeUrl } = await import("./har-security.mjs");
  const original = "https://recording.example.invalid/api/example?view=list&access_token=synthetic-query-secret";
  const recorded = sanitizeUrl(original);
  assert.equal(recorded.includes("synthetic-query-secret"), false);
  assert.equal(normalizeHarReplayUrl(original), normalizeHarReplayUrl(recorded));
  assert.equal(
    normalizeHarReplayUrl("http://localhost:8080/api/example?view=list&access_token=synthetic-other-secret"),
    normalizeHarReplayUrl(recorded)
  );
  assert.notEqual(
    normalizeHarReplayUrl("http://localhost:8080/api/example?view=detail&access_token=synthetic-other-secret"),
    normalizeHarReplayUrl(recorded)
  );
});

test("aborted entries are discarded before sanitation while valid entries persist", async () => {
  const { persistRecordedHar } = await import("../test-fixtures/har-recording.mjs");
  await withFiles(async (rawPath, gzPath) => {
    fs.writeFileSync(
      rawPath,
      JSON.stringify({
        log: {
          entries: [
            {
              request: { method: "GET", url: "https://example.invalid/aborted", headers: [], cookies: [] },
              response: { status: -1, headers: [], cookies: [], content: {}, _failureText: "aborted" },
            },
            {
              request: { method: "GET", url: "https://example.invalid/ok", headers: [], cookies: [] },
              response: {
                status: 200,
                headers: [],
                cookies: [],
                content: { mimeType: "application/json", text: '{"id":"public-id"}' },
              },
            },
          ],
        },
      })
    );
    persistRecordedHar(rawPath, gzPath, "passed");
    const saved = JSON.parse((await import("node:zlib")).gunzipSync(fs.readFileSync(gzPath)).toString("utf8"));
    assert.equal(saved.log.entries.length, 1);
    assert.equal(saved.log.entries[0].request.url, "https://example.invalid/ok");
  });
});

const selectionEntry = (url, value, encoding) => ({
  request: { method: "GET", url, headers: [], cookies: [] },
  response: {
    status: 200,
    headers: [],
    cookies: [],
    content: {
      mimeType: "application/json",
      text: encoding === "base64" ? Buffer.from(JSON.stringify(value)).toString("base64") : JSON.stringify(value),
      ...(encoding ? { encoding } : {}),
    },
  },
});

const selectionHar = (extraServices = [], extraReferences = [], encoding) => ({
  log: {
    entries: [
      selectionEntry(
        "https://recording.example.invalid/api/action?endpoint=%2F2022-09-01-00%2Fservice-offering",
        {
          services: [
            {
              id: "s-newer-global-date",
              name: "Newer global fixture product",
              offerings: [{ serviceId: "s-newer-global-date", serviceName: "SaaSBuilder Postgres DT - newer-date" }],
            },
            {
              id: "s-default",
              name: "Default product",
              offerings: [{ serviceId: "s-default", serviceName: "A different product" }],
            },
            {
              id: "s-recorded",
              name: "Recorded product",
              offerings: [{ serviceId: "s-recorded", serviceName: "SaaSBuilder Postgres DT - recorded-date" }],
            },
            ...extraServices,
          ],
        },
        encoding
      ),
      selectionEntry("https://recording.example.invalid/api/resources?serviceId=s-default", {}),
      selectionEntry(
        "https://recording.example.invalid/api/action?endpoint=%2F2022-09-01-00%2Fservice-offering%2Fs-recorded%2Fresource%2Fr-recorded%2Finstance%2Fnone",
        {}
      ),
      selectionEntry("https://recording.example.invalid/api/version-sets?serviceId=s-recorded", {}),
      ...extraReferences,
      selectionEntry("https://recording.example.invalid/api/resources?serviceId=s-default", {}),
    ],
  },
});

const selectionReader = async () => {
  const loaded = await import("../test-fixtures/har-replay.mjs");
  assert.equal(typeof loaded.readRecordedServiceOffering, "function", "recorded product selection helper is missing");
  return loaded.readRecordedServiceOffering;
};

const assertSafeSelectionFailure = (run) =>
  assert.throws(run, (error) => {
    assert.equal(error.message, "Unable to resolve a unique recorded product for replay");
    return true;
  });

test("replay product selection uses referenced IDs instead of a newer global date or the first product", async () => {
  const read = await selectionReader();
  await withFiles(async (_, gzPath) => {
    fs.writeFileSync(gzPath, zlib.gzipSync(JSON.stringify(selectionHar())));
    assert.deepEqual(read(gzPath, "SaaSBuilder Postgres DT - "), {
      serviceId: "s-recorded",
      serviceName: "SaaSBuilder Postgres DT - recorded-date",
    });
  });
});

test("replay selection decodes base64 offering data without changing the recording or public name", async () => {
  const read = await selectionReader();
  await withFiles(async (_, gzPath) => {
    const har = selectionHar([], [], "base64");
    const list = JSON.parse(Buffer.from(har.log.entries[0].response.content.text, "base64").toString("utf8"));
    list.services[2].offerings[0].serviceName = 'SaaSBuilder Postgres DT - "recorded name"';
    har.log.entries[0].response.content.text = Buffer.from(JSON.stringify(list)).toString("base64");
    const original = zlib.gzipSync(JSON.stringify(har));
    fs.writeFileSync(gzPath, original);
    assert.deepEqual(read(gzPath, "SaaSBuilder Postgres DT - "), {
      serviceId: "s-recorded",
      serviceName: 'SaaSBuilder Postgres DT - "recorded name"',
    });
    assert.deepEqual(fs.readFileSync(gzPath), original);
  });
});

test("replay selection rejects multiple referenced products with the expected prefix", async () => {
  const read = await selectionReader();
  await withFiles(async (_, gzPath) => {
    const har = selectionHar(
      [
        {
          id: "s-second",
          offerings: [{ serviceId: "s-second", serviceName: "SaaSBuilder Postgres DT - another-date" }],
        },
      ],
      [selectionEntry("https://recording.example.invalid/api/resources?serviceId=s-second", {})]
    );
    fs.writeFileSync(gzPath, zlib.gzipSync(JSON.stringify(har)));
    assertSafeSelectionFailure(() => read(gzPath, "SaaSBuilder Postgres DT - "));
  });
});

test("replay selection rejects an expected product that has no recorded request reference", async () => {
  const read = await selectionReader();
  await withFiles(async (_, gzPath) => {
    const har = selectionHar();
    har.log.entries = [har.log.entries[0], har.log.entries[1]];
    fs.writeFileSync(gzPath, zlib.gzipSync(JSON.stringify(har)));
    assertSafeSelectionFailure(() => read(gzPath, "SaaSBuilder Postgres DT - "));
  });
});

test("replay selection rejects references without a recorded offering list", async () => {
  const read = await selectionReader();
  await withFiles(async (_, gzPath) => {
    const har = selectionHar();
    har.log.entries.shift();
    fs.writeFileSync(gzPath, zlib.gzipSync(JSON.stringify(har)));
    assertSafeSelectionFailure(() => read(gzPath, "SaaSBuilder Postgres DT - "));
  });
});

test("replay selection rejects an ID that cannot be safely used as an option attribute value", async () => {
  const read = await selectionReader();
  await withFiles(async (_, gzPath) => {
    const id = 's-recorded"][data-value="synthetic-other';
    const har = selectionHar();
    const list = JSON.parse(har.log.entries[0].response.content.text);
    list.services[2].offerings[0].serviceId = id;
    har.log.entries[0].response.content.text = JSON.stringify(list);
    har.log.entries = [
      har.log.entries[0],
      selectionEntry(`https://recording.example.invalid/api/resources?serviceId=${encodeURIComponent(id)}`, {}),
    ];
    fs.writeFileSync(gzPath, zlib.gzipSync(JSON.stringify(har)));
    assertSafeSelectionFailure(() => read(gzPath, "SaaSBuilder Postgres DT - "));
  });
});

test("replay selection reports malformed or missing files without exposing source data or file paths", async () => {
  const read = await selectionReader();
  await withFiles(async (_, gzPath) => {
    for (const invalid of [Buffer.from("synthetic-private-source"), zlib.gzipSync("{synthetic-private-source")]) {
      fs.writeFileSync(gzPath, invalid);
      assertSafeSelectionFailure(() => read(gzPath, "SaaSBuilder Postgres DT - "));
    }
    fs.rmSync(gzPath);
    assertSafeSelectionFailure(() => read(gzPath, "SaaSBuilder Postgres DT - "));
  });
});

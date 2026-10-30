import assert from "node:assert/strict";
import { once } from "node:events";
import fs from "node:fs";
import http from "node:http";
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

test("real browser HAR capture clears both cookie arrays before persistence and remains replayable", async () => {
  const { persistRecordedHar } = await import("../test-fixtures/har-recording.mjs");
  const { chromium } = await import("@playwright/test");
  await withFiles(async (rawPath, gzPath) => {
    const server = http.createServer((request, response) => {
      response.setHeader("Content-Type", "application/json");
      response.setHeader("Set-Cookie", "session=synthetic-response-cookie; Path=/; HttpOnly");
      response.end(JSON.stringify({ ok: true, nested: { password: "synthetic-response-password" } }));
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const url = `http://127.0.0.1:${server.address().port}/api/example?view=list`;
    let browser;
    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({ recordHar: { path: rawPath, content: "embed" } });
      await context.addCookies([{ name: "session", value: "synthetic-request-cookie", url }]);
      const page = await context.newPage();
      await page.goto(url);
      await context.close();
      const raw = JSON.parse(fs.readFileSync(rawPath, "utf8"));
      assert.ok(raw.log.entries[0].request.cookies.length > 0);
      assert.ok(raw.log.entries[0].response.cookies.length > 0);

      persistRecordedHar(rawPath, gzPath, "passed");
      assert.equal(fs.existsSync(rawPath), false);
      const persisted = JSON.parse(zlib.gunzipSync(fs.readFileSync(gzPath)).toString("utf8"));
      const entry = persisted.log.entries[0];
      assert.deepEqual(entry.request.cookies, []);
      assert.deepEqual(entry.response.cookies, []);
      assert.equal(entry.request.method, "GET");
      assert.equal(entry.request.url, url);
      assert.equal(entry.response.status, 200);
      assert.deepEqual(JSON.parse(entry.response.content.text), {
        ok: true,
        nested: { password: "REDACTED_PLAYWRIGHT_HAR" },
      });

      const replay = await browser.newContext();
      const replayPath = `${gzPath}.har`;
      fs.writeFileSync(replayPath, JSON.stringify(persisted));
      await replay.routeFromHAR(replayPath, { notFound: "abort" });
      const replayPage = await replay.newPage();
      await replayPage.goto(url);
      assert.equal(await replayPage.locator("body").innerText(), entry.response.content.text);
      await replay.close();
    } finally {
      if (browser) await browser.close();
      server.close();
      await once(server, "close");
    }
  });
});

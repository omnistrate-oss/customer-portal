/**
 * HAR-based Test Fixture
 *
 * Extends Playwright's base test to support HAR recording and replay.
 * - record: Captures real API responses to HAR files (nightly runs)
 * - replay: Replays responses from HAR files (PR validation)
 *
 * HAR files are stored per-test as gzipped JSON (.har.gz) to keep the repo small.
 *
 * Usage:
 *   import { test, expect } from "test-fixtures/har-test";
 *
 * Environment Variables:
 *   HAR_MODE: "record" | "replay" | "off" (default: "off")
 */

import { expect, test as base } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import * as zlib from "zlib";

import { isRecordMode, isReplayMode } from "test-utils/har-mode";

export type HarMode = "record" | "replay" | "off";

// Minimal HAR shape — covers the fields we touch. Avoids `any` leaking through
// post-processing and replay so missing/renamed fields fail at the boundary.
type HarHeader = { name: string; value: string };
type HarPostData = { mimeType?: string; text?: string };
type HarRequest = { method: string; url: string; headers: HarHeader[]; postData?: HarPostData };
type HarContent = { text?: string; encoding?: string; mimeType?: string };
type HarResponse = {
  status: number;
  headers: HarHeader[];
  content: HarContent;
  _failureText?: string;
};
type HarEntry = { request: HarRequest; response: HarResponse };
type HarFile = { log: { entries: HarEntry[] } };

// Recursively replace values of sensitive-looking keys in JSON bodies. Used to
// keep credentials out of committed request payloads (e.g. createInstance posts
// a `password` field). Replay matches on method+URL, so redaction is safe.
const SENSITIVE_KEY_PATTERN = /password|secret|token|apikey|access[-_]?key|private[-_]?key|credential/i;

const redactSensitive = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(redactSensitive);
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEY_PATTERN.test(k) ? "[REDACTED]" : redactSensitive(v);
    }
    return out;
  }
  return value;
};

const redactJsonPostData = (postData: HarPostData | undefined): void => {
  if (!postData?.text) return;
  const mime = (postData.mimeType ?? "").toLowerCase();
  if (!mime.includes("json")) return;
  try {
    const parsed = JSON.parse(postData.text);
    postData.text = JSON.stringify(redactSensitive(parsed));
  } catch {
    // Non-JSON despite the mime type — leave the raw text alone rather than corrupt it.
  }
};

type HarFixtures = {
  harMode: HarMode;
  testId: string;
  harFilePath: string;
};

const getHarMode = (): HarMode => {
  if (isRecordMode()) return "record";
  if (isReplayMode()) return "replay";
  return "off";
};

// Per-test HAR file path: hars/{project}/{testFileName}/{sanitized-test-title}.har.gz
const getHarGzPath = (testInfo: {
  file: string;
  project: {
    name: string;
  };
  titlePath: string[];
}): string => {
  const testFileName = path.basename(testInfo.file, ".spec.ts");
  const harsDir = path.resolve(__dirname, "../tests/fixtures/hars");
  const projectDir = testInfo.project.name || "other";

  const testTitle = testInfo.titlePath
    .join("-")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .toLowerCase();

  return path.join(harsDir, projectDir, testFileName, `${testTitle}.har.gz`);
};

const ensureDir = (filePath: string): void => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Read and decompress a .har.gz file
const readHarGz = (gzPath: string): HarFile => {
  const compressed = fs.readFileSync(gzPath);
  const json = zlib.gunzipSync(new Uint8Array(compressed)).toString("utf-8");
  return JSON.parse(json);
};

// Compress and write a .har.gz file
const writeHarGz = (gzPath: string, har: HarFile): void => {
  const json = JSON.stringify(har);
  const compressed = zlib.gzipSync(new Uint8Array(Buffer.from(json)), { level: 9 });
  fs.writeFileSync(gzPath, new Uint8Array(compressed));
};

// Track which HAR files have been cleared this run
const clearedHarFiles = new Set<string>();

// Match on path+query only so HARs recorded against one host:port (e.g. dev on
// :3000) replay correctly on another (CI on :8080).
const normalizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    return parsed.pathname + parsed.search;
  } catch {
    return url;
  }
};

// Auth endpoints intentionally skipped by record mode's urlFilter (their
// bodies/Set-Cookie headers contain credentials). Replay must let these fall
// through to the real Next.js routes — without this, a refresh-token call
// during a replay test would have no HAR entry and abort("failed").
const REPLAY_LIVE_API_PATHS = /\/api\/(signin|signup|refresh-token|sign-in-with-idp|logout|reset-password|change-password)(?:\/|$|\?)/i;

export const test = base.extend<HarFixtures>({
  harMode: async ({}, use) => {
    await use(getHarMode());
  },

  testId: async ({}, use, testInfo) => {
    const testFileName = path.basename(testInfo.file, ".spec.ts");
    const projectName = testInfo.project.name || "default";
    const sanitizedProject = projectName.replace(/[^a-zA-Z0-9]/g, "_");
    const sanitizedFile = testFileName.replace(/[^a-zA-Z0-9]/g, "_");
    await use(`${sanitizedProject}_${sanitizedFile}`);
  },

  harFilePath: async ({}, use, testInfo) => {
    await use(getHarGzPath(testInfo));
  },

  context: async ({ browser, harMode, viewport, storageState }, use, testInfo) => {
    // Preserve project-level context options (storageState, viewport, device settings)
    const baseContextOptions: Record<string, unknown> = {};
    if (viewport !== undefined) baseContextOptions.viewport = viewport;
    if (storageState !== undefined) baseContextOptions.storageState = storageState;

    // Always run live (no HAR):
    // - user-setup project: its HAR contains a JWT that expires after 24h, breaking the middleware check
    // - signin.spec.ts: performs real logins; replaying stale JWTs causes the same 24h expiry issue
    const isAlwaysLive = testInfo.project.name === "user-setup" || path.basename(testInfo.file) === "signin.spec.ts";
    const effectiveHarMode = isAlwaysLive ? "off" : harMode;

    if (effectiveHarMode === "off") {
      const context = await browser.newContext(baseContextOptions);
      await use(context);
      await context.close();
      return;
    }

    const gzPath = getHarGzPath(testInfo);
    // Playwright's recordHar writes raw .har; we compress after
    const rawHarPath = gzPath.replace(".har.gz", ".har");

    if (effectiveHarMode === "record") {
      ensureDir(gzPath);

      if (!clearedHarFiles.has(gzPath)) {
        if (fs.existsSync(gzPath)) fs.unlinkSync(gzPath);
        if (fs.existsSync(rawHarPath)) fs.unlinkSync(rawHarPath);
        clearedHarFiles.add(gzPath);
      }

      const context = await browser.newContext({
        ...baseContextOptions,
        recordHar: {
          path: rawHarPath,
          content: "embed",
          // Capture /api/* but skip auth endpoints — their response bodies and
          // Set-Cookie headers contain credentials that shouldn't land in a
          // committed HAR. Replay re-authenticates at runtime anyway.
          urlFilter: /\/api\/(?!signin|signup|refresh-token|sign-in-with-idp|logout|reset-password|change-password)/,
        },
      });

      await use(context);

      for (const page of context.pages()) {
        try {
          await page.waitForLoadState("networkidle", { timeout: 10000 });
        } catch {
          // Ignore timeout
        }
      }
      // Buffer for async refetches triggered by mutation onSuccess callbacks
      await new Promise((r) => setTimeout(r, 4000));

      await context.close();

      // Don't save HAR for skipped tests — these are soft failures from backend issues
      // and would produce incomplete/empty HAR files that break replay mode
      if (testInfo.status === "skipped") {
        if (fs.existsSync(rawHarPath)) fs.unlinkSync(rawHarPath);
        return;
      }

      // Post-process: remove failed entries, then compress
      if (fs.existsSync(rawHarPath)) {
        try {
          const har: HarFile = JSON.parse(fs.readFileSync(rawHarPath, "utf-8"));
          har.log.entries = har.log.entries.filter((entry) => {
            const resp = entry.response;
            if (resp.status < 0) return false;
            if (resp._failureText && resp.status !== 200) return false;
            return true;
          });

          // Strip sensitive headers and redact sensitive request body fields. The replay
          // matcher only uses method+URL, so headers/postData aren't needed for matching —
          // dropping them keeps secrets out of the committed HAR.
          for (const entry of har.log.entries) {
            entry.request.headers = entry.request.headers.filter(
              (h) => !["authorization", "cookie"].includes(h.name.toLowerCase())
            );
            entry.response.headers = entry.response.headers.filter(
              (h) => !["set-cookie"].includes(h.name.toLowerCase())
            );
            redactJsonPostData(entry.request.postData);
          }

          writeHarGz(gzPath, har);
          // Clean up raw file
          fs.unlinkSync(rawHarPath);
        } catch (e) {
          console.warn(`[HAR] Failed to post-process: ${e}`);
        }
      }
    } else if (effectiveHarMode === "replay") {
      if (!fs.existsSync(gzPath)) {
        // Missing HAR means this test hasn't been recorded yet. Skip rather than
        // silently fall back to live APIs — a live fallback would reintroduce
        // backend flakiness and defeat the purpose of deterministic replay.
        // testInfo.skip throws, aborting the fixture before use() is called.
        testInfo.skip(true, `[HAR REPLAY] No HAR file recorded for this test: ${gzPath}`);
        return;
      }

      const context = await browser.newContext(baseContextOptions);
      const har = readHarGz(gzPath);

      // Each entry is served exactly once. We track consumed entries and always find
      // the first unconsumed match. This handles out-of-order requests correctly —
      // if the browser requests URLs in a different order than recorded, each request
      // still gets the right response (first call gets first recorded response, etc.)
      const entryQueue: HarEntry[] = [...har.log.entries];
      const consumed = new Set<number>();

      // Track last served response per method+URL for fallback on repeated/polling requests
      const lastResponse = new Map<
        string,
        { status: number; headers: Record<string, string>; body: string | Buffer | undefined }
      >();

      await context.route(/\/api\//, async (route) => {
        const request = route.request();
        const method = request.method();
        const url = request.url();
        const normalizedUrl = normalizeUrl(url);

        if (REPLAY_LIVE_API_PATHS.test(new URL(url).pathname)) {
          await route.fallback();
          return;
        }

        // Find first unconsumed matching entry (match on path+query, ignore host:port)
        let matchIndex = -1;
        for (let i = 0; i < entryQueue.length; i++) {
          if (
            !consumed.has(i) &&
            entryQueue[i].request.method === method &&
            normalizeUrl(entryQueue[i].request.url) === normalizedUrl
          ) {
            matchIndex = i;
            break;
          }
        }

        if (matchIndex === -1) {
          // No unconsumed match — serve the last known response for this method+URL.
          // This handles: repeated background polling, async refetches after recording,
          // and polling tests where the same URL is called many times.
          const responseKey = `${method} ${normalizedUrl}`;
          const last = lastResponse.get(responseKey);
          if (last) {
            await route.fulfill(last);
          } else {
            // Fail fast: serving synthetic responses here masks missing coverage and lets
            // tests pass against unexpected API calls. Re-record the HAR if this fires.
            // The abort surfaces as a network failure to the page; the test will fail on
            // the resulting expect/await. Throwing from this handler would land as an
            // unhandled rejection — abort is the deterministic signal.
            console.error(`[HAR REPLAY] No matching HAR entry found for ${method} ${url}`);
            await route.abort("failed");
          }
          return;
        }

        consumed.add(matchIndex);
        const entry = entryQueue[matchIndex];

        // Build response headers — skip transport headers
        const headers: Record<string, string> = {};
        for (const h of entry.response.headers) {
          const name = h.name.toLowerCase();
          if (["content-encoding", "transfer-encoding"].includes(name)) continue;
          if (name === "content-type" && h.value === "x-unknown") continue;
          headers[h.name] = h.value;
        }

        // Build response body — use explicit null check so an empty-string body
        // recorded in the HAR is replayed as-is instead of being dropped.
        let body: string | Buffer | undefined;
        const content = entry.response.content;
        if (content.text != null) {
          body = content.encoding === "base64" ? Buffer.from(content.text, "base64") : content.text;
        }

        const response = { status: entry.response.status, headers, body };

        // Store as last known response for this method+URL (used as fallback for future requests)
        const responseKey = `${method} ${normalizedUrl}`;
        lastResponse.set(responseKey, response);

        await route.fulfill(response);
      });

      await use(context);
      await context.close();
    }
  },
});

export { expect };

export const generateTestName = (prefix: string, testId: string): string => {
  return `${prefix}_${testId}`;
};

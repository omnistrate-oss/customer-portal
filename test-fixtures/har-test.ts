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
import * as os from "os";
import * as path from "path";
import { hasBackendFailure } from "test-utils/backend-error";
import { isRecordMode, isReplayMode } from "test-utils/har-mode";
import * as zlib from "zlib";

import { assertSafeHar } from "../scripts/har-security.mjs";

import { persistRecordedHar } from "./har-recording.mjs";
import { normalizeHarReplayUrl } from "./har-replay.mjs";

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

type HarFixtures = {
  harMode: HarMode;
  testId: string;
  harFilePath: string;
  skipAfterBackendFailure: void;
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

// Read and decompress a validated .har.gz file.
const readHarGz = (gzPath: string): HarFile => {
  try {
    const compressed = fs.readFileSync(gzPath);
    const json = new TextDecoder("utf-8", { fatal: true }).decode(zlib.gunzipSync(new Uint8Array(compressed)));
    const har: unknown = JSON.parse(json);
    assertSafeHar(har, gzPath);
    return har as HarFile;
  } catch {
    throw new Error(`[HAR] Replay recording rejected: ${gzPath}`);
  }
};

// Auth endpoints intentionally skipped by record mode's urlFilter (their
// bodies/Set-Cookie headers contain credentials). Replay must let these fall
// through to the real Next.js routes — without this, a refresh-token call
// during a replay test would have no HAR entry and abort("failed").
const REPLAY_LIVE_API_PATHS =
  /\/api\/(signin|signup|refresh-token|sign-in-with-idp|logout|reset-password|change-password)(?:\/|$|\?)/i;

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

  // Serial suites skip only the test that hit a backend failure; skip the rest of the spec too
  skipAfterBackendFailure: [
    async ({}, use, testInfo) => {
      testInfo.skip(hasBackendFailure(testInfo.file), "Skipping: an earlier test in this spec hit a backend failure");
      await use();
    },
    { auto: true },
  ],

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
    if (effectiveHarMode === "record") {
      // Raw captures stay in a private temporary directory outside the fixture corpus.
      const rawDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "portal-har-"));
      const rawHarPath = path.join(rawDirectory, "capture.har");
      try {
        const context = await browser
          .newContext({
            ...baseContextOptions,
            recordHar: {
              path: rawHarPath,
              content: "embed",
              // Capture /api/* but skip auth endpoints — their response bodies and
              // Set-Cookie headers contain credentials that shouldn't land in a
              // committed HAR. Replay re-authenticates at runtime anyway.
              urlFilter:
                /\/api\/(?!signin|signup|refresh-token|sign-in-with-idp|logout|reset-password|change-password)/,
            },
          })
          .catch(() => {
            throw new Error("[HAR] Cannot create recording context safely");
          });

        try {
          await use(context);

          for (const page of context.pages()) {
            try {
              await page.waitForLoadState("networkidle", { timeout: 10000 });
            } catch {
              // Ignore timeout
            }
          }
          // Buffer for async refetches triggered by mutation onSuccess callbacks.
          await new Promise((r) => setTimeout(r, 4000));
        } finally {
          try {
            await context.close();
          } catch {
            throw new Error(`[HAR] Recording capture failed: ${gzPath}`);
          }
        }

        persistRecordedHar(rawHarPath, gzPath, testInfo.status);
      } finally {
        try {
          fs.rmSync(rawDirectory, { recursive: true, force: true });
        } catch {
          throw new Error(`[HAR] Recording cleanup failed: ${gzPath}`);
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

      const har = readHarGz(gzPath);
      const context = await browser.newContext(baseContextOptions);

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
        const normalizedUrl = normalizeHarReplayUrl(url);

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
            normalizeHarReplayUrl(entryQueue[i].request.url) === normalizedUrl
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
            console.error(`[HAR REPLAY] No matching HAR entry found for ${method}`);
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

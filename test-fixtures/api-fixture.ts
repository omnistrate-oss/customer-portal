/**
 * API Fixture Helper
 *
 * Saves and restores data from direct API calls (e.g., service creation in beforeAll)
 * so that replay mode can use the same IDs that were baked into the browser HAR files.
 *
 * Usage:
 *   const fixture = new ApiFixture("pipelines");
 *   // In beforeAll:
 *   const serviceId = await fixture.getOrCreate("serviceId", () => createService());
 *   // In afterAll:
 *   if (!isReplayMode()) { await deleteService(serviceId); }
 */

import * as fs from "fs";
import { randomUUID } from "node:crypto";
import * as path from "path";
import { isReplayMode } from "test-utils/har-mode";
import * as zlib from "zlib";

import { assertSafeFixture, sanitizeFixture } from "../scripts/har-security.mjs";

const harsDir = path.resolve(__dirname, "../tests/fixtures/hars", "fixtures");

const readGz = (gzPath: string): Record<string, unknown> => {
  try {
    const compressed = fs.readFileSync(gzPath);
    const json = new TextDecoder("utf-8", { fatal: true }).decode(zlib.gunzipSync(new Uint8Array(compressed)));
    const data: unknown = JSON.parse(json);
    if (data === null || typeof data !== "object" || Array.isArray(data)) throw new Error("Invalid fixture shape");
    assertSafeFixture(data, gzPath);
    return data as Record<string, unknown>;
  } catch {
    throw new Error(`[ApiFixture] Fixture rejected: ${gzPath}`);
  }
};

export class ApiFixture {
  private readonly gzPath: string;
  private data: Record<string, unknown> = {};

  constructor(name: string) {
    this.gzPath = path.join(harsDir, `${name}.fixture.json.gz`);

    if (isReplayMode() && fs.existsSync(this.gzPath)) {
      this.data = readGz(this.gzPath);
    }
  }

  /**
   * In record/live mode: calls the factory, saves the result, and returns it.
   * In replay mode: returns the previously saved value.
   */
  async getOrCreate<T>(key: string, factory: () => T | Promise<T>): Promise<T> {
    if (isReplayMode()) {
      if (!(key in this.data)) {
        throw new Error(`[ApiFixture] Missing key "${key}" in fixture ${this.gzPath}. Re-run in record mode.`);
      }
      return this.data[key] as T;
    }

    const value = await factory();
    this.data[key] = value;
    this.flush(key, value);
    return value;
  }

  /**
   * Persist the latest write. Re-reads any concurrent writes from disk and merges before
   * writing, then renames atomically. Playwright runs workers as separate processes that
   * may share a fixture file (e.g. the per-subscription fixture); merge-on-write prevents
   * one worker from clobbering another's keys, and the rename keeps readers from seeing
   * a half-written file.
   */
  private flush(latestKey: string, latestValue: unknown): void {
    const tmpPath = `${this.gzPath}.${randomUUID()}.tmp`;
    try {
      fs.mkdirSync(path.dirname(this.gzPath), { recursive: true });
      if (fs.existsSync(this.gzPath)) {
        const onDisk = readGz(this.gzPath);
        this.data = { ...onDisk, ...this.data, [latestKey]: latestValue };
      }

      // The live factory result and in-memory state retain their original values.
      const sanitized = sanitizeFixture(this.data);
      assertSafeFixture(sanitized, this.gzPath);
      const compressed = zlib.gzipSync(new Uint8Array(Buffer.from(JSON.stringify(sanitized, null, 2))), { level: 9 });
      fs.writeFileSync(tmpPath, new Uint8Array(compressed), { mode: 0o600, flag: "wx" });
      fs.renameSync(tmpPath, this.gzPath);
    } catch {
      throw new Error(`[ApiFixture] Fixture rejected: ${this.gzPath}`);
    } finally {
      try {
        fs.rmSync(tmpPath, { force: true });
      } catch {
        throw new Error(`[ApiFixture] Fixture cleanup failed: ${this.gzPath}`);
      }
    }
  }
}

export { isRecordMode, isReplayMode } from "test-utils/har-mode";

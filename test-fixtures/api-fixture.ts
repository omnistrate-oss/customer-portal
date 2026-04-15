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
import * as path from "path";
import * as zlib from "zlib";

const harsDir = path.resolve(__dirname, "../tests/fixtures/hars", "fixtures");

const isReplayMode = (): boolean => {
  return process.env.HAR_MODE?.toLowerCase() === "replay";
};

const isRecordMode = (): boolean => {
  return process.env.HAR_MODE?.toLowerCase() === "record";
};

export class ApiFixture {
  private gzPath: string;
  private data: Record<string, any> = {};

  constructor(name: string) {
    this.gzPath = path.join(harsDir, `${name}.fixture.json.gz`);

    if (isReplayMode() && fs.existsSync(this.gzPath)) {
      const compressed = fs.readFileSync(this.gzPath);
      const json = zlib.gunzipSync(new Uint8Array(compressed)).toString("utf-8");
      this.data = JSON.parse(json);
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
    this.flush();
    return value;
  }

  // Write fixture data to disk (called automatically after each getOrCreate).
  private flush(): void {
    const dir = path.dirname(this.gzPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const json = JSON.stringify(this.data, null, 2);
    const compressed = zlib.gzipSync(new Uint8Array(Buffer.from(json)), { level: 9 });
    fs.writeFileSync(this.gzPath, new Uint8Array(compressed));
  }
}

// Returns true if running in replay mode — use to skip cleanup in afterAll
export { isRecordMode, isReplayMode };

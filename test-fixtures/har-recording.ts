import type { TestInfo } from "@playwright/test";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { assertSafeHar, sanitizeHar } from "../scripts/har-security.mjs";

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

/** Sanitize successful captures before atomic replacement, and always remove temporary files. */
export const persistRecordedHar = (rawPath: string, gzPath: string, status: TestInfo["status"]): void => {
  const temporaryPath = `${gzPath}.${randomUUID()}.tmp`;
  try {
    if (status !== "passed") return;
    const parsed: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(fs.readFileSync(rawPath)));
    if (isObject(parsed) && isObject(parsed.log) && Array.isArray(parsed.log.entries)) {
      parsed.log.entries = parsed.log.entries.filter((entry) => {
        const response = isObject(entry) ? entry.response : undefined;
        if (!isObject(response) || typeof response.status !== "number") return true;
        return !(response.status < 0 || (response._failureText && (response.status < 200 || response.status >= 300)));
      });
    }
    const har = sanitizeHar(parsed);
    assertSafeHar(har, gzPath);
    const compressed = zlib.gzipSync(new Uint8Array(Buffer.from(JSON.stringify(har))), { level: 9 });
    fs.mkdirSync(path.dirname(gzPath), { recursive: true });
    fs.writeFileSync(temporaryPath, new Uint8Array(compressed), { mode: 0o600, flag: "wx" });
    fs.renameSync(temporaryPath, gzPath);
  } catch {
    throw new Error(`[HAR] Recording rejected: ${gzPath}`);
  } finally {
    try {
      fs.rmSync(rawPath, { force: true });
      fs.rmSync(temporaryPath, { force: true });
    } catch {
      throw new Error(`[HAR] Recording cleanup failed: ${gzPath}`);
    }
  }
};

import { get } from "node:https";
import { setTimeout as delay } from "node:timers/promises";

export const API_SPEC_URLS = {
  external: "https://api.omnistrate.dev/docs/external/openapi.json",
};

const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);

const downloadAttempt = (url, signal) =>
  new Promise((resolve, reject) => {
    const request = get(url, { agent: false, headers: { Accept: "application/json" }, signal }, (response) => {
      response.on("error", reject);

      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`Failed to download OpenAPI spec: HTTP ${response.statusCode ?? "unknown"}`));
        return;
      }

      let content = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        content += chunk;
      });
      response.on("end", () => {
        try {
          const spec = JSON.parse(content);
          if (
            !isRecord(spec) ||
            typeof spec.openapi !== "string" ||
            !/^3\.\d+\.\d+$/.test(spec.openapi) ||
            !isRecord(spec.info) ||
            typeof spec.info.title !== "string" ||
            typeof spec.info.version !== "string" ||
            !isRecord(spec.paths)
          ) {
            throw new Error("Invalid OpenAPI document");
          }
          resolve(content);
        } catch {
          reject(new Error("Downloaded response is not a valid OpenAPI 3 JSON document"));
        }
      });
    });

    request.on("error", reject);
  });

/** Downloads and validates the published OpenAPI JSON, retrying reset connections twice. */
export const downloadOpenAPIJSON = async (url) => {
  const signal = AbortSignal.timeout(300_000);

  for (let retries = 0; ; retries += 1) {
    try {
      return await downloadAttempt(url, signal);
    } catch (error) {
      if (signal.aborted || retries >= 2 || !isRecord(error) || error.code !== "ECONNRESET") {
        throw error;
      }

      process.stdout.write(`Connection reset while downloading OpenAPI spec. Retrying (${retries + 1}/2)...\n`);
      await delay((retries + 1) * 1_000, undefined, { signal });
    }
  }
};

import { execFileSync } from "node:child_process";
import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { API_SPEC_URLS, downloadOpenAPIJSON } from "./downloadOpenAPIJSON.mjs";
import { sanitizeDiagnostic } from "./har-security.mjs";
import { normalizeOpenAPIOperationIds } from "./normalizeOpenAPIOperationIds.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const jsonOutputPath = join(__dirname, "openapi.json");
const externalAPIOutputPath = join(__dirname, "..", "src", "types", "schema.ts");

const log = (message: string): void => {
  process.stdout.write(`${message}\n`);
};

const run = async (): Promise<void> => {
  try {
    if (existsSync(jsonOutputPath)) unlinkSync(jsonOutputPath);

    log(`Downloading external OpenAPI spec from ${API_SPEC_URLS.external}...`);
    const content = await downloadOpenAPIJSON(API_SPEC_URLS.external);
    writeFileSync(jsonOutputPath, normalizeOpenAPIOperationIds(content), "utf8");
    log(`OpenAPI spec downloaded to ${jsonOutputPath}`);

    log("Converting OpenAPI spec to TypeScript...");
    execFileSync("yarn", ["openapi-typescript", jsonOutputPath, "-o", externalAPIOutputPath, "--yes"], {
      stdio: "inherit",
    });
    execFileSync("yarn", ["prettier", "--write", externalAPIOutputPath], { stdio: "inherit" });
    log(`TypeScript definitions saved to ${externalAPIOutputPath}`);
    log("API types update completed successfully!");
  } catch (error) {
    console.error("API types update failed:", sanitizeDiagnostic(error instanceof Error ? error.message : error));
    process.exitCode = 1;
  } finally {
    if (existsSync(jsonOutputPath)) unlinkSync(jsonOutputPath);
  }
};

run().catch(() => {
  console.error("API types update failed unexpectedly.");
  process.exitCode = 1;
});

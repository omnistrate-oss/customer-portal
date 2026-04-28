/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const puppeteer = require("puppeteer");

const externalAPIUrl = "https://api.omnistrate.dev/docs/external/";

const downloadPath = path.join(__dirname);
const jsonOutputPath = path.join(downloadPath, "openapi.json");
const externalAPIOutputPath = path.join(__dirname, "..", "src", "types", "schema.ts");

async function downloadOpenAPISpec() {
  console.log("Launching browser to download OpenAPI spec...");

  const browser = await puppeteer.launch({
    headless: "new",
  });

  try {
    const page = await browser.newPage();

    // Configure download behavior
    const client = await page.createCDPSession();
    await client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: downloadPath,
    });

    // Navigate to the API page
    console.log(`Navigating to ${externalAPIUrl}...`);
    await page.goto(externalAPIUrl);

    console.log("Looking for OpenAPI spec download link...");

    const blobUrlAnchorTag = await page.$('a[download="openapi.json"]');
    if (!blobUrlAnchorTag) {
      throw new Error("Download link not found");
    }

    blobUrlAnchorTag.click();

    // Wait for the download to complete
    console.log("Waiting for download to complete...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Check if the file exists
    if (!fs.existsSync(jsonOutputPath)) {
      throw new Error(`Failed to download OpenAPI spec to ${jsonOutputPath}`);
    }

    console.log(`OpenAPI spec downloaded to ${jsonOutputPath}`);
    return true;
  } catch (error) {
    console.error("Error downloading OpenAPI spec:", error);
    return false;
  } finally {
    await browser.close();
  }
}

// Function to convert the OpenAPI spec to TypeScript
function convertToTypeScript() {
  console.log("Converting OpenAPI spec to TypeScript...");
  try {
    execFileSync("yarn", ["openapi-typescript", jsonOutputPath, "-o", externalAPIOutputPath, "--yes"], {
      stdio: "inherit",
    });
    console.log(`TypeScript definitions saved to ${externalAPIOutputPath}`);

    // Clean up the JSON file
    fs.unlinkSync(jsonOutputPath);
    console.log(`Removed temporary JSON file: ${jsonOutputPath}`);

    return true;
  } catch (error) {
    console.error("Failed to convert OpenAPI spec to TypeScript:", error.message);
    return false;
  }
}

async function run() {
  const externalAPIDownloadSuccess = await downloadOpenAPISpec();
  if (!externalAPIDownloadSuccess) {
    console.error("Failed to download OpenAPI spec. Exiting.");
    process.exit(1);
  }

  const externalAPISuccess = convertToTypeScript();
  if (!externalAPISuccess) {
    console.error("Failed to convert External OpenAPI spec to TypeScript. Exiting.");
    process.exit(1);
  }

  console.log("API types update completed successfully!");
}

run().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});

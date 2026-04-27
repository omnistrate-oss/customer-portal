import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { isRecordMode, isReplayMode } from "test-utils/har-mode";

dotenv.config({ path: path.resolve(__dirname, ".env.local") });

// Replay mode: deterministic (0 retries), instant responses (short timeout)
// Record mode: 2 workers to balance speed vs deterministic capture
const getWorkers = () => {
  if (isRecordMode()) return 2;
  if (isReplayMode()) return process.env.CI ? 1 : 3;
  return process.env.CI ? 1 : 2;
};

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  globalSetup: require.resolve("./test-fixtures/global-setup"),
  globalTeardown: require.resolve("./test-fixtures/global-teardown"),

  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: isReplayMode() ? 0 : process.env.CI ? 2 : 1,
  workers: getWorkers(),
  reporter: process.env.CI ? [["html"], ["github"]] : [["html"]],

  timeout: isReplayMode() ? 60 * 1000 : 12 * 60 * 1000,

  use: {
    actionTimeout: 30 * 1000,
    baseURL: process.env.YOUR_SAAS_DOMAIN_URL || "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "auth-tests",
      testDir: "./tests/auth",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "user-setup",
      testMatch: "user-setup.spec.ts",
    },
    {
      name: "deployment-tests",
      testDir: "./tests/deployments",
      use: {
        ...devices["Desktop Chrome"],
        storageState: path.resolve("./playwright/auth/user.json"),
      },
      dependencies: ["user-setup"],
    },
  ],

  webServer: process.env.CI
    ? undefined
    : {
        command: "yarn dev:test",
        url: process.env.YOUR_SAAS_DOMAIN_URL || "http://127.0.0.1:3000",
        reuseExistingServer: true,
        env: {
          PROVIDER_EMAIL: process.env.PROVIDER_EMAIL || "",
          PROVIDER_PASSWORD: process.env.PROVIDER_PASSWORD || "",
          NEXT_PUBLIC_BACKEND_BASE_DOMAIN: process.env.NEXT_PUBLIC_BACKEND_BASE_DOMAIN || "https://api.omnistrate.dev",
          ENVIRONMENT_TYPE: process.env.ENVIRONMENT_TYPE || "DEV",
          MAIL_USER_EMAIL: process.env.MAIL_USER_EMAIL || "",
          MAIL_USER_PASSWORD: process.env.MAIL_USER_PASSWORD || "",
        },
      },
});

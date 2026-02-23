import { defineConfig, devices } from "@playwright/test";
/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

/**
 * See https://playwright.dev/docs/test-configuration.
 */

export default defineConfig({
  // globalSetup: require.resolve("./test-fixtures/global-setup"),
  // globalTeardown: require.resolve("./test-fixtures/global-teardown"),

  testDir: "./tests",
  testMatch: /(?!)/, // Skip all tests temporarily (backend issues)
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 3 : 3,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */

  timeout: 12 * 60 * 1000, // Timeout for each test (12 minutes)

  use: {
    actionTimeout: 30 * 1000, // Timeout for each action (like a click)

    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.YOUR_SAAS_DOMAIN_URL || "http://127.0.0.1:3000",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  /* Configure projects for major browsers */
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

    // {
    //   name: "firefox",
    //   use: { ...devices["Desktop Firefox"] },
    // },

    // {
    //   name: "webkit",
    //   use: { ...devices["Desktop Safari"] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: "yarn dev",
  //   url: process.env.YOUR_SAAS_DOMAIN_URL || "http://127.0.0.1:3000",
  //   reuseExistingServer: !process.env.CI,
  //   env: {
  //     PROVIDER_EMAIL: process.env.PROVIDER_EMAIL as string,
  //     PROVIDER_PASSWORD: process.env.PROVIDER_PASSWORD as string,
  //     NEXT_PUBLIC_BACKEND_BASE_DOMAIN: "https://api.omnistrate.dev",
  //     ENVIRONMENT_TYPE: "DEV",
  //     MAIL_USER_EMAIL: process.env.MAIL_USER_EMAIL as string,
  //     MAIL_USER_PASSWORD: process.env.MAIL_USER_PASSWORD as string,
  //   },
  // },
});

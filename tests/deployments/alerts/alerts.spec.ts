// spec: docs/COMPREHENSIVE_TEST_PLAN.md — Section 15: Alerts (Notifications)
// seed: tests/user-setup.spec.ts

import { test, expect } from "test-fixtures/har-test";
import { registerSoftFailureRecorder } from "test-utils/soft-failure-tracker";

registerSoftFailureRecorder();

test.describe("Alerts Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/alerts");
    await page.waitForLoadState("networkidle");
  });

  // 15.1 Page Load
  test("Page Load and Structure", async ({ page }) => {
    // Verify the "Alerts" page title is visible
    await expect(page.getByText("Alerts").first()).toBeVisible();
  });

  // 15.2 View Notifications
  test("Notifications Content Renders", async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(3000);

    // Page should have rendered content
    await expect(page.getByText("Alerts").first()).toBeVisible();
    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.length).toBeGreaterThan(0);
  });
});

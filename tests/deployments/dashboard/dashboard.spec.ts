// spec: docs/COMPREHENSIVE_TEST_PLAN.md — Section 5: Dashboard
// seed: tests/user-setup.spec.ts

import test, { expect } from "@playwright/test";

test.describe("Dashboard Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
  });

  // 5.1 Page Load and Data Rendering
  test("Page Load and Data Rendering", async ({ page }) => {
    // Verify the "Dashboard" heading is displayed
    await expect(page.getByText("Dashboard").first()).toBeVisible();
  });

  // 5.2 Audit Logs Widget or Empty State
  test("Audit Logs Widget", async ({ page }) => {
    // The EventsTable renders on the dashboard. It may show "No audit logs" if empty.
    await page.waitForTimeout(3000);
    const hasTable = await page
      .locator("table, [role='table']")
      .first()
      .isVisible()
      .catch(() => false);
    const hasEmptyState = await page
      .getByText("No audit logs")
      .isVisible()
      .catch(() => false);
    expect(hasTable || hasEmptyState).toBeTruthy();
  });

  // 5.4 Chart Widgets
  test("Chart Widgets Render", async ({ page }) => {
    // Wait for data to fully load
    await page.waitForTimeout(5000);

    // Verify at least one chart title is visible
    const chartTitles = [
      "Deployments by Lifecycle Stage",
      "Deployments by Health Status",
      "Deployments by System Load",
      "Deployments by Month",
    ];

    let visibleCount = 0;
    for (const title of chartTitles) {
      const isVisible = await page
        .getByText(title)
        .first()
        .isVisible()
        .catch(() => false);
      if (isVisible) visibleCount++;
    }
    expect(visibleCount).toBeGreaterThan(0);
  });
});

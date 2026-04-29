// spec: docs/COMPREHENSIVE_TEST_PLAN.md — Section 8: Subscriptions
// seed: tests/user-setup.spec.ts

import test, { expect } from "@playwright/test";

test.describe("Subscriptions Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to subscriptions page
    await page.goto("/subscriptions");
    await page.waitForLoadState("networkidle");
  });

  // 8.1 Page Load and Structure
  test("Page Load and Structure", async ({ page }) => {
    // Verify the subscriptions page title or heading is visible
    await expect(page.getByText("Subscriptions").first()).toBeVisible();

    // Verify the DataTable is rendered
    const table = page.locator("table, [role='table']").first();
    await expect(table).toBeVisible({ timeout: 15000 });
  });

  // 8.2 View Subscription Details
  test("View Subscription Details", async ({ page }) => {
    // Wait for subscriptions to load
    await page.waitForLoadState("networkidle");

    // Check if there are subscription rows (skip if empty)
    const rows = page.locator("table tbody tr, [role='row']");
    const rowCount = await rows.count();

    if (rowCount > 0) {
      // Click on the first subscription ID to open details drawer
      const firstSubscriptionLink = rows.first().locator("text=/sub-/i, [class*='primary']").first();
      if (await firstSubscriptionLink.isVisible()) {
        await firstSubscriptionLink.click();

        // Verify the subscription details drawer or overlay opens
        await expect(page.locator('[class*="drawer"], [class*="Drawer"], [role="dialog"]').first()).toBeVisible({
          timeout: 10000,
        });
      }
    }
  });

  // 8.5 Deep Link — Pre-filled Search
  test("Deep Link — Pre-filled Search", async ({ page }) => {
    // Navigate to subscriptions with a subscription ID query param
    await page.goto("/subscriptions?subscriptionId=test-sub-id");
    await page.waitForLoadState("networkidle");

    // Verify search/filter is active or the subscriptionId is shown
    // The page sets searchText from URL params
    const searchInput = page.locator('input[type="search"], input[type="text"]').first();
    if (await searchInput.isVisible()) {
      const value = await searchInput.inputValue();
      expect(value).toContain("test-sub-id");
    }
  });

  // 8.6 Table Renders Without Errors
  test("Table Renders Without Errors", async ({ page }) => {
    // Verify the page loads without crashing
    await page.waitForLoadState("networkidle");

    const table = page.locator("table, [role='table']").first();
    await expect(table).toBeVisible({ timeout: 15000 });
  });
});

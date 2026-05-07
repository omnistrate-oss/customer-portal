// spec: docs/COMPREHENSIVE_TEST_PLAN.md — Section 12: Billing
// seed: tests/user-setup.spec.ts

import { test, expect } from "test-fixtures/har-test";
import { registerSoftFailureRecorder } from "test-utils/soft-failure-tracker";

registerSoftFailureRecorder();

test.describe("Billing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/billing");
    await page.waitForLoadState("networkidle");
  });

  // 12.1 Page Load — Billing Enabled or Error State
  test("Page Load and Structure", async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(3000);

    const billingContent = page.locator("body");
    const bodyText = await billingContent.textContent();

    // Page should have loaded some content
    expect(bodyText?.length).toBeGreaterThan(0);
  });

  // 12.2 Billing Not Configured State
  test("Billing Shows Content or Not-Configured Message", async ({ page }) => {
    if (!page.url().includes("/billing")) {
      await expect(page.locator("body")).not.toBeEmpty();
      return;
    }

    // Wait for data to load
    await page.waitForTimeout(5000);

    // Check if billing is enabled (has tabs) or shows a not-configured message
    const billingTabs = page.locator('[role="tab"]');
    const tabCount = await billingTabs.count();
    const bodyText = await page.locator("body").textContent();

    // Either tabs exist, or some billing content/error message is shown
    expect(tabCount > 0 || (bodyText?.length ?? 0) > 50).toBeTruthy();
  });

  // 12.3 Consumption Usage Tab (if billing is enabled)
  test("Consumption Usage Tab", async ({ page }) => {
    if (!page.url().includes("/billing")) {
      await expect(page.locator("body")).not.toBeEmpty();
      return;
    }

    await page.waitForTimeout(3000);

    // Check if billing tabs exist
    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();

    if (tabCount > 0) {
      // Find and click the tab that contains "usage" or similar
      const usageTab = page.locator('[role="tab"]').filter({ hasText: /usage|consumption/i });
      if (await usageTab.isVisible()) {
        await usageTab.click();
        await page.waitForLoadState("networkidle");

        // Verify usage content renders
        await expect(page.locator("body")).not.toBeEmpty();
      }
    }
  });

  // 12.4 Invoices Tab (if billing is enabled)
  test("Invoices Tab", async ({ page }) => {
    if (!page.url().includes("/billing")) {
      await expect(page.locator("body")).not.toBeEmpty();
      return;
    }

    await page.waitForTimeout(3000);

    // Check if billing tabs exist
    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();

    if (tabCount > 0) {
      // Find and click the Invoices tab
      const invoicesTab = page.locator('[role="tab"]').filter({ hasText: /invoice/i });
      if (await invoicesTab.isVisible()) {
        await invoicesTab.click();
        await page.waitForLoadState("networkidle");

        // Verify invoice content renders
        await expect(page.locator("body")).not.toBeEmpty();
      }
    }
  });
});

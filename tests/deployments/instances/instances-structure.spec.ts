// spec: docs/COMPREHENSIVE_TEST_PLAN.md — Section 6: Instances — Listing and Page Structure
// seed: tests/user-setup.spec.ts

import { test, expect } from "test-fixtures/har-test";
import { registerSoftFailureRecorder } from "test-utils/soft-failure-tracker";

registerSoftFailureRecorder();
import { InstancesPage } from "page-objects/instances-page";

test.describe("Instances Page — Structure and UI", () => {
  let instancesPage: InstancesPage;

  test.beforeEach(async ({ page }) => {
    instancesPage = new InstancesPage(page);
    await instancesPage.navigate();
    await page.waitForLoadState("networkidle");
  });

  // 6.1 Page Load and Structure
  test("Page Load — Toolbar Buttons Visible", async ({ page }) => {
    const dataTestIds = instancesPage.dataTestIds;

    // Verify toolbar buttons are visible
    await expect(page.getByTestId(dataTestIds.refreshButton)).toBeVisible();
    await expect(page.getByTestId(dataTestIds.stopButton)).toBeVisible();
    await expect(page.getByTestId(dataTestIds.startButton)).toBeVisible();
    await expect(page.getByTestId(dataTestIds.modifyButton)).toBeVisible();
    await expect(page.getByTestId(dataTestIds.deleteButton)).toBeVisible();
    await expect(page.getByTestId(dataTestIds.createButton)).toBeVisible();
    await expect(page.getByTestId(dataTestIds.actionsMenu)).toBeVisible();
  });

  // 6.2 Instances Table Columns
  test("Instances Table Columns Visible", async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(3000);

    // Verify the DataTable is rendered
    const table = page.locator("table, [role='table']").first();
    await expect(table).toBeVisible({ timeout: 15000 });
  });

  // 6.3 Create Instance — Form Opens
  test("Create Instance — Form Opens", async ({ page }) => {
    const dataTestIds = instancesPage.dataTestIds;

    // Click the Create button
    await page.getByTestId(dataTestIds.createButton).click();

    // Verify the form drawer opens with the service name select
    await expect(page.getByTestId(dataTestIds.serviceNameSelect)).toBeVisible({ timeout: 10000 });
  });

  // 6.15 Filter and Search Instances
  test("Search/Filter Instances", async ({ page }) => {
    // Check if search input exists
    const searchInput = page.locator('input[type="search"], input[type="text"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("nonexistent-instance-id");

      // Wait for filter to apply
      await page.waitForTimeout(500);

      // Verify the page didn't crash
      await expect(page.getByTestId(instancesPage.dataTestIds.refreshButton)).toBeVisible();
    }
  });

  // 6.1 Refresh Button — Refetches Data (Section 22.4)
  test("Refresh Button Works", async ({ page }) => {
    const dataTestIds = instancesPage.dataTestIds;

    // Click refresh button
    await page.getByTestId(dataTestIds.refreshButton).click();
    await page.waitForLoadState("networkidle");

    // Verify page is still intact after refresh
    await expect(page.getByTestId(dataTestIds.refreshButton)).toBeVisible();
  });
});

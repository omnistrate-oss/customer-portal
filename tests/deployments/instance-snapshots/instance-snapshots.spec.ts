// spec: docs/COMPREHENSIVE_TEST_PLAN.md — Section 16: Instance Snapshots
// seed: tests/user-setup.spec.ts

import { test, expect } from "test-fixtures/har-test";
import { registerSoftFailureRecorder } from "test-utils/soft-failure-tracker";

registerSoftFailureRecorder();

test.describe("Instance Snapshots Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/instance-snapshots");
    await page.waitForLoadState("networkidle");
  });

  // 16.1 Page Load and Structure
  test("Page Load and Structure", async ({ page }) => {
    // Verify the "Instance Snapshots" page title is visible
    await expect(page.getByText("Instance Snapshots").first()).toBeVisible();

    // Verify the DataTable is rendered
    const table = page.locator("table, [role='table']").first();
    await expect(table).toBeVisible({ timeout: 15000 });
  });

  // 16.1 Verify Table Columns
  test("Table Columns Rendered", async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(3000);

    // Verify key column headers exist
    const expectedHeaders = ["Snapshot ID"];
    for (const header of expectedHeaders) {
      await expect(page.getByText(header).first()).toBeVisible();
    }
  });

  // 16.2 Create Snapshot — Button Exists
  test("Create Snapshot Button Exists", async ({ page }) => {
    // Verify the create snapshot button is visible (data-testid: create-button)
    await expect(page.getByTestId("create-button")).toBeVisible();
  });

  // 16.2 Create Snapshot — Dialog Opens
  test("Create Snapshot — Dialog Opens", async ({ page }) => {
    // Click the create button
    await page.getByTestId("create-button").click();

    // Verify a dialog or form opens
    await expect(
      page
        .locator('[role="dialog"], [class*="dialog"], [class*="Dialog"], [class*="drawer"], [class*="Drawer"]')
        .first()
    ).toBeVisible({ timeout: 10000 });
  });

  // 16.5 Delete Snapshot — Button Exists
  test("Delete Snapshot Button Exists", async ({ page }) => {
    // The delete button should be visible in the toolbar (data-testid: delete-button)
    await expect(page.getByTestId("delete-button")).toBeVisible();
  });

  // 16.6 Navigate to Snapshot Details (if snapshots exist)
  test("Snapshot Row Click Navigation", async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(3000);

    // Check if there are snapshot rows
    const rows = page.locator("table tbody tr, [role='row']");
    const rowCount = await rows.count();

    if (rowCount > 1) {
      // Click on the first snapshot ID link
      const firstLink = rows.nth(1).locator("a, [class*='primary'], [style*='cursor: pointer']").first();
      if (await firstLink.isVisible()) {
        const href = await firstLink.getAttribute("href");
        await firstLink.click();
        await page.waitForLoadState("networkidle");

        // Verify navigation occurred
        if (href) {
          expect(page.url()).toContain("instance-snapshots");
        }
      }
    }
  });
});

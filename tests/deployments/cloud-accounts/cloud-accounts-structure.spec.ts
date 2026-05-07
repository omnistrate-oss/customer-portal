// spec: docs/COMPREHENSIVE_TEST_PLAN.md — Section 9: Cloud Accounts (BYOA)
// seed: tests/user-setup.spec.ts

import { test, expect } from "test-fixtures/har-test";
import { registerSoftFailureRecorder } from "test-utils/soft-failure-tracker";

registerSoftFailureRecorder();
import { CloudAccountsPage } from "page-objects/cloud-accounts-page";

test.describe("Cloud Accounts Page — Structure and UI", () => {
  let cloudAccountsPage: CloudAccountsPage;

  test.beforeEach(async ({ page }) => {
    cloudAccountsPage = new CloudAccountsPage(page);
    await cloudAccountsPage.navigate();
    await page.waitForLoadState("networkidle");
  });

  // 9.1 Page Load and Structure
  test("Page Load — Toolbar Buttons Visible", async ({ page }) => {
    const dataTestIds = cloudAccountsPage.dataTestIds;

    // Verify the Cloud Accounts page title is visible
    await expect(page.getByText("Cloud Accounts").first()).toBeVisible();

    // Verify toolbar buttons
    await expect(page.getByTestId(dataTestIds.refreshButton)).toBeVisible();
    await expect(page.getByTestId(dataTestIds.createButton)).toBeVisible();
  });

  // 9.1 DataTable is Rendered
  test("DataTable is Rendered", async ({ page }) => {
    // Verify the DataTable is rendered
    const table = page.locator("table, [role='table']").first();
    await expect(table).toBeVisible({ timeout: 15000 });
  });

  // 9.2 Create Cloud Account — Form Opens
  test("Create Cloud Account — Form Opens", async ({ page }) => {
    const dataTestIds = cloudAccountsPage.dataTestIds;

    // Click Create button
    await page.getByTestId(dataTestIds.createButton).click();

    // Verify the form opens with service name select
    await expect(page.getByTestId(dataTestIds.serviceNameSelect)).toBeVisible({ timeout: 10000 });
  });

  // 9.8 Deep Link — Pre-filled Service
  test("Deep Link — Pre-filled Service", async ({ page }) => {
    // Navigate with serviceId, servicePlanId, subscriptionId params
    await page.goto("/cloud-accounts?serviceId=test-service&servicePlanId=test-plan&subscriptionId=test-sub");
    await page.waitForLoadState("networkidle");

    // The page should load without errors
    await expect(page.getByText("Cloud Accounts").first()).toBeVisible();
  });

  // 9.1 Refresh Button Works
  test("Refresh Button Works", async ({ page }) => {
    const dataTestIds = cloudAccountsPage.dataTestIds;

    // Click refresh button
    await page.getByTestId(dataTestIds.refreshButton).click();
    await page.waitForLoadState("networkidle");

    // Verify page is still intact after refresh
    await expect(page.getByTestId(dataTestIds.refreshButton)).toBeVisible();
  });
});

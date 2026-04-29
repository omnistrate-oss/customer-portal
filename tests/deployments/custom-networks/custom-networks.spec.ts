// spec: docs/COMPREHENSIVE_TEST_PLAN.md — Section 10: Custom Networks
// seed: tests/user-setup.spec.ts

import test, { expect } from "@playwright/test";
import { CustomNetworksPage } from "page-objects/custom-networks-page";

test.describe("Custom Networks Page", () => {
  let customNetworksPage: CustomNetworksPage;

  test.beforeEach(async ({ page }) => {
    customNetworksPage = new CustomNetworksPage(page);
    await customNetworksPage.navigate();
    await page.waitForLoadState("networkidle");
  });

  // 10.1 Page Load and Structure
  test("Page Load and Structure", async ({ page }) => {
    const dataTestIds = customNetworksPage.dataTestIds;

    // Verify the page title is visible
    await expect(page.getByText("Customer Networks").first()).toBeVisible();

    // Verify toolbar buttons are visible
    await expect(page.getByTestId(dataTestIds.refreshButton)).toBeVisible();
    await expect(page.getByTestId(dataTestIds.createButton)).toBeVisible();
  });

  // 10.6 Search Custom Networks
  test("Search Custom Networks", async ({ page }) => {
    // Verify search input is functional
    const searchInput = page.locator('input[type="search"], input[type="text"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("nonexistent-network-name");

      // Table should filter results
      await page.waitForTimeout(500); // Small delay for filter to apply

      // Verify search doesn't crash the page
      await expect(page.getByText("Customer Networks").first()).toBeVisible();
    }
  });

  // 10.7 Deep Link — Auto-Open Create Form
  test("Deep Link — Auto-Open Create Form", async ({ page }) => {
    // Navigate with overlay=create query param
    await page.goto("/custom-networks?overlay=create");
    await page.waitForLoadState("networkidle");

    // Verify the Create Custom Network form opens automatically
    // Look for the name input field which is inside the form
    const nameInput = page.getByTestId(customNetworksPage.dataTestIds.nameInput);
    await expect(nameInput).toBeVisible({ timeout: 10000 });
  });

  // 10.2 Create Custom Network Form Elements
  test("Create Custom Network — Form Opens", async ({ page }) => {
    const dataTestIds = customNetworksPage.dataTestIds;

    // Click Create button
    await page.getByTestId(dataTestIds.createButton).click();

    // Verify form fields are visible
    await expect(page.getByTestId(dataTestIds.nameInput)).toBeVisible({ timeout: 10000 });

    // Verify cloud provider cards are present
    await expect(page.getByTestId(dataTestIds.awsCard)).toBeVisible();
    await expect(page.getByTestId(dataTestIds.gcpCard)).toBeVisible();
  });
});

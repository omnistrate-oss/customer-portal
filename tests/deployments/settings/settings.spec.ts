// spec: docs/COMPREHENSIVE_TEST_PLAN.md — Section 18: Settings
// seed: tests/user-setup.spec.ts

import { test, expect } from "test-fixtures/har-test";
import { registerSoftFailureRecorder } from "test-utils/soft-failure-tracker";

registerSoftFailureRecorder();

test.describe("Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
  });

  // 18.1 Page Load and Structure
  test("Page Load and Structure", async ({ page }) => {
    // Verify the Settings page title is visible
    await expect(page.getByText("Settings").first()).toBeVisible();

    // Verify tabs are visible: Profile, Password
    await expect(page.locator('[role="tab"]').filter({ hasText: "Profile" })).toBeVisible();
    await expect(page.locator('[role="tab"]').filter({ hasText: "Password" })).toBeVisible();
  });

  // 18.2 Profile Tab — View Profile
  test("Profile Tab — View Profile Form", async ({ page }) => {
    // The Profile tab should be the default
    // Verify profile form fields are visible
    await expect(page.getByTestId("name-input")).toBeVisible({ timeout: 10000 });
  });

  // 18.3 Profile Tab — Form Fields
  test("Profile Tab — Form Fields Are Populated", async ({ page }) => {
    // Verify the name input has a value (populated from user data)
    const nameField = page.getByTestId("name-input");
    await expect(nameField).toBeVisible({ timeout: 10000 });

    const input = nameField.locator("input, textarea").first();
    const nameValue = (await input.count()) > 0 ? await input.inputValue() : (await nameField.textContent()) || "";
    // Name should be populated with the user's name
    expect(nameValue.trim().length).toBeGreaterThan(0);
  });

  // 18.4 Password Tab — Change Password Form
  test("Password Tab — Change Password Form", async ({ page }) => {
    // Click Password tab
    await page.locator('[role="tab"]').filter({ hasText: "Password" }).click();

    // Verify password change form fields are visible
    await expect(page.getByTestId("current-password")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("new-password")).toBeVisible();
    await expect(page.getByTestId("confirm-password")).toBeVisible();
  });

  // 18.5 Delete Account Tab — PROD Only
  test("Delete Account Tab — Visibility Based on Environment", async ({ page }) => {
    const isProduction = process.env.ENVIRONMENT_TYPE === "PROD";

    const deleteAccountTab = page.locator('[role="tab"]').filter({ hasText: "Delete Account" });

    if (isProduction) {
      // In PROD, Delete Account tab should be visible
      await expect(deleteAccountTab).toBeVisible();
    } else {
      // In non-PROD, Delete Account tab should NOT be visible
      await expect(deleteAccountTab).not.toBeVisible();
    }
  });

  // 18.6 Tab Navigation
  test("Tab Navigation Works Correctly", async ({ page }) => {
    // Click Password tab
    await page.locator('[role="tab"]').filter({ hasText: "Password" }).click();

    // Verify password form is shown
    await expect(page.getByTestId("current-password")).toBeVisible({ timeout: 10000 });

    // Click Profile tab again
    await page.locator('[role="tab"]').filter({ hasText: "Profile" }).click();

    // Verify profile form is shown
    await expect(page.getByTestId("name-input")).toBeVisible({ timeout: 10000 });
  });
});

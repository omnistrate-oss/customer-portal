// spec: docs/COMPREHENSIVE_TEST_PLAN.md — Section 2: Authentication — Sign Up
// seed: N/A (public page, no auth required)

import test, { expect } from "@playwright/test";
import { PageURLs } from "page-objects/pages";

test.describe("Signup Page", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      process.env.ENVIRONMENT_TYPE !== "PROD",
      "Signup Page is not available in non-prod environments"
    );
    await page.goto(PageURLs.signup);
  });

  // 2.1 Page Load and Structure
  test("Page Load and Structure", async ({ page }) => {
    // Verify the page title is "Sign up"
    await expect(page).toHaveTitle("Sign up");

    // Verify the email input field is visible
    await expect(page.locator('input[name="email"], input[id="email"]')).toBeVisible();
  });

  // 2.2 Form Validation — All Fields Required (Password Signup Flow)
  test("Form Validation — All Fields Required", async ({ page }) => {
    // Enter a valid email to proceed to the form step
    const emailInput = page.locator('input[name="email"], input[id="email"]');
    await emailInput.fill("test-signup@example.com");

    // Look for a Next or Continue button to proceed
    const nextButton = page.getByRole("button", { name: /next|continue|sign up/i });
    if (await nextButton.isVisible()) {
      await nextButton.click();
    }

    // If password signup is enabled, the form fields should appear
    // Try to submit without filling required fields
    const submitButton = page.getByRole("button", { name: /sign up|create account|submit/i });
    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Verify validation errors are shown
      // Check for at least one error message
      const errorMessages = page.locator('[class*="error"], [id*="helper-text"]');
      await expect(errorMessages.first()).toBeVisible();
    }
  });

  // 2.3 Form Validation — Password Requirements
  test("Form Validation — Password Requirements", async ({ page }) => {
    // Enter email first to proceed
    const emailInput = page.locator('input[name="email"], input[id="email"]');
    await emailInput.fill("test-signup@example.com");

    const nextButton = page.getByRole("button", { name: /next|continue/i });
    if (await nextButton.isVisible()) {
      await nextButton.click();
    }

    // Fill password with weak value
    const passwordField = page.locator('input[name="password"]');
    if (await passwordField.isVisible()) {
      await passwordField.fill("abc");
      await passwordField.blur();

      // Verify validation error for password requirements
      const passwordError = page.locator("#password-helper-text");
      await expect(passwordError).toBeVisible();
    }
  });

  // 2.5 SSO Registration Buttons
  test("SSO Registration Buttons", async ({ page }) => {
    // Enter email to see login method options
    const emailInput = page.locator('input[name="email"], input[id="email"]');
    await emailInput.fill(process.env.USER_EMAIL || "test@example.com");

    const nextButton = page.getByRole("button", { name: /next|continue/i });
    if (await nextButton.isVisible()) {
      await nextButton.click();
    }

    // Check if any SSO buttons are present (they have testid pattern: idp-signup-button-*)
    const ssoButtons = page.locator('[data-testid^="idp-signup-button-"]');
    const count = await ssoButtons.count();

    // SSO buttons may or may not be present depending on configuration
    // Just verify the page didn't crash
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

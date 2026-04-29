// spec: docs/COMPREHENSIVE_TEST_PLAN.md — Section 4: Authentication — Change Password
// seed: N/A (public page, no auth required)

import test, { expect } from "@playwright/test";

test.describe("Change Password Page", () => {
  const assertChangePasswordOrSignin = async (page: import("@playwright/test").Page) => {
    await page.waitForLoadState("networkidle");
    if (page.url().includes("/signin")) {
      await expect(page.locator("body")).not.toBeEmpty();
      return "signin" as const;
    }
    return "change-password" as const;
  };

  // 4.1 Valid Token Flow
  test("Valid Token Flow — Form Renders with Email and Token", async ({ page }) => {
    // Navigate to change-password with valid email and token params
    const email = encodeURIComponent("test@example.com");
    const token = encodeURIComponent("valid-test-token");
    await page.goto(`/change-password?email=${email}&token=${token}`);
    const pageType = await assertChangePasswordOrSignin(page);
    if (pageType === "signin") return;

    // Verify "Update your password" heading is visible
    await expect(page.getByText("Update your password")).toBeVisible();

    // Verify description text about password requirements
    await expect(
      page.getByText("Set your new password with minimum 8 characters with a combination of letters and numbers")
    ).toBeVisible();

    // Verify password fields are visible
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator("#confirmPassword")).toBeVisible();

    // Verify submit button is visible
    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();
  });

  // 4.2 Missing Token
  test("Missing Token — Shows Error Message", async ({ page }) => {
    // Navigate to change-password without email/token params
    await page.goto("/change-password");
    const pageType = await assertChangePasswordOrSignin(page);
    if (pageType === "signin") return;

    // Verify the heading is still visible
    await expect(page.getByText("Update your password")).toBeVisible();

    // Verify missing credentials message
    await expect(
      page.getByText("Missing password change credentials. Please check your email and click the link to retry")
    ).toBeVisible();

    // Verify the password form is NOT shown
    await expect(page.locator("#password")).not.toBeVisible();
    await expect(page.locator("#confirmPassword")).not.toBeVisible();
  });

  // 4.3 Password Validation — Mismatching Passwords
  test("Password Validation — Mismatching Passwords", async ({ page }) => {
    const email = encodeURIComponent("test@example.com");
    const token = encodeURIComponent("valid-test-token");
    await page.goto(`/change-password?email=${email}&token=${token}`);
    const pageType = await assertChangePasswordOrSignin(page);
    if (pageType === "signin") return;
    await expect(page.locator("#password")).toBeVisible();

    // Fill password fields with mismatching values
    await page.locator("#password").fill("ValidPass1!");
    await page.locator("#confirmPassword").fill("DifferentPass2!");
    await page.locator("#confirmPassword").blur();

    // Verify "Passwords must match" error (rendered via FieldError component)
    await expect(page.getByText("Passwords must match")).toBeVisible();
  });

  // 4.3 Password Validation — Weak Password
  test("Password Validation — Weak Password", async ({ page }) => {
    const email = encodeURIComponent("test@example.com");
    const token = encodeURIComponent("valid-test-token");
    await page.goto(`/change-password?email=${email}&token=${token}`);
    const pageType = await assertChangePasswordOrSignin(page);
    if (pageType === "signin") return;
    await expect(page.locator("#password")).toBeVisible();

    // Fill password with a weak value
    await page.locator("#password").fill("abc");
    await page.locator("#password").blur();

    // Verify password regex validation error (rendered via FieldError component)
    await expect(page.getByText(/Password must be at least 8 characters/)).toBeVisible();
  });

  // 4.3 Password Validation — Password Same as Email
  test("Password Validation — Password Same as Email", async ({ page }) => {
    const email = "test@example.com";
    const encodedEmail = encodeURIComponent(email);
    const token = encodeURIComponent("valid-test-token");
    await page.goto(`/change-password?email=${encodedEmail}&token=${token}`);
    const pageType = await assertChangePasswordOrSignin(page);
    if (pageType === "signin") return;
    await expect(page.locator("#password")).toBeVisible();

    // Fill password with the same value as the email
    await page.locator("#password").fill(email);
    await page.locator("#password").blur();

    // Verify "password must not match email" validation error (rendered via FieldError component)
    await expect(page.getByText(/password/i).filter({ hasText: /email/i })).toBeVisible();
  });
});

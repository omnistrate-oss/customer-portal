import { test, expect } from "test-fixtures/har-test";
import { PageURLs } from "page-objects/pages";
import { ResetPasswordPage } from "page-objects/reset-password-page";

test.describe("Reset Password Page", () => {
  let resetPasswordPage: ResetPasswordPage;

  test.beforeEach(async ({ page }) => {
    test.skip(process.env.ENVIRONMENT_TYPE !== "PROD", "Reset Password Page is not available in non-prod environments");

    resetPasswordPage = new ResetPasswordPage(page);
    await resetPasswordPage.navigate();
  });

  test("Overall Structure and Elements", async ({ page }) => {
    const pageElements = resetPasswordPage.pageElements;
    await expect(page).toHaveTitle(pageElements.title);
    await expect(page.locator("h1")).toContainText(pageElements.heading);
  });

  test("Form Validation", async ({ page }) => {
    const dataTestIds = resetPasswordPage.dataTestIds,
      pageElements = resetPasswordPage.pageElements;

    await page.getByTestId(dataTestIds.submitButton).click();
    await expect(page.locator("#email-helper-text")).toContainText(pageElements.emailRequiredText);

    // Enter Invalid Email
    await page.getByTestId(dataTestIds.emailInput).fill("invalid-email");
    await page.locator("h1").click(); // Click Anywhere to Trigger Validation
    await expect(page.locator("#email-helper-text")).toContainText(pageElements.invalidEmailText);
  });

  test("Reset Password", async ({ page }) => {
    const dataTestIds = resetPasswordPage.dataTestIds,
      pageElements = resetPasswordPage.pageElements;

    await page.getByTestId(dataTestIds.emailInput).fill(process.env.USER_EMAIL!);
    await page.getByTestId(dataTestIds.submitButton).click();

    // Check Success Message
    await expect(page.locator("h1")).toContainText(pageElements.successHeading);
    await expect(page.getByTestId(dataTestIds.goToLoginButton)).toHaveAttribute("href", PageURLs.signin);

    // Click on Try Again
    await page.getByText("Try again").click();
    await expect(page.locator("h1")).toContainText(pageElements.heading);
    await expect(page.getByTestId(dataTestIds.emailInput)).toBeVisible();
  });
});

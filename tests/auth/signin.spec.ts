import test, { expect } from "@playwright/test";
import { getIdentityProviderButtonLabel } from "app/(public)/(main-image)/signin/utils";
import { PageURLs } from "page-objects/pages";
import { SigninPage } from "page-objects/signin-page";
import { GlobalStateManager } from "test-utils/global-state-manager";
import { ProviderAPIClient } from "test-utils/provider-api-client";

test.describe("Signin Page", () => {
  let signinPage: SigninPage;

  test.beforeEach(async ({ page }) => {
    signinPage = new SigninPage(page);
    await signinPage.navigate();
  });

  test("Email Field Validation", async ({ page }) => {
    const dataTestIds = signinPage.dataTestIds;
    await expect(page.getByTestId(dataTestIds.emailInput)).toBeVisible();
    await page.getByTestId(dataTestIds.emailInput).fill("invalid-email");
    await page.getByTestId(dataTestIds.nextButton).click();
    await expect(page.locator("#email-helper-text")).toContainText(signinPage.pageElements.invalidEmailText);
  });

  test("Login Option Elements", async ({ page }) => {
    await signinPage.goToLoginOptionsStep();

    //check that the other sign in options button is visible
    await expect(page.getByTestId(signinPage.dataTestIds.otherSignInOptionsButton)).toBeVisible();
    await page.getByTestId(signinPage.dataTestIds.otherSignInOptionsButton).click();
    if (process.env.DISABLE_PASSWORD_LOGIN !== "true") {
      //check that the password login button is visible
      await expect(page.getByTestId(signinPage.dataTestIds.passwordLoginButton)).toBeVisible();
      page.getByTestId(signinPage.dataTestIds.passwordLoginButton).click();

      // Check Forgot Password and Create Account Links
      if (process.env.ENVIRONMENT_TYPE === "PROD") {
        await expect(page.getByRole("link", { name: "Forgot Password" })).toHaveAttribute(
          "href",
          PageURLs.resetPassword
        );
        await expect(page.getByRole("link", { name: "Sign Up" })).toHaveAttribute("href", PageURLs.signup);
      } else {
        await expect(page.getByRole("link", { name: "Forgot Password" })).not.toBeVisible();
        await expect(page.getByRole("link", { name: "New to Omnistrate? Sign Up" })).not.toBeVisible();
      }

      //check that the email input is disabled
      await expect(page.getByTestId(signinPage.dataTestIds.emailInput)).toBeDisabled();
      //check that the password input is visible
      await expect(page.getByTestId(signinPage.dataTestIds.passwordInput)).toBeVisible();
      //test password required validation
      await page.getByTestId(signinPage.dataTestIds.passwordInput).fill("");
      await page.getByTestId(signinPage.dataTestIds.passwordInput).blur();

      await expect(page.locator("#password-helper-text")).toContainText(signinPage.pageElements.passwordRequiredText);
    } else {
      await expect(page.getByTestId(signinPage.dataTestIds.passwordLoginButton)).toBeHidden();
    }
  });

  test("Login", async ({ page }) => {
    await signinPage.signInWithPassword();

    // Wait for Instances Page to Load
    await page.waitForURL(PageURLs.instances);
  });

  test("Forgot Password Action", async ({ page }) => {
    const dataTestIds = signinPage.dataTestIds;
    await signinPage.goToPasswordLoginStep();
    // Check Forgot Password Link
    if (process.env.ENVIRONMENT_TYPE === "PROD") {
      await expect(page.getByRole("link", { name: "Forgot Password" })).toHaveAttribute("href", PageURLs.resetPassword);
      await page.getByRole("link", { name: "Forgot Password" }).click();
      //heading should be visible
      await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
      await page.getByTestId(dataTestIds.emailInput).fill(process.env.USER_EMAIL!);
      await page.getByTestId(dataTestIds.resetPasswordSubmitButton).click();
      // Check for success message
      await expect(page.getByRole("heading", { name: "Check Your Email for a Password Reset Link" })).toBeVisible();
    } else {
      await expect(page.getByRole("link", { name: "Forgot Password" })).not.toBeVisible();
    }
  });

  test("Cookie Settings Banner", async ({ page }) => {
    const dataTestIds = signinPage.dataTestIds,
      pageElements = signinPage.pageElements;

    await expect(page.getByTestId(dataTestIds.cookieConsentBanner)).toBeVisible();
    await expect(page.getByTestId(dataTestIds.cookieConsentBanner)).toContainText(pageElements.cookieConsentText);

    // Click on Allow analytics
    await expect(page.getByRole("link", { name: pageElements.cookiePolicyText })).toHaveAttribute(
      "href",
      PageURLs.cookiePolicy
    );
    await page.getByRole("button", { name: "Allow analytics" }).click();
    await expect(page.getByTestId(dataTestIds.cookieConsentBanner)).not.toBeVisible();

    // Click on Cookie Settings Text
    await page.getByText("Cookie Settings").click();
    await expect(page.getByTestId(dataTestIds.cookieConsentBanner)).toBeVisible();

    // Click on Allow Necessary
    await page.getByRole("button", { name: "Allow necessary" }).click();
    await expect(page.getByTestId(dataTestIds.cookieConsentBanner)).not.toBeVisible();
  });

  // check that the identity providers buttons are visible based on the email domain
  test("Identity Provider Buttons", async ({ page }) => {
    const apiClient = new ProviderAPIClient();

    const identityProviders = await apiClient.getIdentityProviders();
    const dataTestIds = signinPage.dataTestIds;

    await signinPage.goToLoginOptionsStep();

    // Check that the other sign in options button is visible
    //get the email input from the email field
    const emailInput = await page.getByTestId(dataTestIds.emailInput).inputValue();
    const emailDomain = emailInput.split("@")[1] || "";

    const domainFilteredIdps = identityProviders.filter((idp) => {
      if (idp.emailIdentifiers === undefined || idp.emailIdentifiers === "") return true;

      const emailIdentifiersList = idp.emailIdentifiers.split(",").map((identifier) => identifier.trim());

      return emailIdentifiersList.some((identifier) => {
        return identifier === emailDomain;
      });
    });

    if (domainFilteredIdps.length > 0) {
      //Check that the other sign in options button is visible
      await expect(page.getByTestId(signinPage.dataTestIds.otherSignInOptionsButton)).toBeVisible();
      await page.getByTestId(signinPage.dataTestIds.otherSignInOptionsButton).click();
      //check that a button for each identity provider is visible
      for (const idp of domainFilteredIdps) {
        const buttonLabel = getIdentityProviderButtonLabel(idp);
        await expect(page.getByRole("button", { name: buttonLabel })).toBeVisible();
      }
    }
  });

  test("Identity Provider Redirect", async ({ page }) => {
    const state = "idp-auth-state";
    const identityProviderName = "Test Identity Provider";

    const authState = {
      identityProvider: identityProviderName,
      nonce: state,
    };

    const encodedLocalAuthState = Buffer.from(JSON.stringify(authState), "utf8").toString("base64");

    await page.evaluate((encodedLocalAuthState) => {
      sessionStorage.setItem("authState", encodedLocalAuthState);
    }, encodedLocalAuthState);

    //get userToken the global state manager
    const userToken = GlobalStateManager.getToken("user");

    // intercept the request to the identity provider auth endpoint "/api/sign-in-with-idp
    await page.route("**/api/sign-in-with-idp", async (route) => {
      try {
        // Return mock successful response
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            jwtToken: userToken,
          }),
        });
      } catch {
        console.log("Error in route handler");
      }
    });
    await page.waitForTimeout(2000);

    await page.goto(`/idp-auth?state=${state}&code=test-code`);

    //expect page to have redirected to the instances page
    await expect(page).toHaveURL(PageURLs.instances, { timeout: 10000 });
  });
});

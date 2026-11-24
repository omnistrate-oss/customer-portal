import type { Locator, Page } from "@playwright/test";
import { getIdentityProviderButtonLabel } from "app/(public)/(main-image)/signin/utils";
import { PageURLs } from "page-objects/pages";
import { SigninPage } from "page-objects/signin-page";
import { SignupPage } from "page-objects/signup-page";
import { expect, test } from "test-fixtures/har-test";
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

    // Click on Accept All
    await expect(page.getByRole("link", { name: pageElements.cookiePolicyText })).toHaveAttribute(
      "href",
      PageURLs.cookiePolicy
    );
    await page.getByRole("button", { name: "Accept All" }).click();
    await expect(page.getByTestId(dataTestIds.cookieConsentBanner)).not.toBeVisible();

    // Click on Cookie Settings Text
    await page.getByText("Cookie Settings").click();
    await expect(page.getByTestId(dataTestIds.cookieConsentBanner)).toBeVisible();

    // Click on Reject All
    await page.getByRole("button", { name: "Reject All" }).click();
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

    // Obtain a fresh session independently of user-setup, then let the callback
    // install all auth cookies, including the client-readable signed-in indicator.
    const signinResponse = await page.request.post("/api/signin", {
      data: { email: process.env.USER_EMAIL!, password: process.env.USER_PASSWORD! },
    });
    expect(signinResponse.status()).toBe(200);
    await page.context().clearCookies();

    await page.route("**/api/sign-in-with-idp", async (route) => {
      await route.fulfill({ response: signinResponse, body: JSON.stringify({}) });
    });

    await page.goto(`/idp-auth?state=${state}&code=test-code`);

    //expect page to have redirected to the instances page
    await expect(page).toHaveURL(PageURLs.instances, { timeout: 10000 });
  });
});

test.describe("Provider API authentication", () => {
  const invalidSignatureToken = [
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url"),
    Buffer.from(
      JSON.stringify({
        exp: Math.floor(Date.now() / 1000) - 60,
        userID: "user-auth-regression",
        organizationID: "org-auth-regression",
        serviceProviderID: "org-auth-regression",
      })
    ).toString("base64url"),
    Buffer.alloc(32).toString("base64url"),
  ].join(".");

  const invalidSessions = [
    { name: "missing", cookie: "omnistrate_refresh_token=invalid-refresh" },
    { name: "malformed", cookie: "omnistrate_refresh_token=invalid-refresh; omnistrate_token=malformed-jwt" },
    {
      name: "invalid-signature",
      cookie: `omnistrate_refresh_token=invalid-refresh; omnistrate_token=${invalidSignatureToken}`,
    },
    {
      name: "newline-containing",
      cookie: "omnistrate_refresh_token=invalid-refresh; omnistrate_token=invalid%0Acredential",
    },
    {
      name: "carriage-return-containing",
      cookie: "omnistrate_refresh_token=invalid-refresh; omnistrate_token=invalid%0Dcredential",
    },
    {
      name: "unicode-containing",
      cookie: "omnistrate_refresh_token=invalid-refresh; omnistrate_token=%E2%82%AC",
    },
  ];

  for (const endpoint of ["resources", "version-sets", "cloud-providers", "product-tier-custom-metrics"]) {
    for (const session of invalidSessions) {
      test(`${endpoint} rejects ${session.name} tokens with 401`, async ({ request }) => {
        const response = await request.get(`/api/${endpoint}`, {
          params: { serviceId: "s-auth-regression", productTierId: "pt-auth-regression" },
          // A refresh hint lets the page proxy defer auth to the API route.
          // Neither cookie is a real credential; the route must reject this session.
          headers: { Cookie: session.cookie },
          maxRedirects: 0,
        });

        expect(response.status()).toBe(401);
        expect(await response.json()).toEqual({ message: "Not authenticated" });
      });
    }
  }
});

test.describe("Responsive Auth Layout", () => {
  const viewports = [
    { name: "mobile", width: 360, height: 740, showsHero: false },
    { name: "tablet", width: 768, height: 1024, showsHero: false },
    { name: "desktop", width: 1440, height: 900, showsHero: true },
  ];

  const getHorizontalOverflow = (page: Page) =>
    page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

  const expectWithinViewport = async (locator: Locator, viewportWidth: number) => {
    await expect(locator).toBeVisible();
    const box = await locator.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewportWidth);
    }
  };

  const dismissCookieBanner = async (page: Page, signinPage: SigninPage) => {
    const banner = page.getByTestId(signinPage.dataTestIds.cookieConsentBanner);
    await expect(banner).toBeVisible();
    await page.getByRole("button", { name: "Accept All" }).click();
    await expect(banner).toBeHidden();
  };

  for (const viewport of viewports) {
    test.describe(`${viewport.name} (${viewport.width}px)`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } });

      test("Sign-in page fits the viewport", async ({ page }) => {
        const signinPage = new SigninPage(page);
        const dataTestIds = signinPage.dataTestIds;
        await signinPage.navigate();

        const heroPanel = page.getByTestId(dataTestIds.heroPanel);
        if (viewport.showsHero) {
          await expect(heroPanel).toBeVisible();
        } else {
          await expect(heroPanel).toBeHidden();
        }
        await expectWithinViewport(page.getByTestId(dataTestIds.emailInput), viewport.width);
        expect(await getHorizontalOverflow(page)).toBeLessThanOrEqual(0);

        await dismissCookieBanner(page, signinPage);
        await page.getByTestId(dataTestIds.emailInput).fill(process.env.USER_EMAIL ?? "user@example.com");
        await page.getByTestId(dataTestIds.nextButton).click();

        await expect(page.getByTestId(dataTestIds.emailInput)).toBeDisabled();

        // The login method is chosen in an effect, so wait for its final controls before measuring.
        const loginButton = page.getByTestId(dataTestIds.loginButton);
        const idpLoginButtons = page.locator(`[data-testid^="${dataTestIds.idpLoginButtonPrefix}"]`);
        const noLoginMethodsMessage = page.getByTestId(dataTestIds.noLoginMethodsMessage);
        await expect(loginButton.or(idpLoginButtons.first()).or(noLoginMethodsMessage)).toBeVisible();

        await expectWithinViewport(page.getByTestId(dataTestIds.emailInput), viewport.width);
        if (await loginButton.isVisible()) {
          await expectWithinViewport(page.getByTestId(dataTestIds.passwordInput), viewport.width);
          await expectWithinViewport(loginButton, viewport.width);
        } else if (await noLoginMethodsMessage.isVisible()) {
          await expectWithinViewport(noLoginMethodsMessage, viewport.width);
        } else {
          for (const idpButton of await idpLoginButtons.all()) {
            if (await idpButton.isVisible()) {
              await expectWithinViewport(idpButton, viewport.width);
            }
          }
        }
        const otherOptionsButton = page.getByTestId(dataTestIds.otherSignInOptionsButton);
        if (await otherOptionsButton.isVisible()) {
          await expectWithinViewport(otherOptionsButton, viewport.width);
        }
        expect(await getHorizontalOverflow(page)).toBeLessThanOrEqual(0);
      });

      test("Sign-up page fits the viewport", async ({ page }) => {
        test.skip(process.env.ENVIRONMENT_TYPE !== "PROD", "Sign-up page is not available in non-prod environments");

        const signinPage = new SigninPage(page);
        const signupPage = new SignupPage(page);
        const signupTestIds = signupPage.dataTestIds;
        await signupPage.navigate();

        const heroPanel = page.getByTestId(signupTestIds.heroPanel);
        if (viewport.showsHero) {
          await expect(heroPanel).toBeVisible();
        } else {
          await expect(heroPanel).toBeHidden();
        }
        const emailInput = page.getByTestId(signupTestIds.emailInput);
        await expectWithinViewport(emailInput, viewport.width);
        expect(await getHorizontalOverflow(page)).toBeLessThanOrEqual(0);

        await dismissCookieBanner(page, signinPage);
        await emailInput.fill("new-user@example.com");
        await page.getByTestId(signupTestIds.formPanel).getByTestId(signupTestIds.nextButton).click();

        await expect(emailInput).toBeDisabled();
        await expectWithinViewport(emailInput, viewport.width);

        // Password sign-up is off when DISABLE_PASSWORD_LOGIN is set or an IDP matches the email domain.
        const isPasswordLoginEnabled = process.env.DISABLE_PASSWORD_LOGIN?.toLowerCase() !== "true";
        const nameInput = page.getByTestId(signupTestIds.nameInput);
        const ssoOnlyEmailField = page.getByTestId(signupTestIds.ssoOnlyEmailField);
        await expect(nameInput.or(ssoOnlyEmailField)).toBeVisible();
        if (await nameInput.isVisible()) {
          expect(isPasswordLoginEnabled).toBe(true);
          await expectWithinViewport(nameInput, viewport.width);
          await expectWithinViewport(page.getByTestId(signupTestIds.createAccountButton), viewport.width);
        } else {
          await expectWithinViewport(ssoOnlyEmailField, viewport.width);
          const idpButtons = page.locator(`[data-testid^="${signupTestIds.idpButtonPrefix}"]`);
          for (const idpButton of await idpButtons.all()) {
            if (await idpButton.isVisible()) {
              await expectWithinViewport(idpButton, viewport.width);
            }
          }
        }
        expect(await getHorizontalOverflow(page)).toBeLessThanOrEqual(0);
      });
    });
  }
});

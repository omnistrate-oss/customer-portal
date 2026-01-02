import { Page } from "@playwright/test";

import { getSigninRoute } from "src/utils/routes";

export class SigninPage {
  page: Page;

  dataTestIds = {
    emailInput: "email-input",
    passwordInput: "password-input",
    loginButton: "login-button",
    forgotPasswordLink: "forgot-password-link",
    signupLink: "signup-link",
    googleSigninButton: "google-signin-button",
    githubSigninButton: "github-signin-button",
    cookieConsentBanner: "cookie-consent-banner",
    nextButton: "next-button",
    otherSignInOptionsButton: "sign-in-options-button",
    passwordLoginButton: "password-login-button",
    resetPasswordSubmitButton: "submit-button",
  };

  pageElements = {
    heading: "Login to your account",
    title: "Sign In",
    emailRequiredText: "Email is required",
    passwordRequiredText: "Password is required",
    invalidEmailText: "Invalid email address",
    cookieConsentText: "We use essential cookies. Analytics cookies are optional.",

    termsText: "Terms & Conditions",
    privacyPolicyText: "Privacy Policy",
    cookiePolicyText: "Cookie Policy",
  };

  constructor(page: Page) {
    this.page = page;
  }

  async navigate() {
    await this.page.goto(getSigninRoute());
  }

  async goToLoginOptionsStep() {
    await this.navigate();
    await this.page.getByTestId(this.dataTestIds.emailInput).fill(process.env.USER_EMAIL!);
    await this.page.getByTestId(this.dataTestIds.nextButton).click();
  }

  async goToPasswordLoginStep() {
    const dataTestIds = this.dataTestIds;

    // Navigate to the Signin Page
    await this.goToLoginOptionsStep();

    if (await this.page.getByTestId(dataTestIds.otherSignInOptionsButton).isVisible()) {
      await this.page.getByTestId(dataTestIds.otherSignInOptionsButton).click();
      if (process.env.DISABLE_PASSWORD_LOGIN !== "true") {
        await this.page.getByTestId(dataTestIds.passwordLoginButton).click();
      }
    }
  }

  async signInWithPassword() {
    const dataTestIds = this.dataTestIds;

    // Navigate to the Signin Page
    await this.goToPasswordLoginStep();
    if (process.env.DISABLE_PASSWORD_LOGIN !== "true") {
      // Fill the Password Field
      await this.page.getByTestId(dataTestIds.passwordInput).fill(process.env.USER_PASSWORD!);
      await this.page.getByTestId(dataTestIds.loginButton).click();
    }
  }

  async allowCookies() {
    if (await this.page.getByTestId(this.dataTestIds.cookieConsentBanner).isVisible()) {
      await this.page.getByRole("button", { name: "Allow all" }).click();
    } else {
      await this.page.getByText("Cookie Settings").click();
      await this.page.getByRole("button", { name: "Allow all" }).click();
    }
  }
}

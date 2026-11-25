import { Page } from "@playwright/test";

import { authLayoutTestIds } from "src/constants/testIds/auth-layout";
import { signupPageTestIds } from "src/constants/testIds/signup-page";
import { getSignupRoute } from "src/utils/routes";

export class SignupPage {
  page: Page;

  dataTestIds = {
    emailInput: signupPageTestIds.emailInput,
    nextButton: signupPageTestIds.nextButton,
    nameInput: signupPageTestIds.nameInput,
    createAccountButton: signupPageTestIds.createAccountButton,
    ssoOnlyEmailField: signupPageTestIds.ssoOnlyEmailField,
    idpButtonPrefix: signupPageTestIds.idpButtonPrefix,
    heroPanel: authLayoutTestIds.heroPanel,
    formPanel: authLayoutTestIds.formPanel,
  };

  constructor(page: Page) {
    this.page = page;
  }

  async navigate() {
    await this.page.goto(getSignupRoute());
  }
}

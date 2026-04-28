import { Page } from "@playwright/test";
import { BackendError } from "test-utils/backend-error";

import { PageURLs } from "./pages";

export class CloudAccountsPage {
  page: Page;

  dataTestIds = {
    serviceNameSelect: "service-name-select",

    refreshButton: "refresh-button",
    deleteActionButton: "delete-action-button",
    actionsMenu: "actions-select",
    createButton: "create-button",

    // Form Elements
    awsAccountIdInput: "aws-account-id-input",
    gcpProjectIdInput: "gcp-project-id-input",
    gcpProjectNumberInput: "gcp-project-number-input",
    submitButton: "submit-button",

    // Instructions Dialog
    closeInstructionsButton: "close-instructions-button",
  };

  pageElements = {
    instructionsDialogTitle: "Account Configuration Instructions",
  };

  constructor(page: Page) {
    this.page = page;
  }

  async navigate() {
    await this.page.goto(PageURLs.cloudAccounts);
  }

  /**
   * Dismisses any blocking overlays (Next.js dev overlay, MUI dialogs, etc.)
   * that might intercept pointer events and cause click failures.
   */
  async dismissBlockingOverlays() {
    await this.page.evaluate(() => {
      document.querySelectorAll("nextjs-portal").forEach((el) => el.remove());
    });
    await this.page.keyboard.press("Escape");
    await this.page.waitForTimeout(300);
  }

  async waitForStatus(
    instanceId: string,
    targetStatus: string,
    logPrefix: string,
    options = {
      timeout: 2 * 60 * 1000, // 2 Minutes Max Timeout
      pollingInterval: 10000, // 10 Seconds
    }
  ) {
    const startTime = Date.now();

    while (Date.now() - startTime < options.timeout) {
      await this.dismissBlockingOverlays();
      await this.page.getByTestId(this.dataTestIds.refreshButton).click();
      await this.page.waitForLoadState("networkidle");

      // The Status is Inside Row Element with Test ID of the Instance ID
      const row = await this.page.getByTestId(instanceId);
      const status = await row.getByTestId("status").textContent();
      console.log(logPrefix, `Cloud Account ${instanceId} Status: ${status}`);

      if (status === targetStatus) {
        return true;
      }

      if (status === "Failed" && targetStatus !== "Failed") {
        throw new BackendError(`Cloud Account ${instanceId} failed to reach status ${targetStatus}`);
      }

      await this.page.waitForTimeout(options.pollingInterval);
    }

    throw new BackendError(`Timeout waiting for cloud account ${instanceId} to reach status ${targetStatus}`);
  }

  async selectCloudAccount(instanceId: string) {
    const row = this.page.getByTestId(instanceId);
    await row.getByRole("checkbox").click();
  }

  async deleteCloudAccount(instanceId: string) {
    await this.selectCloudAccount(instanceId);
    await this.page.getByTestId(this.dataTestIds.actionsMenu).click();
    await this.page.getByTestId(this.dataTestIds.deleteActionButton).click();

    await this.page.locator("#confirmationText").fill("deleteme");
    await this.page.getByTestId("delete-submit-button").click();
  }
}

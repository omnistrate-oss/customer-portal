import { Page } from "@playwright/test";
import { PageURLs } from "./pages";

export class CloudAccountsPage {
  page: Page;

  dataTestIds = {
    serviceNameSelect: "service-name-select",

    refreshButton: "refresh-button",
    deleteButton: "delete-button",
    disconnectButton: "disconnect-button",
    connectButton: "connect-button",
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
        throw new Error(`Cloud Account ${instanceId} failed to reach status ${targetStatus}`);
      }

      await this.page.waitForTimeout(options.pollingInterval);
    }

    throw new Error(`Timeout waiting for cloud account ${instanceId} to reach status ${targetStatus}`);
  }

  async selectCloudAccount(instanceId: string) {
    const row = this.page.getByTestId(instanceId);
    await row.getByRole("checkbox").click();
  }

  async deleteCloudAccount(instanceId: string) {
    await this.selectCloudAccount(instanceId);
    await this.page.getByTestId(this.dataTestIds.deleteButton).click();

    await this.page.locator("#deleteme").fill("deleteme");
    await this.page.getByTestId("delete-submit-button").click();
  }
}

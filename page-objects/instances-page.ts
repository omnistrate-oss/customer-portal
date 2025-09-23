import { Page } from "@playwright/test";
import { UserAPIClient } from "test-utils/user-api-client";

import { PageURLs } from "./pages";

export class InstancesPage {
  page: Page;
  apiClient = new UserAPIClient();

  dataTestIds = {
    refreshButton: "refresh-button",
    stopButton: "stop-button",
    startButton: "start-button",
    modifyButton: "modify-button",
    deleteButton: "delete-button",
    createButton: "create-button",
    actionsMenu: "actions-select",
    rebootButton: "reboot-button",
    restoreButton: "restore-button",
    addCapacityButton: "add-capacity-button",
    removeCapacityButton: "remove-capacity-button",
    generateTokenButton: "generate-token-button",

    // Form Elements
    serviceNameSelect: "service-name-select",
    resourceTypeSelect: "resource-type-select",
    regionSelect: "region-select",
    awsCard: "aws-card",
    gcpCard: "gcp-card",
    azureCard: "azure-card",
    cloudAccountSelect: "cloud_provider_account_config_id-select",
    submitButton: "submit-button",

    // Launching Instance Dialog
    instanceId: "instance-id",
    closeInstructionsButton: "close-instructions-button",

    // Capacity Dialog
    capacityInput: "capacity-input",
    capacitySubmitButton: "capacity-submit-button",
  };

  pageElements = {
    launchingInstanceDialogTitle: "Launching Your Instance",
  };

  constructor(page: Page) {
    this.page = page;
  }

  async navigate() {
    await this.page.goto(PageURLs.instances);
  }

  async waitForStatus(
    instanceId: string,
    targetStatus: string,
    logPrefix: string,
    options = {
      timeout: 10 * 60 * 1000, // 10 Minutes Max Timeout
      pollingInterval: 15000, // 15 Seconds
    }
  ) {
    const startTime = Date.now();

    while (Date.now() - startTime < options.timeout) {
      await this.page.getByTestId(this.dataTestIds.refreshButton).click();
      await this.page.waitForLoadState("networkidle");

      // The Status is Inside Row Element with Test ID of the Instance ID
      const row = await this.page.getByTestId(instanceId);
      const status = await row.getByTestId("status").textContent();
      console.log(logPrefix, `Instance ${instanceId} Status: ${status}`);

      if (status === targetStatus) {
        return true;
      }

      if (status === "Failed" && targetStatus !== "Failed") {
        throw new Error(`Instance ${instanceId} failed to reach status ${targetStatus}`);
      }

      await this.page.waitForTimeout(options.pollingInterval);
    }

    throw new Error(`Timeout waiting for instance ${instanceId} to reach status ${targetStatus}`);
  }

  async waitForDelete(
    instanceId: string,
    logPrefix: string,
    options = {
      timeout: 10 * 60 * 1000, // 10 Minutes Max Timeout
      pollingInterval: 15000, // 15 Seconds
    }
  ) {
    const startTime = Date.now();

    while (Date.now() - startTime < options.timeout) {
      await this.page.getByTestId(this.dataTestIds.refreshButton).click();
      await this.page.waitForLoadState("networkidle");

      const row = await this.page.getByTestId(instanceId);

      // Check if the Row is Visible
      const isVisible = await row.isVisible();
      console.log(logPrefix, `Instance ${instanceId} Visibility: ${isVisible}`);

      if (!isVisible) {
        return true;
      }

      await this.page.waitForTimeout(options.pollingInterval);
    }

    throw new Error(`Timeout waiting for instance ${instanceId} to be deleted`);
  }

  async navigateToInstanceDetails(instanceId: string) {
    const row = this.page.getByTestId(instanceId);
    await row.getByText(instanceId).click();
  }

  async selectInstance(instanceId: string) {
    const row = this.page.getByTestId(instanceId);
    await row.getByRole("checkbox").click();
  }

  async deleteInstance(instanceId: string) {
    await this.selectInstance(instanceId);
    await this.page.getByTestId(this.dataTestIds.deleteButton).click();
    await this.page.locator("#confirmationText").fill("deleteme");
    await this.page.getByRole("button", { name: "Delete" }).click();
  }

  async stopInstance(instanceId: string) {
    await this.selectInstance(instanceId);
    await this.page.getByTestId(this.dataTestIds.stopButton).click();
    await this.page.locator("#confirmationText").fill("stop");
    await this.page.getByRole("button", { name: "Stop" }).click();
  }

  async startInstance(instanceId: string) {
    await this.selectInstance(instanceId);
    await this.page.getByTestId(this.dataTestIds.startButton).click();
  }

  async rebootInstance(instanceId: string) {
    await this.selectInstance(instanceId);
    await this.page.getByTestId(this.dataTestIds.actionsMenu).click();
    await this.page.getByTestId(this.dataTestIds.rebootButton).click();

    await this.page.locator("#confirmationText").fill("reboot");
    await this.page.getByRole("button", { name: "Reboot" }).click();
  }

  async changeCapacity(type: "add" | "remove", instanceId: string, newCapacity: number) {
    await this.selectInstance(instanceId);
    await this.page.getByTestId(this.dataTestIds.actionsMenu).click();
    if (type === "add") {
      await this.page.getByTestId(this.dataTestIds.addCapacityButton).click();
    } else {
      await this.page.getByTestId(this.dataTestIds.removeCapacityButton).click();
    }
    await this.page.getByTestId(this.dataTestIds.capacityInput).fill(newCapacity.toString());
    await this.page.getByTestId(this.dataTestIds.capacitySubmitButton).click();
  }
}

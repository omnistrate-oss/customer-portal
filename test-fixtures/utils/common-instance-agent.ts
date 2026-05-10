import { expect, Page } from "@playwright/test";

export class CommonInstanceAgent {
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async verifyCommonColumns() {
    const columns = [
      "Instance ID",
      "Product Name",
      "Resource Name",
      "Subscription Plan",
      "Lifecycle Status",
      "Health Status",
      "Load",
      "Cloud Provider",
      "Region",
      "Last Modified",
    ];

    for (const column of columns) {
      await expect(this.page.getByRole("columnheader", { name: column })).toBeVisible();
    }
  }

  async applyLifecycleStatusFilter(status: "Running" | "Stopped" | "Failed") {
    await this.page.getByText("Filter").first().click();
    await this.page.getByText("Lifecycle Status").first().click();
    await this.page.getByText(status, { exact: true }).first().click();
    await this.page.getByRole("button", { name: "Apply" }).click();
  }

  async openInstanceDetails(instanceId: string) {
    await this.page.getByTestId(instanceId).getByText(instanceId).click();
  }

  async verifyInstanceDetailsPageLoaded() {
    await expect(this.page.getByRole("button", { name: "Back to list of Deployment Instances" })).toBeVisible();
    await expect(this.page.getByTestId("instance-details-tab")).toBeVisible();
  }
}

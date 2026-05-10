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

  async applyLifecycleStatusFilter(status: string) {
    const normalizedStatus = status.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const filterTrigger = this.page.getByTestId("data-grid-filter-trigger");
    await expect(filterTrigger).toBeVisible();
    await filterTrigger.click();

    const lifecycleFilter = this.page.getByTestId("filter-left-menu-lifecycle-status");
    await expect(lifecycleFilter).toBeVisible();
    await lifecycleFilter.click();

    const statusOption = this.page.getByTestId(`filter-option-${normalizedStatus}`);
    await expect(statusOption).toBeVisible();
    await statusOption.click();

    const applyButton = this.page.getByRole("button", { name: "Apply" });
    await expect(applyButton).toBeVisible();
    await applyButton.click();
  }

  async openInstanceDetails(instanceId: string) {
    const row = this.page.getByTestId(instanceId);
    await expect(row).toBeVisible();
    const instanceLink = row.getByText(instanceId);
    await expect(instanceLink).toBeVisible();
    await instanceLink.click();
  }

  async verifyInstanceDetailsPageLoaded() {
    await expect(this.page.getByRole("button", { name: "Back to list of Deployment Instances" })).toBeVisible();
    await expect(this.page.getByTestId("instance-details-tab")).toBeVisible();
  }
}

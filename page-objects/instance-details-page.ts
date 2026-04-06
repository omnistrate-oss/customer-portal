import { Page } from "@playwright/test";

import { getInstanceDetailsRoute } from "src/utils/routes";

import { dataTestIds, pageElements } from "./constants/instance-details-page";

export class InstanceDetailsPage {
  page: Page;

  dataTestIds = dataTestIds;
  pageElements = pageElements;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(
    serviceId: string,
    servicePlanId: string,
    resourceId: string,
    instanceId: string,
    subscriptionId: string
  ) {
    await this.page.goto(getInstanceDetailsRoute({ serviceId, servicePlanId, resourceId, instanceId, subscriptionId }));
  }

  async waitForMetricsData() {
    await this.page.getByText(this.pageElements.metricsDescription).waitFor({
      state: "visible",
      timeout: 60 * 1000, // 1 Minute
    });
  }

  async waitForLogsData() {
    await this.page.getByText(this.pageElements.liveLogsDescription).waitFor({
      state: "visible",
      timeout: 60 * 1000, // 1 Minute
    });
  }
}

import { expect } from "@playwright/test";
import _ from "lodash";
import { InstanceDetailsPage } from "page-objects/instance-details-page";
import { UserAPIClient } from "test-utils/user-api-client";

import { ResourceInstance } from "src/types/resourceInstance";
import formatDateUTC from "src/utils/formatDateUTC";

export const TestInstanceOverview = async (instanceDetailsPage: InstanceDetailsPage, instance: ResourceInstance) => {
  const page = instanceDetailsPage.page;
  const dataTestIds = instanceDetailsPage.dataTestIds;
  const apiClient = new UserAPIClient();

  // Expect the Instance Overview to be Visible
  await expect(page.getByTestId(dataTestIds.resourceInstanceOverview)).toBeVisible();
  const instanceOverview = page.getByTestId(dataTestIds.resourceInstanceOverview);

  // Expect Instance Region and Status to be Visible
  await expect(instanceOverview.getByText(instance.region || "")).toBeVisible();
  await expect(instanceOverview.getByText(_.capitalize(instance.status))).toBeVisible();

  const subscription = await apiClient.describeSubscription(instance.subscriptionId);

  // Expect Service Name, Product Tier, and Subscription Owner to be Visible
  await expect(instanceOverview.getByText(subscription.serviceName)).toBeVisible();
  await expect(instanceOverview.getByText(subscription.productTierName)).toBeVisible();
  await expect(instanceOverview.getByText(subscription.subscriptionOwnerName)).toBeVisible();
};

export const TestInstanceDetailsTab = async (
  instanceDetailsPage: InstanceDetailsPage,
  instance: ResourceInstance,
  instanceType: "postgres" | "helm"
) => {
  const page = instanceDetailsPage.page;
  const dataTestIds = instanceDetailsPage.dataTestIds.instanceDetails;

  // Check the Instance Details Table
  await expect(page.getByTestId(dataTestIds.deploymentId)).toContainText(instance.id || "");
  await expect(page.getByTestId(dataTestIds.createdAt)).toContainText(formatDateUTC(instance.created_at));
  await expect(page.getByTestId(dataTestIds.modifiedAt)).toContainText(formatDateUTC(instance.last_modified_at));
  await expect(page.getByTestId(dataTestIds.highAvailabilityStatus)).toContainText(
    instance.highAvailability ? "Enabled" : "Disabled"
  );

  // Backup and Auto Scaling Status only for Postgres Type
  if (instanceType === "postgres") {
    await expect(page.getByTestId(dataTestIds.backupsStatus)).toContainText(
      instance.backupStatus?.backupPeriodInHours ? "Enabled" : "Disabled"
    );
    await expect(page.getByTestId(dataTestIds.autoScalingStatus)).toContainText(
      instance.autoscalingEnabled ? "Enabled" : "Disabled"
    );
  }

  if (instanceType === "helm") {
    // Check the License Status Table
    const licenseStatusTable = page.getByTestId(dataTestIds.licenseStatusTable);
    await expect(licenseStatusTable).toBeVisible();

    const license = instance.subscriptionLicense;
    const isExpired = license?.expirationDate ? new Date(license.expirationDate) < new Date() : false;
    await expect(licenseStatusTable.getByText(formatDateUTC(license?.expirationDate))).toBeVisible();
    await expect(licenseStatusTable.getByText(isExpired ? "Expired" : "Active")).toBeVisible();

    // Download the License File
    const downloadPromise = page.waitForEvent("download");
    await licenseStatusTable.getByText("Click Here to download").click();
    const download = await downloadPromise;

    // Check if the File is Downloaded
    const fileName = download.suggestedFilename();
    expect(fileName).toBeTruthy();
  }

  // Check the Output Parameters Table
  const outputParametersTable = page.getByTestId(dataTestIds.outputParametersTable);
  await expect(outputParametersTable).toBeVisible();

  const parameters = Object.values(instance.result_params as Record<string, string>);

  // Handle Password Parameters
  const showButtons = await outputParametersTable.getByText("Show").all();
  for (const button of showButtons) {
    await button.click();
  }

  for (const param of parameters) {
    await expect(outputParametersTable).toContainText(param);
  }
};

export const TestConnectivityTab = async (
  instanceDetailsPage: InstanceDetailsPage,
  instance: ResourceInstance,
  instanceType: "postgres" | "helm"
) => {
  const page = instanceDetailsPage.page;
  const dataTestIds = instanceDetailsPage.dataTestIds,
    connectivityTabIds = instanceDetailsPage.dataTestIds.connectivity;

  await page.getByTestId(dataTestIds.tabs.connectivityTab).click();

  const resources: any = Object.values(instance?.detailedNetworkTopology || {});
  const mainResource = resources.find((resource) => resource.main);

  if (!mainResource) {
    throw new Error("Main resource not found");
  }

  // Check the Connectivity Details Table
  if (instanceType === "postgres") {
    await expect(page.getByTestId(connectivityTabIds.networkType)).toContainText(_.capitalize(instance.network_type));
    for (const node of mainResource.nodes || []) {
      await expect(page.getByTestId(connectivityTabIds.availabilityZones)).toContainText(node.availabilityZone);
    }

    await expect(page.getByTestId(connectivityTabIds.publiclyAccessible)).toContainText(
      mainResource.publiclyAccessible ? "Yes" : "No"
    );

    if (mainResource.privateNetworkCIDR) {
      await expect(page.getByTestId(connectivityTabIds.privateNetworkCIDR)).toContainText(
        mainResource.privateNetworkCIDR
      );
    }
  }

  // Check the Endpoint URL
  if (instanceType === "postgres") {
    await expect(page.getByText(mainResource.clusterEndpoint)).toBeVisible();
  } else {
    await expect(page.getByText(mainResource.additionalEndpoints?.redisCluster?.endpoint)).toBeVisible();
  }
};

export const TestNodesTab = async (instanceDetailsPage: InstanceDetailsPage, instance: ResourceInstance) => {
  const page = instanceDetailsPage.page,
    dataTestIds = instanceDetailsPage.dataTestIds,
    pageElements = instanceDetailsPage.pageElements;

  await page.getByTestId(dataTestIds.tabs.nodesTab).click();
  await expect(page.getByText(pageElements.nodesTableDescription)).toBeVisible();

  // Check the Nodes Table
  const mainResource: any = Object.values(instance?.detailedNetworkTopology || {}).find(
    (resource: any) => resource.main
  );
  if (!mainResource) {
    throw new Error("Main resource not found");
  }

  const nodes = mainResource.nodes || [];
  for (const node of nodes) {
    if (!node.id || !node.status || !node.availabilityZone) {
      console.warn(`Node is missing required properties: ${JSON.stringify(node)}`);
      continue;
    }

    const row = page.getByTestId(node.id);
    await expect(row).toBeVisible();

    await expect(row).toContainText(node.id);
    await expect(row).toContainText(_.capitalize(node.status));
    await expect(row).toContainText(node.availabilityZone);
  }
};

export const TestMetricsTab = async (instanceDetailsPage: InstanceDetailsPage, instance: ResourceInstance) => {
  const page = instanceDetailsPage.page,
    dataTestIds = instanceDetailsPage.dataTestIds,
    pageElements = instanceDetailsPage.pageElements;

  await page.getByTestId(dataTestIds.tabs.metricsTab).click();

  if (instance.status === "RUNNING") {
    await expect(page.getByTestId(dataTestIds.metrics.nodeIdMenu)).toBeVisible();
    await expect(page.getByTestId(dataTestIds.metrics.cpuUsageCard)).toBeVisible();
    await expect(page.getByTestId(dataTestIds.metrics.loadAverageCard)).toBeVisible();
    await expect(page.getByTestId(dataTestIds.metrics.storageCard)).toBeVisible();
    await expect(page.getByTestId(dataTestIds.metrics.totalRamCard)).toBeVisible();
    await expect(page.getByTestId(dataTestIds.metrics.usedRamCard)).toBeVisible();
    await expect(page.getByTestId(dataTestIds.metrics.ramUsageCard)).toBeVisible();
    await expect(page.getByTestId(dataTestIds.metrics.systemUptimeCard)).toBeVisible();
  } else if (instance.status === "STOPPED") {
    await expect(page.getByText(pageElements.stoppedInstanceMetricsMessage)).toBeVisible();
  }
};

export const TestLiveLogsTab = async (instanceDetailsPage: InstanceDetailsPage, instance: ResourceInstance) => {
  const page = instanceDetailsPage.page,
    dataTestIds = instanceDetailsPage.dataTestIds,
    pageElements = instanceDetailsPage.pageElements;

  await page.getByTestId(dataTestIds.tabs.liveLogsTab).click();

  if (instance.status === "RUNNING") {
    await expect(page.getByTestId(dataTestIds.liveLogs.nodeIdMenu)).toBeVisible();
    await expect(page.getByTestId(dataTestIds.liveLogs.logsContainer)).toBeVisible();
    await expect(page.getByTestId(dataTestIds.liveLogs.scrollToTopButton)).toBeVisible();
    await expect(page.getByTestId(dataTestIds.liveLogs.scrollToBottomButton)).toBeVisible();
  } else if (instance.status === "STOPPED") {
    await expect(page.getByText(pageElements.stoppedInstanceLiveLogsMessage)).toBeVisible();
  }
};

export const TestEventsTab = async (instanceDetailsPage: InstanceDetailsPage, instance: ResourceInstance) => {
  const page = instanceDetailsPage.page,
    dataTestIds = instanceDetailsPage.dataTestIds,
    pageElements = instanceDetailsPage.pageElements;

  await page.getByTestId(dataTestIds.tabs.auditLogsTab).click();
  const eventsData = await page.waitForResponse((response) =>
    response.url().includes(`%2Fresource-instance%2F${instance.id}%2Faudit-events`)
  );
  const events = (await eventsData.json()).events;

  // Check the Events Table
  await expect(page.getByText(pageElements.auditLogsTableTitle)).toBeVisible();

  if (events.length === 0) {
    await expect(page.getByText("No events")).toBeVisible();
    return;
  }

  const latestTenEvents = events.slice(0, 10);

  for (const event of latestTenEvents) {
    if (!event.id || !event.eventSource || !event.time) {
      console.warn(`Event is missing required properties: ${JSON.stringify(event)}`);
      continue;
    }

    const row = page.getByTestId(event.id);
    await expect(row).toBeVisible();

    await expect(row).toContainText(event.eventSource);
    await expect(row).toContainText(formatDateUTC(event.time));
  }
};

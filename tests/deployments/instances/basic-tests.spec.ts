import test, { expect } from "@playwright/test";
import { InstanceDetailsPage } from "page-objects/instance-details-page";
import { InstancesPage } from "page-objects/instances-page";
import {
  TestConnectivityTab,
  TestEventsTab,
  TestInstanceDetailsTab,
  TestInstanceOverview,
  TestLiveLogsTab,
  TestMetricsTab,
  TestNodesTab,
} from "test-fixtures/utils/instance-details-tabs";
import { GlobalStateManager } from "test-utils/global-state-manager";

import { ResourceInstance } from "src/types/resourceInstance";

const logPrefix = "Instances -> Basic Tests ->";
test.describe.configure({ mode: "serial" });

test.describe("Instances Page - Basic Lifecycle Tests", () => {
  let instancesPage: InstancesPage,
    instanceDetailsPage: InstanceDetailsPage,
    instance: ResourceInstance,
    instanceId: string;

  test.beforeEach(async ({ page }) => {
    instancesPage = new InstancesPage(page);
    instanceDetailsPage = new InstanceDetailsPage(page);
    await instancesPage.navigate();
    await page.waitForLoadState("networkidle");
  });

  test("Overall Structre and Elements + Create a Postgres DT Instance", async ({ page }) => {
    const dataTestIds = instancesPage.dataTestIds;

    // Expect the Refresh, Stop, Start, Modify, Delete, Create, and Actions Menu to be Visible
    await expect(page.getByTestId(dataTestIds.refreshButton)).toBeVisible();
    await expect(page.getByTestId(dataTestIds.stopButton)).toBeVisible();
    await expect(page.getByTestId(dataTestIds.startButton)).toBeVisible();
    await expect(page.getByTestId(dataTestIds.modifyButton)).toBeVisible();
    await expect(page.getByTestId(dataTestIds.deleteButton)).toBeVisible();
    await expect(page.getByTestId(dataTestIds.createButton)).toBeVisible();
    await expect(page.getByTestId(dataTestIds.actionsMenu)).toBeVisible();

    const date = GlobalStateManager.getDate() || "";
    await page.getByTestId(dataTestIds.createButton).click();

    // Wait for the Form to Load and Click the Service Name Dropdown
    await page.getByTestId(dataTestIds.serviceNameSelect).click();
    await page.getByRole("option", { name: `SaaSBuilder Postgres DT - ${date}` }).click();

    // If the Subscribe Button is Visible, Click it
    const subscribeButton = page.getByTestId("subscribe-button");
    if (await subscribeButton.isVisible()) {
      await subscribeButton.click();
    }

    await page.getByTestId(dataTestIds.gcpCard).click();
    await page.getByTestId(dataTestIds.regionSelect).click();
    await page.getByRole("option", { name: "us-central1" }).click();

    await page.waitForTimeout(5000); // Wait 5 seconds
    await page.getByTestId(dataTestIds.submitButton).click();
    // Wait for the instance ID element to be visible
    await page.getByTestId(dataTestIds.instanceId).waitFor({ state: "visible" });
    instanceId = (await page.getByTestId(dataTestIds.instanceId).textContent()) || "";
    console.log(logPrefix, "Instance ID:", instanceId);

    await page.getByTestId(dataTestIds.closeInstructionsButton).click();
  });

  test("Wait for Running Instance -> Test Running State", async ({ page }) => {
    await instancesPage.waitForStatus(instanceId, "Running", logPrefix);
    await instancesPage.navigateToInstanceDetails(instanceId);

    // Intercept Data from Instance Details Request
    const instanceDetails = await page.waitForResponse((response) =>
      response.url().includes("/api/action?endpoint=%2F2022-09-01-00%2Fresource-instance%2F")
    );

    instance = await instanceDetails.json();
    console.log(logPrefix, "Instance Details:", instance);

    await TestInstanceOverview(instanceDetailsPage, instance);
    await TestInstanceDetailsTab(instanceDetailsPage, instance, "postgres");
    await TestConnectivityTab(instanceDetailsPage, instance, "postgres");
    await TestNodesTab(instanceDetailsPage, instance);
    await TestMetricsTab(instanceDetailsPage, instance);
    await TestLiveLogsTab(instanceDetailsPage, instance);
    await TestEventsTab(instanceDetailsPage, instance);
  });

  test("Stop Instance -> Test Stopped State", async ({ page }) => {
    await instancesPage.stopInstance(instanceId);
    await instancesPage.waitForStatus(instanceId, "Stopped", logPrefix);
    await instancesPage.navigateToInstanceDetails(instanceId);

    // Intercept Data from Instance Details Request
    const instanceDetails = await page.waitForResponse((response) =>
      response.url().includes("/api/action?endpoint=%2F2022-09-01-00%2Fresource-instance%2F")
    );

    instance = await instanceDetails.json();
    console.log(logPrefix, "Instance Details:", instance);

    await TestInstanceOverview(instanceDetailsPage, instance);
    await TestInstanceDetailsTab(instanceDetailsPage, instance, "postgres");
    await TestConnectivityTab(instanceDetailsPage, instance, "postgres");
    await TestNodesTab(instanceDetailsPage, instance);
    await TestMetricsTab(instanceDetailsPage, instance);
    await TestLiveLogsTab(instanceDetailsPage, instance);
    await TestEventsTab(instanceDetailsPage, instance);
  });

  test("Delete Instance", async () => {
    await instancesPage.deleteInstance(instanceId);
    await instancesPage.waitForStatus(instanceId, "Deleting", logPrefix);
  });
});

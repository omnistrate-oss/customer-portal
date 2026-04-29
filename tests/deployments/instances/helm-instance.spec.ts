import test from "@playwright/test";
import { InstancesPage } from "page-objects/instances-page";
import { GlobalStateManager } from "test-utils/global-state-manager";
// import { InstanceDetailsPage } from "page-objects/instance-details-page";
// import {
//   TestConnectivityTab,
//   TestEventsTab,
//   TestInstanceDetailsTab,
//   TestInstanceOverview,
//   TestLiveLogsTab,
//   TestNodesTab,
// } from "test-fixtures/utils/instance-details-tabs";

const logPrefix = "Instances -> Helm Instance Tests ->";
test.describe.configure({ mode: "serial", timeout: 20 * 60 * 1000 });

test.describe("Instances Page - Specialized Tests", () => {
  let instancesPage: InstancesPage,
    //   instanceDetailsPage: InstanceDetailsPage,
    instanceId: string;

  test.beforeEach(async ({ page }) => {
    instancesPage = new InstancesPage(page);
    // instanceDetailsPage = new InstanceDetailsPage(page);
    await instancesPage.navigate();
    await page.waitForLoadState("networkidle");
  });

  test("Create a Helm Instance", async ({ page }) => {
    const dataTestIds = instancesPage.dataTestIds;

    await page.getByTestId("create-button").click();
    await page.getByTestId(dataTestIds.serviceNameSelect).click();

    const serviceOfferings = GlobalStateManager.getServiceOfferings();
    const preferredPrefix = `SaaSBuilder Redis Helm - ${GlobalStateManager.getDate()}`;
    const helmOffering =
      serviceOfferings.find((offering) => offering.serviceName.startsWith(preferredPrefix)) ??
      serviceOfferings.find((offering) => offering.serviceName.startsWith("SaaSBuilder Redis Helm - ")) ??
      serviceOfferings.find((offering) => offering.serviceName.includes("Redis Helm"));

    if (!helmOffering) {
      test.skip(true, `${logPrefix} Redis Helm service offering not available in this environment`);
      return;
    }

    await page.getByRole("option", { name: helmOffering.serviceName, exact: true }).click();

    // If the Subscribe Button is Visible, Click it
    const subscribeButton = page.getByTestId("subscribe-button");
    if (await subscribeButton.isVisible()) {
      await subscribeButton.click();
    }

    await page.getByTestId(dataTestIds.resourceTypeSelect).click();
    await page.getByRole("option", { name: "Redis Cluster" }).click();

    await page.getByTestId(dataTestIds.awsCard).click();
    await page.getByTestId(dataTestIds.regionSelect).click();
    await page.getByRole("option", { name: "ap-south-" }).click();

    await page.getByLabel("Password Generator").click();
    await page.getByTestId(dataTestIds.submitButton).click();

    instanceId = (await page.getByTestId(dataTestIds.instanceId).textContent()) || "";
    console.log(logPrefix, "Instance ID:", instanceId);

    await page.getByTestId(dataTestIds.closeInstructionsButton).click();
  });

  // test("Wait for Running Instance -> Test Instance Details Page", async ({ page }) => {
  //   await instancesPage.waitForStatus(instanceId, "Running", {
  //     timeout: 15 * 60 * 1000, // 15 Minutes Max Timeout
  //     initialPollingInterval: 20000, // 20 Seconds
  //   });
  //   await instancesPage.navigateToInstanceDetails(instanceId);

  //   // Intercept Data from Instance Details Request
  //   const instanceDetails = await page.waitForResponse((response) =>
  //     response.url().includes("/api/action?endpoint=%2Fresource-instance%2F")
  //   );

  //   const instance = await instanceDetails.json();
  //   console.log("Instance Details:", instance);

  //   // Test Instance Overview
  //   await TestInstanceOverview(instanceDetailsPage, instance);

  //   // Test Instance Details Tab
  //   await TestInstanceDetailsTab(instanceDetailsPage, instance, "helm");

  //   // Test Connectivity Tab
  //   await TestConnectivityTab(instanceDetailsPage, instance, "helm");

  //   // Test Nodes Tab
  //   await TestNodesTab(instanceDetailsPage, instance);

  //   // Test Live Logs Tab
  //   await TestLiveLogsTab(instanceDetailsPage, instance);

  //   // Test Events Tab
  //   await TestEventsTab(instanceDetailsPage, instance);
  // });

  test("Delete Instance", async () => {
    if (!instanceId) {
      test.skip(true, `${logPrefix} No Helm instance was created in this run`);
      return;
    }

    await instancesPage.deleteInstance(instanceId);
    await instancesPage.waitForStatus(instanceId, "Deleting", logPrefix);
  });
});

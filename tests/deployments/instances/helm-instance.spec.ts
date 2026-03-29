import test, { expect } from "@playwright/test";
import { InstancesPage } from "page-objects/instances-page";
import { skipOnBackendError } from "test-utils/backend-error";
import { GlobalStateManager } from "test-utils/global-state-manager";

const logPrefix = "Instances -> Helm Instance Tests ->";
test.describe.configure({ mode: "serial", timeout: 20 * 60 * 1000 });

test.describe("Instances Page - Helm Instance Tests", () => {
  let instancesPage: InstancesPage, instanceId: string;

  test.beforeEach(async ({ page }) => {
    instancesPage = new InstancesPage(page);
    await instancesPage.navigate();
    await page.waitForLoadState("networkidle");
  });

  test("Create a Helm Instance", async ({ page }) => {
    const dataTestIds = instancesPage.dataTestIds;

    await page.getByTestId("create-button").click();
    await page.getByTestId(dataTestIds.serviceNameSelect).click();

    const date = GlobalStateManager.getDate();
    await page.getByRole("option", { name: `SaaSBuilder Redis Helm - ${date}` }).click();

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

    const instanceIdInput = page.getByTestId(dataTestIds.instanceId).locator("input");
    await expect(instanceIdInput).not.toHaveValue("", { timeout: 30000 });
    instanceId = await instanceIdInput.inputValue();
    console.log(logPrefix, "Instance ID:", instanceId);

    await page.getByTestId(dataTestIds.closeInstructionsButton).click();
  });

  test("Delete Instance", async () => {
    await instancesPage.deleteInstance(instanceId);
    await skipOnBackendError(test, async () => {
      await instancesPage.waitForStatus(instanceId, "Deleting", logPrefix);
    });
  });
});

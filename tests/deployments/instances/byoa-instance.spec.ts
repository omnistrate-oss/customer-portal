import test, { expect } from "@playwright/test";
import { CloudAccountsPage } from "page-objects/cloud-accounts-page";
import { dataTestIds as instanceDataTestIds } from "page-objects/constants/instances-page";
import { InstancesPage } from "page-objects/instances-page";
import { skipOnBackendError } from "test-utils/backend-error";
import { GlobalStateManager } from "test-utils/global-state-manager";
import { registerSoftFailureRecorder } from "test-utils/soft-failure-tracker";

registerSoftFailureRecorder();

const logPrefix = "Instances -> BYOA Instance Tests ->";

test.describe.configure({ mode: "serial" });

test.describe("Instances Page - BYOA Instance Tests", () => {
  let instancesPage: InstancesPage,
    cloudAccountsPage: CloudAccountsPage,
    cloudAccountInstanceId: string,
    instanceId: string;

  test.beforeEach(async ({ page }) => {
    instancesPage = new InstancesPage(page);
    cloudAccountsPage = new CloudAccountsPage(page);
  });

  test("Create a Cloud Provider Account Instance", async ({ page }) => {
    await cloudAccountsPage.navigate();
    await page.waitForLoadState("networkidle");

    const dataTestIds = cloudAccountsPage.dataTestIds,
      pageElements = cloudAccountsPage.pageElements;

    await page.getByTestId(dataTestIds.createButton).click();
    await page.getByTestId(dataTestIds.serviceNameSelect).click();
    const date = GlobalStateManager.getDate();
    await page.getByRole("option", { name: `SaaSBuilder Supabase DT BYOA - ${date}` }).click();

    // If the Subscribe Button is Visible, Click it
    const subscribeButton = page.getByTestId("subscribe-button");
    if (await subscribeButton.isVisible()) {
      await subscribeButton.click();
    }

    await page.getByTestId(dataTestIds.awsAccountIdInput).fill(process.env.BYOA_AWS_ACCOUNT_ID!);
    await page.getByTestId(dataTestIds.submitButton).click();

    const instanceDetails = await page.waitForResponse((response) =>
      response.url().includes("/api/action?endpoint=%2F2022-09-01-00%2Fresource-instance%2F")
    );

    const cloudAccount = await instanceDetails.json();
    console.log(logPrefix, "Cloud Account Instance:", cloudAccount);

    cloudAccountInstanceId = cloudAccount.id;

    await expect(page.getByText(pageElements.instructionsDialogTitle)).toBeVisible();
    await page.getByTestId(dataTestIds.closeInstructionsButton).click();

    await skipOnBackendError(test, async () => {
      await cloudAccountsPage.waitForStatus(cloudAccountInstanceId, "Ready", logPrefix);
    });
  });

  test("Create a BYOA Instance", async ({ page }) => {
    const dataTestIds = instancesPage.dataTestIds;
    await instancesPage.navigate();
    await page.waitForLoadState("networkidle");

    await page.getByTestId(dataTestIds.createButton).click();
    await page.getByTestId(dataTestIds.serviceNameSelect).click();

    const date = GlobalStateManager.getDate();
    await page.getByRole("option", { name: `SaaSBuilder Supabase DT BYOA - ${date}` }).click();
    await page.waitForLoadState("networkidle");

    await page.getByTestId(dataTestIds.cloudAccountSelect).click();
    await page.getByRole("option", { name: `${cloudAccountInstanceId} (Account` }).click();

    await page.getByTestId("postgresPassword-input").fill("hello");
    await page.getByTestId("organizationName-input").fill("hello");
    await page.getByTestId("dashboardPassword-input").fill("hello");
    await page.getByTestId("projectName-input").fill("hello");

    await page.waitForTimeout(5000);
    await page.getByTestId(dataTestIds.submitButton).click();

    const instanceIdInput = page.getByTestId(instanceDataTestIds.instanceId).locator("input");
    await expect(instanceIdInput).not.toHaveValue("", { timeout: 30000 });
    instanceId = await instanceIdInput.inputValue();
    console.log(logPrefix, "Instance ID:", instanceId);

    await page.getByTestId(dataTestIds.closeInstructionsButton).click();
  });

  test("Delete the BYOA Instance", async ({ page }) => {
    await instancesPage.navigate();
    await page.waitForLoadState("networkidle");

    await instancesPage.deleteInstance(instanceId);
    await skipOnBackendError(test, async () => {
      await instancesPage.waitForStatus(instanceId, "Deleting", logPrefix);
      await instancesPage.waitForDelete(instanceId, logPrefix);
    });

    await cloudAccountsPage.navigate();
    await page.waitForLoadState("networkidle");
    await cloudAccountsPage.deleteCloudAccount(cloudAccountInstanceId);
  });
});

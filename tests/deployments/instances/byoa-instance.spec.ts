import { CloudAccountsPage } from "page-objects/cloud-accounts-page";
import { InstancesPage } from "page-objects/instances-page";
import { readRecordedServiceOffering } from "test-fixtures/har-replay";
import { expect, test } from "test-fixtures/har-test";
import { skipOnBackendError } from "test-utils/backend-error";
import { GlobalStateManager } from "test-utils/global-state-manager";
import { registerSoftFailureRecorder } from "test-utils/soft-failure-tracker";

import { dataTestIds as instanceDataTestIds } from "src/constants/testIds/instances-page";

registerSoftFailureRecorder();

const logPrefix = "Instances -> BYOA Instance Tests ->";

test.describe.configure({ mode: "serial" });

test.describe.skip("Instances Page - BYOA Instance Tests", () => {
  let instancesPage: InstancesPage,
    cloudAccountsPage: CloudAccountsPage,
    cloudAccountInstanceId: string,
    instanceId: string;

  test.beforeEach(async ({ page }) => {
    instancesPage = new InstancesPage(page);
    cloudAccountsPage = new CloudAccountsPage(page);
  });

  test("Create a Cloud Provider Account Instance", async ({ page, harMode, harFilePath }) => {
    await cloudAccountsPage.navigate();
    await page.waitForLoadState("networkidle");

    const dataTestIds = cloudAccountsPage.dataTestIds,
      pageElements = cloudAccountsPage.pageElements;

    await page.getByTestId(dataTestIds.createButton).click();
    await page.getByTestId(dataTestIds.serviceNameSelect).click();
    const recordedOffering =
      harMode === "replay" ? readRecordedServiceOffering(harFilePath, "SaaSBuilder Postgres DT BYOA - ") : undefined;
    if (recordedOffering) {
      await page.locator(`[role="option"][data-value="${recordedOffering.serviceId}"]`).click();
    } else {
      await page
        .getByRole("option", { name: `SaaSBuilder Postgres DT BYOA - ${GlobalStateManager.getDate()}` })
        .click();
    }

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
    console.info(logPrefix, "Cloud account instance received");

    cloudAccountInstanceId = cloudAccount.id;

    await expect(page.getByText(pageElements.instructionsDialogTitle)).toBeVisible();
    await page.getByTestId(dataTestIds.closeInstructionsButton).click();

    await skipOnBackendError(test, async () => {
      await cloudAccountsPage.waitForStatus(cloudAccountInstanceId, "Ready", logPrefix);
    });
  });

  test("Create a BYOA Instance", async ({ page, harMode, harFilePath }) => {
    const dataTestIds = instancesPage.dataTestIds;
    await instancesPage.navigate();
    await page.waitForLoadState("networkidle");

    await page.getByTestId(dataTestIds.createButton).click();
    await page.getByTestId(dataTestIds.serviceNameSelect).click();

    const recordedOffering =
      harMode === "replay" ? readRecordedServiceOffering(harFilePath, "SaaSBuilder Postgres DT BYOA - ") : undefined;
    if (recordedOffering) {
      await page.locator(`[role="option"][data-value="${recordedOffering.serviceId}"]`).click();
    } else {
      await page
        .getByRole("option", { name: `SaaSBuilder Postgres DT BYOA - ${GlobalStateManager.getDate()}` })
        .click();
    }
    await page.waitForLoadState("networkidle");

    await page.getByTestId(dataTestIds.cloudAccountSelect).click();
    await page.getByRole("option", { name: `${cloudAccountInstanceId} (Account` }).click();

    await page.getByTestId("private-radio").click();
    await page.getByTestId("password-input").fill(process.env.TEST_INSTANCE_PASSWORD!);
    await page.getByTestId("username-input").fill("username");

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

    await skipOnBackendError(test, async () => {
      await instancesPage.deleteInstance(instanceId);
      await instancesPage.waitForStatus(instanceId, "Deleting", logPrefix);
      await instancesPage.waitForDelete(instanceId, logPrefix);
    });

    await cloudAccountsPage.navigate();
    await page.waitForLoadState("networkidle");
    await cloudAccountsPage.deleteCloudAccount(cloudAccountInstanceId);
  });
});

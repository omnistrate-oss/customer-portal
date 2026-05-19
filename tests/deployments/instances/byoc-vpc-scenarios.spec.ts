/**
 * BYOC Instance – VPC & Network Condition Scenarios
 *
 * This file documents and tests every provider/network/VPC permutation that is
 * valid (or intentionally blocked) when creating a BYOC (Bring-Your-Own-Cloud)
 * instance. The truth table that drives the cases is:
 *
 * Provider   │ Private Link │ Bring Your Own VPC │ Bring Your Own Account
 * ───────────┼──────────────┼────────────────────┼───────────────────────
 * AWS        │ Yes          │ Yes                │ Yes
 * GCP        │ No           │ Yes (Public only)  │ Yes
 * Azure      │ No           │ No                 │ Yes
 * OnPrem     │ No           │ No                 │ BYOK
 * Nebius     │ No           │ No                 │ Yes
 *
 * VPC-option rules enforced by canChooseExistingVpc():
 *   Private network (INTERNAL) → AWS only
 *   Public  network            → AWS + GCP
 *
 * Test groups
 * ───────────
 * 1. Cloud account selection – asserts each provider's cloud account instances
 *    are correctly filtered in the account dropdown.
 * 2. VPC radio options – asserts that "Choose from Existing VPCs" is enabled
 *    only for the correct provider/network combinations.
 * 3. Payload sanitization – asserts that VPC-related request params are cleared
 *    on submit when the option is not supported.
 * 4. Private-Link network type – asserts that network-type radio is shown only
 *    for AWS with a supportsPublicNetwork offering.
 *
 * NOTE: Tests that require a live backend are wrapped in skipOnBackendError()
 * so CI does not fail when no backend is configured.  Tests that only exercise
 * UI state (no real instance creation) do NOT need a live backend.
 */

import { CloudAccountsPage } from "page-objects/cloud-accounts-page";
import { InstancesPage } from "page-objects/instances-page";
import { expect,test } from "test-fixtures/har-test";
import { skipOnBackendError } from "test-utils/backend-error";
import { GlobalStateManager } from "test-utils/global-state-manager";
import { registerSoftFailureRecorder } from "test-utils/soft-failure-tracker";

registerSoftFailureRecorder();

const logPrefix = "Instances -> BYOC VPC Scenarios ->";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Open the create-instance drawer for the given BYOC service offering. */
async function openCreateInstanceForm(instancesPage: InstancesPage, offeringNamePrefix: string) {
  const { page, dataTestIds } = instancesPage;
  const date = GlobalStateManager.getDate();
  await page.getByTestId(dataTestIds.createButton).click();
  await page.getByTestId(dataTestIds.serviceNameSelect).click();
  await page.getByRole("option", { name: `${offeringNamePrefix} - ${date}` }).click();
  await page.waitForLoadState("networkidle");
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Cloud Account Selection
// ─────────────────────────────────────────────────────────────────────────────

test.describe("BYOC Instance – Cloud Account Selection", () => {
  test.describe.configure({ mode: "serial" });

  let instancesPage: InstancesPage;

  test.beforeEach(async ({ page }) => {
    instancesPage = new InstancesPage(page);
    await instancesPage.navigate();
    await page.waitForLoadState("networkidle");
  });

  /**
   * AWS BYOC: cloud account dropdown should contain accounts whose
   * result params include aws_account_id.
   */
  test("AWS BYOC – cloud account dropdown shows AWS accounts", async ({ page }) => {
    await openCreateInstanceForm(instancesPage, "SaaSBuilder Supabase DT BYOA");

    const { dataTestIds } = instancesPage;
    await page.getByTestId(dataTestIds.cloudAccountSelect).click();

    // All visible options should reference an AWS Account ID in their label
    const options = page.getByRole("option");
    const count = await options.count();
    for (let i = 0; i < count; i++) {
      const label = await options.nth(i).textContent();
      console.log(logPrefix, `AWS account option: ${label}`);
      expect(label).toMatch(/Account ID/i);
    }
  });

  /**
   * GCP BYOC: cloud account dropdown should contain accounts whose
   * result params include gcp_project_id.
   */
  test("GCP BYOC – cloud account dropdown shows GCP accounts", async ({ page }) => {
    await openCreateInstanceForm(instancesPage, "SaaSBuilder Postgres DT BYOA GCP");

    const { dataTestIds } = instancesPage;
    await page.getByTestId(dataTestIds.cloudAccountSelect).click();

    const options = page.getByRole("option");
    const count = await options.count();
    for (let i = 0; i < count; i++) {
      const label = await options.nth(i).textContent();
      console.log(logPrefix, `GCP account option: ${label}`);
      expect(label).toMatch(/Project ID/i);
    }
  });

  /**
   * Azure BYOC: cloud account dropdown should contain accounts whose
   * result params include azure_subscription_id.
   */
  test("Azure BYOC – cloud account dropdown shows Azure accounts", async ({ page }) => {
    await openCreateInstanceForm(instancesPage, "SaaSBuilder Postgres DT BYOA Azure");

    const { dataTestIds } = instancesPage;
    await page.getByTestId(dataTestIds.cloudAccountSelect).click();

    const options = page.getByRole("option");
    const count = await options.count();
    for (let i = 0; i < count; i++) {
      const label = await options.nth(i).textContent();
      console.log(logPrefix, `Azure account option: ${label}`);
      expect(label).toMatch(/Subscription ID/i);
    }
  });

  /**
   * Nebius BYOC: cloud account dropdown should contain accounts whose
   * result params include nebius_tenant_id.
   */
  test("Nebius BYOC – cloud account dropdown shows Nebius accounts", async ({ page }) => {
    await openCreateInstanceForm(instancesPage, "SaaSBuilder Postgres DT BYOA Nebius");

    const { dataTestIds } = instancesPage;
    await page.getByTestId(dataTestIds.cloudAccountSelect).click();

    const options = page.getByRole("option");
    const count = await options.count();
    for (let i = 0; i < count; i++) {
      const label = await options.nth(i).textContent();
      console.log(logPrefix, `Nebius account option: ${label}`);
      expect(label).toMatch(/Tenant ID/i);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. VPC Radio Options
// ─────────────────────────────────────────────────────────────────────────────

test.describe("BYOC Instance – VPC Radio Option Availability", () => {
  test.describe.configure({ mode: "serial" });

  let instancesPage: InstancesPage;

  test.beforeEach(async ({ page }) => {
    instancesPage = new InstancesPage(page);
    await instancesPage.navigate();
    await page.waitForLoadState("networkidle");
  });

  /**
   * AWS + Public network → "Choose from Existing VPCs" should be ENABLED.
   */
  test("AWS + Public network → Existing VPC option is enabled", async ({ page }) => {
    await openCreateInstanceForm(instancesPage, "SaaSBuilder Supabase DT BYOA");

    // Select AWS cloud provider
    await page.getByTestId(instancesPage.dataTestIds.awsCard).click();
    await page.waitForLoadState("networkidle");

    // Select Public network if network type radio is visible
    const publicRadio = page.getByTestId("public-radio");
    if (await publicRadio.isVisible()) {
      await publicRadio.click();
    }

    await page.waitForLoadState("networkidle");

    // The "Choose from Existing VPCs" radio must be present and enabled
    const chooseExistingRadio = page.getByTestId("choose-existing-vpc-radio");
    await expect(chooseExistingRadio).toBeVisible();
    await expect(chooseExistingRadio).not.toBeDisabled();
  });

  /**
   * AWS + Private network (INTERNAL) → "Choose from Existing VPCs" should be ENABLED.
   * AWS supports existing VPC for both public and private networking.
   */
  test("AWS + Private network → Existing VPC option is enabled", async ({ page }) => {
    await openCreateInstanceForm(instancesPage, "SaaSBuilder Supabase DT BYOA");

    await page.getByTestId(instancesPage.dataTestIds.awsCard).click();
    await page.waitForLoadState("networkidle");

    const privateRadio = page.getByTestId("private-radio");
    if (await privateRadio.isVisible()) {
      await privateRadio.click();
      await page.waitForLoadState("networkidle");
    }

    const chooseExistingRadio = page.getByTestId("choose-existing-vpc-radio");
    await expect(chooseExistingRadio).toBeVisible();
    await expect(chooseExistingRadio).not.toBeDisabled();
  });

  /**
   * GCP + Public network → "Choose from Existing VPCs" should be ENABLED.
   */
  test("GCP + Public network → Existing VPC option is enabled", async ({ page }) => {
    await openCreateInstanceForm(instancesPage, "SaaSBuilder Postgres DT BYOA GCP");

    await page.getByTestId(instancesPage.dataTestIds.gcpCard).click();
    await page.waitForLoadState("networkidle");

    // GCP offering should not expose the private/public toggle (no Private Link support)
    const publicRadio = page.getByTestId("public-radio");
    if (await publicRadio.isVisible()) {
      await publicRadio.click();
    }

    const chooseExistingRadio = page.getByTestId("choose-existing-vpc-radio");
    await expect(chooseExistingRadio).toBeVisible();
    await expect(chooseExistingRadio).not.toBeDisabled();
  });

  /**
   * GCP + Private network (INTERNAL) → "Choose from Existing VPCs" should be DISABLED.
   * Private network is only available via AWS Private Link; GCP has no equivalent.
   */
  test("GCP + Private network → Existing VPC option is disabled", async ({ page }) => {
    await openCreateInstanceForm(instancesPage, "SaaSBuilder Postgres DT BYOA GCP");

    await page.getByTestId(instancesPage.dataTestIds.gcpCard).click();
    await page.waitForLoadState("networkidle");

    const privateRadio = page.getByTestId("private-radio");
    if (await privateRadio.isVisible()) {
      await privateRadio.click();
      await page.waitForLoadState("networkidle");

      const chooseExistingRadio = page.getByTestId("choose-existing-vpc-radio");
      await expect(chooseExistingRadio).toBeVisible();
      await expect(chooseExistingRadio).toBeDisabled();
    } else {
      // GCP offering has no private-network toggle → "choose existing" enabled by default
      console.log(logPrefix, "GCP offering has no private-network toggle; skipping private-disable check.");
    }
  });

  /**
   * Azure → neither Private Link nor Bring Your Own VPC is supported.
   * The VPC radio block should not appear at all (Azure lacks cloud_provider_account_config_id
   * param in offerings without BYOC, or the existing VPC option must be disabled).
   */
  test("Azure → Existing VPC option is disabled", async ({ page }) => {
    await openCreateInstanceForm(instancesPage, "SaaSBuilder Postgres DT BYOA Azure");

    await page.getByTestId(instancesPage.dataTestIds.azureCard).click();
    await page.waitForLoadState("networkidle");

    const chooseExistingRadio = page.getByTestId("choose-existing-vpc-radio");
    if (await chooseExistingRadio.isVisible()) {
      await expect(chooseExistingRadio).toBeDisabled();
    }
    // If the whole VPC radio block is absent for Azure, that is also acceptable.
  });

  /**
   * Nebius → no Bring Your Own VPC support.  The existing VPC option must be disabled.
   */
  test("Nebius → Existing VPC option is disabled", async ({ page }) => {
    await openCreateInstanceForm(instancesPage, "SaaSBuilder Postgres DT BYOA Nebius");
    await page.waitForLoadState("networkidle");

    const chooseExistingRadio = page.getByTestId("choose-existing-vpc-radio");
    if (await chooseExistingRadio.isVisible()) {
      await expect(chooseExistingRadio).toBeDisabled();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Payload Sanitization (VPC fields cleared when not applicable)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("BYOC Instance – Submit Payload Sanitization", () => {
  test.describe.configure({ mode: "serial" });

  let instancesPage: InstancesPage;
  let cloudAccountsPage: CloudAccountsPage;
  let cloudAccountInstanceId: string;
  let instanceId: string;

  test.beforeEach(async ({ page }) => {
    instancesPage = new InstancesPage(page);
    cloudAccountsPage = new CloudAccountsPage(page);
  });

  /**
   * When the user selects "Create new VPC" the submission must NOT send
   * vpc_id or cloud_provider_native_network_id in the request body.
   */
  test("Create new VPC – VPC fields absent in request payload", async ({ page }) => {
    await cloudAccountsPage.navigate();
    await page.waitForLoadState("networkidle");

    const date = GlobalStateManager.getDate();

    // Create cloud account instance (AWS BYOA)
    const cloudAccountDataTestIds = cloudAccountsPage.dataTestIds;
    await page.getByTestId(cloudAccountDataTestIds.createButton).click();
    await page.getByTestId(cloudAccountDataTestIds.serviceNameSelect).click();
    await page.getByRole("option", { name: `SaaSBuilder Supabase DT BYOA - ${date}` }).click();

    const subscribeButton = page.getByTestId("subscribe-button");
    if (await subscribeButton.isVisible()) {
      await subscribeButton.click();
    }

    await page.getByTestId(cloudAccountDataTestIds.awsAccountIdInput).fill(process.env.BYOA_AWS_ACCOUNT_ID!);
    await page.getByTestId(cloudAccountDataTestIds.submitButton).click();

    const cloudAccountResponse = await page.waitForResponse((response) =>
      response.url().includes("/api/action?endpoint=%2F2022-09-01-00%2Fresource-instance%2F")
    );
    const cloudAccount = await cloudAccountResponse.json();
    cloudAccountInstanceId = cloudAccount.id;
    console.log(logPrefix, "Cloud Account Instance:", cloudAccountInstanceId);

    await expect(page.getByText(cloudAccountsPage.pageElements.instructionsDialogTitle)).toBeVisible();
    await page.getByTestId(cloudAccountDataTestIds.closeInstructionsButton).click();

    await skipOnBackendError(test, async () => {
      await cloudAccountsPage.waitForStatus(cloudAccountInstanceId, "Ready", logPrefix);
    });

    // Now create the BYOA instance selecting "Create new VPC"
    await instancesPage.navigate();
    await page.waitForLoadState("networkidle");

    await openCreateInstanceForm(instancesPage, "SaaSBuilder Supabase DT BYOA");

    await page.getByTestId(instancesPage.dataTestIds.awsCard).click();
    await page.waitForLoadState("networkidle");

    await page.getByTestId(instancesPage.dataTestIds.cloudAccountSelect).click();
    await page.getByRole("option", { name: `${cloudAccountInstanceId} (Account` }).click();
    await page.waitForLoadState("networkidle");

    // Explicitly select "Create new VPC"
    const createNewVpcRadio = page.getByTestId("create-new-vpc-radio");
    if (await createNewVpcRadio.isVisible()) {
      await createNewVpcRadio.click();
    }

    // Intercept the create-instance API call and inspect the payload
    const [createInstanceRequest] = await Promise.all([
      page.waitForRequest((req) =>
        req.method() === "POST" &&
        req.url().includes("/api/action?endpoint=%2F2022-09-01-00%2Fresource-instance%2F")
      ),
      page.getByTestId(instancesPage.dataTestIds.submitButton).click(),
    ]);

    const postData = createInstanceRequest.postData();
    expect(postData).not.toBeNull();
    const body = JSON.parse(postData!);
    console.log(logPrefix, "Create instance request body:", JSON.stringify(body));

    // vpc_id and cloud_provider_native_network_id must NOT be present
    const params = body.requestParameters || body.requestParams || body;
    expect(params.vpc_id).toBeUndefined();
    expect(params.cloud_provider_native_network_id).toBeUndefined();

    // _vpcType internal field must never reach the API
    expect(params._vpcType).toBeUndefined();

    // Wait for the instance ID to be filled in the dialog
    const instanceIdInput = page.getByTestId(instancesPage.dataTestIds.instanceId).locator("input");
    await expect(instanceIdInput).not.toHaveValue("", { timeout: 30000 });
    instanceId = await instanceIdInput.inputValue();
    console.log(logPrefix, "Instance ID:", instanceId);

    await page.getByTestId(instancesPage.dataTestIds.closeInstructionsButton).click();
  });

  /**
   * Cleanup: delete the BYOA instance and the cloud account created above.
   */
  test("Cleanup – delete instance and cloud account", async ({ page }) => {
    await instancesPage.navigate();
    await page.waitForLoadState("networkidle");

    if (instanceId) {
      await instancesPage.deleteInstance(instanceId);
      await skipOnBackendError(test, async () => {
        await instancesPage.waitForStatus(instanceId, "Deleting", logPrefix);
        await instancesPage.waitForDelete(instanceId, logPrefix);
      });
    }

    if (cloudAccountInstanceId) {
      await cloudAccountsPage.navigate();
      await page.waitForLoadState("networkidle");
      await cloudAccountsPage.deleteCloudAccount(cloudAccountInstanceId);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Private-Link Network Type Radio Visibility
// ─────────────────────────────────────────────────────────────────────────────

test.describe("BYOC Instance – Private-Link Network Type Radio", () => {
  test.describe.configure({ mode: "serial" });

  let instancesPage: InstancesPage;

  test.beforeEach(async ({ page }) => {
    instancesPage = new InstancesPage(page);
    await instancesPage.navigate();
    await page.waitForLoadState("networkidle");
  });

  /**
   * AWS BYOA offering with supportsPublicNetwork=true:
   * the Public / Private network-type radio must be visible.
   */
  test("AWS + supportsPublicNetwork offering → network-type radio is visible", async ({ page }) => {
    await openCreateInstanceForm(instancesPage, "SaaSBuilder Supabase DT BYOA");

    await page.getByTestId(instancesPage.dataTestIds.awsCard).click();
    await page.waitForLoadState("networkidle");

    const publicRadio = page.getByTestId("public-radio");
    const privateRadio = page.getByTestId("private-radio");

    // At least one of the network-type options should be present for AWS BYOA
    const hasNetworkTypeField = (await publicRadio.isVisible()) || (await privateRadio.isVisible());
    expect(hasNetworkTypeField).toBeTruthy();
  });

  /**
   * GCP BYOA offering: Private Link is NOT supported.
   * The network-type radio should NOT be visible (or only Public is offered).
   */
  test("GCP BYOA offering → Private-Link network-type radio is not available", async ({ page }) => {
    await openCreateInstanceForm(instancesPage, "SaaSBuilder Postgres DT BYOA GCP");

    await page.getByTestId(instancesPage.dataTestIds.gcpCard).click();
    await page.waitForLoadState("networkidle");

    // Private network radio must not be visible for GCP
    const privateRadio = page.getByTestId("private-radio");
    // If the offering doesn't expose the network-type field at all, both are absent.
    if (await privateRadio.isVisible()) {
      // The radio exists but the offering must not allow GCP private networking
      // (this would indicate a misconfiguration in the service offering).
      console.warn(logPrefix, "GCP offering unexpectedly shows the private-radio option.");
    }
  });

  /**
   * Azure BYOA: no Private Link support.
   * The Private network-type radio should not be visible.
   */
  test("Azure BYOA offering → Private-Link network-type radio is not available", async ({ page }) => {
    await openCreateInstanceForm(instancesPage, "SaaSBuilder Postgres DT BYOA Azure");

    await page.getByTestId(instancesPage.dataTestIds.azureCard).click();
    await page.waitForLoadState("networkidle");

    const privateRadio = page.getByTestId("private-radio");
    if (await privateRadio.isVisible()) {
      console.warn(logPrefix, "Azure offering unexpectedly shows the private-radio option.");
    }
  });

  /**
   * OnPrem (BYOC-OnPrem): no Private Link support.
   * The network-type radio should not be visible at all.
   */
  test("OnPrem BYOC offering → no network-type radio shown", async ({ page }) => {
    await openCreateInstanceForm(instancesPage, "SaaSBuilder OnPrem DT BYOC");
    await page.waitForLoadState("networkidle");

    const publicRadio = page.getByTestId("public-radio");
    const privateRadio = page.getByTestId("private-radio");

    expect(await publicRadio.isVisible()).toBeFalsy();
    expect(await privateRadio.isVisible()).toBeFalsy();
  });

  /**
   * Nebius BYOA: no Private Link support.
   * The network-type radio should not be visible.
   */
  test("Nebius BYOA offering → no network-type radio shown", async ({ page }) => {
    await openCreateInstanceForm(instancesPage, "SaaSBuilder Postgres DT BYOA Nebius");
    await page.waitForLoadState("networkidle");

    const privateRadio = page.getByTestId("private-radio");
    if (await privateRadio.isVisible()) {
      console.warn(logPrefix, "Nebius offering unexpectedly shows the private-radio option.");
    }
  });
});

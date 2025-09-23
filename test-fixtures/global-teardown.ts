import { GlobalStateManager } from "test-utils/global-state-manager";
import { ProviderAPIClient } from "test-utils/provider-api-client";
import { UserAPIClient } from "test-utils/user-api-client";

import { ResourceInstance } from "src/types/resourceInstance";
import { ServiceOffering } from "src/types/serviceOffering";

const deleteInstances = async (instances: ResourceInstance[], serviceOfferings: ServiceOffering[]) => {
  const userAPIClient = new UserAPIClient();

  const deletingInstanceIds: string[] = [];

  for (const instance of instances) {
    try {
      const subscription = await userAPIClient.describeSubscription(instance.subscriptionId);
      const serviceOffering = serviceOfferings.find(
        (offering) =>
          offering.serviceId === subscription.serviceId && offering.productTierID === subscription.productTierId
      );
      const param: any = serviceOffering?.resourceParameters.find((param) => param.resourceId === instance.resourceID);

      if (!serviceOffering) {
        console.error(`Service Offering not found for Instance: ${instance.id}`);
        continue;
      }

      if (!instance.id || !instance.subscriptionId) {
        console.error(`Instance is missing required ID or subscription ID`);
        continue;
      }

      const resourceInstance = await userAPIClient.describeResourceInstance(
        serviceOffering.serviceProviderId,
        serviceOffering.serviceURLKey,
        serviceOffering.serviceAPIVersion,
        serviceOffering.serviceEnvironmentURLKey,
        serviceOffering.serviceModelURLKey,
        serviceOffering.productTierURLKey,
        instance.resourceID?.startsWith("r-injected") ? "omnistrateCloudAccountConfig" : param.urlKey,
        instance.id,
        instance.subscriptionId
      );

      if (resourceInstance.status === "DELETING") {
        console.log(`Instance ${instance.id} is already being deleted.`);
        continue;
      }

      await userAPIClient.deleteResourceInstance(
        serviceOffering.serviceProviderId,
        serviceOffering.serviceURLKey,
        serviceOffering.serviceAPIVersion,
        serviceOffering.serviceEnvironmentURLKey,
        serviceOffering.serviceModelURLKey,
        serviceOffering.productTierURLKey,
        instance.resourceID?.startsWith("r-injected") ? "omnistrateCloudAccountConfig" : param.urlKey,
        instance.id,
        instance.subscriptionId
      );

      console.log("Deleting Resource Instance: ", resourceInstance);
      deletingInstanceIds.push(instance.id);
    } catch (error) {
      console.error(`Failed to delete instance ${instance.id}:`, error);
    }
  }

  return deletingInstanceIds;
};

const waitForDeletion = async (instanceType: "instance" | "cloudAccount", instanceIds: (string | undefined)[]) => {
  const userAPIClient = new UserAPIClient(),
    startTime = Date.now(),
    timeout = 10 * 60 * 1000; // 10 minutes

  while (Date.now() - startTime < timeout) {
    const instances = await userAPIClient.listResourceInstances();
    const deletingInstances = instances.filter(
      (instance) => instance.status === "DELETING" && instanceIds.includes(instance.id)
    );

    if (deletingInstances.length === 0) {
      console.log(`All ${instanceType === "instance" ? "Instances" : "Cloud Accounts"} deleted successfully`);
      return;
    }

    console.log(`Waiting for ${deletingInstances.length} instances to be deleted...`);
    await new Promise((resolve) => setTimeout(resolve, 20000)); // Wait for 20 seconds
  }

  console.error("Timeout: Some instances are still being deleted after 10 minutes");
};

async function globalTeardown() {
  console.log("Running Global Teardown...");

  const userAPIClient = new UserAPIClient();

  await userAPIClient.userLogin(process.env.USER_EMAIL!, process.env.USER_PASSWORD!);
  const instances = await userAPIClient.listResourceInstances();
  const serviceOfferings = await userAPIClient.listServiceOffering();

  // Delete Instances
  const deletingInstanceIds = await deleteInstances(
    instances.filter((el) => !el.resourceID?.startsWith("r-injected")),
    serviceOfferings
  );
  await waitForDeletion("instance", deletingInstanceIds);

  // Delete Cloud Accounts
  const deletingCloudAccountIds = await deleteInstances(
    instances.filter((el) => el.resourceID?.startsWith("r-injected")),
    serviceOfferings
  );
  await waitForDeletion("cloudAccount", deletingCloudAccountIds);

  // Delete Created Services and Services Older than 1 Days
  const providerAPIClient = new ProviderAPIClient();
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  const date = GlobalStateManager.getDate();

  const serviceOfferingsToDelete = serviceOfferings.filter((offering) => {
    const isCreatedByCurrentTest = offering.serviceName.includes("SaaSBuilder") && offering.serviceName.includes(date);
    if (isCreatedByCurrentTest) return true;

    const createdAt = new Date(offering.createdAt).getTime();
    if (date) {
      return createdAt < twoHoursAgo || offering.serviceName.includes(date);
    }
    return createdAt < twoHoursAgo;
  });

  const uniqueServiceIds = Array.from(new Set(serviceOfferingsToDelete.map((offering) => offering.serviceId)));

  for (const serviceId of uniqueServiceIds) {
    try {
      await providerAPIClient.deleteService(serviceId);
      console.log(`Deleted Service: ${serviceId}`);
    } catch (error) {
      console.error(`Failed to delete service ${serviceId}:`, error);
    }
  }

  console.log("Global Teardown Successful");
}

export default globalTeardown;

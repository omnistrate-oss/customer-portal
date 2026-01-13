import { GlobalStateManager } from "test-utils/global-state-manager";
import { ProviderAPIClient } from "test-utils/provider-api-client";
import { UserAPIClient } from "test-utils/user-api-client";

import { ResourceInstance } from "src/types/resourceInstance";
import { isCloudAccountInstance } from "src/utils/access/byoaResource";

type Instance = ResourceInstance & { serviceId: string; environmentId: string };

const deleteInstances = async (instances: Instance[]) => {
  const providerAPIClient = new ProviderAPIClient();
  const deletingInstanceIds: string[] = [];

  for (const instance of instances) {
    try {
      if (!instance.id || !instance.subscriptionId) {
        console.error(`Instance is missing required ID or subscription ID`);
        continue;
      }

      const resourceInstance = await providerAPIClient.describeInstance(
        instance.serviceId,
        instance.environmentId,
        instance.id
      );

      if (resourceInstance.status === "DELETING") {
        console.log(`Instance ${instance.id} is already being deleted.`);
        continue;
      }

      await providerAPIClient.deleteInstance(
        instance.serviceId,
        instance.environmentId,
        instance.id,
        instance.resourceID!
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
  const providerAPIClient = new ProviderAPIClient();

  // Login
  await userAPIClient.userLogin(process.env.USER_EMAIL!, process.env.USER_PASSWORD!);
  await providerAPIClient.providerLogin(process.env.PROVIDER_EMAIL!, process.env.PROVIDER_PASSWORD!);

  const services = await providerAPIClient.listSaaSBuilderServices();
  const instances: Instance[] = [];

  for (const service of services) {
    console.log(`Listing Instances for Service: ${service.name} (${service.id})`);
    for (const environment of service.serviceEnvironments) {
      console.log(`  Environment: ${environment.name} (${environment.id})`);
      const arr = await providerAPIClient.listInstances(service.id, environment.id);
      instances.push(
        ...arr.map((instance) => ({
          ...instance,
          serviceId: service.id,
          environmentId: environment.id,
        }))
      );
    }
  }

  // Delete Instances
  const deletingInstanceIds = await deleteInstances(instances.filter((el) => !isCloudAccountInstance(el)));
  await waitForDeletion("instance", deletingInstanceIds);

  // Delete Cloud Accounts
  const deletingCloudAccountIds = await deleteInstances(instances.filter((el) => isCloudAccountInstance(el)));
  await waitForDeletion("cloudAccount", deletingCloudAccountIds);

  // Delete Services Created in This Test using Date and Services Older than 2 Hours
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  const date = GlobalStateManager.getDate();

  const servicesToDelete = services.filter((service) => {
    const isCreatedByCurrentTest = service.name.includes(date);
    if (isCreatedByCurrentTest) return true;

    const createdAt = new Date(service.createdAt).getTime();
    return createdAt < twoHoursAgo;
  });

  for (const service of servicesToDelete) {
    try {
      for (const environment of service.serviceEnvironments) {
        await providerAPIClient.deleteSubscriptions(service.id, environment.id);
        console.log(`Deleted Subscriptions for Environment: ${environment.id}`);
      }
      await providerAPIClient.deleteService(service.id);
      console.log(`Deleted Service: ${service.name}`);
    } catch (error) {
      console.error(`Failed to delete service ${service.name}:`, error);
    }
  }

  console.log("Global Teardown Successful");
}

export default globalTeardown;

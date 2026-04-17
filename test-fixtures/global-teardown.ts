import { GlobalStateManager } from "test-utils/global-state-manager";
import { ProviderAPIClient } from "test-utils/provider-api-client";

import { ResourceInstance } from "src/types/resourceInstance";
import { isCloudAccountInstance } from "src/utils/access/byoaResource";

type Instance = ResourceInstance & { serviceId: string; environmentId: string };
type DeletingInstance = { serviceId: string; environmentId: string; instanceId: string };

const deleteInstances = async (instances: Instance[]) => {
  const providerAPIClient = new ProviderAPIClient();
  const deletingInstances: DeletingInstance[] = [];

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
        deletingInstances.push({
          serviceId: instance.serviceId,
          environmentId: instance.environmentId,
          instanceId: instance.id,
        });
        continue;
      }

      await providerAPIClient.deleteInstance(
        instance.serviceId,
        instance.environmentId,
        instance.id,
        instance.resourceID!
      );

      console.log(`Deleting Resource Instance: ${instance.id}`);

      // Delay between delete requests to avoid backend rate limiting
      await new Promise((resolve) => setTimeout(resolve, 5000));
      deletingInstances.push({
        serviceId: instance.serviceId,
        environmentId: instance.environmentId,
        instanceId: instance.id,
      });
    } catch (error) {
      console.error(`Failed to delete instance ${instance.id}:`, error);
    }
  }

  return deletingInstances;
};

const waitForDeletion = async (instanceType: "instance" | "cloudAccount", instances: DeletingInstance[]) => {
  if (instances.length === 0) return;

  const providerClient = new ProviderAPIClient(),
    startTime = Date.now(),
    timeout = 10 * 60 * 1000; // 10 minutes

  const deletingInstanceIds = instances.map((i) => i.instanceId);
  const uniqueCombinations = Array.from(new Set(instances.map((i) => `${i.serviceId}:${i.environmentId}`))).map(
    (combo) => {
      const [serviceId, environmentId] = combo.split(":");
      return { serviceId, environmentId };
    }
  );

  while (Date.now() - startTime < timeout) {
    let totalRemainingInstances = 0;

    for (const { serviceId, environmentId } of uniqueCombinations) {
      try {
        const instancesList = await providerClient.listInstances(serviceId, environmentId);
        const remainingInstances = instancesList.filter((inst) => deletingInstanceIds.includes(inst.id!));

        // Re-delete any instances that fell into FAILED status
        for (const inst of remainingInstances) {
          if (inst.status === "Failed" || inst.status === "FAILED") {
            console.log(`Instance ${inst.id} is in ${inst.status} state, re-triggering deletion...`);
            try {
              await providerClient.deleteInstance(serviceId, environmentId, inst.id!, inst.resourceID!);
              // Delay between delete requests to avoid backend rate limiting
              await new Promise((resolve) => setTimeout(resolve, 5000));
            } catch (error) {
              console.error(`Failed to re-delete instance ${inst.id}:`, error);
            }
          }
        }

        totalRemainingInstances += remainingInstances.length;
      } catch (error) {
        console.error(`Failed to list instances for ${serviceId}/${environmentId}:`, error);
      }
    }

    if (totalRemainingInstances === 0) {
      console.log(`All ${instanceType === "instance" ? "Instances" : "Cloud Accounts"} deleted successfully`);
      return;
    }

    console.log(`Waiting for ${totalRemainingInstances} ${instanceType}(s) to be deleted...`);
    await new Promise((resolve) => setTimeout(resolve, 20000));
  }

  console.error(`Timeout: Some ${instanceType}(s) are still being deleted after 10 minutes`);
};

async function globalTeardown() {
  console.log("Running Global Teardown...");

  const providerAPIClient = new ProviderAPIClient();

  // Re-authenticate in case token expired during tests
  try {
    await providerAPIClient.providerLogin(process.env.PROVIDER_EMAIL!, process.env.PROVIDER_PASSWORD!);
  } catch (error) {
    console.error("Failed to authenticate during teardown:", error);
    return;
  }

  let services;
  try {
    services = await providerAPIClient.listSaaSBuilderServices();
  } catch (error) {
    console.error("Failed to list services during teardown:", error);
    return;
  }

  // Filter services to only those created by the current test run or older than 2 hours
  const date = GlobalStateManager.getDate();
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;

  const servicesToCleanup = services.filter((service) => {
    const isCreatedByCurrentTest = service.name.includes(date);
    if (isCreatedByCurrentTest) return true;

    const createdAt = new Date(service.createdAt).getTime();
    return createdAt < twoHoursAgo;
  });

  // Step 1: Collect instances only from filtered services
  const instances: Instance[] = [];

  for (const service of servicesToCleanup) {
    console.log(`Listing Instances for Service: ${service.name} (${service.id})`);
    for (const environment of service.serviceEnvironments) {
      try {
        console.log(`  Environment: ${environment.name} (${environment.id})`);
        const arr = await providerAPIClient.listInstances(service.id, environment.id);
        instances.push(
          ...arr.map((instance) => ({
            ...instance,
            serviceId: service.id,
            environmentId: environment.id,
          }))
        );
      } catch (error) {
        console.error(`Failed to list instances for ${service.id}/${environment.id}:`, error);
      }
    }
  }

  console.log(`Total Instances Found: ${instances.length}`);

  // Step 2: Delete regular instances first, then wait
  const regularInstances = instances.filter((el) => !isCloudAccountInstance(el));
  if (regularInstances.length > 0) {
    console.log(`Deleting ${regularInstances.length} regular instance(s)...`);
    const deletingInstances = await deleteInstances(regularInstances);
    await waitForDeletion("instance", deletingInstances);
  }

  // Step 3: Delete cloud account instances, then wait
  const cloudAccountInstances = instances.filter((el) => isCloudAccountInstance(el));
  if (cloudAccountInstances.length > 0) {
    console.log(`Deleting ${cloudAccountInstances.length} cloud account instance(s)...`);
    const deletingCloudAccounts = await deleteInstances(cloudAccountInstances);
    await waitForDeletion("cloudAccount", deletingCloudAccounts);
  }

  // Step 4: Delete subscriptions for each service/environment
  for (const service of servicesToCleanup) {
    for (const environment of service.serviceEnvironments) {
      try {
        await providerAPIClient.deleteSubscriptions(service.id, environment.id);
        console.log(`Deleted Subscriptions for Service: ${service.name}, Environment: ${environment.id}`);
      } catch (error) {
        console.error(`Failed to delete subscriptions for ${service.name}/${environment.id}:`, error);
      }
    }
  }

  // Step 5: Delete the services themselves
  for (const service of servicesToCleanup) {
    try {
      await providerAPIClient.deleteService(service.id);
      console.log(`Deleted Service: ${service.name}`);
    } catch (error) {
      console.error(`Failed to delete service ${service.name}:`, error);
    }
  }

  console.log("Global Teardown Successful");
}

export default globalTeardown;

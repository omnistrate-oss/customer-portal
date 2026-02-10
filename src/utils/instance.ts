import { ResourceInstance } from "src/types/resourceInstance";

function checkBYOADeploymentInstance(instance: ResourceInstance) {
  if (instance.awsAccountID || instance.gcpProjectID || instance.azureSubscriptionID || instance.ociTenancyID)
    return true;

  return false;
}

export { checkBYOADeploymentInstance };

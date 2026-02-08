import { ResourceInstance } from "src/types/resourceInstance";

function checkBYOADeploymentInstance(instance: ResourceInstance) {
  if (instance.awsAccountID || instance.gcpProjectID || instance.azureSubscriptionID) return true;
  //@ts-ignore
  else if (instance.result_params?.cloud_provider_account_config_id) return true;
  return false;
}

export { checkBYOADeploymentInstance };

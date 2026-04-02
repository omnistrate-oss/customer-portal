import { ResourceInstance } from "src/types/resourceInstance";

function checkBYOADeploymentInstance(instance: ResourceInstance) {
  if (instance.awsAccountID || instance.gcpProjectID || instance.azureSubscriptionID || instance.ociTenancyID)
    return true;

  return false;
}

export { checkBYOADeploymentInstance };

/**
 * Returns result_params if non-empty, otherwise falls back to launch_input_params.
 * result_params can be an empty object `{}` which is truthy,
 * so a simple `||` check doesn't work.
 */

export const getResultParams = (instance?: {
  result_params?: Record<string, any> | unknown;
  launch_input_params?: Record<string, any> | unknown;
}): Record<string, any> => {
  const resultParams = instance?.result_params as Record<string, any> | undefined;
  if (resultParams && typeof resultParams === "object" && Object.keys(resultParams).length > 0) {
    return { ...resultParams };
  }
  const launchParams = (instance?.launch_input_params as Record<string, any>) ?? {};
  return { ...launchParams };
};

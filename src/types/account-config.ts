import { components, operations } from "./schema";

export type AccountConfig = components["schemas"]["DescribeAccountConfigResult"];
export type AccountGovernanceControls = components["schemas"]["AccountGovernanceControls"];

export type SyncAccountConfigCloudNativeNetworksPayload =
  operations["account-config-api/SyncAccountConfigCloudNativeNetworks"]["requestBody"]["content"]["application/json"];

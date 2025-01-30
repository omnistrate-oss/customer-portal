import type { paths, components } from "./schema";

export type ListAllResourceInstancesSuccessResponse =
  paths["/2022-09-01-00/resource-instance"]["get"]["responses"]["200"]["content"]["application/json"];

export type DescribeResourceInstanceSuccessResponse =
  paths["/2022-09-01-00/resource-instance/{serviceProviderId}/{serviceKey}/{serviceAPIVersion}/{serviceEnvironmentKey}/{serviceModelKey}/{productTierKey}/{resourceKey}/{id}"]["get"]["responses"]["200"]["content"]["application/json"];

export type ResourceInstance =
  components["schemas"]["DescribeResourceInstanceResult"] & {
    resourceID?: string;
  };

export type ResourceInstanceNetworkTopology =
  components["schemas"]["ResourceNetworkTopologyResult"];

export type ResourceInstanceNode =
  components["schemas"]["NodeNetworkTopologyResult"];

export const RESOURCE_TYPES = {
  OperatorCRD: "OperatorCRD",
  Kustomize: "Kustomize",
};

export type InstanceComputedHealthStatus =
  | "HEALTHY"
  | "UNHEALTHY"
  | "DEGRADED"
  | "UNKNOWN"
  | "NA";

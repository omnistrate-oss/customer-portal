import { RESOURCE_TYPES } from "src/constants/resource";
import { ServiceOffering } from "src/types/serviceOffering";

export type ResourceTypeHints = {
  managedResourceType?: string;
  resourceID?: string;
  resourceId?: string;
  resourceType?: string;
};

export const isOperatorCRDResourceType = (resourceType?: string) => {
  return resourceType?.trim().toLowerCase() === RESOURCE_TYPES.OperatorCRD.toLowerCase();
};

export const getResourceTypeFromHints = (resource?: ResourceTypeHints, serviceOffering?: ServiceOffering) => {
  const resourceId = resource?.resourceID || resource?.resourceId;
  const serviceOfferingResourceType = resourceId
    ? serviceOffering?.resourceParameters?.find((offeringResource) => offeringResource.resourceId === resourceId)
        ?.resourceType
    : undefined;

  return resource?.resourceType || serviceOfferingResourceType || resource?.managedResourceType;
};

export const hasOperatorCRDResource = (serviceOffering?: ServiceOffering) => {
  return Boolean(
    serviceOffering?.resourceParameters?.some((resource) => isOperatorCRDResourceType(resource.resourceType))
  );
};

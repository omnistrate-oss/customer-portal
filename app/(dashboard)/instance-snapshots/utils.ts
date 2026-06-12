import { RESOURCE_TYPES } from "src/constants/resource";

export const isOperatorCRDResourceType = (resourceType?: string) => {
  return resourceType?.toLowerCase() === RESOURCE_TYPES.OperatorCRD.toLowerCase();
};

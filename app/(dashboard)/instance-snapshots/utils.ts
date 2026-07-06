import { RESOURCE_TYPES } from "src/constants/resource";

export const isOperatorCRDResourceType = (resourceType?: string) => {
  return resourceType?.toLowerCase() === RESOURCE_TYPES.OperatorCRD.toLowerCase();
};

type SnapshotCopyTargetRegionInput = {
  snapshot?: {
    instanceResourceType?: string;
    region?: string;
  };
  sourceResourceType?: string;
};

export const getCopySnapshotTargetRegion = ({
  snapshot,
  sourceResourceType,
}: SnapshotCopyTargetRegionInput): string | undefined => {
  const resourceType = snapshot?.instanceResourceType || sourceResourceType;

  return isOperatorCRDResourceType(resourceType) ? snapshot?.region : undefined;
};

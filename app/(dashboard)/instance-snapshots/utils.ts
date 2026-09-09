import { RESOURCE_TYPES } from "src/constants/resource";
import { InstanceSnapshotListItem } from "src/types/instance-snapshot";

export const isOperatorCRDResourceType = (resourceType?: string) => {
  return resourceType?.toLowerCase() === RESOURCE_TYPES.OperatorCRD.toLowerCase();
};

/** Returns whether an instance can take a final snapshot while being deleted. */
export const canTakeFinalSnapshotBeforeDeletion = (snapshotEnabled?: boolean, status?: string): boolean =>
  Boolean(snapshotEnabled && status && ["RUNNING", "READY"].includes(status));

type SnapshotCopyTargetRegionInput = {
  snapshot?: Pick<InstanceSnapshotListItem, "instanceResourceType" | "region">;
  sourceResourceType?: string;
};

export const getCopySnapshotTargetRegion = ({
  snapshot,
  sourceResourceType,
}: SnapshotCopyTargetRegionInput): string | undefined => {
  const resourceType = snapshot?.instanceResourceType || sourceResourceType;

  return isOperatorCRDResourceType(resourceType) ? snapshot?.region : undefined;
};

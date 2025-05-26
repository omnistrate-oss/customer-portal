import { useQuery } from "@tanstack/react-query";

import { getInstanceRestoreAccess } from "src/api/resourceInstance";

import { accessQueryParams } from "../Backup";

type QueryParams = {
  instanceId?: string;
  accessQueryParams?: accessQueryParams;
  isEnable?: boolean;
};

// Shared properties between fleet and access responses
export type SnapshotBase = {
  completeTime: string;
  createdTime: string;
  encrypted: boolean;
  progress: number;
  snapshotId: string;
  status: string;
};

// Access-specific properties
type AccessSnapshot = SnapshotBase;

// Union type to represent either fleet or access snapshot
export type RestoreResponse = AccessSnapshot;

function useBackup(queryParams: QueryParams = {}, queryOptions = {}) {
  const { instanceId, accessQueryParams, isEnable } = queryParams;

  const enabled = Boolean(instanceId && isEnable);

  const query = useQuery({
    queryKey: ["instanceRestore", instanceId, isEnable],
    queryFn: () => {
      const {
        serviceProviderId,
        serviceKey,
        serviceAPIVersion,
        serviceEnvironmentKey,
        serviceModelKey,
        productTierKey,
        resourceKey,
        subscriptionId,
      } = accessQueryParams ?? {};
      return getInstanceRestoreAccess(
        serviceProviderId,
        serviceKey,
        serviceAPIVersion,
        serviceEnvironmentKey,
        serviceModelKey,
        productTierKey,
        resourceKey,
        instanceId,
        subscriptionId,
        {
          ignoreGlobalErrorSnack: true,
        }
      );
    },
    enabled: enabled,
    refetchOnWindowFocus: false,
    retry: false,
    refetchOnMount: true,
    refetchInterval: 30000,
    select: (response) => {
      return response?.data?.snapshots || [];
    },
    ...queryOptions,
  });

  return query;
}

export default useBackup;

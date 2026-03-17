import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { $api } from "src/api/query";
import axios from "src/axios";
import useEnvironmentType from "src/hooks/useEnvironmentType";
import { useGlobalData } from "src/providers/GlobalDataProvider";
import { isCloudAccountInstance } from "src/utils/access/byoaResource";

type QueryOptions = {
  onlyInstances?: boolean;
  onlyCloudAccounts?: boolean;
  describeInstances?: boolean;
  [key: string]: any;
};

const sortByCreatedAtDesc = (a: { created_at?: string }, b: { created_at?: string }) =>
  new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime();

const useInstancesListWithDescribe = (queryOptions: QueryOptions = {}) => {
  const { onlyInstances, onlyCloudAccounts, describeInstances, ...restOptions } = queryOptions;

  const { serviceOfferings } = useGlobalData();
  // Standard list query for all instances
  const listQuery = $api.useQuery(
    "get",
    "/2022-09-01-00/resource-instance",
    {
      params: {
        query: {
          environmentType: useEnvironmentType(),
        },
      },
    },
    {
      select: (data) => {
        let res = data.resourceInstances;
        if (onlyInstances) {
          // Exclude cloud account instances
          res = res.filter((instance: any) => !isCloudAccountInstance(instance));
        } else if (onlyCloudAccounts) {
          // Only cloud account instances
          res = res.filter((instance: any) => isCloudAccountInstance(instance));
        }
        // When neither option is set, return all instances (matches useInstances behavior)
        return res;
      },
      refetchInterval: 60000,
      ...restOptions,
    }
  );

  const describeQuery = useQuery({
    queryKey: ["resource-instances-describe", listQuery.dataUpdatedAt, serviceOfferings?.length],
    enabled: Boolean(
      describeInstances && listQuery.data && !listQuery.isFetching && !listQuery.isPending && serviceOfferings?.length
    ),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const res = listQuery.data || [];

      const describePromises = res.map(async (instance: any) => {
        let mainResource;
        if (instance?.detailedNetworkTopology) {
          mainResource = Object.values(instance?.detailedNetworkTopology).find(
            (topologyDetails: any) => topologyDetails.main === true
          );
        }

        const serviceOffering = serviceOfferings?.find((so: any) =>
          so?.resourceParameters?.some((resourceParam: any) => resourceParam?.resourceId === instance?.resourceID)
        );

        if (!serviceOffering) {
          return null;
        }

        try {
          const queryParams: Record<string, string> = {};
          if (instance.subscriptionId) {
            queryParams.subscriptionId = instance.subscriptionId;
          }
          let resourceKey: string | null = null;
          if (mainResource?.urlKey) {
            resourceKey = mainResource.urlKey;
          } else if (isCloudAccountInstance(instance)) {
            resourceKey = "omnistrateCloudAccountConfig";
          }
          // If we don't have a valid resource key, skip the describe call for this instance.
          if (!resourceKey) {
            return null;
          }

          const describeResponse = await axios.get(
            `/resource-instance/${serviceOffering?.serviceProviderId}/${serviceOffering?.serviceURLKey}/${serviceOffering?.serviceAPIVersion}/${serviceOffering?.serviceEnvironmentURLKey}/${serviceOffering?.serviceModelURLKey}/${serviceOffering?.productTierURLKey}/${resourceKey}/${instance.id}`,
            {
              params: queryParams,
              ignoreGlobalErrorSnack: true,
            }
          );

          return describeResponse?.data ?? null;
        } catch {
          return [] as any; // Return empty array on error to be filtered out later
        }
      });

      const describedInstances = (await Promise.all(describePromises)).filter(Boolean);
      const listToReturn = describedInstances.length > 0 ? describedInstances : res;

      return listToReturn.sort(sortByCreatedAtDesc);
    },
  });

  const { refetch: refetchList } = listQuery;

  // Memoize refetch to prevent useEffect re-runs in consumers using this as a dependency
  // Only refetch the list query — the describe query auto-fires because its
  // queryKey includes listQuery.dataUpdatedAt, so an explicit describeQuery.refetch()
  // would cause a redundant second describe fetch.
  const refetch = useCallback(async () => {
    return refetchList();
  }, [refetchList]);

  if (describeInstances) {
    return {
      ...listQuery,
      data: describeQuery.data || [],
      isPending: listQuery.isPending || describeQuery.isPending,
      isFetching: listQuery.isFetching || describeQuery.isFetching,
      error: listQuery.error || describeQuery.error,
      refetch,
    };
  }

  return {
    ...listQuery,
    data: (listQuery.data || []).sort(sortByCreatedAtDesc),
  };
};

export default useInstancesListWithDescribe;

import { useQuery } from "@tanstack/react-query";

import { $api } from "src/api/query";
import useEnvironmentType from "src/hooks/useEnvironmentType";
import { isCloudAccountInstance } from "src/utils/access/byoaResource";

import { getResourceInstanceDetails } from "../../../../src/api/resourceInstance";
import { useGlobalData } from "../../../../src/providers/GlobalDataProvider";
type QueryOptions = {
  onlyInstances?: boolean;
  describeInstances?: boolean;
  [key: string]: any;
};

const sortByCreatedAtDesc = (a: { created_at?: string }, b: { created_at?: string }) =>
  new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime();

const useInstancesListWithDescribe = (queryOptions: QueryOptions = {}) => {
  const { onlyInstances, describeInstances, ...restOptions } = queryOptions;

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
          res = res.filter((instance: any) => !isCloudAccountInstance(instance));
        } else {
          res = res.filter((instance: any) => isCloudAccountInstance(instance));
        }
        return res;
      },
      refetchInterval: 60000,
      ...restOptions,
    }
  );

  const describeQuery = useQuery({
    queryKey: ["resource-instances-describe", listQuery.dataUpdatedAt, serviceOfferings],
    enabled: Boolean(describeInstances && listQuery.data),
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
          return [];
        }

        try {
          const describeResponse = await getResourceInstanceDetails(
            serviceOffering?.serviceProviderId as string,
            serviceOffering?.serviceURLKey as string,
            serviceOffering?.serviceAPIVersion as string,
            serviceOffering?.serviceEnvironmentURLKey as string,
            serviceOffering?.serviceModelURLKey as string,
            serviceOffering?.productTierURLKey as string,
            mainResource?.urlKey,
            instance.id,
            instance.subscriptionId
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

  if (describeInstances) {
    return {
      ...listQuery,
      data: describeQuery.data || [],
      isPending: listQuery.isPending || describeQuery.isPending,
      isFetching: listQuery.isFetching || describeQuery.isFetching,
      error: listQuery.error || describeQuery.error,
      refetch: async () => {
        await listQuery.refetch();
        return describeQuery.refetch();
      },
    };
  }

  return {
    ...listQuery,
    data: (listQuery.data || []).sort(sortByCreatedAtDesc),
  };
};

export default useInstancesListWithDescribe;

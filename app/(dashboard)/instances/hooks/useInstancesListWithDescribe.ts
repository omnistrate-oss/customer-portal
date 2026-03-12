import { useQuery } from "@tanstack/react-query";

import { apiClient } from "src/api/client";
import { getResourceInstanceDetails } from "src/api/resourceInstance";
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
  const { onlyCloudAccounts = true, ...restOptions } = queryOptions;

  const { serviceOfferings, isServiceOfferingsPending } = useGlobalData();
  const environmentType = useEnvironmentType();

  // Derive a stable key from serviceOfferings so the query re-runs when they load
  const serviceOfferingIds = serviceOfferings?.map((so: any) => so?.serviceId).join(",") ?? "";

  const listQuery = useQuery({
    queryKey: [
      "get",
      "/2022-09-01-00/resource-instance",
      { params: { query: { environmentType } } },
      onlyCloudAccounts,
      serviceOfferingIds,
    ],
    queryFn: async () => {
      const { data } = await apiClient.GET("/2022-09-01-00/resource-instance", {
        params: {
          query: {
            environmentType,
          },
        },
      });

      let res = data?.resourceInstances ?? [];

      if (onlyCloudAccounts) {
        res = res.filter((instance: any) => isCloudAccountInstance(instance));
      } else {
        res = res.filter((instance: any) => !isCloudAccountInstance(instance));
      }

      const describePromises = res.map(async (instance: any) => {
        const serviceOffering = serviceOfferings?.find((so: any) =>
          so?.resourceParameters?.some((resourceParam: any) => resourceParam?.resourceId === instance?.resourceID)
        );

        if (serviceOffering) {
          const describeResponse = await getResourceInstanceDetails(
            serviceOffering.serviceProviderId as string,
            serviceOffering.serviceURLKey as string,
            serviceOffering.serviceAPIVersion as string,
            serviceOffering.serviceEnvironmentURLKey as string,
            serviceOffering.serviceModelURLKey as string,
            serviceOffering.productTierURLKey as string,
            "omnistrateCloudAccountConfig",
            instance.id,
            instance.subscriptionId
          );

          return describeResponse?.data ?? null;
        }

        return null;
      });

      const results = await Promise.all(describePromises);
      return results.filter((item): item is Record<string, any> => item !== null).sort(sortByCreatedAtDesc);
    },
    // Wait until serviceOfferings are loaded before running the query
    enabled: !isServiceOfferingsPending && serviceOfferings.length > 0,
    refetchInterval: 60000,
    ...restOptions,
  });

  return listQuery;
};

export default useInstancesListWithDescribe;

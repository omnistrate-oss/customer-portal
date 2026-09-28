import { useQueries, useQuery, UseQueryResult } from "@tanstack/react-query";

import { getCloudProviders } from "src/api/cloudProvider";
import { $api } from "src/api/query";
import { CloudProviderDetails, Region } from "src/types/region";

type UseRegionsResult = {
  data: Region[] | undefined;
  isFetching: boolean;
};

// Module-level, so useQueries keeps each combined result stable between renders
const combineRegionIds = (results: UseQueryResult<{ ids?: string[] }, unknown>[]) => ({
  regionIds: results.flatMap((result) => result.data?.ids ?? []),
  isFetching: results.some((result) => result.isFetching),
  isSuccess: results.every((result) => result.isSuccess),
});

const combineRegions = (results: UseQueryResult<Region, unknown>[]) => ({
  regions: results.flatMap((result) => (result.data ? [result.data] : [])),
  isFetching: results.some((result) => result.isFetching),
  isSuccess: results.every((result) => result.isSuccess),
});

const useRegions = (queryOptions = {}): UseRegionsResult => {
  const options = { refetchOnMount: false, ...queryOptions };

  // Listing cloud providers needs the provider's credentials, so it goes through a portal route
  const cloudProvidersQuery = useQuery({
    queryKey: ["/api/cloud-providers"],
    queryFn: async () => {
      const cloudProviders: CloudProviderDetails[] = (await getCloudProviders()).data;
      return cloudProviders.map((cloudProvider) => cloudProvider?.name);
    },
    ...options,
  });

  const regionIdsQueries = useQueries({
    queries: (cloudProvidersQuery.data ?? []).map((cloudProviderName) =>
      $api.queryOptions(
        "get",
        "/2022-09-01-00/region/cloudprovider/{cloudProviderName}",
        { params: { path: { cloudProviderName } } },
        options
      )
    ),
    combine: combineRegionIds,
  });

  // Regions are described once every cloud provider's list has loaded
  const regionQueries = useQueries({
    queries: (regionIdsQueries.isSuccess ? regionIdsQueries.regionIds : []).map((id) =>
      $api.queryOptions("get", "/2022-09-01-00/region/{id}", { params: { path: { id } } }, options)
    ),
    combine: combineRegions,
  });

  const isSuccess = cloudProvidersQuery.isSuccess && regionIdsQueries.isSuccess && regionQueries.isSuccess;

  return {
    // All or nothing: no regions until every lookup has succeeded
    data: isSuccess ? regionQueries.regions : undefined,
    isFetching: cloudProvidersQuery.isFetching || regionIdsQueries.isFetching || regionQueries.isFetching,
  };
};

export default useRegions;

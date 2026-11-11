import { useQueries, UseQueryResult } from "@tanstack/react-query";

import { $api } from "src/api/query";
import { AvailabilityZone } from "src/types/availabilityZone";
import { CloudProvider } from "src/types/common/enums";

type QueryParams = {
  regionCode: string;
  cloudProviderName: CloudProvider;
  hasCustomAvailabilityZoneField?: boolean;
};

const combineZones = (results: UseQueryResult<AvailabilityZone>[]) => ({
  data: results.flatMap((result) => (result.data ? [result.data] : [])),
  isLoading: results.some((result) => result.isLoading),
});

const useAvailabilityZone = (queryParams: QueryParams, queryOptions = {}) => {
  const { regionCode, cloudProviderName, hasCustomAvailabilityZoneField = true } = queryParams;
  const isEnabled = Boolean(regionCode && cloudProviderName && hasCustomAvailabilityZoneField);

  // The region list returns zone IDs only; each zone's code comes from its describe call.
  const zoneIdsQuery = $api.useQuery(
    "get",
    "/2022-09-01-00/availability-zone/region/code/{regionCode}/cloud-provider/{cloudProviderName}",
    {
      params: {
        path: {
          regionCode,
          cloudProviderName,
        },
      },
    },
    {
      enabled: isEnabled,
      ...queryOptions,
    }
  );

  const zones = useQueries({
    queries: (zoneIdsQuery.data?.ids ?? []).map((id) =>
      $api.queryOptions("get", "/2022-09-01-00/availability-zone/{id}", { params: { path: { id } } })
    ),
    combine: combineZones,
  });

  return {
    data: zones.data,
    isLoading: zoneIdsQuery.isLoading || zones.isLoading,
  };
};

export default useAvailabilityZone;

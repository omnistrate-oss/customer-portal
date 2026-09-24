import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import axios from "axios";

import { ReleaseSummary } from "src/types/tier-version-set";

async function fetchVersionSets(params: { serviceId?: string; productTierId?: string }): Promise<ReleaseSummary[]> {
  const { serviceId, productTierId } = params;

  const response = await axios.get<ReleaseSummary[]>("/api/version-sets", {
    params: { serviceId, productTierId },
  });

  return response.data || [];
}

const useVersionSets = (
  queryParams: { serviceId?: string; productTierId?: string },
  queryOptions: Omit<UseQueryOptions<ReleaseSummary[]>, "queryKey" | "queryFn"> = {}
) => {
  const { serviceId, productTierId } = queryParams;

  const query = useQuery({
    queryKey: ["versionSets", serviceId, productTierId],
    queryFn: () => fetchVersionSets({ serviceId, productTierId }),
    enabled: Boolean(serviceId && productTierId),
    ...queryOptions,
  });

  return query;
};

export default useVersionSets;

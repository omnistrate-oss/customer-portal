import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import axios from "axios";

import { TierVersionSet } from "src/types/tier-version-set";

async function fetchVersionSets(params: { serviceId?: string; productTierId?: string }): Promise<TierVersionSet[]> {
  const { serviceId, productTierId } = params;

  const response = await axios.get<TierVersionSet[]>("/api/version-sets", {
    params: { serviceId, productTierId },
  });

  return response.data || [];
}

const useVersionSets = (
  queryParams: { serviceId?: string; productTierId?: string },
  queryOptions: Omit<UseQueryOptions<TierVersionSet[]>, "queryKey" | "queryFn"> = {}
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

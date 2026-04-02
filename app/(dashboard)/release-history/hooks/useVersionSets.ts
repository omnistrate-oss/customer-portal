import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import { TierVersionSet } from "src/types/tier-version-set";

type QueryOptions = {
  [key: string]: any;
};

type VersionSetsResponse = {
  tierVersionSets: TierVersionSet[];
};

async function fetchVersionSets(params: { serviceId?: string; productTierId?: string }): Promise<TierVersionSet[]> {
  const { serviceId, productTierId } = params;

  const response = await axios.get<VersionSetsResponse>("/api/version-sets", {
    params: { serviceId, productTierId },
  });

  return response.data.tierVersionSets || [];
}

const useVersionSets = (
  queryParams: { serviceId?: string; productTierId?: string },
  queryOptions: QueryOptions = {}
) => {
  const { serviceId, productTierId } = queryParams;

  const query = useQuery({
    queryKey: ["versionSets", serviceId, productTierId],
    queryFn: () => fetchVersionSets({ serviceId, productTierId }),
    select: (data) => {
      return [...data].sort(
        (a, b) =>
          new Date(b.releasedAt || b.createdAt || "").getTime() - new Date(a.releasedAt || a.createdAt || "").getTime()
      );
    },
    enabled: Boolean(serviceId && productTierId),
    refetchInterval: 60000,
    ...queryOptions,
  });

  return query;
};

export default useVersionSets;

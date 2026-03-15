import { useQuery } from "@tanstack/react-query";
import axios from "axios";

type QueryParams = {
  serviceId?: string;
  productTierId?: string;
  productTierVersion?: string;
  isInjectedAccountConfig?: boolean;
};

export type ResourceSummary = {
  customDNS: boolean;
  id: string;
  key?: string;
  name: string;
};

type ResourcesResponse = {
  resources: ResourceSummary[];
};

async function fetchResources(params: QueryParams): Promise<ResourceSummary[]> {
  const { serviceId, productTierId, productTierVersion, isInjectedAccountConfig } = params;

  const response = await axios.get("/api/resources", {
    params: {
      serviceId,
      productTierId,
      productTierVersion: productTierVersion || "",
      isInjectedAccountConfig: isInjectedAccountConfig ? "true" : "false",
    },
  });

  return (response.data as ResourcesResponse).resources || [];
}

function useResources(queryParams: QueryParams, queryOptions = {}) {
  const { serviceId, productTierId, productTierVersion, isInjectedAccountConfig = false } = queryParams;

  const query = useQuery({
    queryKey: ["resources", serviceId, productTierId, productTierVersion, isInjectedAccountConfig],
    queryFn: () =>
      fetchResources({
        serviceId,
        productTierId,
        productTierVersion,
        isInjectedAccountConfig,
      }),
    enabled: Boolean(serviceId && productTierId),
    ...queryOptions,
  });

  return query;
}

export default useResources;

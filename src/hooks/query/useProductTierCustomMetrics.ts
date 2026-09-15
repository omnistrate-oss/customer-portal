import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

import { getProductTierCustomMetrics } from "src/api/productTierCustomMetrics";
import type { ProductTierCustomMetricsResponse } from "src/types/productTierCustomMetrics";

type ProductTierCustomMetricsQueryOptions = Omit<
  UseQueryOptions<ProductTierCustomMetricsResponse>,
  "queryKey" | "queryFn"
>;

export default function useProductTierCustomMetrics(
  subscriptionIds: string[],
  queryOptions: ProductTierCustomMetricsQueryOptions = {}
) {
  const normalizedSubscriptionIds = Array.from(new Set(subscriptionIds.filter(Boolean))).sort();
  const { enabled = true, ...options } = queryOptions;

  return useQuery({
    queryKey: ["product-tier-custom-metrics", normalizedSubscriptionIds],
    queryFn: () => getProductTierCustomMetrics(normalizedSubscriptionIds),
    staleTime: 5 * 60 * 1000,
    ...options,
    enabled: normalizedSubscriptionIds.length > 0 && enabled,
  });
}

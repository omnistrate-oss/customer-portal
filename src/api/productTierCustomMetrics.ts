import axios from "src/axios";
import type { ProductTierCustomMetricsResponse } from "src/types/productTierCustomMetrics";

export async function getProductTierCustomMetrics(
  subscriptionIds: string[]
): Promise<ProductTierCustomMetricsResponse> {
  const response = await axios.get<ProductTierCustomMetricsResponse>("/api/product-tier-custom-metrics", {
    baseURL: "",
    params: {
      subscriptionIds: subscriptionIds.join(","),
    },
  });

  return response.data;
}

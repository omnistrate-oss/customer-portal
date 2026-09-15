export type CustomMeteringAggregationFunction = "sum" | "max" | "count";

export type ProductTierCustomMetric = {
  name: string;
  aggregationFunction: CustomMeteringAggregationFunction;
};

export type ProductTierCustomMetrics = {
  serviceId: string;
  productTierId: string;
  metrics: ProductTierCustomMetric[];
};

export type ProductTierCustomMetricsResponse = {
  productTiers: Record<string, ProductTierCustomMetrics>;
  unavailableProductTierIds: string[];
};

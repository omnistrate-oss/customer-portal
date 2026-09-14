import Axios from "axios";

import type { components } from "src/types/schema";

import type {
  CustomMeteringAggregationFunction,
  ProductTierCustomMetrics,
  ProductTierCustomMetricsResponse,
} from "../../types/productTierCustomMetrics";

const providerAxios = require("../axios");
const { baseURL } = require("../../axios");
const ProviderAuthError = require("../utils/ProviderAuthError");
const withProviderTokenExpirationHanding = require("../utils/withProviderTokenExpirationHandling");

type Subscription = components["schemas"]["DescribeSubscriptionResult"];
type ProductTier = components["schemas"]["DescribeProductTierResult"];

type ProductTierIdentifier = {
  serviceId: string;
  productTierId: string;
};

const supportedAggregationFunctions = new Set<CustomMeteringAggregationFunction>(["sum", "max", "count"]);

function getProductTierKey({ serviceId, productTierId }: ProductTierIdentifier) {
  return `${serviceId}:${productTierId}`;
}

export async function getAuthorizedSubscriptions(
  subscriptionIds: string[],
  authToken: string
): Promise<Subscription[]> {
  return Promise.all(
    subscriptionIds.map(async (subscriptionId) => {
      const response = await Axios.get<Subscription>(`${baseURL}/subscription/${encodeURIComponent(subscriptionId)}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      return response.data;
    })
  );
}

function mapProductTierCustomMetrics(
  productTier: ProductTier,
  { serviceId, productTierId }: ProductTierIdentifier
): ProductTierCustomMetrics {
  const metrics = (productTier.customMetering?.metrics ?? []).flatMap((metric) => {
    const name = metric.name;
    const aggregationFunction = metric.aggregationFunction;

    if (typeof name !== "string" || !name.trim() || !supportedAggregationFunctions.has(aggregationFunction)) {
      return [];
    }

    return [{ name, aggregationFunction }];
  });

  return {
    serviceId,
    productTierId,
    metrics,
  };
}

async function fetchProductTierCustomMetrics(
  productTierIdentifiers: ProductTierIdentifier[]
): Promise<ProductTierCustomMetricsResponse> {
  const results = await Promise.allSettled(
    productTierIdentifiers.map(async (identifier) => {
      const { serviceId, productTierId } = identifier;
      try {
        const response = await providerAxios.get(`/service/${serviceId}/product-tier/${productTierId}`);
        return mapProductTierCustomMetrics(response.data as ProductTier, identifier);
      } catch (error) {
        if (Axios.isAxiosError(error) && error.response?.status === 401) {
          throw new ProviderAuthError();
        }
        throw error;
      }
    })
  );

  const providerAuthFailure = results.find(
    (result): result is PromiseRejectedResult =>
      result.status === "rejected" && result.reason?.name === "ProviderAuthError"
  );

  // Let the provider-token wrapper refresh once and retry the complete batch.
  if (providerAuthFailure) {
    throw providerAuthFailure.reason;
  }

  return results.reduce<ProductTierCustomMetricsResponse>(
    (response, result, index) => {
      const productTierId = productTierIdentifiers[index].productTierId;

      if (result.status === "fulfilled") {
        response.productTiers[productTierId] = result.value;
      } else {
        console.error("Failed to fetch product-tier custom metrics", {
          productTierId,
          status: result.reason?.response?.status,
        });
        response.unavailableProductTierIds.push(productTierId);
      }

      return response;
    },
    {
      productTiers: {},
      unavailableProductTierIds: [],
    }
  );
}

export const getProductTierCustomMetrics = withProviderTokenExpirationHanding(fetchProductTierCustomMetrics) as (
  productTierIdentifiers: ProductTierIdentifier[]
) => Promise<ProductTierCustomMetricsResponse>;

export function getUniqueProductTierIdentifiers(subscriptions: Subscription[]): ProductTierIdentifier[] {
  const uniqueProductTiers = new Map<string, ProductTierIdentifier>();

  subscriptions.forEach(({ serviceId, productTierId }) => {
    if (!serviceId || !productTierId) return;

    const identifier = { serviceId, productTierId };
    uniqueProductTiers.set(getProductTierKey(identifier), identifier);
  });

  return Array.from(uniqueProductTiers.values());
}

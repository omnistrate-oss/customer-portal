import type { NextApiRequest, NextApiResponse } from "next";

import {
  getAuthorizedSubscriptions,
  getProductTierCustomMetrics,
  getUniqueProductTierIdentifiers,
} from "src/server/api/product-tier-custom-metrics";
import { getAuthToken } from "src/server/utils/authCookie";
import type { ProductTierCustomMetricsResponse } from "src/types/productTierCustomMetrics";

function parseSubscriptionIds(value: string | string[] | undefined): string[] {
  const values = Array.isArray(value) ? value : value ? [value] : [];

  return Array.from(
    new Set(
      values
        .flatMap((item) => item.split(","))
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProductTierCustomMetricsResponse | { message: string }>
) {
  const defaultErrorMessage = "Something went wrong. Please retry";

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method not allowed" });
  }

  const authToken = getAuthToken(req);
  if (!authToken) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const subscriptionIds = parseSubscriptionIds(req.query.subscriptionIds);

  if (subscriptionIds.length === 0) {
    return res.status(400).json({ message: "subscriptionIds is required" });
  }

  try {
    const subscriptions = await getAuthorizedSubscriptions(subscriptionIds, authToken);
    const productTierIdentifiers = getUniqueProductTierIdentifiers(subscriptions);
    const response =
      productTierIdentifiers.length > 0
        ? await getProductTierCustomMetrics(productTierIdentifiers)
        : { productTiers: {}, unavailableProductTierIds: [] };

    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).json(response);
  } catch (error) {
    const status = getAxiosErrorStatus(error);
    console.error("Failed to get product-tier custom metrics", {
      name: error instanceof Error ? error.name : undefined,
      status,
    });
    if (status === 401) {
      return res.status(401).json({ message: defaultErrorMessage });
    }
    if (status === 403 || status === 404) {
      return res.status(403).json({ message: "One or more subscriptions are not accessible" });
    }

    return res.status(500).json({ message: defaultErrorMessage });
  }
}

function getAxiosErrorStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("response" in error)) return undefined;

  const response = (error as { response?: { status?: unknown } }).response;
  return typeof response?.status === "number" ? response.status : undefined;
}

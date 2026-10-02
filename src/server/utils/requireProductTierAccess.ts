import type { NextApiRequest, NextApiResponse } from "next";
import createFetchClient from "openapi-fetch";

import { baseDomain } from "src/api/client";
import type { paths } from "src/types/schema";

import { getAuthToken } from "./authCookie";
import { getEnvironmentType } from "./getEnvironmentType";
import { validateUserToken } from "./validateUserToken";

export type ProductTierIdentifier = {
  serviceId: string;
  productTierId: string;
};

const customerClient = createFetchClient<paths>({ baseUrl: baseDomain });

// IDs go into the backend URL path, so only word characters and hyphens pass (IDs look like "s-KgFDwg5J6N").
// An ID that doesn't exist gets 403 from the offering lookup below.
const ID_PATTERN = /^[\w-]+$/;

const NOT_AUTHENTICATED = { message: "Not authenticated" };
const NO_ACCESS = { message: "You don't have access to this plan" };
const DEFAULT_ERROR = { message: "Something went wrong. Please retry" };

/**
 * Guards API routes that call the backend with the provider's credentials. The signed-in customer must see
 * the requested plan among their own service offerings, checked with their own token. Otherwise it sends
 * 400, 401, 403 or 500 and returns null.
 *
 * @example
 * // GET /api/resources?serviceId=s-1&productTierId=pt-1
 * const productTier = await requireProductTierAccess(req, res); // { serviceId: "s-1", productTierId: "pt-1" }
 * if (!productTier) return; // the error response was already sent
 */
export async function requireProductTierAccess(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<ProductTierIdentifier | null> {
  const authToken = getAuthToken(req);
  if (!authToken) {
    res.status(401).json(NOT_AUTHENTICATED);
    return null;
  }

  const authentication = await validateUserToken(req);
  if (!authentication.ok) {
    res.status(authentication.status).json({ message: authentication.message });
    return null;
  }

  const { serviceId, productTierId } = req.query;
  if (
    typeof serviceId !== "string" ||
    typeof productTierId !== "string" ||
    !ID_PATTERN.test(serviceId) ||
    !ID_PATTERN.test(productTierId)
  ) {
    res.status(400).json({ message: "Valid serviceId and productTierId are required" });
    return null;
  }

  try {
    // Describing one service returns the same plans the UI lists for it, without fetching every service.
    const { data, response } = await customerClient.GET("/2022-09-01-00/service-offering/{serviceId}", {
      params: { path: { serviceId }, query: { environmentType: getEnvironmentType() } },
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (response.status === 401) {
      res.status(401).json(NOT_AUTHENTICATED);
      return null;
    }
    if (!response.ok && ![400, 403, 404].includes(response.status)) {
      console.error("Service offering lookup failed", { status: response.status });
      res.status(500).json(DEFAULT_ERROR);
      return null;
    }
    if (!data?.offerings?.some((offering) => offering.productTierID === productTierId)) {
      res.status(403).json(NO_ACCESS);
      return null;
    }

    return { serviceId, productTierId };
  } catch (error) {
    console.error("Service offering lookup failed", { name: error instanceof Error ? error.name : undefined });
    res.status(500).json(DEFAULT_ERROR);
    return null;
  }
}

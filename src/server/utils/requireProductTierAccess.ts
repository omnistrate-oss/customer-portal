import type { NextApiRequest, NextApiResponse } from "next";
import createFetchClient from "openapi-fetch";

import { baseDomain } from "src/api/client";
import { ENVIRONMENT_TYPES } from "src/constants/environmentTypes";
import type { paths } from "src/types/schema";

import { getAuthToken } from "./authCookie";

export type ProductTierIdentifier = {
  serviceId: string;
  productTierId: string;
};

const customerClient = createFetchClient<paths>({ baseUrl: baseDomain });

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

  const { serviceId, productTierId } = req.query;
  if (typeof serviceId !== "string" || typeof productTierId !== "string" || !serviceId || !productTierId) {
    res.status(400).json({ message: "serviceId and productTierId are required" });
    return null;
  }

  try {
    const { data, response } = await customerClient.GET("/2022-09-01-00/service-offering/{serviceId}", {
      // The same environment filter the UI uses to list the customer's offerings (app/layout.tsx).
      params: {
        path: { serviceId },
        query: { environmentType: process.env.ENVIRONMENT_TYPE || ENVIRONMENT_TYPES.PROD },
      },
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

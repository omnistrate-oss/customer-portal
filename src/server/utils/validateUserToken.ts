import type { NextApiRequest } from "next";
import { jwtDecode } from "jwt-decode";

import { baseURL } from "src/axios";
import type { components } from "src/types/schema";

import { getAuthToken } from "./authCookie";
import { getEnvironmentType } from "./getEnvironmentType";

type User = components["schemas"]["DescribeUserResult"];

type AccessTokenClaims = {
  organizationID?: unknown;
  serviceProviderID?: unknown;
};

type UserTokenValidationResult =
  | { ok: true; authToken: string; user: User }
  | { ok: false; status: 401 | 403 | 503; message: string };

const AUTHENTICATION_TIMEOUT_MS = 10000;
const NOT_AUTHENTICATED = { ok: false, status: 401, message: "Not authenticated" } as const;
const WRONG_ORGANIZATION = { ok: false, status: 403, message: "Forbidden" } as const;
const AUTHENTICATION_UNAVAILABLE = {
  ok: false,
  status: 503,
  message: "Authentication service unavailable",
} as const;

export async function validateUserToken(req: NextApiRequest): Promise<UserTokenValidationResult> {
  const authToken = getAuthToken(req);

  if (!authToken) {
    return NOT_AUTHENTICATED;
  }

  try {
    const response = await fetch(`${baseURL}/user`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(AUTHENTICATION_TIMEOUT_MS),
    });

    if (response.status === 400 || response.status === 401 || response.status === 403) {
      return NOT_AUTHENTICATED;
    }

    if (response.status !== 200) {
      return AUTHENTICATION_UNAVAILABLE;
    }

    const user = (await response.json()) as User;
    if (typeof user.orgId !== "string" || !user.orgId.trim()) {
      return AUTHENTICATION_UNAVAILABLE;
    }

    // /user has authenticated this exact token. jwtDecode only reads the claims used for the organization check.
    let claims: AccessTokenClaims;
    try {
      claims = jwtDecode<AccessTokenClaims>(authToken);
    } catch {
      return NOT_AUTHENTICATED;
    }

    const { organizationID, serviceProviderID } = claims;
    if (
      typeof organizationID !== "string" ||
      !organizationID.trim() ||
      typeof serviceProviderID !== "string" ||
      !serviceProviderID.trim()
    ) {
      return NOT_AUTHENTICATED;
    }

    const tokenOrgId = getEnvironmentType() === "PROD" ? organizationID : serviceProviderID;
    if (user.orgId !== tokenOrgId) {
      return WRONG_ORGANIZATION;
    }

    return { ok: true, authToken, user };
  } catch {
    return AUTHENTICATION_UNAVAILABLE;
  }
}

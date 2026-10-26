import type { NextApiRequest } from "next";

import { baseURL } from "src/axios";
import type { AuthSession } from "src/types/authSession";
import type { ProviderUser } from "src/types/users";

import { getAuthToken } from "./authCookie";
import { getEnvironmentType } from "./getEnvironmentType";

type UserTokenValidationResult =
  | { ok: true; authToken: string }
  | { ok: false; status: 401 | 403 | 500 | 503; message: string };

const AUTHENTICATION_TIMEOUT_MS = 10000;
const NOT_AUTHENTICATED = { ok: false, status: 401, message: "Not authenticated" } as const;
const WRONG_ORGANIZATION = { ok: false, status: 403, message: "Forbidden" } as const;
const VALIDATION_FAILED = { ok: false, status: 500, message: "Something went wrong. Please retry" } as const;
const SERVICE_UNAVAILABLE = { ok: false, status: 503, message: "Something went wrong. Please retry" } as const;

export async function validateUserToken(req: NextApiRequest): Promise<UserTokenValidationResult> {
  const authToken = getAuthToken(req);

  if (!authToken) {
    return NOT_AUTHENTICATED;
  }

  let headers: Headers;

  try {
    headers = new Headers({
      Accept: "application/json",
      Authorization: `Bearer ${authToken}`,
    });
  } catch {
    return NOT_AUTHENTICATED;
  }

  try {
    const requestOptions = {
      method: "GET",
      headers,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(AUTHENTICATION_TIMEOUT_MS),
    } as const;
    const response = await fetch(`${baseURL}/auth/session`, requestOptions);

    if (response.status === 401) {
      return NOT_AUTHENTICATED;
    }

    if (response.status === 503) {
      return SERVICE_UNAVAILABLE;
    }

    if (response.status !== 200) {
      return VALIDATION_FAILED;
    }

    const session = (await response.json()) as AuthSession;
    if (
      typeof session?.organizationID !== "string" ||
      !session.organizationID.trim() ||
      typeof session.serviceProviderID !== "string" ||
      !session.serviceProviderID.trim()
    ) {
      return NOT_AUTHENTICATED;
    }

    const userResponse = await fetch(`${baseURL}/user`, requestOptions);
    if (userResponse.status === 401) {
      return NOT_AUTHENTICATED;
    }
    if (userResponse.status === 503) {
      return SERVICE_UNAVAILABLE;
    }
    if (userResponse.status !== 200) {
      return VALIDATION_FAILED;
    }

    const user = (await userResponse.json()) as ProviderUser;
    if (typeof user?.orgId !== "string" || !user.orgId.trim()) {
      return NOT_AUTHENTICATED;
    }

    const tokenOrgId = getEnvironmentType() === "PROD" ? session.organizationID : session.serviceProviderID;
    if (user.orgId !== tokenOrgId) {
      return WRONG_ORGANIZATION;
    }

    return { ok: true, authToken };
  } catch {
    return VALIDATION_FAILED;
  }
}

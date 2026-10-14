import type { NextApiRequest } from "next";

import { baseURL } from "src/axios";

import { getAuthToken } from "./authCookie";

type UserTokenValidationResult =
  | { ok: true; authToken: string }
  | { ok: false; status: 401 | 500 | 503; message: string };

const AUTHENTICATION_TIMEOUT_MS = 10000;
const NOT_AUTHENTICATED = { ok: false, status: 401, message: "Not authenticated" } as const;
const VALIDATION_FAILED = { ok: false, status: 500, message: "Something went wrong. Please retry" } as const;
const SERVICE_UNAVAILABLE = { ok: false, status: 503, message: "Something went wrong. Please retry" } as const;

export async function validateUserToken(req: NextApiRequest): Promise<UserTokenValidationResult> {
  const authToken = getAuthToken(req);

  if (!authToken) {
    return NOT_AUTHENTICATED;
  }

  try {
    const response = await fetch(`${baseURL}/auth/session`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(AUTHENTICATION_TIMEOUT_MS),
    });

    if (response.status === 401) {
      return NOT_AUTHENTICATED;
    }

    if (response.status === 503) {
      return SERVICE_UNAVAILABLE;
    }

    if (response.status !== 200) {
      return VALIDATION_FAILED;
    }

    return { ok: true, authToken };
  } catch {
    return VALIDATION_FAILED;
  }
}

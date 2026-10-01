import type { NextApiRequest } from "next";

import { baseURL } from "src/axios";

import { getAuthToken } from "./authCookie";

type UserTokenValidationResult = { ok: true } | { ok: false; status: 401 | 503; message: string };

const AUTHENTICATION_TIMEOUT_MS = 10000;

export async function validateUserToken(req: NextApiRequest): Promise<UserTokenValidationResult> {
  const authToken = getAuthToken(req);

  if (!authToken) {
    return { ok: false, status: 401, message: "Not authenticated" };
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

    if (response.status === 200) {
      return { ok: true };
    }

    if (response.status === 400 || response.status === 401 || response.status === 403) {
      return { ok: false, status: 401, message: "Not authenticated" };
    }

    return { ok: false, status: 401, message: "Not authenticated" };
  } catch {
    return { ok: false, status: 401, message: "Not authenticated" };
  }
}

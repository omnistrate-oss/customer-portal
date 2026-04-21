import type { NextApiRequest, NextApiResponse } from "next";

import {
  COOKIE_NAME,
  INDICATOR_COOKIE_NAME,
  INDICATOR_MAX_AGE,
  isSecureCookie,
  MAX_AGE,
  REFRESH_COOKIE_NAME,
  REFRESH_MAX_AGE,
} from "./authCookieConstants";

export { COOKIE_NAME, REFRESH_COOKIE_NAME };

/**
 * Appends a Set-Cookie header without overwriting existing ones.
 * Next.js's res.setHeader("Set-Cookie", ...) overwrites previous values,
 * so we read existing cookies and append to the array.
 */
function appendSetCookieHeader(res: NextApiResponse, cookie: string) {
  const existing = res.getHeader("Set-Cookie");
  const cookies = Array.isArray(existing) ? existing.map(String) : existing ? [String(existing)] : [];
  res.setHeader("Set-Cookie", [...cookies, cookie]);
}

/**
 * Sets the httpOnly auth cookie on the response.
 */
export function setAuthCookie(res: NextApiResponse, token: string) {
  const parts = [`${COOKIE_NAME}=${token}`, `Path=/`, `HttpOnly`, `SameSite=Lax`, `Max-Age=${MAX_AGE}`];
  if (isSecureCookie) parts.push("Secure");

  appendSetCookieHeader(res, parts.join("; "));
}

/**
 * Sets the httpOnly refresh token cookie on the response.
 */
export function setRefreshCookie(res: NextApiResponse, refreshToken: string) {
  const parts = [
    `${REFRESH_COOKIE_NAME}=${refreshToken}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${REFRESH_MAX_AGE}`,
  ];
  if (isSecureCookie) parts.push("Secure");

  appendSetCookieHeader(res, parts.join("; "));
}

/**
 * Sets the non-httpOnly indicator cookie so client-side auth guards know the user is logged in.
 * Used by server-side auth handlers (idp-auth, signin) that redirect before client JS runs.
 */
export function setIndicatorCookie(res: NextApiResponse) {
  // Not HttpOnly — must be readable by client-side JavaScript
  const parts = [`${INDICATOR_COOKIE_NAME}=true`, `Path=/`, `SameSite=Lax`, `Max-Age=${INDICATOR_MAX_AGE}`];
  if (isSecureCookie) parts.push("Secure");

  appendSetCookieHeader(res, parts.join("; "));
}

/**
 * Clears the httpOnly auth cookie by setting Max-Age=0.
 */
export function clearAuthCookie(res: NextApiResponse) {
  const parts = [`${COOKIE_NAME}=`, `Path=/`, `HttpOnly`, `SameSite=Lax`, `Max-Age=0`];
  if (isSecureCookie) parts.push("Secure");

  appendSetCookieHeader(res, parts.join("; "));
}

/**
 * Clears the httpOnly refresh token cookie by setting Max-Age=0.
 */
export function clearRefreshCookie(res: NextApiResponse) {
  const parts = [`${REFRESH_COOKIE_NAME}=`, `Path=/`, `HttpOnly`, `SameSite=Lax`, `Max-Age=0`];
  if (isSecureCookie) parts.push("Secure");

  appendSetCookieHeader(res, parts.join("; "));
}

// Request type that works with both Pages API routes and Edge middleware.
// Pages Router: req.cookies is a plain object { [name]: value }
// Edge Runtime: req.cookies is a RequestCookies with .get(name) method
type CookieRequest = NextApiRequest | { cookies: { get(name: string): { value: string } | undefined } };

/**
 * Reads the auth token from the request cookies.
 * Works with both Pages API routes (req.cookies is plain object) and Edge middleware (req.cookies.get()).
 */
export function getAuthToken(req: CookieRequest): string | undefined {
  if (req.cookies && typeof req.cookies === "object" && !("get" in req.cookies && typeof req.cookies.get === "function")) {
    return (req.cookies as Record<string, string>)[COOKIE_NAME];
  }
  return (req.cookies as { get(name: string): { value: string } | undefined })?.get(COOKIE_NAME)?.value;
}

/**
 * Reads the refresh token from the request cookies.
 */
export function getRefreshToken(req: CookieRequest): string | undefined {
  if (req.cookies && typeof req.cookies === "object" && !("get" in req.cookies && typeof req.cookies.get === "function")) {
    return (req.cookies as Record<string, string>)[REFRESH_COOKIE_NAME];
  }
  return (req.cookies as { get(name: string): { value: string } | undefined })?.get(REFRESH_COOKIE_NAME)?.value;
}

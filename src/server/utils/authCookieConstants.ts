import { jwtDecode } from "jwt-decode";

// Shared constants for httpOnly auth cookies — used by both the Pages API
// helpers (authCookie.ts) and the Edge-runtime helpers (authCookieEdge.ts).
export const COOKIE_NAME = "omnistrate_token";
export const REFRESH_COOKIE_NAME = "omnistrate_refresh_token";
export const INDICATOR_COOKIE_NAME = "omnistrate_logged_in";

export const FALLBACK_ACCESS_MAX_AGE = 86400; // used only when JWT exp is unreadable
export const REFRESH_MAX_AGE = 86400; // refresh token: 1 day
export const INDICATOR_MAX_AGE = REFRESH_MAX_AGE; // indicator tracks refresh validity

export const isSecureCookie = process.env.NODE_ENV === "production";

// Returns the cookie Max-Age (seconds) for an access JWT.
// - JWT readable + still valid: remaining lifetime.
// - JWT readable + already expired: 0, so the browser drops the cookie immediately
//   instead of holding a known-dead token for a day.
// - JWT unreadable (no exp claim, decode fails): fall back to FALLBACK_ACCESS_MAX_AGE
//   so a misshapen-but-otherwise-good token doesn't lock the user out.
export function maxAgeFromJWT(token: string): number {
  try {
    const exp = jwtDecode<{ exp?: number }>(token)?.exp;
    if (typeof exp !== "number" || !Number.isFinite(exp)) return FALLBACK_ACCESS_MAX_AGE;
    const remaining = exp - Math.floor(Date.now() / 1000);
    return remaining > 0 ? remaining : 0;
  } catch {
    return FALLBACK_ACCESS_MAX_AGE;
  }
}

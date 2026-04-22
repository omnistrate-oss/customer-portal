// Shared constants for httpOnly auth cookies — used by both the Pages API
// helpers (authCookie.ts) and the Edge-runtime helpers (authCookieEdge.ts).
export const COOKIE_NAME = "omnistrate_token";
export const REFRESH_COOKIE_NAME = "omnistrate_refresh_token";
export const INDICATOR_COOKIE_NAME = "omnistrate_logged_in";

// Refresh-related cookie Max-Age values must match the backend's actual
// refresh token lifetime. Setting them longer leaves dead cookies around
// after the backend stops accepting refreshes, causing "logged in but every
// refresh fails" states.
// MAX_AGE is the access-token cookie lifetime and may be longer than the JWT
// exp in some environments (e.g. shorter-lived Dev access tokens — the
// cookie sticks around but the JWT inside expires first, triggering refresh).
export const MAX_AGE = 86400; // access-token cookie lifetime: up to 1 day (15 min JWT exp in Dev)
export const REFRESH_MAX_AGE = 86400; // refresh token: 1 day
export const INDICATOR_MAX_AGE = REFRESH_MAX_AGE; // indicator tracks refresh validity

export const isSecureCookie = process.env.NODE_ENV === "production";

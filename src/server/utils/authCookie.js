const COOKIE_NAME = "omnistrate_token";
const REFRESH_COOKIE_NAME = "omnistrate_refresh_token";
const INDICATOR_COOKIE_NAME = "omnistrate_logged_in";

// 1 day in seconds — matches backend token TTL
const MAX_AGE = 86400;
// 7 days for refresh token
const REFRESH_MAX_AGE = 604800;

/**
 * Sets the httpOnly auth cookie on the response.
 * @param {import("next").NextApiResponse} res
 * @param {string} token - JWT token
 */
function setAuthCookie(res, token) {
  const cookie = [
    `${COOKIE_NAME}=${token}`,
    `Path=/`,
    `HttpOnly`,
    `Secure`,
    `SameSite=Lax`,
    `Max-Age=${MAX_AGE}`,
  ].join("; ");

  appendSetCookieHeader(res, cookie);
}

/**
 * Sets the httpOnly refresh token cookie on the response.
 * @param {import("next").NextApiResponse} res
 * @param {string} refreshToken
 */
function setRefreshCookie(res, refreshToken) {
  const cookie = [
    `${REFRESH_COOKIE_NAME}=${refreshToken}`,
    `Path=/`,
    `HttpOnly`,
    `Secure`,
    `SameSite=Lax`,
    `Max-Age=${REFRESH_MAX_AGE}`,
  ].join("; ");

  appendSetCookieHeader(res, cookie);
}

/**
 * Clears the httpOnly auth cookie by setting Max-Age=0.
 * @param {import("next").NextApiResponse} res
 */
function clearAuthCookie(res) {
  const cookie = [
    `${COOKIE_NAME}=`,
    `Path=/`,
    `HttpOnly`,
    `Secure`,
    `SameSite=Lax`,
    `Max-Age=0`,
  ].join("; ");

  appendSetCookieHeader(res, cookie);
}

/**
 * Clears the httpOnly refresh token cookie by setting Max-Age=0.
 * @param {import("next").NextApiResponse} res
 */
function clearRefreshCookie(res) {
  const cookie = [
    `${REFRESH_COOKIE_NAME}=`,
    `Path=/`,
    `HttpOnly`,
    `Secure`,
    `SameSite=Lax`,
    `Max-Age=0`,
  ].join("; ");

  appendSetCookieHeader(res, cookie);
}

/**
 * Reads the auth token from the request cookies.
 * Works with both Pages API routes (req.cookies) and middleware (request.cookies.get()).
 * @param {import("next").NextApiRequest} req
 * @returns {string | undefined}
 */
function getAuthToken(req) {
  // Pages API routes: req.cookies is a plain object
  if (req.cookies && typeof req.cookies === "object" && !req.cookies.get) {
    return req.cookies[COOKIE_NAME];
  }
  // Middleware: request.cookies is a RequestCookies instance
  return req.cookies?.get(COOKIE_NAME)?.value;
}

/**
 * Reads the refresh token from the request cookies.
 * @param {import("next").NextApiRequest} req
 * @returns {string | undefined}
 */
function getRefreshToken(req) {
  if (req.cookies && typeof req.cookies === "object" && !req.cookies.get) {
    return req.cookies[REFRESH_COOKIE_NAME];
  }
  return req.cookies?.get(REFRESH_COOKIE_NAME)?.value;
}

/**
 * Appends a Set-Cookie header without overwriting existing ones.
 */
function appendSetCookieHeader(res, cookie) {
  const existing = res.getHeader("Set-Cookie") || [];
  const cookies = Array.isArray(existing) ? existing : [existing];
  res.setHeader("Set-Cookie", [...cookies, cookie]);
}

module.exports = {
  COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  INDICATOR_COOKIE_NAME,
  MAX_AGE,
  REFRESH_MAX_AGE,
  setAuthCookie,
  setRefreshCookie,
  clearAuthCookie,
  clearRefreshCookie,
  getAuthToken,
  getRefreshToken,
};

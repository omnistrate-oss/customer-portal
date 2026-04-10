/**
 * Extracts the refresh token from Set-Cookie headers in a backend (axios) response.
 *
 * When the Next.js server calls the backend for signin, the backend may include
 * a refresh token as a Set-Cookie header. Since the customer portal runs on a
 * different domain, these cookies can't reach the browser directly — we capture
 * the value here so it can be re-set as our own httpOnly cookie.
 *
 * @param {import("axios").AxiosResponse} response - Axios response from the backend
 * @returns {string | undefined} The refresh token value, or undefined if not found
 */
function extractBackendRefreshToken(response) {
  const setCookieHeaders = response?.headers?.["set-cookie"];
  if (!setCookieHeaders) return undefined;

  const headers = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];

  for (const header of headers) {
    // Match common refresh token cookie names the backend may use
    const match = header.match(/(?:refresh_token|omnistrate_refresh_token|refreshToken)=([^;]+)/i);
    if (match?.[1]) {
      return match[1];
    }
  }

  return undefined;
}

module.exports = { extractBackendRefreshToken };

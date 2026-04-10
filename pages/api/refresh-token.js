const { setAuthCookie, setRefreshCookie, clearAuthCookie, clearRefreshCookie, getRefreshToken } = require("src/server/utils/authCookie");

const baseDomain = process.env.NEXT_PUBLIC_BACKEND_BASE_DOMAIN || "https://api.omnistrate.cloud";

/**
 * Server-side refresh token endpoint.
 *
 * Reads the refresh token from our httpOnly cookie, sends it to the backend's
 * /refresh-token endpoint, and stores the new access token as an httpOnly cookie.
 *
 * This is necessary because the customer portal runs on a different domain than the
 * backend, so the backend cannot set cookies on the portal's domain directly.
 */
export default async function handleRefreshToken(nextRequest, nextResponse) {
  if (nextRequest.method !== "POST") {
    nextResponse.setHeader("Allow", "POST");
    return nextResponse.status(405).json({ message: "Method not allowed" });
  }

  const refreshToken = getRefreshToken(nextRequest);
  if (!refreshToken) {
    return nextResponse.status(401).json({ message: "No refresh token" });
  }

  try {
    const backendResponse = await fetch(`${baseDomain}/2022-09-01-00/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `refresh_token=${refreshToken}`,
      },
      body: JSON.stringify({}),
    });

    if (!backendResponse.ok) {
      // Refresh failed — clear cookies so user can re-authenticate
      clearAuthCookie(nextResponse);
      clearRefreshCookie(nextResponse);
      return nextResponse.status(401).json({ message: "Refresh failed" });
    }

    // The backend may return a new access token in the response body or via Set-Cookie
    const data = await backendResponse.json().catch(() => ({}));

    // If the backend returns the new JWT in the body, store it
    if (data.jwtToken) {
      setAuthCookie(nextResponse, data.jwtToken);
    }

    // Capture new tokens from Set-Cookie headers (backend may rotate tokens)
    const setCookieHeaders = backendResponse.headers.getSetCookie?.() || [];
    for (const header of setCookieHeaders) {
      // Look for access token
      const accessMatch = header.match(/(?:omnistrate_token|token)=([^;]+)/i);
      if (accessMatch?.[1]) {
        setAuthCookie(nextResponse, accessMatch[1]);
      }

      // Look for rotated refresh token
      const refreshMatch = header.match(/(?:refresh_token|omnistrate_refresh_token|refreshToken)=([^;]+)/i);
      if (refreshMatch?.[1]) {
        setRefreshCookie(nextResponse, refreshMatch[1]);
      }
    }

    return nextResponse.status(200).json({ message: "Token refreshed" });
  } catch (error) {
    console.error("Error refreshing token", error);
    clearAuthCookie(nextResponse);
    clearRefreshCookie(nextResponse);
    return nextResponse.status(401).json({ message: "Refresh failed" });
  }
}

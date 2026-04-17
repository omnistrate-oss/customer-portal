import {
  setAuthCookie,
  setRefreshCookie,
  clearAuthCookie,
  clearRefreshCookie,
  getRefreshToken,
} from "src/server/utils/authCookie";

const baseDomain = process.env.NEXT_PUBLIC_BACKEND_BASE_DOMAIN || "https://api.omnistrate.cloud";

/**
 * Server-side refresh token endpoint.
 *
 * Reads the refresh token from our httpOnly cookie, sends it to the backend's
 * /refresh-token endpoint in the POST body, and stores the new tokens as httpOnly cookies.
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!backendResponse.ok) {
      clearAuthCookie(nextResponse);
      clearRefreshCookie(nextResponse);
      return nextResponse.status(401).json({ message: "Refresh failed" });
    }

    const data = await backendResponse.json().catch(() => ({}));

    if (!data.jwtToken) {
      // Backend returned 200 but no token — treat as failure
      clearAuthCookie(nextResponse);
      clearRefreshCookie(nextResponse);
      return nextResponse.status(401).json({ message: "Refresh failed — no token in response" });
    }

    setAuthCookie(nextResponse, data.jwtToken);
    if (data.refreshToken) {
      setRefreshCookie(nextResponse, data.refreshToken);
    }

    return nextResponse.status(200).json({ message: "Token refreshed" });
  } catch (error) {
    console.error("Error refreshing token", error);
    clearAuthCookie(nextResponse);
    clearRefreshCookie(nextResponse);
    return nextResponse.status(401).json({ message: "Refresh failed" });
  }
}

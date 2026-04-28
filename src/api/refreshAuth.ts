import Cookies from "js-cookie";

const AUTH_INDICATOR_COOKIE = "omnistrate_logged_in";

// Shared refresh state: ensures only one refresh request is in-flight at a time.
// Concurrent 401s queue behind the same promise instead of hammering the endpoint.
let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempt to silently refresh the access token via the server-side refresh endpoint.
 *
 * The browser calls /api/refresh-token (same-origin). The Next.js server reads the
 * httpOnly refresh token cookie, calls the backend with the refresh token in the POST
 * body, and sets a new httpOnly access token cookie in the response.
 *
 * Returns true if refresh succeeded, false if the user must re-authenticate.
 */
export async function refreshAuth(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = doRefresh();
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function doRefresh(): Promise<boolean> {
  try {
    const response = await fetch("/api/refresh-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      // Server set new httpOnly access token cookie via Set-Cookie header.
      // Refresh the indicator cookie so the UI knows we're still authenticated.
      Cookies.set(AUTH_INDICATOR_COOKIE, "true", {
        sameSite: "Lax",
        secure: window.location.protocol === "https:",
        expires: 1,
      });
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

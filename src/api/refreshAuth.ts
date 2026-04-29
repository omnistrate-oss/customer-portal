// Shared refresh state: ensures only one refresh request is in-flight at a time.
// Concurrent 401s queue behind the same promise instead of hammering the endpoint.
let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempt to silently refresh the access token via the server-side refresh endpoint.
 *
 * The browser calls /api/refresh-token (same-origin). The Next.js server reads the
 * httpOnly refresh token cookie, calls the backend with the refresh token in the POST
 * body, and writes new httpOnly auth + refresh cookies and the indicator cookie (with
 * Max-Age driven by the server-side REFRESH_MAX_AGE constant) back in Set-Cookie.
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
    return response.ok;
  } catch {
    return false;
  }
}

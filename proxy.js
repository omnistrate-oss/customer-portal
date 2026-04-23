import { NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

import { baseURL } from "src/axios";
import { PAGE_TITLE_MAP } from "src/constants/pageTitleMap";
import { COOKIE_NAME, REFRESH_COOKIE_NAME } from "src/server/utils/authCookieConstants";
import {
  clearAuthCookieEdge,
  clearIndicatorCookieEdge,
  clearRefreshCookieEdge,
  setAuthCookieEdge,
  setIndicatorCookieEdge,
  setRefreshCookieEdge,
} from "src/server/utils/authCookieEdge";
import { getEnvironmentType } from "src/server/utils/getEnvironmentType";

const environmentType = getEnvironmentType();

function applyRefreshedCookies(response, refreshedToken) {
  if (!refreshedToken) return;
  setAuthCookieEdge(response, refreshedToken.jwtToken);
  if (refreshedToken.refreshToken) {
    setRefreshCookieEdge(response, refreshedToken.refreshToken);
  }
  setIndicatorCookieEdge(response);
}

export async function proxy(request) {
  const authToken = request.cookies.get(COOKIE_NAME);
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME);
  const path = request.nextUrl.pathname;

  if (path.startsWith("/signup") || path.startsWith("/reset-password") || path.startsWith("/change-password")) {
    if (environmentType === "PROD") return;
  }

  const buildRedirectToSignIn = () => {
    const currentPath = request.nextUrl.pathname;
    const search = request.nextUrl.search || "";

    // Prevent Redirecting to the Same Page
    if (currentPath.startsWith("/signin")) return null;
    const destination = currentPath?.startsWith("/") ? currentPath : "";

    const redirectPath = destination ? `/signin?destination=${encodeURIComponent(destination + search)}` : "/signin";

    const response = NextResponse.redirect(new URL(redirectPath, request.url));
    response.headers.set(`x-middleware-cache`, `no-cache`);
    return response;
  };

  // Clears all three cookies before redirecting — a stale indicator
  // cookie would otherwise trick the client into a refresh loop. When
  // we're already on /signin, still clear cookies via NextResponse.next()
  // rather than returning undefined (no-op).
  const clearAuthCookies = (response) => {
    clearAuthCookieEdge(response);
    clearRefreshCookieEdge(response);
    clearIndicatorCookieEdge(response);
    return response;
  };
  const redirectToSignInAndClearAuth = () => {
    const redirect = buildRedirectToSignIn();
    if (redirect) return clearAuthCookies(redirect);
    const passthrough = NextResponse.next();
    passthrough.headers.set(`x-middleware-cache`, `no-cache`);
    return clearAuthCookies(passthrough);
  };

  // When non-null, we just refreshed — skip the /user check below.
  let refreshedToken = null;
  let activeToken = authToken?.value;

  // jwtDecode throws on malformed tokens; treat any decode failure (or a
  // missing/non-numeric exp) as expired so the refresh/redirect path runs.
  const isTokenMissingOrExpired = (tokenValue) => {
    if (!tokenValue) return true;
    try {
      const exp = jwtDecode(tokenValue)?.exp;
      if (typeof exp !== "number") return true;
      return exp < Date.now() / 1000;
    } catch {
      return true;
    }
  };
  const tokenMissingOrExpired = isTokenMissingOrExpired(authToken?.value);

  if (tokenMissingOrExpired) {
    // No refresh token → no recovery path, go to signin.
    if (!refreshToken?.value) {
      return redirectToSignInAndClearAuth();
    }

    let refreshStatus = null;
    try {
      const refreshResponse = await fetch(`${baseURL}/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refreshToken.value, environmentType }),
        signal: AbortSignal.timeout(5000),
      });

      refreshStatus = refreshResponse.status;
      if (refreshResponse.ok) {
        const data = await refreshResponse.json().catch(() => ({}));
        if (data.jwtToken) {
          refreshedToken = data;
          activeToken = data.jwtToken;
        }
      }
    } catch (error) {
      console.error("Middleware refresh failed", error instanceof Error ? error.message : error);
    }

    if (!refreshedToken) {
      // Only treat explicit auth failures (401/403) as a hard logout — the
      // refresh token itself is invalid and no client retry will recover.
      // Transient errors (5xx, timeout, network, missing jwtToken on 200)
      // fall through so the client-side 401 path can retry.
      if (refreshStatus === 401 || refreshStatus === 403) {
        return redirectToSignInAndClearAuth();
      }
      const passthrough = NextResponse.next();
      passthrough.headers.set("x-middleware-cache", "no-cache");
      return passthrough;
    }
  }

  if (!refreshedToken) {
    let userData;
    try {
      userData = await fetch(`${baseURL}/user`, {
        method: "GET",
        headers: { Authorization: `Bearer ${activeToken}` },
        signal: AbortSignal.timeout(5000),
      });
    } catch (error) {
      console.warn("Middleware /user check unavailable, continuing", error instanceof Error ? error.message : error);
    }

    // Only treat explicit auth failures as invalidation. 5xx/timeouts/other
    // transient errors fall through so the client-side 401 path can still
    // recover during a backend incident.
    if (userData && (userData.status === 401 || userData.status === 403)) {
      return redirectToSignInAndClearAuth();
    }
  }

  if (path.startsWith("/signin")) {
    let destination = request.nextUrl.searchParams.get("destination");

    if (!destination || destination.startsWith("//") || !destination.startsWith("/") || !PAGE_TITLE_MAP[destination]) {
      destination = "/instances";
    }

    const response = NextResponse.redirect(new URL(destination, request.url));
    response.headers.set(`x-middleware-cache`, `no-cache`);
    applyRefreshedCookies(response, refreshedToken);
    return response;
  }

  const response = NextResponse.next();
  response.headers.set(`x-middleware-cache`, `no-cache`);
  applyRefreshedCookies(response, refreshedToken);
  return response;
}

/*
 * Match all request paths except for the ones starting with:
 * - signup
 * - reset-password
 * - change-password
 * - validate-token
 * - _next/static (static files)
 * - _next/image (image optimization files)
 * - favicon.ico (favicon file)
 */

export const config = {
  matcher: [
    "/((?!api/action|api/signup|api/signin|api/logout|api/refresh-token|api/reset-password|api/provider-details|api/download-cli|api/download-installer|idp-auth|api/sign-in-with-idp|privacy-policy|cookie-policy|terms-of-use|favicon.ico|_next/image|_next/static|static|validate-token).*)",
  ],
};

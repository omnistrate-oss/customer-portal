import { NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

import { baseURL } from "src/axios";
import { PAGE_TITLE_MAP } from "src/constants/pageTitleMap";
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

export async function proxy(request) {
  const authToken = request.cookies.get("omnistrate_token");
  const refreshToken = request.cookies.get("omnistrate_refresh_token");
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
  // cookie would otherwise trick the client into a refresh loop.
  const redirectToSignInAndClearAuth = () => {
    const response = buildRedirectToSignIn();
    if (!response) return undefined;
    clearAuthCookieEdge(response);
    clearRefreshCookieEdge(response);
    clearIndicatorCookieEdge(response);
    return response;
  };

  // When non-null, we just refreshed — skip the /user check below.
  let refreshedToken = null;
  let activeToken = authToken?.value;

  const tokenMissingOrExpired = !authToken?.value || jwtDecode(authToken.value).exp < Date.now() / 1000;

  if (tokenMissingOrExpired) {
    // No refresh token → no recovery path, go to signin.
    if (!refreshToken?.value) {
      return redirectToSignInAndClearAuth();
    }

    // Same silent-refresh path the client interceptors have — without this,
    // a fresh navigation (e.g., URL copied into a new tab) would bounce
    // through /signin even when the refresh token is still valid.
    try {
      const refreshResponse = await fetch(`${baseURL}/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refreshToken.value }),
      });

      if (!refreshResponse.ok) {
        return redirectToSignInAndClearAuth();
      }

      const data = await refreshResponse.json().catch(() => ({}));
      if (!data.jwtToken) {
        return redirectToSignInAndClearAuth();
      }

      refreshedToken = data;
      activeToken = data.jwtToken;
    } catch (error) {
      console.error("Middleware refresh failed", error);
      return redirectToSignInAndClearAuth();
    }
  }

  try {
    // Defense in depth for the "JWT present and not yet expired" path — catches
    // server-side invalidation (admin revoke, user logged out elsewhere). Skip
    // when we just refreshed, since the backend just minted the JWT.
    if (!refreshedToken) {
      const userData = await fetch(`${baseURL}/user`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });

      if (userData?.status !== 200) {
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
  } catch (error) {
    console.log("Middleware Error", error?.response?.data);
    return redirectToSignInAndClearAuth();
  }

  const response = NextResponse.next();
  response.headers.set(`x-middleware-cache`, `no-cache`);
  applyRefreshedCookies(response, refreshedToken);
  return response;
}

function applyRefreshedCookies(response, refreshedToken) {
  if (!refreshedToken) return;
  setAuthCookieEdge(response, refreshedToken.jwtToken);
  if (refreshedToken.refreshToken) {
    setRefreshCookieEdge(response, refreshedToken.refreshToken);
  }
  setIndicatorCookieEdge(response);
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

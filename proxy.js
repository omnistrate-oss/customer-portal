import { NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

import { baseDomain, baseURL } from "src/axios";
import { PAGE_TITLE_MAP } from "src/constants/pageTitleMap";
import { COOKIE_NAME, REFRESH_COOKIE_NAME } from "src/server/utils/authCookieConstants";
import {
  clearIndicatorCookieEdge,
  setAuthCookieEdge,
  setIndicatorCookieEdge,
  setRefreshCookieEdge,
} from "src/server/utils/authCookieEdge";
import { getEnvironmentType } from "src/server/utils/getEnvironmentType";

const environmentType = getEnvironmentType();

// Backend's Origin-header allowlist rejects refresh calls from non-frontend
// origins. Strip `api.` from the backend domain to derive a whitelisted origin.
function deriveFrontendOrigin() {
  if (!baseDomain || !baseDomain.startsWith("http")) return null;
  try {
    const url = new URL(baseDomain);
    const host = url.hostname.startsWith("api.") ? url.hostname.slice(4) : url.hostname;
    return `${url.protocol}//${host}`;
  } catch {
    return null;
  }
}

function isTokenMissingOrExpired(tokenValue) {
  if (!tokenValue) return true;
  try {
    const exp = jwtDecode(tokenValue)?.exp;
    if (typeof exp !== "number") return true;
    return exp < Date.now() / 1000;
  } catch {
    return true;
  }
}

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

  // Redirect to /signin, preserving the current path as destination.
  // Only clears the indicator cookie (to break redirect loops) — httpOnly
  // cookies are left for the backend to overwrite on next signin.
  const redirectToSignIn = () => {
    const currentPath = request.nextUrl.pathname;
    const search = request.nextUrl.search || "";

    if (currentPath.startsWith("/signin")) {
      const passthrough = NextResponse.next();
      passthrough.headers.set("x-middleware-cache", "no-cache");
      clearIndicatorCookieEdge(passthrough);
      return passthrough;
    }

    const destination = currentPath?.startsWith("/") ? currentPath : "";
    const redirectPath = destination ? `/signin?destination=${encodeURIComponent(destination + search)}` : "/signin";
    const response = NextResponse.redirect(new URL(redirectPath, request.url));
    response.headers.set("x-middleware-cache", "no-cache");
    clearIndicatorCookieEdge(response);
    return response;
  };

  let refreshedToken = null;
  let activeToken = authToken?.value;
  const tokenMissingOrExpired = isTokenMissingOrExpired(authToken?.value);

  if (tokenMissingOrExpired) {
    if (!refreshToken?.value) {
      return redirectToSignIn();
    }

    const frontendOrigin = deriveFrontendOrigin();
    try {
      const refreshResponse = await fetch(`${baseURL}/refresh-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(frontendOrigin ? { Origin: frontendOrigin } : {}),
        },
        body: JSON.stringify({ refreshToken: refreshToken.value, environmentType }),
        signal: AbortSignal.timeout(5000),
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json().catch(() => ({}));
        if (data.jwtToken) {
          refreshedToken = data;
          activeToken = data.jwtToken;
        }
      } else if (refreshResponse.status === 401 || refreshResponse.status === 403) {
        return redirectToSignIn();
      }
    } catch (error) {
      console.error("Middleware refresh failed", error instanceof Error ? error.message : error);
    }

    // Refresh failed for a transient reason (timeout, 5xx, empty response) —
    // pass through and let the client's 401 interceptor handle recovery.
    if (!refreshedToken) {
      const passthrough = NextResponse.next();
      passthrough.headers.set("x-middleware-cache", "no-cache");
      return passthrough;
    }
  }

  // When we didn't just refresh, validate the token with a /user call so the
  // page never loads with a revoked/invalid token (matches pre-httpOnly UX).
  if (!refreshedToken && activeToken) {
    try {
      const userData = await fetch(`${baseURL}/user`, {
        method: "GET",
        headers: { Authorization: `Bearer ${activeToken}` },
        signal: AbortSignal.timeout(5000),
      });

      if (userData.status === 401 || userData.status === 403) {
        return redirectToSignIn();
      }
    } catch (error) {
      // Timeout or network error — pass through; don't punish the user for
      // a backend hiccup. The client's 401 interceptor catches real issues.
      console.warn("Middleware /user check unavailable, continuing", error instanceof Error ? error.message : error);
    }
  }

  if (path.startsWith("/signin")) {
    let destination = request.nextUrl.searchParams.get("destination");

    if (!destination || destination.startsWith("//") || !destination.startsWith("/") || !PAGE_TITLE_MAP[destination]) {
      destination = "/instances";
    }

    const response = NextResponse.redirect(new URL(destination, request.url));
    response.headers.set("x-middleware-cache", "no-cache");
    applyRefreshedCookies(response, refreshedToken);
    return response;
  }

  const response = NextResponse.next();
  response.headers.set("x-middleware-cache", "no-cache");
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

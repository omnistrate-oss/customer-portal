import { NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

import { baseURL } from "src/axios";
import { PAGE_TITLE_MAP } from "src/constants/pageTitleMap";
import { COOKIE_NAME, REFRESH_COOKIE_NAME } from "src/server/utils/authCookieConstants";
import {
  clearAuthCookieEdge,
  clearIndicatorCookieEdge,
  clearRefreshCookieEdge,
} from "src/server/utils/authCookieEdge";
import { getEnvironmentType } from "src/server/utils/getEnvironmentType";

const environmentType = getEnvironmentType();

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

export async function proxy(request) {
  const authToken = request.cookies.get(COOKIE_NAME);
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME);
  const path = request.nextUrl.pathname;

  if (path.startsWith("/signup") || path.startsWith("/reset-password") || path.startsWith("/change-password")) {
    if (environmentType === "PROD") return;
  }

  // Reached only when the session is unrecoverable (no refresh cookie, or
  // /user said the backend has revoked the JWT). Clear all three auth cookies
  // so the next navigation doesn't re-run the /user check against a dead
  // session and loop until the indicator's Max-Age expires.
  const clearAllAuthCookies = (res) => {
    clearAuthCookieEdge(res);
    clearRefreshCookieEdge(res);
    clearIndicatorCookieEdge(res);
  };

  const redirectToSignIn = () => {
    const currentPath = request.nextUrl.pathname;
    const search = request.nextUrl.search || "";

    if (currentPath.startsWith("/signin")) {
      const passthrough = NextResponse.next();
      passthrough.headers.set("x-middleware-cache", "no-cache");
      clearAllAuthCookies(passthrough);
      return passthrough;
    }

    const destination = currentPath?.startsWith("/") ? currentPath : "";
    const redirectPath = destination ? `/signin?destination=${encodeURIComponent(destination + search)}` : "/signin";
    const response = NextResponse.redirect(new URL(redirectPath, request.url));
    response.headers.set("x-middleware-cache", "no-cache");
    clearAllAuthCookies(response);
    return response;
  };

  const tokenExpired = isTokenMissingOrExpired(authToken?.value);

  if (tokenExpired) {
    if (refreshToken?.value) {
      // Refresh token exists — pass through and let the client-side 401
      // interceptor recover via refreshAuth(). Refreshing here would race
      // with the client for the single-use refresh token: the loser gets
      // 401 and logs the user out.
      const passthrough = NextResponse.next();
      passthrough.headers.set("x-middleware-cache", "no-cache");
      return passthrough;
    }
    return redirectToSignIn();
  }

  // Token present and not expired — validate with /user so the page never
  // loads with a revoked token (matches pre-httpOnly UX).
  try {
    const userData = await fetch(`${baseURL}/user`, {
      method: "GET",
      headers: { Authorization: `Bearer ${authToken.value}` },
      signal: AbortSignal.timeout(5000),
    });

    if (userData.status === 401 || userData.status === 403) {
      return redirectToSignIn();
    }
  } catch {
    // Timeout or network error — pass through; the client's 401 interceptor
    // catches real issues.
  }

  if (path.startsWith("/signin")) {
    let destination = request.nextUrl.searchParams.get("destination");

    if (!destination || destination.startsWith("//") || !destination.startsWith("/") || !PAGE_TITLE_MAP[destination]) {
      destination = "/instances";
    }

    const response = NextResponse.redirect(new URL(destination, request.url));
    response.headers.set("x-middleware-cache", "no-cache");
    return response;
  }

  const response = NextResponse.next();
  response.headers.set("x-middleware-cache", "no-cache");
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

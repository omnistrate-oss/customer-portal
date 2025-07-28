import { NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

import { baseURL } from "src/axios";
import { PAGE_TITLE_MAP } from "src/constants/pageTitleMap";
import { getEnvironmentType } from "src/server/utils/getEnvironmentType";

const environmentType = getEnvironmentType();

export async function middleware(request) {
  const authToken = request.cookies.get("token");
  const path = request.nextUrl.pathname;

  if (path.startsWith("/signup") || path.startsWith("/reset-password") || path.startsWith("/change-password")) {
    if (environmentType === "PROD") return;
  }

  const redirectToSignIn = () => {
    const path = request.nextUrl.pathname;
    const search = request.nextUrl.search || "";

    // Prevent Redirecting to the Same Page
    if (path.startsWith("/signin")) return;
    const destination = path?.startsWith("/") ? path : "";

    const redirectPath = destination ? `/signin?destination=${encodeURIComponent(destination + search)}` : "/signin";

    const response = NextResponse.redirect(new URL(redirectPath, request.url));
    response.headers.set(`x-middleware-cache`, `no-cache`);
    return response;
  };

  if (!authToken?.value || jwtDecode(authToken.value).exp < Date.now() / 1000) {
    return redirectToSignIn();
  }

  try {
    const userData = await fetch(`${baseURL}/user`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken.value}`,
      },
    });

    if (userData?.status !== 200) {
      return redirectToSignIn();
    }

    if (request.nextUrl.pathname.startsWith("/signin")) {
      let destination = request.nextUrl.searchParams.get("destination");

      if (!destination || !PAGE_TITLE_MAP[destination]) {
        destination = "/instances";
      }

      const response = NextResponse.redirect(new URL(destination, request.url));
      response.headers.set(`x-middleware-cache`, `no-cache`);
      return response;
    }
  } catch (error) {
    console.log("Middleware Error", error?.response?.data);
    redirectToSignIn();
  }

  const response = NextResponse.next();
  response.headers.set(`x-middleware-cache`, `no-cache`);
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
    "/((?!api/action|api/signup|api/signin|api/reset-password|api/provider-details|idp-auth|api/sign-in-with-idp|privacy-policy|cookie-policy|terms-of-use|favicon.ico|_next/image|_next/static|static|validate-token).*)",
  ],
};

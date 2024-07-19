import { jwtDecode } from "jwt-decode";
import { NextResponse } from "next/server";
import { baseURL } from "src/axios";
import { getEnvironmentType } from "src/server/utils/getEnvironmentType";

const environmentType = getEnvironmentType();

export async function middleware(request) {
  const authToken = request.cookies.get("token");
  const path = request.nextUrl.pathname;

  if (
    path.startsWith("/signup") ||
    path.startsWith("/reset-password") ||
    path.startsWith("/change-password")
  ) {
    if (environmentType === "PROD") return;
  }

  const redirectToSignIn = () => {
    const path = request.nextUrl.pathname;

    // Prevent Redirecting to the Same Page
    if (path.startsWith("/signin")) return;

    let redirectPath = "/signin";

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
    //subscriptions page should only be accessible in PROD
    if (request.nextUrl.pathname.startsWith("/subscriptions")) {
      if (environmentType !== "PROD") {
        const response = NextResponse.redirect(
          new URL("/service-plans", request.url)
        );
        response.headers.set(`x-middleware-cache`, `no-cache`);
        return response;
      }
    }

    if (request.nextUrl.pathname.startsWith("/signin")) {
      const response = NextResponse.redirect(
        new URL("/service-plans", request.url)
      );
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
    "/((?!api/action|api/signup|api/signin|api/reset-password|api/provider-details|idp-auth|api/sign-in-with-idp|privacy-policy|terms-of-use|favicon.ico|_next/image|_next/static|static|validate-token).*)",
  ],
};

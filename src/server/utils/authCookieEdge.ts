import type { NextResponse } from "next/server";

import {
  COOKIE_NAME,
  INDICATOR_COOKIE_NAME,
  INDICATOR_MAX_AGE,
  isSecureCookie,
  MAX_AGE,
  REFRESH_COOKIE_NAME,
  REFRESH_MAX_AGE,
} from "./authCookieConstants";

// Edge-runtime equivalents of the Pages API helpers in authCookie.ts.
// Middleware can't use NextApiResponse — we set cookies via NextResponse.cookies.
// Attributes must stay in lockstep with authCookie.ts.

export function setAuthCookieEdge(res: NextResponse, token: string) {
  res.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
    secure: isSecureCookie,
  });
}

export function setRefreshCookieEdge(res: NextResponse, refreshToken: string) {
  res.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: refreshToken,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_MAX_AGE,
    secure: isSecureCookie,
  });
}

export function setIndicatorCookieEdge(res: NextResponse) {
  // Not HttpOnly — must be readable by client-side JavaScript.
  res.cookies.set({
    name: INDICATOR_COOKIE_NAME,
    value: "true",
    sameSite: "lax",
    path: "/",
    maxAge: INDICATOR_MAX_AGE,
    secure: isSecureCookie,
  });
}

export function clearAuthCookieEdge(res: NextResponse) {
  res.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: isSecureCookie,
  });
}

export function clearRefreshCookieEdge(res: NextResponse) {
  res.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: isSecureCookie,
  });
}

export function clearIndicatorCookieEdge(res: NextResponse) {
  res.cookies.set({
    name: INDICATOR_COOKIE_NAME,
    value: "",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: isSecureCookie,
  });
}

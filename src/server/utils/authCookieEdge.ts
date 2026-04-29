import type { NextResponse } from "next/server";

import { COOKIE_NAME, INDICATOR_COOKIE_NAME, isSecureCookie, REFRESH_COOKIE_NAME } from "./authCookieConstants";

// Edge-runtime cookie clearers used by proxy.js. Middleware runs on the Edge
// runtime which can't use NextApiResponse — we clear cookies via
// NextResponse.cookies. Attributes must stay in lockstep with authCookie.ts.
//
// The setter counterparts (setAuthCookieEdge etc.) were removed when the
// middleware silent-refresh flow was replaced with client-side recovery;
// reintroduce them from authCookie.ts + the shared constants if ever needed.

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

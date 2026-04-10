# Authentication Architecture — Customer Portal

## Overview

The customer portal uses **httpOnly cookies** for authentication. JWT tokens are managed entirely server-side — client-side JavaScript never has access to the raw token. This mitigates XSS-based token theft.

### Cross-Domain Architecture

The customer portal and the Omnistrate backend API run on **different domains**:
- Customer portal: `portal.acme.com` (varies per customer)
- Backend API: `api.omnistrate.cloud` (fixed)

Because they are different origins, the backend **cannot** set cookies on the customer portal's domain. Instead, the Next.js server acts as an intermediary:
1. The Next.js server receives JWT tokens from the backend in response bodies
2. The Next.js server sets httpOnly cookies on its own domain (same-origin with the browser)
3. On subsequent requests, the Next.js server reads the cookie and adds the `Authorization: Bearer` header to backend calls

```
Browser ←──same-origin──→ Next.js Server ──cross-domain──→ Backend API
  (cookies work here)        (reads cookie,                  (receives
                              sets Auth header)               Auth header)
```

### Cookie Summary

Three cookies are used:

| Cookie | Name | Type | Set By | Purpose |
|--------|------|------|--------|---------|
| Auth token | `omnistrate_token` | httpOnly, Secure, SameSite=Lax | Next.js server | Holds the JWT. Set and read only by the server. |
| Refresh token | `omnistrate_refresh_token` | httpOnly, Secure, SameSite=Lax | Next.js server | Holds the refresh token. Used to obtain a new JWT when the current one expires. |
| Indicator | `omnistrate_logged_in` | Regular (JS-accessible) | Browser (js-cookie) | Lets the UI know the user is authenticated. |

## How It Works

### Sign-In Flow

```
Browser                    Next.js Server              Backend API
  │                             │                     (different domain)
  │                             │                          │
  ├─ POST /api/signin ─────────►│                          │
  │  { email, password }        ├─ POST /customer-user-signin ──►│
  │                             │                          │
  │                             │◄── { jwtToken: "..." } ──┤
  │                             │    Set-Cookie: refresh_token=...
  │                             │                          │
  │                             │── (extracts jwtToken +   │
  │                             │   refresh token from     │
  │                             │   backend response,      │
  │                             │   sets httpOnly cookies)  │
  │                             │                          │
  │◄── 200 OK ─────────────────┤                          │
  │    Set-Cookie: omnistrate_token=...; HttpOnly; Secure  │
  │    Set-Cookie: omnistrate_refresh_token=...; HttpOnly  │
  │    (no tokens in body)      │                          │
  │                             │                          │
  ├─ Sets omnistrate_logged_in  │                          │
  │  indicator cookie (JS)      │                          │
  ├─ Redirects to /instances    │                          │
```

1. The browser sends credentials to `/api/signin` (Next.js API route).
2. The Next.js server calls the backend (cross-domain), receives the JWT in the response body and potentially a refresh token via Set-Cookie headers.
3. The **Next.js server** sets the JWT as an httpOnly cookie (`omnistrate_token`) on its response to the browser — the backend cannot set cookies on the customer's domain because it's a different origin. The token never appears in the response body sent to the browser.
4. If the backend returns a refresh token, the server also stores it as `omnistrate_refresh_token` (httpOnly).
5. The client sets a regular `omnistrate_logged_in` indicator cookie for UI state (route guards, request gating).

The same flow applies to IDP (SSO) sign-in via `/api/sign-in-with-idp`.

### Authenticated API Requests

All client-side API calls are proxied through the Next.js server via `POST /api/action`.
The server reads the httpOnly cookie and adds the `Authorization: Bearer` header before
forwarding to the backend (since the backend is on a different domain, browsers won't
send the cookie directly to it):

```
Browser                    Next.js Server              Backend API
  │                             │                     (different domain)
  │                             │                          │
  ├─ POST /api/action ──────────►│                          │
  │  { endpoint, method, data } │                          │
  │  (httpOnly cookie sent      │                          │
  │   automatically, same-origin)│                         │
  │                             ├─ Reads omnistrate_token   │
  │                             │  from request cookies     │
  │                             │                          │
  │                             ├─ GET/POST/... endpoint ──►│
  │                             │  Authorization: Bearer <token>
  │                             │  (header set by server    │
  │                             │   from cookie value)      │
  │                             │                          │
  │                             │◄── response ──────────────┤
  │◄── response ────────────────┤                          │
```

1. The browser sends requests to `/api/action` with request metadata (endpoint, method, data).
2. The `omnistrate_token` httpOnly cookie is sent automatically by the browser (same-origin request to Next.js server).
3. The **Next.js server** reads the token from the cookie and adds the `Authorization: Bearer` header to the backend call — this is necessary because the backend is on a different domain and cannot receive the cookie directly.
4. The response is forwarded back to the browser.

### Logout Flow

```
Browser                    Next.js Server              Backend API
  │                             │                     (different domain)
  │                             │                          │
  ├─ POST /api/logout ──────────►│                          │
  │                             ├─ Reads omnistrate_token   │
  │                             │  from cookie              │
  │                             ├─ POST /logout ───────────►│
  │                             │  Authorization: Bearer <token>
  │                             │                          │
  │◄── 200 OK ─────────────────┤                          │
  │    Set-Cookie: omnistrate_token=; Max-Age=0            │
  │    Set-Cookie: omnistrate_refresh_token=; Max-Age=0    │
  │    (Next.js server clears   │                          │
  │     both httpOnly cookies)  │                          │
  │                             │                          │
  ├─ Removes omnistrate_logged_in│                         │
  ├─ Broadcasts "logout" to     │                          │
  │  other tabs                 │                          │
  ├─ Redirects to /signin       │                          │
```

1. The client calls `POST /api/logout`.
2. The Next.js server reads the httpOnly cookie, calls the backend to invalidate the token, then clears both httpOnly cookies (access + refresh, `Max-Age=0`). The backend cannot clear the cookies because it's on a different domain — the Next.js server handles it.
3. The client removes the indicator cookie, clears local state, and redirects to `/signin`.

### Middleware (Route Protection)

The Next.js middleware (`proxy.js`) runs on every navigation request:

1. Reads the `omnistrate_token` httpOnly cookie (middleware runs server-side, so it can read httpOnly cookies).
2. Decodes the JWT and checks expiration.
3. Validates the token by calling `GET /user` on the backend.
4. Redirects to `/signin` if the token is missing, expired, or invalid.

### 401 Handling & Silent Token Refresh

When any API response returns 401, the client attempts a silent token refresh before logging out:

```
Browser                    Next.js Server              Backend API
  │                             │                     (different domain)
  │                             │                          │
  ├─ Request returns 401 ──────►│                          │
  │                             │                          │
  ├─ POST /api/refresh-token ──►│                          │
  │  (httpOnly refresh cookie   │                          │
  │   sent automatically)       │                          │
  │                             ├─ Reads refresh token     │
  │                             │  from httpOnly cookie     │
  │                             │                          │
  │                             ├─ POST /refresh-token ───►│
  │                             │  Cookie: refresh_token=...│
  │                             │                          │
  │                             │◄── new JWT / Set-Cookie ─┤
  │                             │                          │
  │                             │── Sets new               │
  │                             │   omnistrate_token cookie │
  │                             │                          │
  │◄── 200 OK ─────────────────┤                          │
  │    Set-Cookie: omnistrate_token=...; HttpOnly; Secure  │
  │                             │                          │
  ├─ Retries original request   │                          │
  │  (new httpOnly cookie       │                          │
  │   sent automatically)       │                          │
```

**Refresh flow (both openapi-fetch client and Axios):**

1. On 401, the client calls `POST /api/refresh-token` (same-origin, httpOnly cookies included).
2. The Next.js server reads the `omnistrate_refresh_token` httpOnly cookie.
3. The server forwards it to the backend's `/refresh-token` endpoint.
4. If the backend returns a new JWT (in body or Set-Cookie), the server stores it as the new `omnistrate_token` httpOnly cookie.
5. The client retries the original request — the new cookie is sent automatically.
6. If refresh fails, the user is logged out and redirected to `/signin`.

**Coalescing:** Multiple concurrent 401s share a single refresh request to avoid hammering the endpoint.

**Graceful degradation:** If the backend doesn't issue a refresh token on signin, the refresh attempt simply fails and the user is redirected to sign in — same as the previous behavior.

## Why This Architecture Works for Customer-Hosted Domains

The customer portal can run on **any domain** (e.g., `portal.acme.com`, `app.example.io`). This works because:

1. **All API calls are same-origin.** The browser only communicates with the Next.js server on the same domain. The server then forwards requests to the backend. There are no cross-origin requests from the browser.

2. **Cookies are always first-party.** The httpOnly cookie is set by the Next.js server (same domain as the browser) — not by a third-party backend domain. `SameSite=Lax` works everywhere.

3. **No domain configuration needed.** The cookie `Path=/` applies to whatever domain the portal is hosted on. No need to configure cookie domains per customer.

```
Customer domain: portal.acme.com
  │
  ├── Browser ←→ portal.acme.com (Next.js)     ← same-origin, cookies work
  │                    │
  │                    └──→ api.omnistrate.cloud  ← server-to-server, no cookies needed
```

## Cookie Configuration

```javascript
// httpOnly auth cookie (set by server)
{
  httpOnly: true,
  secure: true,        // HTTPS only
  sameSite: "Lax",     // same-origin requests only
  path: "/",           // available to all routes
  maxAge: 86400,       // 1 day — matches backend token TTL
}

// httpOnly refresh token cookie (set by server)
{
  httpOnly: true,
  secure: true,
  sameSite: "Lax",
  path: "/",
  maxAge: 604800,      // 7 days — longer-lived than access token
}

// Indicator cookie (set by client JS)
{
  expires: 1,          // 1 day
  sameSite: "Lax",
  secure: true,
}
```

## Key Files

| File | Role |
|------|------|
| `src/server/utils/authCookie.js` | Server-side cookie utility (set, clear, read access + refresh tokens) |
| `src/server/utils/extractBackendCookies.js` | Extracts refresh token from backend Set-Cookie headers |
| `pages/api/signin.js` | Password sign-in — sets httpOnly access + refresh cookies |
| `pages/api/sign-in-with-idp.js` | IDP sign-in — sets httpOnly access + refresh cookies |
| `pages/api/idp-auth.js` | Legacy IDP callback (Google/GitHub direct) — sets httpOnly cookies |
| `pages/api/logout.js` | Clears both httpOnly cookies, calls backend logout |
| `pages/api/refresh-token.js` | Server-side token refresh — reads refresh cookie, calls backend, sets new access token |
| `pages/api/action.js` | API proxy — reads cookie, adds Authorization header |
| `src/api/client.ts` | openapi-fetch client — 401 → refresh → retry → logout |
| `src/api/refreshAuth.ts` | Client-side refresh utility with request coalescing |
| `src/axios.js` | Axios client — no longer carries Authorization header |
| `src/providers/AxiosGlobalErrorHandler.tsx` | Axios error handler — 401 → refresh → retry → logout |
| `src/hooks/useLogout.js` | Client logout — calls `/api/logout`, clears indicator |
| `proxy.js` | Middleware — reads httpOnly cookie for route protection |

## Security Properties

- **XSS protection**: The JWT is never accessible to client-side JavaScript. Even if an attacker injects a script, they cannot steal the auth token.
- **CSRF protection**: `SameSite=Lax` prevents the cookie from being sent on cross-origin POST requests. The `/api/action` endpoint only accepts POST, so CSRF is blocked.
- **Secure flag**: Cookies are only sent over HTTPS.
- **No token in localStorage/sessionStorage**: Eliminates another common XSS exfiltration vector.

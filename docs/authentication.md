# Authentication Architecture — Customer Portal

## Overview

The customer portal uses **httpOnly cookies** for authentication. JWT tokens are managed entirely server-side — client-side JavaScript never has access to the raw token. This mitigates XSS-based token theft.

---

## Cross-Domain Architecture

The customer portal and the Omnistrate backend API run on **different domains**:
- Customer portal: `portal.acme.com` (varies per customer deployment)
- Backend API: `api.omnistrate.cloud` (fixed)

Because they are different origins, the backend **cannot** set cookies on the customer portal's domain. Instead, the Next.js server acts as an intermediary — it receives tokens from the backend in response bodies and Set-Cookie headers, then re-sets them as httpOnly cookies on its own domain:

```
Browser ←──same-origin──→ Next.js Server ──cross-domain──→ Backend API
  (cookies work here)        (reads cookie,                  (receives
                              sets Auth header)               Auth header)
```

> **Contrast with Omnistrate Cloud UI**: In the Cloud UI, the browser and API share `*.omnistrate.cloud`, so the backend sets httpOnly cookies directly via `Set-Cookie` headers. No server intermediary is needed. See the [Cloud UI authentication doc](../../omnistrate-cloud-ui/docs/authentication.md) for that architecture.

### Why This Works on Any Customer Domain

The customer portal can run on **any domain** (e.g., `portal.acme.com`, `app.example.io`):

1. **All API calls are same-origin.** The browser only communicates with the Next.js server on the same domain. The server forwards requests to the backend. There are no cross-origin requests from the browser.
2. **Cookies are always first-party.** The httpOnly cookie is set by the Next.js server (same domain as the browser). `SameSite=Lax` works everywhere.
3. **No domain configuration needed.** The cookie `Path=/` applies to whatever domain the portal is hosted on.

```
Customer domain: portal.acme.com
  │
  ├── Browser ←→ portal.acme.com (Next.js)     ← same-origin, cookies work
  │                    │
  │                    └──→ api.omnistrate.cloud  ← server-to-server, no cookies needed
```

---

## Cookie Summary

| Cookie | Name | Type | Set By | Purpose |
|--------|------|------|--------|---------|
| Access token | `omnistrate_token` | httpOnly, Secure, SameSite=Lax, 1-day TTL | Next.js server | Holds the JWT. Set and read only by the server. |
| Refresh token | `omnistrate_refresh_token` | httpOnly, Secure, SameSite=Lax, 7-day TTL | Next.js server | Used to obtain a new JWT when the access token expires. |
| Indicator | `omnistrate_logged_in` | Regular (JS-accessible), Secure, SameSite=Lax, 1-day TTL | Browser (js-cookie) | Lets the UI know the user is authenticated. Carries no sensitive data. |

### Cookie Configuration

```javascript
// httpOnly access token (set by Next.js server in authCookie.js)
{
  httpOnly: true,
  secure: true,        // HTTPS only
  sameSite: "Lax",     // blocks cross-origin POST/PUT/DELETE
  path: "/",           // available to all routes
  maxAge: 86400,       // 1 day — matches backend token TTL
}

// httpOnly refresh token (set by Next.js server in authCookie.js)
{
  httpOnly: true,
  secure: true,
  sameSite: "Lax",
  path: "/",
  maxAge: 604800,      // 7 days — longer-lived than access token
}

// Indicator cookie (set by client JS via js-cookie)
{
  secure: true,
  sameSite: "Lax",
  expires: 1,          // 1 day
}
```

---

## Authentication Flows

### Sign-In

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
  │                             │── Extracts jwtToken from │
  │                             │   body + refresh token   │
  │                             │   from Set-Cookie header │
  │                             │── Sets httpOnly cookies   │
  │                             │                          │
  │◄── 200 OK ─────────────────┤                          │
  │    Set-Cookie: omnistrate_token=...; HttpOnly; Secure  │
  │    Set-Cookie: omnistrate_refresh_token=...; HttpOnly  │
  │    Body: { ...rest }        │  (no tokens in body)     │
  │                             │                          │
  ├─ Sets omnistrate_logged_in  │                          │
  │  indicator cookie (JS)      │                          │
  ├─ Redirects to /instances    │                          │
```

1. Browser sends credentials to `/api/signin` (Next.js API route — same-origin).
2. Next.js server calls the backend (cross-domain), receives the JWT in the response body and potentially a refresh token via `Set-Cookie` headers.
3. The server sets `omnistrate_token` (httpOnly) from the JWT. The token is stripped from the response body sent to the browser.
4. If the backend returns a refresh token in `Set-Cookie`, the server captures it and sets `omnistrate_refresh_token` (httpOnly).
5. The client sets the `omnistrate_logged_in` indicator cookie for UI state.

The same flow applies to IDP (SSO) sign-in via `/api/sign-in-with-idp` and the legacy `/api/idp-auth` callback.

### Authenticated API Requests

All client-side API calls are proxied through `POST /api/action`. The server reads the httpOnly cookie and adds the `Authorization: Bearer` header:

```
Browser                    Next.js Server              Backend API
  │                             │                     (different domain)
  │                             │                          │
  ├─ POST /api/action ──────────►│                          │
  │  { endpoint, method, data } │                          │
  │  (httpOnly cookie sent      │                          │
  │   automatically, same-origin)│                         │
  │                             ├─ Reads omnistrate_token   │
  │                             │  from cookie              │
  │                             │                          │
  │                             ├─ GET/POST/... endpoint ──►│
  │                             │  Authorization: Bearer <token>
  │                             │                          │
  │                             │◄── response ──────────────┤
  │◄── response ────────────────┤                          │
```

1. Browser sends a request to `/api/action` with metadata (endpoint, method, data).
2. The `omnistrate_token` cookie is included automatically (same-origin).
3. The server reads the token and sets the `Authorization: Bearer` header for the backend.
4. The response is forwarded back to the browser.

### 401 Handling & Silent Token Refresh

When an API response returns 401, the client attempts a silent refresh before logging out:

```
Browser                    Next.js Server              Backend API
  │                             │                     (different domain)
  │                             │                          │
  ├─ Request returns 401        │                          │
  │                             │                          │
  ├─ POST /api/refresh-token ──►│                          │
  │  (httpOnly refresh cookie   │                          │
  │   sent automatically)       │                          │
  │                             ├─ Reads omnistrate_       │
  │                             │  refresh_token cookie     │
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
  ├─ Refreshes indicator cookie │                          │
  ├─ Retries original request   │                          │
```

**Flow (both openapi-fetch client and Axios interceptors):**

1. On 401, `refreshAuth()` calls `POST /api/refresh-token` (same-origin, httpOnly cookies included).
2. The Next.js server reads `omnistrate_refresh_token` from the cookie.
3. The server forwards it to the backend's `/refresh-token` endpoint.
4. If the backend returns a new JWT (in body or `Set-Cookie`), the server stores it as the new `omnistrate_token` cookie.
5. The client refreshes the indicator cookie and retries the original request — the new cookie is sent automatically.
6. If refresh fails or the retry still returns 401, the user is logged out and redirected to `/signin`.

**Coalescing:** Multiple concurrent 401s share a single refresh request (via a shared promise) to avoid hammering the endpoint.

**Graceful degradation:** If the backend doesn't issue a refresh token on signin, the refresh attempt simply fails and the user is redirected to sign in — same as the pre-refresh behavior.

### Logout

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
  │                             │                          │
  ├─ Removes omnistrate_logged_in│                         │
  ├─ Broadcasts "logout" to     │                          │
  │  other tabs (BroadcastChannel)                         │
  ├─ Redirects to /signin       │                          │
```

1. The client calls `POST /api/logout`.
2. The server reads the access token, calls the backend to invalidate it, then clears both httpOnly cookies (`Max-Age=0`).
3. The client removes the indicator cookie, clears local state, broadcasts logout to other tabs, and redirects to `/signin`.

### Middleware (Route Protection)

The Next.js middleware (`proxy.js`) runs on every navigation request:

1. Reads the `omnistrate_token` httpOnly cookie (middleware runs server-side, can read httpOnly cookies).
2. Decodes the JWT and checks expiration.
3. Validates the token by calling `GET /user` on the backend.
4. Redirects to `/signin` if the token is missing, expired, or invalid.

Excluded routes (no auth required): `/api/action`, `/api/signin`, `/api/signup`, `/api/logout`, `/api/refresh-token`, `/api/reset-password`, `/api/provider-details`, `/api/sign-in-with-idp`, `/idp-auth`, `/validate-token`, static assets, and legal pages.

---

## Security Properties

### XSS Mitigation

**Problem**: Traditional cookie or localStorage token storage allows any JavaScript running on the page to read the token — including injected scripts.

**Solution**: The JWT is in an httpOnly cookie. The `HttpOnly` flag prevents `document.cookie` from accessing it. Even if an attacker injects JavaScript, they **cannot exfiltrate the auth token**. The refresh token is equally protected.

The `omnistrate_logged_in` indicator is intentionally non-httpOnly (the UI reads it), but it carries no sensitive data — it's the string `"true"`.

### CSRF Protection

**Problem**: httpOnly cookies are sent automatically on every same-origin request, which could enable CSRF if an attacker tricks the browser into making a request.

**Mitigations**:
1. **`SameSite=Lax`**: Cookies are only sent on top-level navigations (GET) and same-site requests. Cross-origin `POST`/`PUT`/`DELETE` requests **do not include the cookie**.
2. **POST-only mutation endpoints**: `/api/action`, `/api/logout`, and `/api/refresh-token` only accept POST. Since `SameSite=Lax` blocks cross-origin POST, CSRF is blocked.
3. **`Secure` flag**: Cookies are only transmitted over HTTPS.

### Token Refresh Security

- The refresh token is httpOnly — invisible to JavaScript.
- Refresh requests are coalesced into a single in-flight request, preventing thundering herd on concurrent 401s.
- If refresh fails, the user is immediately logged out — no infinite retry loops.
- On logout, both access and refresh tokens are cleared.

### Defense in Depth

| Layer | Mechanism |
|-------|-----------|
| Token storage | httpOnly cookies — invisible to JS |
| Transport | `Secure` flag — HTTPS only |
| Cross-site | `SameSite=Lax` — blocks cross-origin mutation requests |
| Clickjacking | `X-Frame-Options: DENY` |
| Token expiry | 1-day access TTL, 7-day refresh TTL |
| Silent refresh | Automatic token renewal on 401 |
| Session termination | Logout clears cookies + backend invalidation |
| Multi-tab logout | `BroadcastChannel` propagates logout across tabs |

### What the Indicator Cookie Does NOT Do

The `omnistrate_logged_in` cookie is a **UX optimization**, not a security boundary:
- It allows the API client to abort requests early when the user is clearly logged out.
- It does **not** grant access to anything. All real authorization is performed by the backend using the httpOnly token.
- If an attacker sets `omnistrate_logged_in=true` manually, API calls will still fail with 401 (no valid httpOnly token), triggering a logout.

---

## Key Files

| File | Role |
|------|------|
| `src/server/utils/authCookie.js` | Server-side cookie utility — set, clear, read access + refresh tokens |
| `src/server/utils/extractBackendCookies.js` | Extracts refresh token from backend `Set-Cookie` headers |
| `pages/api/signin.js` | Password sign-in — sets httpOnly access + refresh cookies |
| `pages/api/sign-in-with-idp.js` | IDP sign-in — sets httpOnly access + refresh cookies |
| `pages/api/idp-auth.js` | Legacy IDP callback (Google/GitHub) — sets httpOnly cookies |
| `pages/api/logout.js` | Clears both httpOnly cookies, calls backend logout |
| `pages/api/refresh-token.js` | Server-side token refresh — reads refresh cookie, calls backend, sets new access token |
| `pages/api/action.js` | API proxy — reads access cookie, adds `Authorization` header |
| `src/api/client.ts` | openapi-fetch client — indicator checks, 401 → refresh → retry → logout |
| `src/api/refreshAuth.ts` | Client-side refresh utility with request coalescing |
| `src/axios.js` | Axios client — no Authorization header (server handles it) |
| `src/providers/AxiosGlobalErrorHandler.tsx` | Axios error handler — 401 → refresh → retry → logout |
| `src/hooks/useLogout.js` | Client logout — calls `/api/logout`, clears indicator, broadcasts |
| `proxy.js` | Middleware — reads httpOnly cookie for route protection |

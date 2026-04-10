# Authentication Architecture — Customer Portal

## Overview

The customer portal uses **httpOnly cookies** for authentication. JWT tokens are managed entirely server-side — client-side JavaScript never has access to the raw token. This mitigates XSS-based token theft.

Two cookies are used:

| Cookie | Name | Type | Purpose |
|--------|------|------|---------|
| Auth token | `omnistrate_token` | httpOnly, Secure, SameSite=Lax | Holds the JWT. Set and read only by the server. |
| Indicator | `omnistrate_logged_in` | Regular (JS-accessible) | Lets the UI know the user is authenticated. |

## How It Works

### Sign-In Flow

```
Browser                    Next.js Server              Backend API
  │                             │                          │
  ├─ POST /api/signin ─────────►│                          │
  │  { email, password }        ├─ POST /customer-user-signin ──►│
  │                             │                          │
  │                             │◄── { jwtToken: "..." } ──┤
  │                             │                          │
  │◄── Set-Cookie: omnistrate_token=...; HttpOnly; Secure ─┤
  │◄── 200 OK (no token in body)│                          │
  │                             │                          │
  ├─ Sets omnistrate_logged_in  │                          │
  │  indicator cookie (JS)      │                          │
  ├─ Redirects to /instances    │                          │
```

1. The browser sends credentials to `/api/signin` (Next.js API route).
2. The server calls the backend, receives the JWT in the response body.
3. The server sets the JWT as an **httpOnly cookie** (`omnistrate_token`) on the response — the token never appears in the response body sent to the browser.
4. The client sets a regular `omnistrate_logged_in` indicator cookie for UI state (route guards, request gating).

The same flow applies to IDP (SSO) sign-in via `/api/sign-in-with-idp`.

### Authenticated API Requests

All client-side API calls are proxied through the Next.js server via `POST /api/action`:

```
Browser                    Next.js Server              Backend API
  │                             │                          │
  ├─ POST /api/action ──────────►│                          │
  │  { endpoint, method, data } │                          │
  │  (cookie sent automatically)│                          │
  │                             ├─ Reads omnistrate_token   │
  │                             │  from request cookies     │
  │                             │                          │
  │                             ├─ GET/POST/... endpoint ──►│
  │                             │  Authorization: Bearer <token>
  │                             │                          │
  │                             │◄── response ──────────────┤
  │◄── response ────────────────┤                          │
```

1. The browser sends requests to `/api/action` with request metadata (endpoint, method, data).
2. The `omnistrate_token` httpOnly cookie is sent automatically by the browser (same-origin).
3. The server reads the token from the cookie and adds the `Authorization: Bearer` header to the backend call.
4. The response is forwarded back to the browser.

### Logout Flow

```
Browser                    Next.js Server              Backend API
  │                             │                          │
  ├─ POST /api/logout ──────────►│                          │
  │                             ├─ POST /logout ───────────►│
  │                             │  Authorization: Bearer <token>
  │                             │                          │
  │◄── Set-Cookie: omnistrate_token=; Max-Age=0 ───────────┤
  │                             │                          │
  ├─ Removes omnistrate_logged_in│                         │
  ├─ Broadcasts "logout" to     │                          │
  │  other tabs                 │                          │
  ├─ Redirects to /signin       │                          │
```

1. The client calls `POST /api/logout`.
2. The server calls the backend to invalidate the token, then clears the httpOnly cookie.
3. The client removes the indicator cookie, clears local state, and redirects to `/signin`.

### Middleware (Route Protection)

The Next.js middleware (`proxy.js`) runs on every navigation request:

1. Reads the `omnistrate_token` httpOnly cookie (middleware runs server-side, so it can read httpOnly cookies).
2. Decodes the JWT and checks expiration.
3. Validates the token by calling `GET /user` on the backend.
4. Redirects to `/signin` if the token is missing, expired, or invalid.

### 401 Handling

When any API response returns 401:

- The **openapi-fetch client** (`src/api/client.ts`) removes the `omnistrate_logged_in` indicator cookie, clears localStorage, and redirects to `/signin`.
- The **Axios error handler** (`AxiosGlobalErrorHandler.tsx`) calls the logout handler which does the same.

The httpOnly cookie is left as-is on 401 — it will be overwritten on the next sign-in or cleared by the middleware redirect.

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
| `src/server/utils/authCookie.js` | Server-side cookie utility (set, clear, read) |
| `pages/api/signin.js` | Password sign-in — sets httpOnly cookie |
| `pages/api/sign-in-with-idp.js` | IDP sign-in — sets httpOnly cookie |
| `pages/api/logout.js` | Clears httpOnly cookie, calls backend logout |
| `pages/api/action.js` | API proxy — reads cookie, adds Authorization header |
| `src/api/client.ts` | openapi-fetch client — uses indicator cookie for auth state |
| `src/axios.js` | Axios client — no longer carries Authorization header |
| `src/hooks/useLogout.js` | Client logout — calls `/api/logout`, clears indicator |
| `proxy.js` | Middleware — reads httpOnly cookie for route protection |

## Security Properties

- **XSS protection**: The JWT is never accessible to client-side JavaScript. Even if an attacker injects a script, they cannot steal the auth token.
- **CSRF protection**: `SameSite=Lax` prevents the cookie from being sent on cross-origin POST requests. The `/api/action` endpoint only accepts POST, so CSRF is blocked.
- **Secure flag**: Cookies are only sent over HTTPS.
- **No token in localStorage/sessionStorage**: Eliminates another common XSS exfiltration vector.

import Cookies from "js-cookie";
import createFetchClient from "openapi-fetch";

import { logoutBroadcastChannel } from "src/broadcastChannel";
import { paths } from "src/types/schema";
import { checkIsNonProtectedEndpoint, isAuthError } from "src/utils/authUtils";

import { refreshAuth } from "./refreshAuth";

export const AUTH_INDICATOR_COOKIE = "omnistrate_logged_in";

export const baseDomain = process.env.NEXT_PUBLIC_BACKEND_BASE_DOMAIN || "https://api.omnistrate.cloud";

let globalErrorHandler: ((error: Error) => void) | null = null;
export function setGlobalErrorHandler(handler: ((error: Error) => void) | null) {
  globalErrorHandler = handler;
}

export const apiClient = createFetchClient<paths>();

// Stash of untouched Request clones keyed by the Request openapi-fetch sends.
// openapi-fetch's internal `fetch(request)` disturbs the body stream, so by the
// time onResponse runs, `request.clone()` would throw "Request body is already
// used". Cloning inside onRequest (before fetch consumes the body) and looking
// the clone up by Request identity is the only safe retry path.
const requestClones = new WeakMap<Request, Request>();

apiClient.use({
  async onRequest({ request }) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    const isProtectedEndpoint = !checkIsNonProtectedEndpoint(pathname);
    const hasAuth = typeof document !== "undefined" && !!Cookies.get(AUTH_INDICATOR_COOKIE);

    if (isProtectedEndpoint && !hasAuth) {
      // Redirect to signin — handles stale sessions (e.g., after deployment migration)
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/signin")) {
        window.location.href = "/signin";
      }
      const controller = new AbortController();
      controller.abort("Request aborted because the user is not authenticated");
      return new Request(request, { signal: controller.signal });
    }

    // Authorization header is added server-side by /api/action using the httpOnly cookie

    if (!pathname.startsWith("/api") && pathname.startsWith("/")) {
      // Store original request details
      const originalRequestURL = pathname;
      const originalRequestMethod = request.method;

      let originalRequestPayload;

      // Firefox doesn't always expose request.body, but we can still try to read it
      // assume all non-GET/HEAD requests have a body
      const hasBodyContent = request.method !== "GET" && request.method !== "HEAD" && request.method !== "OPTIONS";

      if (hasBodyContent) {
        try {
          // Clone the request before reading the body to avoid consumption issues
          const requestClone = request.clone();
          const bodyText = await requestClone.text();

          if (bodyText) {
            try {
              originalRequestPayload = JSON.parse(bodyText);
            } catch {
              originalRequestPayload = bodyText;
            }
          }
        } catch (error) {
          console.warn("Failed to read request body:", error);
        }
      }

      // Get original query parameters
      const originalRequestQueryParams = Object.fromEntries(url.searchParams);

      // Create request metadata
      const requestMetaData: {
        endpoint: string;
        method: string;
        data?: any;
        queryParams?: Record<string, string>;
      } = {
        endpoint: originalRequestURL,
        method: originalRequestMethod.toUpperCase(),
      };

      if (originalRequestPayload) {
        requestMetaData.data = originalRequestPayload;
      }
      if (Object.keys(originalRequestQueryParams).length > 0) {
        requestMetaData.queryParams = originalRequestQueryParams;
      }

      // Modify the request
      const newUrl = new URL("/api/action", url.origin);
      newUrl.searchParams.set("endpoint", originalRequestURL);

      // Create new request with modified properties
      const modifiedRequest = new Request(newUrl.toString(), {
        method: "POST",
        headers: new Headers(request.headers), // Create new Headers object
        body: JSON.stringify(requestMetaData),
      });

      // Ensure Content-Type is set for JSON
      modifiedRequest.headers.set("Content-Type", "application/json");

      // Only stash a clone for protected endpoints — refresh-based retries
      // are only attempted for authenticated calls, so cloning the body of
      // non-protected calls (signin, refresh-token, etc.) is wasted work.
      if (isProtectedEndpoint) {
        try {
          requestClones.set(modifiedRequest, modifiedRequest.clone());
        } catch {
          // Locked/disturbed body stream — skip retry support rather than
          // blowing up the request pipeline.
        }
      }
      return modifiedRequest;
    }

    if (isProtectedEndpoint && request.method !== "GET" && request.method !== "HEAD") {
      try {
        requestClones.set(request, request.clone());
      } catch {
        // Locked/disturbed body stream — skip retry support rather than
        // blowing up the request pipeline.
      }
    }
    return request;
  },

  async onResponse({ response, request }) {
    // Pull the stashed retry clone up front and drop the WeakMap entry so the
    // (potentially large) body doesn't sit in memory longer than needed.
    const retryClone = requestClones.get(request);
    requestClones.delete(request);

    // Cache the response body so we only read it once across the error-handling
    // block and the downstream empty/non-JSON handling.
    let cachedResponseText: string | null = null;

    if (!response.ok) {
      const ignoreGlobalErrorSnack = request.headers.get("x-ignore-global-error");

      // Parse the body once up front so isAuthError can inspect the backend's
      // error message (needed to detect 400 "token is missing" / "token is missing from header").
      let parsedMessage: string | null = null;
      let parseError: unknown = null;
      try {
        const contentType = response.headers.get("content-type");
        const hasJsonContent = contentType && contentType.includes("application/json");
        cachedResponseText = await response.clone().text();
        const trimmedResponseText = cachedResponseText.trim();
        if (hasJsonContent && trimmedResponseText) {
          try {
            const body = JSON.parse(cachedResponseText);
            // Guard against structured errors where `message` is an object/array —
            // feeding those into `new Error(...)` yields "[object Object]".
            const bodyMessage = typeof body?.message === "string" ? body.message : null;
            parsedMessage = bodyMessage ?? trimmedResponseText;
          } catch (err) {
            parseError = err;
            parsedMessage = trimmedResponseText || null;
          }
        } else if (trimmedResponseText) {
          parsedMessage = trimmedResponseText;
        }
      } catch (err) {
        parseError = err;
      }

      if (isAuthError(response.status, parsedMessage)) {
        // Check if this isn't the signin URL to avoid redirect loops
        if (!response.url.endsWith("/signin")) {
          // Attempt silent token refresh before forcing logout
          const refreshed = await refreshAuth();
          if (refreshed) {
            // Retry only when it's safe to replay: either we have the
            // undisturbed clone stashed in onRequest, or the request has no
            // body (GET/HEAD) so the original Request object is replayable.
            // Anything else would throw "Request body is already used".
            const isBodyless = request.method === "GET" || request.method === "HEAD";
            if (retryClone || isBodyless) {
              const retryResponse = await fetch(retryClone ?? request);
              if (retryResponse.ok) {
                return retryResponse;
              }
            }
          }

          // Refresh failed or retry still unauthorized — force logout.
          // Await so the server finishes clearing the httpOnly cookies before
          // /signin loads. Middleware redirects away from /signin when the
          // auth cookie is still present, which would bounce us back.
          try {
            await fetch("/api/logout", { method: "POST", keepalive: true });
          } catch {
            // Ignore — we're redirecting regardless.
          }

          Cookies.remove(AUTH_INDICATOR_COOKIE);
          localStorage.removeItem("paymentNotificationHidden");
          try {
            localStorage.removeItem("loggedInUsingSSO");
          } catch (error) {
            console.warn("Failed to clear SSO state:", error);
          }

          // Broadcast so other open tabs/windows also log out.
          if (logoutBroadcastChannel) {
            try {
              logoutBroadcastChannel.postMessage("logout");
            } catch (error) {
              console.warn("Failed to broadcast logout:", error);
            }
          }

          // Use replace so /signin doesn't get added to history (Back would
          // land on the protected page and trigger another 401 bounce).
          window.location.replace("/signin");
        }
      } else if (!ignoreGlobalErrorSnack && globalErrorHandler) {
        const status = String(response.status);

        if (status.startsWith("4") || status.startsWith("5")) {
          if (parseError) {
            console.warn("Failed to parse error response:", parseError);
          }
          const message = parsedMessage || "Something went wrong please try again later";

          const ignoredMessages = [
            "You have not been subscribed to a service yet.",
            "Your provider has not enabled billing for the user.",
            "You have not been enrolled in a service plan with a billing plan yet.",
            "Your provider has not enabled billing for the services.",
          ];

          if (!ignoredMessages.includes(message)) {
            globalErrorHandler(new Error(message));
          }
        }
      }
    }

    // Handle empty responses - Happens for some delete operations
    const text = cachedResponseText ?? (await response.clone().text());
    if (text.trim() === "") {
      console.warn("Received empty response for:", request.url);
      return new Response("{}", {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          "Content-Type": "application/json",
        },
      });
    }

    // Handle non-JSON responses
    if (!response.headers.get("Content-Type")?.includes("application/json")) {
      console.warn("Non-JSON response received:", text);
      return new Response(JSON.stringify({ data: text }), {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          "Content-Type": "application/json",
        },
      });
    }

    return response;
  },
});

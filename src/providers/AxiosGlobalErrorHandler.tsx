import { useEffect, useState } from "react";
import { Alert, Snackbar } from "@mui/material";
import Cookies from "js-cookie";
import _ from "lodash";

import { AUTH_INDICATOR_COOKIE } from "src/api/client";
import { refreshAuth } from "src/api/refreshAuth";
import axios, { baseURL } from "src/axios";
import { logoutBroadcastChannel } from "src/broadcastChannel";
import { checkIsNonProtectedEndpoint, isAuthError } from "src/utils/authUtils";

const AxiosGlobalErrorHandler = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");

  function handleClose() {
    setIsOpen(false);
    setSnackbarMsg("");
  }

  useEffect(() => {
    const requestInterceptorId = axios.interceptors.request.use((config) => {
      // cancel the request if auth indicator is missing for protected endpoints
      const isProtectedEndpoint = !checkIsNonProtectedEndpoint(config.url || "");
      const hasAuth = typeof document !== "undefined" && !!Cookies.get(AUTH_INDICATOR_COOKIE);

      if (isProtectedEndpoint && !hasAuth) {
        // Redirect to signin — handles stale sessions (e.g., after deployment migration)
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/signin")) {
          window.location.href = "/signin";
        }
        const controller = new AbortController();
        config.signal = controller.signal;
        controller.abort("Request aborted due to missing auth token");
        return config;
      }

      if (config.url && !config.url.startsWith("/api") && config.url.startsWith("/")) {
        //the original request url
        const originalRequestURL = config.url;
        //the original request method
        const originalRequestMethod = config.method;
        //the original request payload
        const originalRequestPayload = _.cloneDeep(config.data);
        const orignalRequestQueryParams = _.cloneDeep(config.params);

        //requestMetaData is the payload that will be sent to the next js endpoint
        //it contains information about the original request
        const requestMetaData: any = {
          endpoint: `/2022-09-01-00${originalRequestURL}`,
          method: _.upperCase(originalRequestMethod),
        };

        if (originalRequestPayload) {
          requestMetaData.data = originalRequestPayload;
        }
        if (orignalRequestQueryParams) {
          requestMetaData.queryParams = orignalRequestQueryParams;
        }
        config.params = { endpoint: originalRequestURL };

        config.baseURL = "";
        config.url = "/api/action";
        config.method = "post";

        config.data = requestMetaData;
      }
      return config;
    });

    const responseInterceptorId = axios.interceptors.response.use(
      (response) => {
        return response;
      },
      async function (error) {
        // Silently swallow requests canceled by the auth guard (no indicator cookie).
        // The auth guard already triggers a redirect to /signin — showing an error toast
        // would just flash "Something went wrong" before the redirect completes.
        if (error.code === "ERR_CANCELED") {
          return Promise.reject(error);
        }

        const ignoreGlobalErrorSnack = error.config?.ignoreGlobalErrorSnack;

        // Extract backend message from either a plain-string body or a `.message` field
        // so isAuthError can detect 400 "token is missing from header" in both shapes.
        const responseMessage =
          typeof error.response?.data === "string" ? error.response.data : error.response?.data?.message;

        if (error.response && isAuthError(error.response.status, responseMessage)) {
          if (`${baseURL}/signin` !== error.request.responseURL) {
            // Attempt silent token refresh before forcing logout
            const refreshed = await refreshAuth();
            if (refreshed && error.config && !error.config._retried) {
              try {
                error.config._retried = true;
                return await axios.request(error.config);
              } catch {
                // Retry failed — fall through to logout
              }
            }
            // Force logout with a hard nav. Using `logout()` here does a soft
            // router.replace that lets React keep rendering — enough time for
            // the rejected 401 to reach React Query's onError and flash the
            // error snackbar before /signin mounts.
            // Await so the server finishes clearing the httpOnly cookies
            // before /signin loads — middleware redirects away from /signin
            // when the auth cookie is still present and valid, which would
            // bounce us back.
            try {
              await fetch("/api/logout", { method: "POST", keepalive: true });
            } catch {
              // Ignore — we're redirecting regardless.
            }
            Cookies.remove(AUTH_INDICATOR_COOKIE);
            localStorage.removeItem("paymentNotificationHidden");
            try {
              localStorage.removeItem("loggedInUsingSSO");
            } catch (err) {
              console.warn("Failed to clear SSO state:", err);
            }
            // Broadcast so other open tabs/windows also log out.
            if (logoutBroadcastChannel) {
              try {
                logoutBroadcastChannel.postMessage("logout");
              } catch (err) {
                console.warn("Failed to broadcast logout:", err);
              }
            }
            // Use replace so /signin doesn't get added to history (Back would
            // land on the protected page and trigger another 401 bounce).
            window.location.replace("/signin");
          }
        } else if (!ignoreGlobalErrorSnack) {
          if (error.response && error.response.data) {
            const status = String(error.response.status);
            if (status.startsWith("4") || status.startsWith("5")) {
              const message = error.response.data.message;
              const ignoredMessages = [
                "You have not been subscribed to a service yet.",
                "Your provider has not enabled billing for the user.",
                "You have not been enrolled in a service plan with a billing plan yet.",
                "Your provider has not enabled billing for the services.",
              ];
              if (!ignoredMessages.includes(message)) {
                if (message) {
                  setSnackbarMsg(message);
                  setIsOpen(true);
                } else {
                  setSnackbarMsg("Something went wrong please try again later");
                  setIsOpen(true);
                }
              }
            }
          } else {
            setSnackbarMsg("Something went wrong please try again later");
            setIsOpen(true);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptorId);
      axios.interceptors.response.eject(responseInterceptorId);
    };
  }, []);

  return (
    <Snackbar open={isOpen} autoHideDuration={5000} onClose={handleClose}>
      <Alert onClose={handleClose} variant="filled" severity={"error"} sx={{ width: "100%", fontWeight: 500 }}>
        {snackbarMsg}
      </Alert>
    </Snackbar>
  );
};

export default AxiosGlobalErrorHandler;

import { useEffect, useState } from "react";
import { Alert, Snackbar } from "@mui/material";
import Cookies from "js-cookie";
import _ from "lodash";

import axios, { baseURL } from "src/axios";
import useLogout from "src/hooks/useLogout";
import { checkIsNonProtectedEndpoint } from "src/utils/authUtils";

const AxiosGlobalErrorHandler = () => {
  const { handleLogout } = useLogout();
  const [isOpen, setIsOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");

  function handleClose() {
    setIsOpen(false);
    setSnackbarMsg("");
  }

  useEffect(() => {
    axios.interceptors.request.use((config) => {
      const isCliDownload = /^\/service\/[^/]+\/service-api\/[^/]+\/cli$/.test(config.url);

      // cancel the request if auth cookie is missing for protected endpoints
      const isProtectedEndpoint = !checkIsNonProtectedEndpoint(config.url || "");
      const hasAuthToken = typeof document !== "undefined" && !!Cookies.get("token");

      if (isProtectedEndpoint && !hasAuthToken) {
        // Abort this request with AbortController
        const controller = new AbortController();
        config.signal = controller.signal;
        controller.abort("Request aborted due to missing auth token");
        return config; // Axios will reject the request after seeing the aborted signal
      }

      if (!config.url.startsWith("/api") && config.url.startsWith("/") && !isCliDownload) {
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

    axios.interceptors.response.use(
      (response) => {
        return response;
      },
      async function (error) {
        const ignoreGlobalErrorSnack = error.config.ignoreGlobalErrorSnack; //state passed with each request to suppress the global snackbar errors if true the errors are ignore
        if (error.response && error.response.status === 401) {
          if (`${baseURL}/signin` !== error.request.responseURL) {
            handleLogout();
          }
        } else if (error.response && error.response.data && !ignoreGlobalErrorSnack) {
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

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject();
      axios.interceptors.response.eject();
    };
  }, [handleLogout]);

  return (
    <Snackbar open={isOpen} autoHideDuration={5000} onClose={handleClose}>
      <Alert onClose={handleClose} variant="filled" severity={"error"} sx={{ width: "100%", fontWeight: 500 }}>
        {snackbarMsg}
      </Alert>
    </Snackbar>
  );
};

export default AxiosGlobalErrorHandler;

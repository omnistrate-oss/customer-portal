import createFetchClient from "openapi-fetch";

import { baseDomain } from "src/api/client";
import { isAllowedRoute } from "src/server/utils/allowedRoutes";
import { httpRequestMethods } from "src/server/utils/constants/httpsRequestMethods";
import { isPasswordSameAsEmail, passwordMatchesEmailText, passwordRegex, passwordText as passwordRegexFailText } from "src/utils/passwordRegex";

// Create the API client
const apiClient = createFetchClient({
  baseUrl: baseDomain,
});

const defaultErrorMessage = "";

// Get app version from environment variable (set during Docker build) or fallback to "dev"
const appVersion = process.env.APP_VERSION || "dev";

export default async function handleAction(nextRequest, nextResponse) {
  if (nextRequest.method === "POST") {
    const { endpoint, method, data = {}, queryParams = {} } = nextRequest.body;

    if (endpoint && method && endpoint?.startsWith("/")) {
      // Reject requests to endpoints not in the allowlist
      if (!isAllowedRoute(method, endpoint)) {
        return nextResponse.status(403).send({ message: "Forbidden" });
      }

      try {
        // Password validation for change-password and update-password endpoints
        if (endpoint === "/2022-09-01-00/change-password" || endpoint === "/2022-09-01-00/update-password") {
          const password = data.password;
          if (password && typeof password === "string") {
            if (!password.match(passwordRegex)) {
              return nextResponse.status(400).send({ message: passwordRegexFailText });
            }
            if (isPasswordSameAsEmail(password, data.email)) {
              return nextResponse.status(400).send({ message: passwordMatchesEmailText });
            }
          }
        }

        // Extract client IP from X-Forwarded-For header
        // xForwardedForHeader has multiple IPs in the format <client>, <proxy1>, <proxy2>
        // Get the first IP (client IP)
        const xForwardedForHeader = nextRequest.get("X-Forwarded-For") || "";
        const clientIP = xForwardedForHeader.split(",").shift().trim();
        const saasBuilderIP = process.env.POD_IP || "";

        // Build custom User-Agent: customer-portal/<version> (<original-user-agent>)
        const originalUserAgent = nextRequest.get("User-Agent") || "";
        const customUserAgent = `customer-portal/${appVersion} (${originalUserAgent})`;

        // Prepare request options
        const requestOptions = {
          params: {
            query: queryParams,
          },
          headers: {
            Authorization: nextRequest.headers.authorization,
            "Client-IP": clientIP,
            "SaaSBuilder-IP": saasBuilderIP,
            "User-Agent": customUserAgent,
          },
        };

        let response;

        // Handle different HTTP methods
        if (method === httpRequestMethods.GET) {
          response = await apiClient.GET(endpoint, requestOptions);
        } else if (method === httpRequestMethods.POST) {
          response = await apiClient.POST(endpoint, {
            ...requestOptions,
            body: data,
          });
        } else if (method === httpRequestMethods.PATCH) {
          response = await apiClient.PATCH(endpoint, {
            ...requestOptions,
            body: data,
          });
        } else if (method === httpRequestMethods.PUT) {
          response = await apiClient.PUT(endpoint, {
            ...requestOptions,
            body: data,
          });
        } else if (method === httpRequestMethods.DELETE) {
          response = await apiClient.DELETE(endpoint, {
            ...requestOptions,
            body: data,
          });
        }

        if (response) {
          const { data: responseData, response: fetchResponse, error } = response;

          // Handle errors from OpenAPI Fetch
          if (error) {
            console.error("Action Route error", error);
            const errorCode = fetchResponse?.status || 500;
            const errorMessage = error.message || defaultErrorMessage;
            return nextResponse.status(errorCode).send({
              message: errorMessage,
            });
          }

          // Set response status
          const responseStatusCode = fetchResponse?.status || 200;
          nextResponse.status(responseStatusCode);

          // Handle binary content (octet-stream)
          const contentType = fetchResponse?.headers.get("content-type");
          if (contentType === "application/octet-stream") {
            return nextResponse.setHeader("content-type", contentType).send(responseData);
          }

          // Send response data
          if (responseData) {
            nextResponse.send(responseData);
          } else {
            nextResponse.send();
          }
          return;
        }
      } catch (error) {
        console.error("Action Route error", error);
        const errorCode = error?.status || 500;
        const errorMessage = error?.message || defaultErrorMessage;
        return nextResponse.status(errorCode).send({
          message: errorMessage,
        });
      }
    }
  }

  // Respond with 500 by default
  return nextResponse.status(500).send({ message: defaultErrorMessage });
}

export const config = {
  api: {
    responseLimit: false,
  },
};

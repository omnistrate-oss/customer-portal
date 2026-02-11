const { customerSignInWithIdentityProvider } = require("src/server/api/customer-user");
const { getEnvironmentType } = require("src/server/utils/getEnvironmentType");
import { getSaaSDomainURL } from "src/server/utils/getSaaSDomainURL";

export default async function handleSignIn(nextRequest, nextResponse) {
  if (nextRequest.method === "POST") {
    try {
      const environmentType = getEnvironmentType();
      const requestBody = {
        ...nextRequest.body,
        environmentType: environmentType,
      };
      const saasDomainURL = getSaaSDomainURL();

      requestBody.redirectUri = `${saasDomainURL}/idp-auth`;

      //xForwardedForHeader has multiple IPs in the format <client>, <proxy1>, <proxy2>
      //get the first IP (client IP)
      const xForwardedForHeader = nextRequest.get("X-Forwarded-For") || "";
      const clientIP = xForwardedForHeader.split(",").shift().trim();
      const saasBuilderIP = process.env.POD_IP;

      const response = await customerSignInWithIdentityProvider(requestBody, {
        "Client-IP": clientIP,
        "SaaSBuilder-IP": saasBuilderIP,
      });

      nextResponse.status(200).send({ ...response.data });
    } catch (error) {
      console.log("IDP Sign In Error");
      const defaultErrorMessage = "Someting went wrong. Please retry";

      if (error.name === "ProviderAuthError" || error?.response?.status === undefined) {
        nextResponse.status(500).send({
          message: defaultErrorMessage,
        });
      } else {
        nextResponse.status(error.response?.status || 500).send({
          message: error.response?.data?.message || defaultErrorMessage,
        });
      }
    }
  } else {
    nextResponse.status(404).json({
      message: "Endpoint not found",
    });
  }
}

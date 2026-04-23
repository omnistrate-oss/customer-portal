import _ from "lodash";

import { getProviderUsers } from "src/server/api/provider-users";
const { customerUserSignIn } = require("src/server/api/customer-user");
const { getEnvironmentType } = require("src/server/utils/getEnvironmentType");
import CaptchaVerificationError from "src/server/errors/CaptchaVerificationError";
import { setAuthCookie, setIndicatorCookie, setRefreshCookie } from "src/server/utils/authCookie";
import { checkReCaptchaSetup } from "src/server/utils/checkReCaptchaSetup";
import { verifyRecaptchaToken } from "src/server/utils/verifyRecaptchaToken";

export default async function handleSignIn(nextRequest, nextResponse) {
  if (nextRequest.method === "POST") {
    let environmentType;
    try {
      const requestBody = nextRequest.body || {};
      const isReCaptchaSetup = checkReCaptchaSetup();
      if (isReCaptchaSetup) {
        const { reCaptchaToken } = requestBody;
        const isVerified = await verifyRecaptchaToken(reCaptchaToken);
        if (!isVerified) throw new CaptchaVerificationError();
      }

      environmentType = getEnvironmentType();
      const payload = {
        ...nextRequest.body,
        environmentType: environmentType,
      };
      //xForwardedForHeader has multiple IPs in the format <client>, <proxy1>, <proxy2>
      //get the first IP (client IP)
      const xForwardedForHeader = nextRequest.get("X-Forwarded-For") || "";
      const clientIP = xForwardedForHeader.split(",").shift().trim();
      const saasBuilderIP = process.env.POD_IP || "";

      const response = await customerUserSignIn(payload, {
        "Client-IP": clientIP,
        "SaaSBuilder-IP": saasBuilderIP,
      });
      const delayInMilliseconds = _.random(0, 150);

      //Wait for a random duration b/w 0ms and 150ms to mask the difference b/w response times of api when a user is present vs not present
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, delayInMilliseconds);
      });

      const responseData = response?.data || {};
      const { jwtToken, refreshToken, ...rest } = responseData;

      // Set httpOnly cookies — the client never sees the raw tokens.
      // Setting the indicator cookie here (not client-side) keeps its Max-Age
      // aligned with REFRESH_MAX_AGE, so client pages don't have to hardcode
      // an expiry that drifts from the backend's refresh lifetime.
      if (jwtToken) {
        setAuthCookie(nextResponse, jwtToken);
        setIndicatorCookie(nextResponse);
      }
      if (refreshToken) {
        setRefreshCookie(nextResponse, refreshToken);
      }

      nextResponse.status(200).send({ ...rest });
    } catch (error) {
      console.error("Error in sign in", error);
      let defaultErrorMessage = "Failed to sign in. Either the credentials are incorrect or the user does not exist";

      //Wait for a random duration b/w 0ms and 150ms to mask the difference b/w response times of api when a user is present vs not present
      const delayInMilliseconds = _.random(0, 150);
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, delayInMilliseconds);
      });

      if (error.name === "ProviderAuthError" || error?.response?.status === undefined) {
        nextResponse.status(400).send({
          message: defaultErrorMessage,
        });
      } else if (error.response?.data?.message === "wrong user email or password") {
        if (environmentType === "PROD") {
          const buildUsersRes = await getProviderUsers();
          const users = buildUsersRes?.data?.orgUsers;
          const email = nextRequest.body.email;
          const emailExistsInBuildUsers = users?.some((user) => user?.email === email);
          if (emailExistsInBuildUsers) {
            defaultErrorMessage = "Omnistrate credentials can’t be used in Production. Use a customer account instead";
          }
        }
        nextResponse.status(400).send({
          message: defaultErrorMessage,
        });
      } else if (
        error.response?.data?.message?.toLowerCase() ===
        "user has not been activated. please check your email for activation link."
      ) {
        nextResponse.status(400).send({
          message: defaultErrorMessage,
        });
      } else {
        nextResponse.status(error.response?.status || 400).send({
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

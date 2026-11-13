import { customerUserResetPassword } from "src/server/api/customer-user";
import CaptchaVerificationError from "src/server/errors/CaptchaVerificationError";
import { getRefreshToken } from "src/server/utils/authCookie";
import { checkReCaptchaSetup } from "src/server/utils/checkReCaptchaSetup";
import { validateUserToken } from "src/server/utils/validateUserToken";
import { verifyRecaptchaToken } from "src/server/utils/verifyRecaptchaToken";

export default async function handleResetPassword(nextRequest, nextResponse) {
  if (nextRequest.method === "POST") {
    try {
      //xForwardedForHeader has multiple IPs in the format <client>, <proxy1>, <proxy2>
      //get the first IP (client IP)
      const xForwardedForHeader = nextRequest.get("X-Forwarded-For") || "";
      const clientIP = xForwardedForHeader.split(",").shift().trim();
      const saasBuilderIP = process.env.POD_IP || "";
      const requestBody = nextRequest.body || {};
      const isReCaptchaSetup = checkReCaptchaSetup();
      if (isReCaptchaSetup) {
        const { reCaptchaToken } = requestBody;
        const isVerified = await verifyRecaptchaToken(reCaptchaToken);
        if (!isVerified) {
          const authentication = await validateUserToken(nextRequest);
          if (!authentication.ok && authentication.status === 401 && !reCaptchaToken && getRefreshToken(nextRequest)) {
            return nextResponse.status(401).send({ message: "Not authenticated" });
          }
          const userEmail = authentication.ok ? authentication.user.email : undefined;
          const requestedEmail = requestBody.email;
          if (
            typeof userEmail !== "string" ||
            !userEmail.trim() ||
            typeof requestedEmail !== "string" ||
            !requestedEmail.trim() ||
            userEmail.trim().toLowerCase() !== requestedEmail.trim().toLowerCase()
          ) {
            throw new CaptchaVerificationError();
          }
        }
      }

      await customerUserResetPassword(
        { email: requestBody.email },
        {
          "Client-IP": clientIP,
          "SaaSBuilder-IP": saasBuilderIP,
        }
      );
      nextResponse.status(200).send();
    } catch (error) {
      const defaultErrorMessage = "Something went wrong. Please retry";

      if (error.name === "ProviderAuthError" || error?.response?.status === undefined) {
        nextResponse.status(500).send({
          message: defaultErrorMessage,
        });
      } else {
        const responseErrorMessage = error.response?.data?.message;

        if (responseErrorMessage === "user not found: record not found") {
          nextResponse.status(200).send();
          return;
        }

        nextResponse.status(error.response?.status || 500).send({
          message: responseErrorMessage || defaultErrorMessage,
        });
      }
    }
  } else {
    nextResponse.status(404).json({
      message: "Endpoint not found",
    });
  }
}

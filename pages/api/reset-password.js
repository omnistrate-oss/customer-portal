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
      // A backend rejection is answered like success, so the response never hints whether an account exists.
      if (error.name !== "ProviderAuthError" && error?.response?.status < 500) {
        return nextResponse.status(200).send();
      }

      nextResponse.status(500).send({ message: "Something went wrong. Please retry" });
    }
  } else {
    nextResponse.status(404).json({
      message: "Endpoint not found",
    });
  }
}

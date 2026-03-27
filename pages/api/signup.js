import { customerUserSignUp } from "src/server/api/customer-user";
import CaptchaVerificationError from "src/server/errors/CaptchaVerificationError";
import { checkReCaptchaSetup } from "src/server/utils/checkReCaptchaSetup";
import { verifyRecaptchaToken } from "src/server/utils/verifyRecaptchaToken";
import { isPasswordSameAsEmail, passwordMatchesEmailText, passwordRegex, passwordText as passwordRegexFailText } from "src/utils/passwordRegex";

export default async function handleSignup(nextRequest, nextResponse) {
  if (nextRequest.method === "POST") {
    try {
      const requestBody = nextRequest.body || {};
      const isReCaptchaSetup = checkReCaptchaSetup();
      if (isReCaptchaSetup) {
        const { reCaptchaToken } = requestBody;
        const isVerified = await verifyRecaptchaToken(reCaptchaToken);
        if (!isVerified) throw new CaptchaVerificationError();
      }

      const { password, email } = requestBody;
      if (password && typeof password === "string") {
        if (!password.match(passwordRegex)) {
          return nextResponse.status(400).send({ message: passwordRegexFailText });
        }
        if (isPasswordSameAsEmail(password, email)) {
          return nextResponse.status(400).send({ message: passwordMatchesEmailText });
        }
      }
      //xForwardedForHeader has multiple IPs in the format <client>, <proxy1>, <proxy2>
      //get the first IP (client IP)
      const xForwardedForHeader = nextRequest.get("X-Forwarded-For") || "";
      const clientIP = xForwardedForHeader.split(",").shift().trim();
      const saasBuilderIP = process.env.POD_IP || "";

      await customerUserSignUp(nextRequest.body, {
        "Client-IP": clientIP,
        "SaaSBuilder-IP": saasBuilderIP,
      });

      nextResponse.status(200).send();
    } catch (error) {
      console.error(error?.response);
      const defaultErrorMessage = "Something went wrong. Please retry";

      if (error.name === "ProviderAuthError" || error?.response?.status === undefined) {
        nextResponse.status(500).send({
          message: defaultErrorMessage,
        });
      } else {
        const responseErrorMessage = error.response?.data?.message;

        if (
          responseErrorMessage?.toLowerCase() === "tenant already exists" ||
          responseErrorMessage?.toLowerCase() ===
            "tenant with a valid token already exists, wait for the current token to expire"
        ) {
          nextResponse.status(200).send();
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

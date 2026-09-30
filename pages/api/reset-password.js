import axios from "src/axios";
import { customerUserResetPassword } from "src/server/api/customer-user";
import CaptchaVerificationError from "src/server/errors/CaptchaVerificationError";
import { checkReCaptchaSetup } from "src/server/utils/checkReCaptchaSetup";
import { errorSummary } from "src/server/utils/errorSummary";
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
      const token = nextRequest.cookies?.token;
      let tokenValidate = false;
      if (token) {
        tokenValidate = await getUser(token);
      }
      if (!tokenValidate && isReCaptchaSetup) {
        const { reCaptchaToken } = requestBody;
        const isVerified = await verifyRecaptchaToken(reCaptchaToken);
        if (!isVerified) throw new CaptchaVerificationError();
      }

      await customerUserResetPassword(requestBody, {
        "Client-IP": clientIP,
        "SaaSBuilder-IP": saasBuilderIP,
      });
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

async function getUser(token) {
  try {
    const response = await axios.get("/user", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.status === 200;
  } catch (error) {
    console.error("getUser error", errorSummary(error));
    return false;
  }
}

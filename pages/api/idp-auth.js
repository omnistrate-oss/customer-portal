import { customerSignInWithIdentityProvider } from "src/server/api/customer-user";
import { getEnvironmentType } from "src/server/utils/getEnvironmentType";
import { setAuthCookie, setIndicatorCookie, setRefreshCookie } from "src/server/utils/authCookie";
import { getSaaSDomainURL } from "src/server/utils/getSaaSDomainURL";

export default async function handleAuth(nextRequest, nextResponse) {
  if (nextRequest.method === "GET") {
    const { state, code } = nextRequest.query;

    let authRequestPayload = null;

    if (state === "google-auth" && code) {
      const saasDomainURL = getSaaSDomainURL();
      const authorizationCode = code;
      authRequestPayload = {
        authorizationCode,
        identityProviderName: "Google",
        redirectUri: `${saasDomainURL}/api/idp-auth`,
        environmentType: getEnvironmentType(),
      };
    } else if (state === "github-auth" && code) {
      const authorizationCode = code;
      authRequestPayload = {
        authorizationCode,
        identityProviderName: "GitHub",
        environmentType: getEnvironmentType(),
      };
    }

    if (authRequestPayload) {
      try {
        const response = await customerSignInWithIdentityProvider(authRequestPayload);
        const jwtToken = response.data.jwtToken;
        const refreshToken = response.data.refreshToken;
        if (jwtToken) {
          setAuthCookie(nextResponse, jwtToken);
          setIndicatorCookie(nextResponse);
        }
        if (refreshToken) {
          setRefreshCookie(nextResponse, refreshToken);
        }
        return nextResponse.redirect(307, "/signin");
      } catch (err) {
        console.error("IDP AUTH error", err);
      }
    }
  }

  //something went wrong, redirect to signin page with
  nextResponse.redirect(307, "/signin?redirect_reason=idp_auth_error");
}

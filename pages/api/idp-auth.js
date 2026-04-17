import { customerSignInWithIdentityProvider } from "src/server/api/customer-user";
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
      };
    } else if (state === "github-auth" && code) {
      const authorizationCode = code;
      authRequestPayload = {
        authorizationCode,
        identityProviderName: "GitHub",
      };
    }

    if (authRequestPayload) {
      try {
        const response = await customerSignInWithIdentityProvider(authRequestPayload);
        const jwtToken = response.data.jwtToken;
        const refreshToken = response.data.refreshToken;
        if (jwtToken) {
          setAuthCookie(nextResponse, jwtToken);
        }
        if (refreshToken) {
          setRefreshCookie(nextResponse, refreshToken);
        }
        setIndicatorCookie(nextResponse);
        return nextResponse.redirect(307, "/signin");
      } catch (err) {
        console.error("IDP AUTH error", err);
      }
    }
  }

  //something went wrong, redirect to signin page with
  nextResponse.redirect(307, "/signin?redirect_reason=idp_auth_error");
}

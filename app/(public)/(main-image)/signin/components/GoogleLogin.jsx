import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { Buffer } from "buffer";
import { flushSync } from "react-dom";
import { v4 as uuidv4 } from "uuid";

import GoogleLoginIcon from "src/components/Icons/GoogleLogin/GoogleLogin";

import { IDENTITY_PROVIDER_TYPES } from "../constants";

import SSOLoginButton from "./SSOLoginButton";

function GoogleLogin(props) {
  const { disabled, saasBuilderBaseURL, invitationInfo = {}, destination } = props;
  const [authState, setAuthState] = useState("");

  const googleLogin = useGoogleLogin({
    onSuccess: async () => {},
    onError: () => {},
    onNonOAuthError: () => {},
    redirect_uri: `${saasBuilderBaseURL}/idp-auth`,
    ux_mode: "redirect",
    flow: "auth-code",
    state: authState,
  });

  function handleGoogleLogin() {
    const uuid = uuidv4();
    const googleAuthState = {
      nonce: uuid,
      destination,
      identityProvider: IDENTITY_PROVIDER_TYPES.Google,
    };
    const encodedGoogleAuthState = Buffer.from(JSON.stringify(googleAuthState), "utf8").toString("base64");
    //synchronously update state to make immediately available to google login hook
    flushSync(() => {
      setAuthState(encodedGoogleAuthState);
    });

    const localAuthState = { ...googleAuthState, invitationInfo };

    const encodedLocalAuthState = Buffer.from(JSON.stringify(localAuthState), "utf8").toString("base64");

    sessionStorage.setItem("authState", encodedLocalAuthState);
    googleLogin();
  }

  return (
    <SSOLoginButton
      data-testid="google-signin-button"
      onClick={() => {
        handleGoogleLogin();
      }}
      disabled={disabled}
      disabledMessage="Temporarily Unavailable"
    >
      <GoogleLoginIcon disabled={disabled} />
    </SSOLoginButton>
  );
}

export default GoogleLogin;

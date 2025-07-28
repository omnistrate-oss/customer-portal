"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next-nprogress-bar";
import { Stack } from "@mui/material";
import { Buffer } from "buffer";
import Cookies from "js-cookie";

import { customerSignInWithIdentityProvider } from "src/api/customer-user";
import axios from "src/axios";
import useEnvironmentType from "src/hooks/useEnvironmentType";
import useSnackbar from "src/hooks/useSnackbar";
import checkRouteValidity from "src/utils/route/checkRouteValidity";
import { getInstancesRoute } from "src/utils/routes";
import LoadingSpinner from "components/LoadingSpinner/LoadingSpinner";
import { Text } from "components/Typography/Typography";

const IDPAuthPage = () => {
  const environmentType = useEnvironmentType();
  const router = useRouter();
  const searchParams = useSearchParams();
  const state = searchParams?.get("state");
  const code = searchParams?.get("code");
  const snackbar = useSnackbar();
  const isAPICallInprogress = useRef(false);

  const handleSignIn = useCallback(
    async (payload, destination) => {
      try {
        isAPICallInprogress.current = true;
        const response = await customerSignInWithIdentityProvider(payload);
        // @ts-ignore
        const jwtToken = response.data.jwtToken;
        sessionStorage.removeItem("authState");
        if (jwtToken) {
          Cookies.set("token", jwtToken, { sameSite: "Lax", secure: true });
          axios.defaults.headers["Authorization"] = "Bearer " + jwtToken;

          try {
            localStorage.setItem("loggedInUsingSSO", "true");
          } catch (error) {
            console.warn("Failed to set SSO state:", error);
          }
          const decodedDestination = decodeURIComponent(destination);

          // Redirect to the Destination URL
          if (destination && checkRouteValidity(decodedDestination)) {
            router.replace(decodedDestination, {}, { showProgressBar: true });
          } else {
            router.replace(getInstancesRoute(), {}, { showProgressBar: true });
          }
        }
      } catch (error) {
        isAPICallInprogress.current = false;
        sessionStorage.removeItem("authState");
        if (error.response && error.response.status === 409) {
          snackbar.showError(
            `This email is already registered. You may reset your password or contact support for help`
          );
          router.replace("/signup");
        } else {
          router.replace("/signin?redirect_reason=idp_auth_error");
        }
      }
    },
    [router, snackbar]
  );

  useEffect(() => {
    if (state && code) {
      try {
        //get local auth state from session storage and compare the nonce values
        const localAuthStateString = sessionStorage.getItem("authState");
        //decode from base64 to utf8 string
        const decodedLocalAuthStateString = Buffer.from(localAuthStateString || "", "base64").toString("utf8");

        const localAuthState = JSON.parse(decodedLocalAuthStateString);
        // console.log("localAuthState.nonce", localAuthState.nonce);
        // console.log("authState.nonce", state);
        if (localAuthState.nonce === state) {
          const identityProvider = localAuthState.identityProvider;
          const invitationInfo = localAuthState.invitationInfo || {};
          const destination = localAuthState.destination;

          const payload = {
            authorizationCode: code,
            identityProviderName: identityProvider,
            environmentType: environmentType,
            state: state,
            ...invitationInfo,
          };
          if (isAPICallInprogress.current !== true) {
            handleSignIn(payload, destination);
          }
        }
      } catch (error) {
        console.log(error);
        router.replace("/signin?redirect_reason=idp_auth_error");
      }
    } else {
      router.replace("/signin");
    }
  }, [state, code, router, handleSignIn]);

  return (
    <Stack height="100vh" width="100vw" justifyContent="center" alignItems="center">
      <Text
        sx={{
          fontSize: "32px",
          fontWeight: 600,
          lineHeight: "38px",
          textAlign: "center",
        }}
      >
        Logging you in, please wait...
      </Text>
      <LoadingSpinner />
    </Stack>
  );
};

export default IDPAuthPage;

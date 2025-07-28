import { FC, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next-nprogress-bar";
import { Stack } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useFormik } from "formik";
import Cookies from "js-cookie";
import ReCAPTCHA from "react-google-recaptcha";

import { customerUserSignin } from "src/api/customer-user";
import axios from "src/axios";
import useSnackbar from "src/hooks/useSnackbar";
import { IdentityProvider } from "src/types/identityProvider";
import checkRouteValidity from "src/utils/route/checkRouteValidity";
import { getInstancesRoute } from "src/utils/routes";

import { createSigninValidationSchema } from "../constants";
import { useLastLoginDetails } from "../hooks/useLastLoginDetails";

import EmailStep from "./EmailStep";
import LoginMethodStep from "./LoginMethodStep";

type SignInFormProps = {
  isPasswordLoginEnabled: boolean;
  identityProviders: IdentityProvider[];
  isReCaptchaSetup: boolean;
  googleReCaptchaSiteKey: string;
};

const SignInForm: FC<SignInFormProps> = ({
  identityProviders,
  isPasswordLoginEnabled,
  isReCaptchaSetup,
  googleReCaptchaSiteKey,
}) => {
  const [shouldRememberLoginDetails, setShouldRememberLoginDetails] = useState(true);
  const [hasCaptchaErrored, setHasCaptchaErrored] = useState(false);
  const { email } = useLastLoginDetails();
  const [currentStep, setCurrentStep] = useState(email ? 1 : 0);
  const [isRecaptchaScriptLoaded, setIsRecaptchaScriptLoaded] = useState(false);
  const { setLoginMethod } = useLastLoginDetails();
  const router = useRouter();

  const searchParams = useSearchParams();
  const redirect_reason = searchParams?.get("redirect_reason");
  const destination = searchParams?.get("destination");
  const snackbar = useSnackbar();

  const reCaptchaRef = useRef<ReCAPTCHA | null>(null);

  useEffect(() => {
    if (redirect_reason === "idp_auth_error") {
      snackbar.showError("Something went wrong. Please retry");

      if (destination) router.replace(`/signin?destination=${encodeURIComponent(destination)}`);
      else router.replace("/signin");
    }
    /*eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, [redirect_reason]);

  function handlePasswordSignInSuccess(jwtToken) {
    if (jwtToken) {
      Cookies.set("token", jwtToken, { sameSite: "Lax", secure: true });

      try {
        localStorage.removeItem("loggedInUsingSSO");
      } catch (error) {
        console.warn("Failed to set SSO state:", error);
      }

      axios.defaults.headers["Authorization"] = "Bearer " + jwtToken;
      const decodedDestination = decodeURIComponent(destination || "");

      // Redirect to the Destination URL
      if (destination && checkRouteValidity(decodedDestination)) {
        router.replace(decodedDestination, {}, { showProgressBar: true });
      } else {
        router.replace(getInstancesRoute(), {}, { showProgressBar: true });
      }
    }
  }

  const passwordSignInMutation = useMutation({
    mutationFn: (payload) => {
      delete axios.defaults.headers["Authorization"];
      return customerUserSignin(payload);
    },
    onSuccess: (response) => {
      setLoginMethod({
        methodType: "Password",
      });
      /*eslint-disable-next-line no-use-before-define*/
      formik.resetForm();

      //@ts-ignore
      const jwtToken = response?.data?.jwtToken;
      handlePasswordSignInSuccess(jwtToken);
    },
    onError: (error: any) => {
      if (error.response.data && error.response.data.message) {
        const errorMessage = error.response.data.message;
        snackbar.showError(errorMessage);
      } else {
        snackbar.showError("Failed to sign in. Either the credentials are incorrect or the user does not exist");
      }
    },
  });

  async function handleFormSubmit(values) {
    const data = { ...values };

    if (reCaptchaRef.current && !hasCaptchaErrored) {
      const token = await reCaptchaRef.current.executeAsync();
      reCaptchaRef.current.reset();
      data["reCaptchaToken"] = token;
    }

    passwordSignInMutation.mutate(data);
  }

  const formik = useFormik({
    initialValues: {
      email: email || "",
      password: "",
    },
    // enableReinitialize: true,
    onSubmit: handleFormSubmit,
    validationSchema: createSigninValidationSchema,
  });

  return (
    <>
      {currentStep === 0 && (
        <EmailStep
          formData={formik}
          setCurrentStep={setCurrentStep}
          setShouldRememberLoginDetails={setShouldRememberLoginDetails}
          shouldRememberLoginDetails={shouldRememberLoginDetails}
        />
      )}
      <Stack component="form" gap="32px" mt="44px">
        {currentStep === 1 && (
          <LoginMethodStep
            formData={formik}
            setCurrentStep={setCurrentStep}
            identityProviders={identityProviders}
            isPasswordLoginEnabled={isPasswordLoginEnabled}
            isPasswordSignInLoading={passwordSignInMutation.isPending}
            isReCaptchaSetup={isReCaptchaSetup}
            isRecaptchaScriptLoaded={isRecaptchaScriptLoaded}
          />
        )}
        {isReCaptchaSetup && (
          // @ts-ignore
          <ReCAPTCHA
            size="invisible"
            sitekey={googleReCaptchaSiteKey}
            ref={reCaptchaRef}
            asyncScriptOnLoad={() => {
              setIsRecaptchaScriptLoaded(true);
            }}
            onErrored={() => {
              setHasCaptchaErrored(true);
            }}
          />
        )}
      </Stack>
    </>
  );
};

export default SignInForm;

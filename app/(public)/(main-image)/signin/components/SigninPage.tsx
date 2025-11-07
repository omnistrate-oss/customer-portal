"use client";

import { FC, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next-nprogress-bar";
import { Box } from "@mui/material";

import Logo from "src/components/NonDashboardComponents/Logo";
import useSnackbar from "src/hooks/useSnackbar";
import { useProviderOrgDetails } from "src/providers/ProviderOrgDetailsProvider";
import { IdentityProvider } from "src/types/identityProvider";

const SignInForm = dynamic(() => import("./SignInForm"), { ssr: false });

type SignInPageProps = {
  saasBuilderBaseURL: string;
  googleReCaptchaSiteKey: string;
  isReCaptchaSetup: boolean;
  isPasswordLoginEnabled: boolean;
  identityProviders: IdentityProvider[];
};

const SigninPage: FC<SignInPageProps> = (props) => {
  const {
    // saasBuilderBaseURL,
    googleReCaptchaSiteKey,
    isReCaptchaSetup,
    isPasswordLoginEnabled,
    identityProviders,
  } = props;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { orgName, orgLogoURL } = useProviderOrgDetails();
  const redirect_reason = searchParams?.get("redirect_reason");
  const destination = searchParams?.get("destination");
  const snackbar = useSnackbar();

  useEffect(() => {
    if (redirect_reason === "idp_auth_error") {
      snackbar.showError("Something went wrong. Please retry");

      if (destination) router.replace(`/signin?destination=${encodeURIComponent(destination)}`);
      else router.replace("/signin");
    }
    /*eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, [redirect_reason]);

  return (
    <Box minHeight="451px">
      <Box textAlign="center">
        {orgLogoURL ? (
          <Logo src={orgLogoURL} alt={orgName} style={{ maxWidth: "300px", maxHeight: "120px", height: "auto" }} />
        ) : (
          ""
        )}
      </Box>
      <Box>
        <SignInForm
          identityProviders={identityProviders}
          isPasswordLoginEnabled={isPasswordLoginEnabled}
          isReCaptchaSetup={isReCaptchaSetup}
          googleReCaptchaSiteKey={googleReCaptchaSiteKey}
        />
      </Box>
    </Box>
  );
};

export default SigninPage;

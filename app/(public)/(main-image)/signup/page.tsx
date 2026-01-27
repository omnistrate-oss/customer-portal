import { Metadata } from "next";

import { getRenderIdentityProvidersList } from "src/server/api/identity-provider";
import { checkReCaptchaSetup } from "src/server/utils/checkReCaptchaSetup";
import { getEnvironmentType } from "src/server/utils/getEnvironmentType";
import { getSaaSDomainURL } from "src/server/utils/getSaaSDomainURL";
import { IdentityProvider } from "src/types/identityProvider";

import { getIdentityProviderButtonLabel } from "../signin/utils";

import SignupPage from "./components/SignupPage";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Sign up for an account",
};

const Page = async () => {
  const idpRedirectUri = `${getSaaSDomainURL()}/idp-auth`;
  const identityProvidersResponse = await getRenderIdentityProvidersList({
    environmentType: getEnvironmentType(),
    redirectUrl: idpRedirectUri,
  });
  const identityProviders: IdentityProvider[] = identityProvidersResponse.data.identityProviders || [];

  //sort identity providers by login button text
  identityProviders.sort((a, b) => {
    const loginButtonTextA = getIdentityProviderButtonLabel(a).toLowerCase();
    const loginButtonTextB = getIdentityProviderButtonLabel(b).toLowerCase();

    return loginButtonTextA.localeCompare(loginButtonTextB);
  });

  const isPasswordLoginEnabled = process.env.DISABLE_PASSWORD_LOGIN?.toLowerCase() !== "true";

  return (
    <SignupPage
      isReCaptchaSetup={checkReCaptchaSetup()}
      googleReCaptchaSiteKey={process.env.GOOGLE_RECAPTCHA_SITE_KEY || null}
      isPasswordLoginEnabled={isPasswordLoginEnabled}
      identityProviders={identityProviders}
    />
  );
};

export default Page;

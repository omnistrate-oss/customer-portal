import { FC, ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Box, InputAdornment, Stack, styled } from "@mui/material";
import { FormikProps } from "formik";

import Button from "src/components/Button/Button";
import FieldLabel from "src/components/FormElements/FieldLabel/FieldLabel";
import FieldContainer from "src/components/FormElementsv2/FieldContainer/FieldContainer";
import TextField from "src/components/FormElementsv2/TextField/TextField";
import { Text } from "src/components/Typography/Typography";
import extractQueryParam from "src/constants/extractQueryParam";
import useEnvironmentType from "src/hooks/useEnvironmentType";
import { colors } from "src/themeConfig";
import { SetState } from "src/types/common/reactGenerics";
import { IdentityProvider } from "src/types/identityProvider";

import { IDENTITY_PROVIDER_ICON_MAP } from "../constants";
import { useLastLoginDetails } from "../hooks/useLastLoginDetails";
import { getIdentityProviderButtonLabel } from "../utils";

import PasswordLoginFields from "./PasswordLoginFields";
import { useProviderOrgDetails } from "src/providers/ProviderOrgDetailsProvider";

const LogoImg = styled("img")({
  height: "24px",
  width: "24px",
  display: "inline-block",
});

type LoginMethodStepProps = {
  setCurrentStep: SetState<number>;
  formData: FormikProps<{
    email: string;
    password: string;
  }>;
  identityProviders: IdentityProvider[];
  isPasswordLoginEnabled: boolean;
  isPasswordSignInLoading: boolean;
  isRecaptchaScriptLoaded: boolean;
  isReCaptchaSetup: boolean;
};

const LoginMethodStep: FC<LoginMethodStepProps> = (props) => {
  const {
    setCurrentStep,
    formData,
    identityProviders,
    isPasswordLoginEnabled,
    isPasswordSignInLoading,
    isReCaptchaSetup,
    isRecaptchaScriptLoaded,
  } = props;
  const { orgName } = useProviderOrgDetails();
  const searchParams = useSearchParams();
  const org = searchParams?.get("org");
  const orgUrl = searchParams?.get("orgUrl");
  const email = searchParams?.get("email");
  const destination = searchParams?.get("destination");
  const { setLoginMethod } = useLastLoginDetails();
  const [idpOptionsExpanded, setIdpOptionsExpanded] = useState(false);
  const router = useRouter();
  const { loginMethod: loginMethodStringified } = useLastLoginDetails();
  const userEmail = formData.values.email;
  const emailDomain = userEmail.split("@")[1] || "";
  const [preferredLoginMethod, setPreferredLoginMethod] = useState<{
    type: string;
    name?: string;
  } | null>(null);
  const [viewType, setViewType] = useState<"password-login" | "login-options">("login-options");
  const environmentType = useEnvironmentType();
  const hasIDPWithMatchingDomain = useMemo(() => {
    return (
      identityProviders.length > 0 &&
      identityProviders.some((idp) => {
        if (idp.emailIdentifiers === undefined || idp.emailIdentifiers === "") return false;

        const emailIdentifiersList = idp.emailIdentifiers.split(",").map((identifier) => identifier.trim());
        return emailIdentifiersList.includes(emailDomain);
      })
    );
  }, [identityProviders, emailDomain]);

  //hide password login if there is some IDP with email identifiers matching the email domain
  const allowPasswordLogin = isPasswordLoginEnabled && !hasIDPWithMatchingDomain;

  const domainFilteredIdentityProviders = useMemo(() => {
    //if some IDP has a configured domain and the domain matches the email domain, show only those IDPs with matching domains and hide the ones without configured domains

    const filteredProviders = identityProviders.filter((idp) => {
      if ((idp.emailIdentifiers === undefined || idp.emailIdentifiers === "") && !hasIDPWithMatchingDomain) return true;

      const emailIdentifiersList = idp.emailIdentifiers.split(",").map((identifier) => identifier.trim());

      return emailIdentifiersList.some((identifier) => {
        return identifier === emailDomain;
      });
    });

    // Sort providers: exact domain matches first, then others in original order
    return filteredProviders.sort((a, b) => {
      const aHasExactMatch =
        a.emailIdentifiers &&
        a.emailIdentifiers
          .split(",")
          .map((id) => id.trim())
          .includes(emailDomain);
      const bHasExactMatch =
        b.emailIdentifiers &&
        b.emailIdentifiers
          .split(",")
          .map((id) => id.trim())
          .includes(emailDomain);

      // If 'a' has exact match and 'b' doesn't, 'a' comes first
      if (aHasExactMatch && !bHasExactMatch) return -1;
      // If 'b' has exact match and 'a' doesn't, 'b' comes first
      if (bHasExactMatch && !aHasExactMatch) return 1;

      // For all other cases (both match or both don't match), maintain original order
      return 0;
    });
  }, [identityProviders, emailDomain, hasIDPWithMatchingDomain]);

  //set default sign in method using data from last login stored in localStorage
  useEffect(() => {
    //'Password' or some IDP type
    let lastLoginMethodType;
    let lastLoginIdpName;

    let selectedPreferredLoginMethod: string | undefined;
    let selectedPreferredIdpName: string | undefined;

    if (loginMethodStringified) {
      try {
        const loginMethod = JSON.parse(loginMethodStringified);
        const { methodType, idpName } = loginMethod;
        lastLoginMethodType = methodType;
        lastLoginIdpName = idpName;

        if (lastLoginMethodType && lastLoginMethodType?.toLowerCase() === "password" && allowPasswordLogin) {
          selectedPreferredLoginMethod = "Password";
        } else if (lastLoginIdpName || lastLoginMethodType) {
          //check if the identity providers list has the preferredIdpName
          // let matchingIdp: IdentityProvider | undefined;

          const matchingIdp = domainFilteredIdentityProviders.find(
            (idp) =>
              idp.name.toLowerCase() === lastLoginIdpName?.toLowerCase() &&
              idp.identityProviderName.toLowerCase() === lastLoginMethodType?.toLowerCase()
          );

          if (matchingIdp) {
            selectedPreferredLoginMethod = matchingIdp.identityProviderName;
            selectedPreferredIdpName = matchingIdp.name;
          } else {
            //if last login method is not found in the current domain filtered identity providers, use the first available one
            if (domainFilteredIdentityProviders.length > 0) {
              selectedPreferredLoginMethod = domainFilteredIdentityProviders[0].identityProviderName;
              selectedPreferredIdpName = domainFilteredIdentityProviders[0].name;
            }
          }
        }
      } catch (error) {
        console.warn("Failed to parse login method from localStorage:", error);
      }
    } else {
      // Default to first IDP if no preferred login method is found
      if (domainFilteredIdentityProviders.length > 0) {
        selectedPreferredLoginMethod = domainFilteredIdentityProviders[0].identityProviderName;
        selectedPreferredIdpName = domainFilteredIdentityProviders[0].name;
      } else {
        if (allowPasswordLogin) {
          selectedPreferredLoginMethod = "Password";
        }
      }
    }

    //if not preferredLoginMethod is set, check if password login is enabled and set it as preferredLoginMethod
    if (!selectedPreferredLoginMethod && allowPasswordLogin) {
      selectedPreferredLoginMethod = "Password";
    }

    if (selectedPreferredLoginMethod) {
      setPreferredLoginMethod({
        type: selectedPreferredLoginMethod,
        name: selectedPreferredIdpName,
      });
      if (selectedPreferredLoginMethod.toLowerCase() === "password") {
        setViewType("password-login");
      }
    }
  }, [loginMethodStringified, domainFilteredIdentityProviders, allowPasswordLogin]);

  let defaultLoginMethodButton: ReactNode | null = null;

  const invitationInfo: {
    invitedEmail?: string;
    legalCompanyName?: string;
    companyUrl?: string;
  } = {};

  if (email || org || orgUrl) {
    if (email) {
      invitationInfo.invitedEmail = decodeURIComponent(email).trim();
    }
    if (org) {
      invitationInfo.legalCompanyName = decodeURIComponent(org).trim();
    }
    if (orgUrl) {
      invitationInfo.companyUrl = decodeURIComponent(orgUrl).trim();
    }
  }

  const otherIdpSignInOptions = domainFilteredIdentityProviders.filter((idp) => {
    const match = idp.name === preferredLoginMethod?.name && idp.identityProviderName === preferredLoginMethod?.type;
    return !Boolean(match);
  });

  const numOtherSignInOptions =
    otherIdpSignInOptions.length +
    (allowPasswordLogin && preferredLoginMethod?.type?.toLowerCase() !== "password" ? 1 : 0);

  function handleIDPButtonClick(idp: IdentityProvider) {
    //check if state query param is present in the renderdAuthorizationEndpoint
    const stateFromURL = extractQueryParam(idp.renderedAuthorizationEndpoint, "state");

    const state = idp.state;
    let redirectURL = idp.renderedAuthorizationEndpoint;

    if (!stateFromURL && state) {
      // If state is not present in the URL, append it
      redirectURL += (redirectURL.includes("?") ? "&" : "?") + `state=${state}`;
    }
    redirectURL += (redirectURL.includes("?") ? "&" : "?") + `login_hint=${encodeURIComponent(userEmail)}`;

    const localAuthState: {
      destination: string | undefined | null;
      identityProvider: string;
      invitationInfo: any;
      nonce?: string;
    } = {
      destination: destination,
      identityProvider: idp.name || idp.identityProviderName,
      invitationInfo,
    };
    if (stateFromURL || state) {
      localAuthState.nonce = stateFromURL || state;
    }

    const encodedLocalAuthState = Buffer.from(JSON.stringify(localAuthState), "utf8").toString("base64");

    sessionStorage.setItem("authState", encodedLocalAuthState);
    setLoginMethod({
      methodType: idp.identityProviderName,
      idpName: idp.name,
    });
    router.push(redirectURL);
  }

  const passwordLoginButton = (
    <Button
      variant="outlined"
      size="xlarge"
      startIcon={<Box width="24px" height="24px" />}
      sx={{ justifyContent: "flex-start" }}
      onClick={() => {
        setViewType("password-login");
        setIdpOptionsExpanded(false);
      }}
      data-testid="password-login-button"
    >
      <Box display="inline-flex" flexGrow={1} justifyContent="center">
        Sign In With Password
      </Box>
    </Button>
  );

  if (preferredLoginMethod) {
    if (preferredLoginMethod.type?.toLowerCase() === "password") {
      defaultLoginMethodButton = passwordLoginButton;
    } else {
      const matchingIdp = domainFilteredIdentityProviders.find(
        (idp) =>
          idp.name.toLowerCase() === preferredLoginMethod.name?.toLowerCase() &&
          idp.identityProviderName.toLowerCase() === preferredLoginMethod.type?.toLowerCase()
      );

      if (matchingIdp) {
        const loginButtonIconUrl = matchingIdp.loginButtonIconUrl;

        let LoginButtonIcon: ReactNode;
        if (loginButtonIconUrl) {
          LoginButtonIcon = <LogoImg src={loginButtonIconUrl} alt={matchingIdp.name} />;
        } else if (IDENTITY_PROVIDER_ICON_MAP[matchingIdp.identityProviderName]) {
          const IconComponent: FC = IDENTITY_PROVIDER_ICON_MAP[matchingIdp.identityProviderName];
          LoginButtonIcon = <IconComponent />;
        } else {
          LoginButtonIcon = <Box width="24px" height="24px" />;
        }

        defaultLoginMethodButton = (
          <Button
            variant="outlined"
            size="xlarge"
            startIcon={LoginButtonIcon}
            sx={{ justifyContent: "flex-start" }}
            onClick={() => {
              handleIDPButtonClick(matchingIdp);
            }}
            data-testid={`idp-login-button-${matchingIdp.name}`}
          >
            <Box display="inline-flex" flexGrow={1} justifyContent="center">
              {getIdentityProviderButtonLabel(matchingIdp)}
            </Box>
          </Button>
        );
      }
    }
  }

  const hasNoLoginMethods = !allowPasswordLogin && identityProviders.length === 0;
  const hasNoLoginMethodsForEmail = !allowPasswordLogin && domainFilteredIdentityProviders.length === 0;

  return (
    <Stack gap="24px">
      <FieldContainer>
        <FieldLabel>Welcome</FieldLabel>
        <TextField
          inputProps={{
            "data-testid": "email-input",
          }}
          name="email"
          id="email"
          placeholder="Enter your registered email"
          value={formData.values.email}
          onChange={formData.handleChange}
          onBlur={formData.handleBlur}
          error={formData.touched.email && formData.errors.email}
          helperText={formData.touched.email && formData.errors.email}
          disabled
          InputProps={{
            endAdornment: (
              <InputAdornment
                position="end"
                sx={{
                  borderLeft: "1px solid #D5D7DA",
                  paddingLeft: "18px !important",
                  paddingRight: "18px !important",
                }}
              >
                <Text
                  size="medium"
                  weight="semibold"
                  style={{
                    color: "#414651",
                    cursor: "pointer",
                    userSelect: "none",
                    textAlign: "center",
                  }}
                  onClick={() => setCurrentStep(0)}
                >
                  Change{" "}
                </Text>
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root.Mui-disabled": {
              [`& .MuiOutlinedInput-input`]: {
                background: colors.white,
              },
            },
          }}
        />
      </FieldContainer>
      {hasNoLoginMethods ? (
        <Text size="medium" weight="semibold" sx={{ color: "#414651", textAlign: "center", marginTop: "24px" }}>
          No login methods available. Please contact support
        </Text>
      ) : hasNoLoginMethodsForEmail ? (
        <Text size="medium" weight="semibold" sx={{ color: "#414651", textAlign: "center", marginTop: "24px" }}>
          No login methods available for this email. Try another email or contact support
        </Text>
      ) : (
        <>
          {viewType === "password-login" ? (
            <PasswordLoginFields
              formData={formData}
              isReCaptchaSetup={isReCaptchaSetup}
              isRecaptchaScriptLoaded={isRecaptchaScriptLoaded}
              isPasswordSignInLoading={isPasswordSignInLoading}
            />
          ) : (
            <Stack gap="12px">
              {defaultLoginMethodButton}

              {idpOptionsExpanded &&
                otherIdpSignInOptions.map((idp) => {
                  const loginButtonIconUrl = idp.loginButtonIconUrl;

                  let LoginButtonIcon: ReactNode;
                  if (loginButtonIconUrl) {
                    LoginButtonIcon = <LogoImg src={loginButtonIconUrl} alt={idp.name} />;
                  } else if (IDENTITY_PROVIDER_ICON_MAP[idp.identityProviderName]) {
                    const IconComponent: FC = IDENTITY_PROVIDER_ICON_MAP[idp.identityProviderName];
                    LoginButtonIcon = <IconComponent />;
                  } else {
                    LoginButtonIcon = <Box width="24px" height="24px" />;
                  }

                  return (
                    <Button
                      variant="outlined"
                      key={idp.name}
                      size="xlarge"
                      startIcon={LoginButtonIcon}
                      sx={{ justifyContent: "flex-start" }}
                      onClick={() => {
                        handleIDPButtonClick(idp);
                      }}
                      data-testid={`idp-login-button-${idp.name}`}
                    >
                      <Box display="inline-flex" flexGrow={1} justifyContent="center">
                        {getIdentityProviderButtonLabel(idp)}
                      </Box>
                    </Button>
                  );
                })}
              {preferredLoginMethod?.type?.toLowerCase() !== "password" &&
                allowPasswordLogin &&
                idpOptionsExpanded &&
                passwordLoginButton}
            </Stack>
          )}
          {numOtherSignInOptions > 0 && (
            <Button
              data-testid="sign-in-options-button"
              variant="text"
              disableRipple
              endIcon={
                idpOptionsExpanded ? (
                  <ExpandLessIcon style={{ color: "#414651", fontSize: "20px" }} />
                ) : (
                  <ExpandMoreIcon style={{ color: "#414651", fontSize: "20px" }} />
                )
              }
              onClick={() => {
                if (idpOptionsExpanded) {
                  // If the options are expanded, we switch to password login
                  if (preferredLoginMethod?.type?.toLowerCase() === "password") {
                    setViewType("password-login");
                  } else {
                    setViewType("login-options");
                  }
                } else {
                  setViewType("login-options");
                }

                setIdpOptionsExpanded((prev) => !prev);
              }}
            >
              <Text size="medium" weight="semibold" sx={{ color: "#414651", textAlign: "center" }}>
                {idpOptionsExpanded ? "View less options" : "Other sign in options"}
              </Text>
            </Button>
          )}
          {environmentType === "PROD" && allowPasswordLogin && (
            <Text size="small" weight="regular" sx={{ color: "#535862", textAlign: "center" }}>
              New {orgName ? "to " + orgName : "here"}?{" "}
              <Link href="/signup" style={{ color: "#364152", fontWeight: 600 }}>
                Sign Up{" "}
              </Link>
            </Text>
          )}
        </>
      )}
    </Stack>
  );
};

export default LoginMethodStep;

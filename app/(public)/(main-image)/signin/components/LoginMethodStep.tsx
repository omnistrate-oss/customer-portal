import { FC, ReactNode, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Box, InputAdornment, Stack } from "@mui/material";
import { FormikProps } from "formik";

import Button from "src/components/Button/Button";
import FieldLabel from "src/components/FormElements/FieldLabel/FieldLabel";
import FieldContainer from "src/components/FormElementsv2/FieldContainer/FieldContainer";
import TextField from "src/components/FormElementsv2/TextField/TextField";
import DisplayHeading from "src/components/NonDashboardComponents/DisplayHeading";
import { Text } from "src/components/Typography/Typography";
import { colors } from "src/themeConfig";
import { SetState } from "src/types/common/reactGenerics";
import { IdentityProvider } from "src/types/identityProvider";

import { buildInvitationInfo, handleIDPButtonClick } from "../../shared/idp-utils";
import IDPButton from "../../shared/IDPButton";
import { useFilteredIdentityProviders } from "../../shared/useFilteredIdentityProviders";
import { useLastLoginDetails } from "../hooks/useLastLoginDetails";

import PasswordLoginFields from "./PasswordLoginFields";

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
  const searchParams = useSearchParams();
  const org = searchParams?.get("org");
  const orgUrl = searchParams?.get("orgUrl");
  const email = searchParams?.get("email");
  const destination = searchParams?.get("destination");
  const affiliateCode = searchParams?.get("affiliateCode");
  const { setLoginMethod } = useLastLoginDetails();
  const [idpOptionsExpanded, setIdpOptionsExpanded] = useState(false);
  const router = useRouter();
  const { loginMethod: loginMethodStringified } = useLastLoginDetails();
  const userEmail = formData.values.email;
  const [preferredLoginMethod, setPreferredLoginMethod] = useState<{
    type: string;
    name?: string;
  } | null>(null);
  const [viewType, setViewType] = useState<"password-login" | "login-options">("login-options");

  const { hasIDPWithMatchingDomain, domainFilteredIdentityProviders } = useFilteredIdentityProviders(
    identityProviders,
    userEmail
  );

  //hide password login if there is some IDP with email identifiers matching the email domain
  const allowPasswordLogin = isPasswordLoginEnabled && !hasIDPWithMatchingDomain;

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

  const invitationInfo = buildInvitationInfo({ email, org, orgUrl });

  const otherIdpSignInOptions = domainFilteredIdentityProviders.filter((idp) => {
    const match = idp.name === preferredLoginMethod?.name && idp.identityProviderName === preferredLoginMethod?.type;
    return !Boolean(match);
  });

  const numOtherSignInOptions =
    otherIdpSignInOptions.length +
    (allowPasswordLogin && preferredLoginMethod?.type?.toLowerCase() !== "password" ? 1 : 0);

  function onIDPButtonClick(idp: IdentityProvider) {
    handleIDPButtonClick({
      idp,
      userEmail,
      destination,
      invitationInfo,
      affiliateCode,
      onRedirect: (url) => router.push(url),
      onSetLoginMethod: (method) => setLoginMethod(method),
    });
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
        Sign In with Password
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
        defaultLoginMethodButton = (
          <IDPButton
            idp={matchingIdp}
            onClick={onIDPButtonClick}
            data-testid={`idp-login-button-${matchingIdp.name}`}
          />
        );
      }
    }
  }

  const hasNoLoginMethods = !allowPasswordLogin && identityProviders.length === 0;
  const hasNoLoginMethodsForEmail = !allowPasswordLogin && domainFilteredIdentityProviders.length === 0;

  return (
    <>
      <DisplayHeading mt="24px">Login to your account</DisplayHeading>
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
                  otherIdpSignInOptions.map((idp) => (
                    <IDPButton
                      key={idp.name}
                      idp={idp}
                      onClick={onIDPButtonClick}
                      data-testid={`idp-login-button-${idp.name}`}
                    />
                  ))}
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
          </>
        )}
      </Stack>
    </>
  );
};

export default LoginMethodStep;

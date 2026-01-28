import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Box, Collapse, InputAdornment, Stack } from "@mui/material";
import { styled } from "@mui/system";

import Button from "src/components/Button/Button";
import TextField from "src/components/FormElementsv2/TextField/TextField";
import { Text } from "src/components/Typography/Typography";
import { SetState } from "src/types/common/reactGenerics";
import { IdentityProvider } from "src/types/identityProvider";
import FieldError from "components/FormElementsv2/FieldError/FieldError";
import FieldContainer from "components/NonDashboardComponents/FormElementsV2/FieldContainer";
import FieldLabel from "components/NonDashboardComponents/FormElementsV2/FieldLabel";
import PasswordField from "components/NonDashboardComponents/FormElementsV2/PasswordField";
import SubmitButton from "components/NonDashboardComponents/FormElementsV2/SubmitButton";
import Link from "next/link";

import { handleIDPButtonClick } from "../../shared/idp-utils";
import IDPButton from "../../shared/IDPButton";

const policyAgreementText = `By creating your account, you agree to our`;

const FormGrid = styled(Box)(() => ({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  columnGap: "22px",
  rowGap: "27px",
  "@media (max-width: 1280px)": {
    gridTemplateColumns: "1fr",
    rowGap: "22px",
  },
}));

type SignupFormProps = {
  formData: any;
  setFormStep: SetState<"email-input" | "complete-form">;
  isSSOEnabled: boolean;
  isPasswordLoginEnabled: boolean;
  identityProviders: IdentityProvider[];
  invitationInfo: {
    invitedEmail?: string;
    legalCompanyName?: string;
    companyUrl?: string;
  };
  affiliateCode?: string | null;
  org?: string | null;
  orgUrl?: string | null;
  onSubmit: () => void;
  isSubmitDisabled: boolean;
  isSubmitLoading: boolean;
  hasIDPWithMatchingDomain: boolean;
  hasNoLoginMethodsForEmail: boolean;
  hasNoLoginMethods: boolean;
};

const SignupForm: React.FC<SignupFormProps> = ({
  formData,
  setFormStep,
  isSSOEnabled,
  isPasswordLoginEnabled,
  identityProviders,
  invitationInfo,
  affiliateCode,
  org,
  orgUrl,
  onSubmit,
  isSubmitDisabled,
  isSubmitLoading,
  hasIDPWithMatchingDomain,
  hasNoLoginMethodsForEmail,
  hasNoLoginMethods,
}) => {
  const { values, errors, touched, handleChange, handleBlur } = formData;
  const [areOtherSigninOptionsExpanded, setAreOtherSigninOptionsExpanded] = useState(
    isPasswordLoginEnabled ? false : true
  );
  const [hasLoadedParams, setHasLoadedParams] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Mark params as loaded after initial render
    setHasLoadedParams(true);
  }, []);
  

  function onIDPButtonClick(idp: IdentityProvider) {
    handleIDPButtonClick({
      idp,
      userEmail: values.email,
      invitationInfo,
      affiliateCode,
      onRedirect: (url) => router.push(url),
    });
  }

  const primaryIdp = identityProviders.length > 0 ? identityProviders[0] : null;
  const otherIdps = identityProviders.slice(1);

  const passwordSignupAllowed = isPasswordLoginEnabled && !hasIDPWithMatchingDomain;

  const emailField = (
    <FieldContainer>
      {passwordSignupAllowed && <FieldLabel required>Email</FieldLabel>}
      {/* @ts-ignore */}
      <TextField
        name="email"
        id="email"
        placeholder="example@companyemail.com"
        value={values.email}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.email && errors.email}
        disabled
        InputProps={{
          endAdornment: (
            <InputAdornment
              position="end"
              sx={{
                px: "18px",
                borderLeft: "1px solid #D5D7DA",
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
                onClick={() => {
                  router.replace("signup");
                  setFormStep("email-input");
                  formData.setFieldValue("email", "");
                }}
              >
                Change
              </Text>
            </InputAdornment>
          ),
        }}
      />
      <FieldError sx={{ paddingLeft: "13px" }}>{touched.email && errors.email}</FieldError>
    </FieldContainer>
  );

  return (
    <>
      {!passwordSignupAllowed && (
        <Box maxWidth="390px" mx="auto">
          {emailField}
        </Box>
      )}
      {isSSOEnabled && (
        <Stack
          maxWidth="390px"
          mx="auto"
          mb={passwordSignupAllowed ? 0 : "8px"}
          mt={!passwordSignupAllowed ? "24px" : 0}
        >
          {primaryIdp && (
            <IDPButton
              idp={primaryIdp}
              onClick={onIDPButtonClick}
              data-testid={`idp-signup-button-${primaryIdp.name}`}
            />
          )}
          <Collapse in={areOtherSigninOptionsExpanded} timeout={300}>
            <Stack gap="12px" mt="12px">
              {otherIdps.map((idp) => (
                <IDPButton
                  key={idp.name}
                  idp={idp}
                  onClick={onIDPButtonClick}
                  data-testid={`idp-signup-button-${idp.name}`}
                />
              ))}
            </Stack>
          </Collapse>
          {otherIdps.length > 0 && passwordSignupAllowed && (
            <Button
              variant="text"
              disableRipple
              endIcon={
                areOtherSigninOptionsExpanded ? (
                  <ExpandLessIcon style={{ color: "#414651", fontSize: "20px" }} />
                ) : (
                  <ExpandMoreIcon style={{ color: "#414651", fontSize: "20px" }} />
                )
              }
              sx={{ mt: "12px" }}
              onClick={() => setAreOtherSigninOptionsExpanded((prev) => !prev)}
            >
              <Text size="medium" weight="semibold" sx={{ color: "#414651", textAlign: "center" }}>
                {areOtherSigninOptionsExpanded ? "View less options" : "Other sign up options"}
              </Text>
            </Button>
          )}
        </Stack>
      )}
      {hasLoadedParams && passwordSignupAllowed && !areOtherSigninOptionsExpanded && (
        <Collapse in={passwordSignupAllowed && !areOtherSigninOptionsExpanded}>
          {passwordSignupAllowed && isSSOEnabled && (
            <div className="max-w-[390px] mx-auto mb-8">
              <div className="relative flex items-center mt-4">
                <div className="flex-grow border-t border-[#E9EAEB]" />
                <Text size="small" weight="medium" color="#535862" sx={{ mx: "8px", background: "white" }}>
                  OR
                </Text>
                <div className="flex-grow border-t border-[#E9EAEB]" />
              </div>
            </div>
          )}
          <FormGrid>
            <FieldContainer>
              <FieldLabel required>Name</FieldLabel>
              {/* @ts-ignore */}
              <TextField
                id="name"
                name="name"
                placeholder="Enter your full name"
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.name && errors.name}
              />
              <FieldError sx={{ paddingLeft: "13px" }}>{touched.name && errors.name}</FieldError>
            </FieldContainer>

            {emailField}

            <FieldContainer>
              <FieldLabel required>Company Name</FieldLabel>
              {/* @ts-ignore */}
              <TextField
                id="legalcompanyname"
                name="legalcompanyname"
                placeholder="Enter your company's name"
                value={values.legalcompanyname}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={Boolean(org)}
                error={touched.legalcompanyname && errors.legalcompanyname}
              />
              <FieldError sx={{ paddingLeft: "13px" }}>
                {touched.legalcompanyname && errors.legalcompanyname}
              </FieldError>
            </FieldContainer>

            <FieldContainer>
              <FieldLabel>Company URL</FieldLabel>
              {/* @ts-ignore */}
              <TextField
                id="companyurl"
                name="companyurl"
                placeholder="https://companyurl.com"
                value={values.companyurl}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.companyurl && errors.companyurl}
                disabled={Boolean(orgUrl)}
              />
              <FieldError sx={{ paddingLeft: "13px" }}>{touched.companyurl && errors.companyurl}</FieldError>
            </FieldContainer>

            <FieldContainer>
              <FieldLabel required>Password</FieldLabel>
              <PasswordField
                name="password"
                id="password"
                autoComplete="new-password"
                placeholder="Enter your password"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.password && errors.password}
              />
              <FieldError sx={{ paddingLeft: "13px" }}>{touched.password && errors.password}</FieldError>
            </FieldContainer>

            <FieldContainer>
              <FieldLabel required>Confirm Password</FieldLabel>
              <PasswordField
                name="confirmPassword"
                id="confirmPassword"
                placeholder="Confirm your password"
                value={values.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.confirmPassword && errors.confirmPassword}
              />
              <FieldError sx={{ paddingLeft: "13px" }}>{touched.confirmPassword && errors.confirmPassword}</FieldError>
            </FieldContainer>
            <FieldContainer>
              <FieldLabel>Affiliation Code</FieldLabel>
              {/* @ts-ignore */}
              <TextField
                id="affiliateCode"
                name="affiliateCode"
                placeholder="Affiliation Code"
                value={values.affiliateCode}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.affiliateCode && errors.affiliateCode}
              />
            </FieldContainer>
          </FormGrid>
          <Stack mt="32px" maxWidth="360px" mx="auto">
            <SubmitButton type="submit" onClick={onSubmit} disabled={isSubmitDisabled} loading={isSubmitLoading}>
              Create Account
            </SubmitButton>
          </Stack>
        </Collapse>
      )}

      {hasNoLoginMethods ? (
        <Text size="medium" weight="semibold" sx={{ color: "#414651", textAlign: "center", marginTop: "24px" }}>
          No signup methods available. Please contact support
        </Text>
      ) : hasNoLoginMethodsForEmail ? (
        <Text size="medium" weight="semibold" sx={{ color: "#414651", textAlign: "center", marginTop: "24px" }}>
          No signup methods available for this email. Try another email or contact support
        </Text>
      ) : (
        <Text size="small" weight="regular" sx={{ color: "#535862", textAlign: "center", marginTop: "32px" }}>
          {policyAgreementText}{" "}
          <Link target="_blank" href="/terms-of-use" style={{ color: "#364152", fontWeight: 600 }}>
            Terms & Conditions
          </Link>{" "}
          and{" "}
          <Link target="_blank" href="/privacy-policy" style={{ color: "#364152", fontWeight: 600 }}>
            Privacy Policy
          </Link>
        </Text>
      )}
    </>
  );
};

export default SignupForm;

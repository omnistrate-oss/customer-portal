"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Box, Stack } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useFormik } from "formik";
import ReCAPTCHA from "react-google-recaptcha";
import * as Yup from "yup";

import { customerUserSignup } from "src/api/customer-user";
import FieldContainer from "src/components/FormElementsv2/FieldContainer/FieldContainer";
import FieldError from "src/components/FormElementsv2/FieldError/FieldError";
import TextField from "src/components/FormElementsv2/TextField/TextField";
import Logo from "src/components/NonDashboardComponents/Logo";
import { Text } from "src/components/Typography/Typography";
import useSnackbar from "src/hooks/useSnackbar";
import { useProviderOrgDetails } from "src/providers/ProviderOrgDetailsProvider";
import { passwordRegex, passwordText } from "src/utils/passwordRegex";
import DisplayHeading from "components/NonDashboardComponents/DisplayHeading";
import FieldLabel from "components/NonDashboardComponents/FormElementsV2/FieldLabel";
import SubmitButton from "components/NonDashboardComponents/FormElementsV2/SubmitButton";
import SuccessBox from "components/SuccessBox/SuccessBox";

import { buildInvitationInfo } from "../../shared/idp-utils";
import { useFilteredIdentityProviders } from "../../shared/useFilteredIdentityProviders";

import SignupForm from "./SignupForm";

const signupValidationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Invalid email address").required("Email is required"),
  password: Yup.string().required("Password is required").matches(passwordRegex, passwordText),
  confirmPassword: Yup.string()
    .required("Re-enter your password")
    .oneOf([Yup.ref("password"), null], "Passwords must match"),
  legalcompanyname: Yup.string().required("Company name is required"),
});

const SignupPage = (props) => {
  const { googleReCaptchaSiteKey, isReCaptchaSetup, isPasswordLoginEnabled, identityProviders } = props;
  const { orgName, orgLogoURL } = useProviderOrgDetails();

  const searchParams = useSearchParams();
  const org = searchParams?.get("org");
  const orgUrl = searchParams?.get("orgUrl");
  const email = searchParams?.get("email");
  const userSource = searchParams?.get("userSource");
  const affiliateCode = searchParams?.get("affiliateCode");

  const [showSuccess, setShowSuccess] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [hasCaptchaErrored, setHasCaptchaErrored] = useState(false);
  const [formStep, setFormStep] = useState<"email-input" | "complete-form">(email ? "complete-form" : "email-input");

  const snackbar = useSnackbar();
  const reCaptchaRef = useRef<ReCAPTCHA | null>(null);

  const signupMutation = useMutation({
    mutationFn: (payload) => {
      setShowSuccess(false);
      return customerUserSignup(payload);
    },
    onSuccess: () => {
      /* eslint-disable-next-line no-use-before-define*/
      formik.resetForm();
      setShowSuccess(true);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message;
      if (errorMessage) {
        snackbar.showError(errorMessage);
      }
    },
  });

  async function handleFormSubmit(values) {
    const data: any = {};

    if (reCaptchaRef.current && !hasCaptchaErrored) {
      const token = await reCaptchaRef.current.executeAsync();
      reCaptchaRef.current.reset();
      data["reCaptchaToken"] = token;
    }

    for (const key in values) {
      if (values[key]) {
        data[key] = values[key];
      }
    }

    data.confirmPassword = undefined;

    if (data.affiliateCode?.trim()) {
      data.attributes = {
        affiliateCode: data.affiliateCode,
      };
    }
    delete data.affiliateCode;

    signupMutation.mutate(data);
  }

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      legalcompanyname: "",
      companydescription: "",
      companyurl: "",
      userSource: "",
    },
    enableReinitialize: true,
    onSubmit: handleFormSubmit,
    validationSchema: signupValidationSchema,
  });

  const { values, errors, touched, handleChange, handleBlur } = formik;

  const { hasIDPWithMatchingDomain, domainFilteredIdentityProviders } = useFilteredIdentityProviders(
    identityProviders || [],
    values.email || ""
  );

  const hasNoLoginMethods = !isPasswordLoginEnabled && identityProviders.length === 0;
  const hasNoLoginMethodsForEmail = !isPasswordLoginEnabled && domainFilteredIdentityProviders.length === 0;

  useEffect(() => {
    const updatedValues: any = {};

    if (org) {
      updatedValues.legalcompanyname = decodeURIComponent(org).trim();
    }
    if (orgUrl) {
      updatedValues.companyurl = decodeURIComponent(orgUrl).trim();
    }
    if (email) {
      updatedValues.email = decodeURIComponent(email).trim();
    }
    if (userSource) {
      updatedValues.userSource = userSource.trim();
    }

    if (affiliateCode) {
      updatedValues.affiliateCode = affiliateCode.trim();
    }

    formik.setValues((values) => ({
      ...values,
      ...updatedValues,
    }));

    if (org && orgUrl && email) {
      const readOnlyFields = ["legalcompanyname", "companyurl", "email"];

      readOnlyFields.forEach((fieldName) => {
        const field = document.querySelector(`[name=${fieldName}]`);
        if (field) {
          field.setAttribute("readonly", "true");
        }
      });
    }
    /*eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, [org, orgUrl, email, userSource]);

  const invitationInfo = buildInvitationInfo({ email, org, orgUrl });

  if (showSuccess) {
    return (
      <>
        <SuccessBox
          title="Verify Your Email to Activate Your Account"
          description="Thank you for signing up! We've sent a confirmation link to your email. Please check your inbox and click the link to verify your email address and complete the activation process."
        />
      </>
    );
  }

  return (
    <>
      <Box textAlign="center">
        {orgLogoURL ? (
          <Logo src={orgLogoURL} alt={orgName} style={{ maxWidth: "300px", maxHeight: "120px", height: "auto" }} />
        ) : (
          ""
        )}
      </Box>
      <DisplayHeading mt="24px">Get Started Today</DisplayHeading>

      <Box
        component="form"
        mt="44px"
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          if (formStep === "email-input" && !errors.email) {
            setFormStep("complete-form");
          } else if (formStep === "complete-form") {
            formik.handleSubmit();
          }
        }}
      >
        {formStep === "email-input" ? (
          <FieldContainer sx={{ maxWidth: "360px", mx: "auto" }}>
            <FieldLabel required>Email</FieldLabel>
            {/* @ts-ignore */}
            <TextField
              name="email"
              id="email"
              placeholder="example@companyemail.com"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.email && errors.email}
              disabled={Boolean(email)}
            />
            <FieldError sx={{ marginTop: "6px" }}>{touched.email && errors.email}</FieldError>
          </FieldContainer>
        ) : (
          <SignupForm
            formData={formik}
            setFormStep={setFormStep}
            isSSOEnabled={domainFilteredIdentityProviders.length > 0}
            isPasswordLoginEnabled={isPasswordLoginEnabled}
            hasIDPWithMatchingDomain={hasIDPWithMatchingDomain}
            identityProviders={domainFilteredIdentityProviders}
            invitationInfo={invitationInfo}
            affiliateCode={affiliateCode}
            org={org}
            orgUrl={orgUrl}
            onSubmit={formik.handleSubmit}
            isSubmitDisabled={
              !formik.isValid ||
              (isReCaptchaSetup && !isScriptLoaded) ||
              !isPasswordLoginEnabled ||
              hasIDPWithMatchingDomain
            }
            isSubmitLoading={signupMutation.isPending}
            hasNoLoginMethods={hasNoLoginMethods}
            hasNoLoginMethodsForEmail={hasNoLoginMethodsForEmail}
          />
        )}

        {/* Signup Restriction Message */}
        {/* <Collapse in={hasIDPWithMatchingDomain} timeout={300}>
          <Box
            mt="32px"
            display="flex"
            gap="16px"
            borderRadius="12px"
            p="16px"
            border="1px solid #D5D7DA"
            boxShadow="0 1px 2px 0 #0A0D120D"
          >
            <AlertIcon className="shrink-0" />
            <Text size="medium" weight="regular" sx={{ color: "#535862" }}>
              You cannot create a password account using <span className="font-semibold">@{emailDomain}</span> domain.
              <br />
              <span className="text-[#414651] font-semibold">
                Please sign up using your organization&apos;s identity provider.
              </span>
            </Text>
          </Box>
        </Collapse> */}

        {formStep === "email-input" && (
          <Stack mt="32px" maxWidth="360px" mx="auto">
            <SubmitButton
              type="button"
              onClick={() => setFormStep("complete-form")}
              disabled={Boolean(errors.email)}
              loading={false}
            >
              Next
            </SubmitButton>
          </Stack>
        )}
        {isReCaptchaSetup && (
          // @ts-ignore
          <ReCAPTCHA
            size="invisible"
            sitekey={googleReCaptchaSiteKey}
            ref={reCaptchaRef}
            asyncScriptOnLoad={() => {
              setIsScriptLoaded(true);
            }}
            onErrored={() => {
              setHasCaptchaErrored(true);
            }}
          />
        )}
      </Box>

      {/* Signup Link */}
      <Text size="small" weight="regular" sx={{ color: "#535862", textAlign: "center", marginTop: "24px" }}>
        Already have an account?{" "}
        <Link href="/signin" style={{ color: "#364152", fontWeight: 600 }}>
          Login here
        </Link>
      </Text>
    </>
  );
};

export default SignupPage;

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Box, Stack, styled } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useFormik } from "formik";
import ReCAPTCHA from "react-google-recaptcha";
import * as Yup from "yup";

import { customerUserSignup } from "src/api/customer-user";
import Logo from "src/components/NonDashboardComponents/Logo";
import { Text } from "src/components/Typography/Typography";
import useSnackbar from "src/hooks/useSnackbar";
import { useProviderOrgDetails } from "src/providers/ProviderOrgDetailsProvider";
import { passwordRegex, passwordText } from "src/utils/passwordRegex";
import FieldError from "components/FormElementsv2/FieldError/FieldError";
import DisplayHeading from "components/NonDashboardComponents/DisplayHeading";
import FieldContainer from "components/NonDashboardComponents/FormElementsV2/FieldContainer";
import FieldLabel from "components/NonDashboardComponents/FormElementsV2/FieldLabel";
import PasswordField from "components/NonDashboardComponents/FormElementsV2/PasswordField";
import SubmitButton from "components/NonDashboardComponents/FormElementsV2/SubmitButton";
import TextField from "components/NonDashboardComponents/FormElementsV2/TextField";
import SuccessBox from "components/SuccessBox/SuccessBox";

import { useLastLoginDetails } from "../../signin/hooks/useLastLoginDetails";

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
  const { googleReCaptchaSiteKey, isReCaptchaSetup } = props;
  const { orgName, orgLogoURL } = useProviderOrgDetails();
  const { email: loginStepOneEmail } = useLastLoginDetails();

  const searchParams = useSearchParams();
  const org = searchParams?.get("org");
  const orgUrl = searchParams?.get("orgUrl");
  const email = searchParams?.get("email");
  const userSource = searchParams?.get("userSource");

  const [showSuccess, setShowSuccess] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [hasCaptchaErrored, setHasCaptchaErrored] = useState(false);

  const snackbar = useSnackbar();
  const reCaptchaRef = useRef(null);

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
    onError: (error) => {
      const errorMessage = error.response?.data?.message;
      if (errorMessage) {
        snackbar.showError(errorMessage);
      }
    },
  });

  async function handleFormSubmit(values) {
    const data = {};

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

    signupMutation.mutate(data);
  }

  const formik = useFormik({
    initialValues: {
      name: "",
      email: loginStepOneEmail || "",
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

  useEffect(() => {
    const updatedValues = {};

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

    formik.setValues((values) => ({
      ...values,
      ...updatedValues,
    }));

    if (org && orgUrl && email) {
      const readOnlyFields = ["legalcompanyname", "companyurl", "email"];

      readOnlyFields.forEach((fieldName) => {
        const field = document.querySelector(`[name=${fieldName}]`);
        if (field) {
          field.setAttribute("readonly", true);
        }
      });
    }
    /*eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, [org, orgUrl, email, userSource]);

  const { values, touched, errors, handleChange, handleBlur } = formik;

  const policyAgreementText = `By creating your account, you agree to our`;

  const invitationInfo = {};
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
          <Logo src={orgLogoURL} alt={orgName} style={{ width: "120px", height: "auto", maxHeight: "unset" }} />
        ) : (
          ""
        )}
      </Box>
      <DisplayHeading mt="24px">Get Started Today</DisplayHeading>

      <Box component="form" mt="44px" autoComplete="off">
        {/* Signup Form */}
        <FormGrid>
          <FieldContainer>
            <FieldLabel required>Name</FieldLabel>
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

          <FieldContainer>
            <FieldLabel required>Email</FieldLabel>
            <TextField
              name="email"
              id="email"
              placeholder="example@companyemail.com"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.email && errors.email}
              disabled={email ? true : false}
            />
            <FieldError sx={{ paddingLeft: "13px" }}>{touched.email && errors.email}</FieldError>
          </FieldContainer>

          <FieldContainer>
            <FieldLabel required>Company Name</FieldLabel>
            <TextField
              id="legalcompanyname"
              name="legalcompanyname"
              placeholder="Enter your company's name"
              value={values.legalcompanyname}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={org ? true : false}
              error={touched.legalcompanyname && errors.legalcompanyname}
            />
            <FieldError sx={{ paddingLeft: "13px" }}>{touched.legalcompanyname && errors.legalcompanyname}</FieldError>
          </FieldContainer>

          <FieldContainer>
            <FieldLabel>Company URL</FieldLabel>
            <TextField
              id="companyurl"
              name="companyurl"
              placeholder="https://companyurl.com"
              value={values.companyurl}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.companyurl && errors.companyurl}
              disabled={orgUrl ? true : false}
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
        </FormGrid>

        {/* Login and Google Button */}
        <Stack mt="32px" width="480px" mx="auto">
          <SubmitButton
            type="submit"
            onClick={formik.handleSubmit}
            disabled={!formik.isValid || (isReCaptchaSetup && !isScriptLoaded)}
            loading={signupMutation.isPending}
          >
            Create Account
          </SubmitButton>
          {isReCaptchaSetup && (
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
        </Stack>
      </Box>
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

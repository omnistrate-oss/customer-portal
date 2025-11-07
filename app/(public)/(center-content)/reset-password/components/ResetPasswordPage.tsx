"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Box, Stack } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useFormik } from "formik";
import ReCAPTCHA from "react-google-recaptcha";
import * as Yup from "yup";

import { customerUserResetPassword } from "src/api/customer-user";
import useSnackbar from "src/hooks/useSnackbar";
import { styleConfig } from "src/providerConfig";
import { useProviderOrgDetails } from "src/providers/ProviderOrgDetailsProvider";
import DisplayHeading from "components/NonDashboardComponents/DisplayHeading";
import FieldContainer from "components/NonDashboardComponents/FormElementsV2/FieldContainer";
import FieldLabel from "components/NonDashboardComponents/FormElementsV2/FieldLabel";
import SubmitButton from "components/NonDashboardComponents/FormElementsV2/SubmitButton";
import TextField from "components/NonDashboardComponents/FormElementsV2/TextField";
import Logo from "components/NonDashboardComponents/Logo";
import PageDescription from "components/NonDashboardComponents/PageDescription";
import { Text } from "components/Typography/Typography";

import Confetti from "public/assets/images/non-dashboard/confetti.svg";

const resetPasswordValidationSchema = Yup.object({
  email: Yup.string().email("Invalid email address").required("Email is required"),
});

const ResetPasswordPage = (props) => {
  const { googleReCaptchaSiteKey, isReCaptchaSetup } = props;
  const { orgLogoURL, orgName } = useProviderOrgDetails();

  const snackbar = useSnackbar();
  const reCaptchaRef = useRef<any>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [hasCaptchaErrored, setHasCaptchaErrored] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const resetPasswordMutation = useMutation({
    mutationFn: (payload: any) => {
      setShowSuccess(false);
      return customerUserResetPassword(payload);
    },
    onSuccess: () => {
      /*eslint-disable-next-line no-use-before-define*/
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
    resetPasswordMutation.mutate(data);
  }

  const formik = useFormik({
    initialValues: {
      email: "",
    },
    enableReinitialize: true,
    onSubmit: handleFormSubmit,
    validationSchema: resetPasswordValidationSchema,
  });

  const { values, touched, errors, handleChange, handleBlur } = formik;

  if (showSuccess) {
    return (
      <>
        <Image src={Confetti} alt="Confetti" width={265} height={140} style={{ margin: "0 auto" }} />

        <Stack gap="16px">
          <DisplayHeading>Check Your Email for a Password Reset Link</DisplayHeading>
          <PageDescription>
            If an account is associated with the provided email, a password reset link will be sent. Please follow the
            instructions to reset your password.
          </PageDescription>
        </Stack>
        {/* @ts-ignore */}
        <SubmitButton data-testid="go-to-login-button" href="/signin">
          Go to Login
        </SubmitButton>

        <Text size="small" weight="medium" color="#4B5563" style={{ textAlign: "center" }}>
          Didn&apos;t get a reset password link?{" "}
          <span onClick={() => setShowSuccess(false)} style={{ color: styleConfig.primaryColor, cursor: "pointer" }}>
            Try again
          </span>
        </Text>
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
      <Stack component="form" gap="32px">
        <Stack gap="16px">
          <DisplayHeading>Reset your password</DisplayHeading>
          <PageDescription>
            Enter your email address and we&apos;ll send you password reset instructions.
          </PageDescription>
        </Stack>
        <FieldContainer>
          <FieldLabel required>Registered Email</FieldLabel>
          {/* @ts-ignore */}
          <TextField
            inputProps={{
              "data-testid": "email-input",
            }}
            name="email"
            id="email"
            placeholder="Input your registered email"
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.email && errors.email}
            helperText={touched.email && errors.email}
          />
        </FieldContainer>
        <SubmitButton
          data-testid="submit-button"
          type="submit"
          onClick={formik.handleSubmit}
          disabled={!formik.isValid || (isReCaptchaSetup && !isScriptLoaded)}
          loading={resetPasswordMutation.isPending}
        >
          Submit
        </SubmitButton>
      </Stack>
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
    </>
  );
};

export default ResetPasswordPage;

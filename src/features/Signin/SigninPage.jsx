import Link from "next/link";
import { useRouter } from "next/router";
import { useMutation } from "@tanstack/react-query";
import { Box, Stack, Typography } from "@mui/material";
import { useFormik } from "formik";
import axios from "src/axios";
import Cookies from "js-cookie";
import * as Yup from "yup";
import MainImageLayout from "components/NonDashboardComponents/Layout/MainImageLayout";
import PageHeading from "components/NonDashboardComponents/PageHeading";
import FieldContainer from "components/NonDashboardComponents/FormElementsV2/FieldContainer";
import FieldLabel from "components/NonDashboardComponents/FormElementsV2/FieldLabel";
import SubmitButton from "components/NonDashboardComponents/FormElementsV2/SubmitButton";
import TextField from "components/NonDashboardComponents/FormElementsV2/TextField";
import PasswordField from "components/NonDashboardComponents/FormElementsV2/PasswordField";
import {
  customerUserSignin,
  customerUserSigninWithIdentityProvider,
} from "src/api/customer-user";
import useSnackbar from "src/hooks/useSnackbar";
import GoogleLogin from "./components/GoogleLogin";
import { IDENTITY_PROVIDER_STATUS_TYPES } from "./constants";
import { GoogleOAuthProvider } from "@react-oauth/google";

const createSigninValidationSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string().required("Password is required"),
});

const SigninPage = (props) => {
  const {
    orgName,
    orgLogoURL,
    googleIdentityProvider,
    githubIdentityProvider,
  } = props;
  const router = useRouter();
  const snackbar = useSnackbar();

  async function handleSSOLogin(authorizationCode, identityProviderName) {
    const payload = { authorizationCode, identityProviderName };
    try {
      const response = await customerUserSigninWithIdentityProvider(payload);
      const jwtToken = response.data.jwtToken;
      handleSignInSuccess(jwtToken);
    } catch (error) {
      console.error(error);
    }
  }

  function handleSignInSuccess(jwtToken) {
    if (jwtToken) {
      Cookies.set("token", jwtToken, { sameSite: "Strict", secure: true });
      axios.defaults.headers["Authorization"] = "Bearer " + jwtToken;
      router.push("/service-plans");
    }
  }

  const signInMutation = useMutation(
    (payload) => {
      delete axios.defaults.headers["Authorization"];
      return customerUserSignin(payload);
    },
    {
      onSuccess: (data) => {
        formik.resetForm();
        const jwtToken = data.data.jwtToken;
        handleSignInSuccess(jwtToken);
      },
      onError: (error) => {
        if (error.response.data && error.response.data.message) {
          const errorMessage = error.response.data.message;
          snackbar.showError(errorMessage);
        } else {
          snackbar.showError(
            "Failed to sign in. Either the credentials are incorrect or the user does not exist"
          );
        }
      },
    }
  );

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    enableReinitialize: true,
    onSubmit: (values) => {
      let data = { ...values };
      signInMutation.mutate(data);
    },
    validationSchema: createSigninValidationSchema,
  });

  const { values, touched, errors, handleChange, handleBlur } = formik;

  let googleIDPClientID = null;
  let showGoogleLoginButton = false;
  let isGoogleLoginDisabled = false;

  if (googleIdentityProvider) {
    console.log("Google identity provider", googleIdentityProvider);
    showGoogleLoginButton = true;
    googleIDPClientID = googleIdentityProvider.clientId;

    const { status } = googleIdentityProvider;

    if (status === IDENTITY_PROVIDER_STATUS_TYPES.FAILED) {
      isGoogleLoginDisabled = true;
    }
  }

  if (githubIdentityProvider) {
    console.log("Github identity provider", githubIdentityProvider);
  }

  return (
    <MainImageLayout
      pageTitle="Sign in"
      orgName={orgName}
      orgLogoURL={orgLogoURL}
    >
      <PageHeading>Login to your account</PageHeading>

      <Stack component="form" gap="32px">
        {/* Signin Form */}
        <Stack gap="30px">
          <FieldContainer>
            <FieldLabel required>Email Address</FieldLabel>
            <TextField
              name="email"
              id="email"
              placeholder="Enter your registered email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.email && errors.email}
              helperText={touched.email && errors.email}
            />
          </FieldContainer>

          <FieldContainer>
            <FieldLabel required>Password</FieldLabel>
            <PasswordField
              name="password"
              id="password"
              placeholder="Enter your password"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.password && errors.password}
              helperText={touched.password && errors.password}
            />
          </FieldContainer>

          <Link
            href="/reset-password"
            style={{
              fontWeight: "500",
              fontSize: "14px",
              lineHeight: "22px",
              color: "#687588",
            }}
          >
            Forgot Password
          </Link>
        </Stack>

        {/* Login and Google Button */}
        <Stack gap="16px">
          <SubmitButton
            type="submit"
            onClick={formik.handleSubmit}
            disabled={!formik.isValid}
            loading={signInMutation.isLoading}
          >
            Login
          </SubmitButton>
        </Stack>
      </Stack>
      {Boolean(googleIdentityProvider || githubIdentityProvider) && (
        <>
          <Box borderTop="1px solid #F1F2F4" textAlign="center" mt="8px">
            <Box
              display="inline-block"
              paddingLeft="16px"
              paddingRight="16px"
              color="#687588"
              bgcolor="white"
              fontSize="14px"
              fontWeight="500"
              lineHeight="22px"
              sx={{ transform: "translateY(-50%)" }}
            >
              Or login with
            </Box>
          </Box>
          <Stack direction="row" justifyContent="center" mt="-6px">
            {showGoogleLoginButton && (
              <GoogleOAuthProvider
                clientId={googleIDPClientID}
                onScriptLoadError={() => {
                  console.log("Script load error");
                }}
                onScriptLoadSuccess={() => {
                  console.log("Script load success");
                }}
              >
                <GoogleLogin
                  handleSSOLogin={handleSSOLogin}
                  disabled={isGoogleLoginDisabled}
                />
              </GoogleOAuthProvider>
            )}
          </Stack>
        </>
      )}

      {/* Signup Link */}
      <Typography
        fontWeight="500"
        fontSize="14px"
        lineHeight="22px"
        color="#A0AEC0"
        textAlign="center"
      >
        You’re new in here?{" "}
        <Link href="/signup" style={{ color: "#27A376" }}>
          Create Account
        </Link>
      </Typography>
    </MainImageLayout>
  );
};

export default SigninPage;

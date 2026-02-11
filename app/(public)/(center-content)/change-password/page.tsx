"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Box, Stack } from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";

import { $api } from "src/api/query";
import useSnackbar from "src/hooks/useSnackbar";
import { useProviderOrgDetails } from "src/providers/ProviderOrgDetailsProvider";
import { passwordRegex, passwordText } from "src/utils/passwordRegex";
import FieldError from "components/FormElementsv2/FieldError/FieldError";
import DisplayHeading from "components/NonDashboardComponents/DisplayHeading";
import FieldContainer from "components/NonDashboardComponents/FormElementsV2/FieldContainer";
import FieldLabel from "components/NonDashboardComponents/FormElementsV2/FieldLabel";
import PasswordField from "components/NonDashboardComponents/FormElementsV2/PasswordField";
import SubmitButton from "components/NonDashboardComponents/FormElementsV2/SubmitButton";
import Logo from "components/NonDashboardComponents/Logo";
import PageDescription from "components/NonDashboardComponents/PageDescription";

const changePasswordValidationSchema = Yup.object({
  password: Yup.string().required("Password is required").matches(passwordRegex, passwordText),
  confirmPassword: Yup.string()
    .required("Password is required")
    .oneOf([Yup.ref("password"), null], "Passwords must match"),
});

const ChangePasswordPage = () => {
  const router = useRouter();
  const snackbar = useSnackbar();
  const searchParams = useSearchParams();
  const email = searchParams?.get("email");
  const token = searchParams?.get("token");
  const { orgLogoURL, orgName } = useProviderOrgDetails();

  const changePasswordMutation = $api.useMutation("post", "/2022-09-01-00/change-password", {
    onSuccess: () => {
      snackbar.showSuccess("Change password successful");
      router.push("/signin");
    },
  });

  const formik = useFormik({
    initialValues: {
      password: "",
      confirmPassword: "",
    },
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        await changePasswordMutation.mutateAsync({
          body: {
            email: decodeURIComponent(email as string),
            token: decodeURIComponent(token as string),
            password: values.password,
          },
        });
        formik.resetForm();
      } catch (error) {
        console.error("Password change failed:", error);
      }
    },
    validationSchema: changePasswordValidationSchema,
  });

  const { values, handleChange, handleBlur, touched, errors } = formik;

  return (
    <>
      <Box display="flex" justifyContent="center">
        {orgLogoURL ? (
          <Logo src={orgLogoURL} alt={orgName} style={{ width: "120px", height: "auto", maxHeight: "unset" }} />
        ) : (
          ""
        )}
      </Box>
      <Stack gap="16px">
        <DisplayHeading>Update your password</DisplayHeading>
        <PageDescription>
          {email && token
            ? "Set your new password with minimum 8 characters with a combination of letters and numbers"
            : "Missing password change credentials. Please check your email and click the link to retry"}
        </PageDescription>
      </Stack>

      {email && token && (
        <Stack component="form" gap="32px">
          {/* Update Password Form */}
          <Stack gap="20px">
            <FieldContainer>
              <FieldLabel required>New Password</FieldLabel>
              <PasswordField
                name="password"
                id="password"
                placeholder="Enter your new password"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.password && errors.password}
              />
              <FieldError sx={{ paddingLeft: "13px" }}>{touched.password && errors.password}</FieldError>
            </FieldContainer>

            <FieldContainer>
              <FieldLabel required>Confirm New Password</FieldLabel>
              <PasswordField
                name="confirmPassword"
                id="confirmPassword"
                placeholder="Re-type your new password"
                value={values.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.confirmPassword && errors.confirmPassword}
              />
              <FieldError sx={{ paddingLeft: "13px" }}>{touched.confirmPassword && errors.confirmPassword}</FieldError>
            </FieldContainer>
          </Stack>

          {/* Submit Button */}
          <SubmitButton
            type="submit"
            onClick={formik.handleSubmit}
            disabled={!formik.isValid}
            loading={changePasswordMutation.isPending}
          >
            Submit
          </SubmitButton>
        </Stack>
      )}
    </>
  );
};

export default ChangePasswordPage;

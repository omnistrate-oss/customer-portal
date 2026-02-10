import { FC, useState } from "react";
import Link from "next/link";
import { InputAdornment } from "@mui/material";
import { FormikProps } from "formik";

import TextField from "src/components/FormElementsv2/TextField/TextField";
import SubmitButton from "src/components/NonDashboardComponents/FormElementsV2/SubmitButton";
import { Text } from "src/components/Typography/Typography";
import useEnvironmentType from "src/hooks/useEnvironmentType";

import NonProdLoginInstructions from "./NonProdLoginInstructions";

type PasswordLoginFieldsProps = {
  formData: FormikProps<{
    email: string;
    password: string;
  }>;
  isPasswordSignInLoading: boolean;
  isReCaptchaSetup: boolean;
  isRecaptchaScriptLoaded: boolean;
};

const PasswordLoginFields: FC<PasswordLoginFieldsProps> = ({
  formData,
  isPasswordSignInLoading,
  isReCaptchaSetup,
  isRecaptchaScriptLoaded,
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const environmentType = useEnvironmentType();

  return (
    <>
      <TextField
        inputProps={{
          "data-testid": "password-input",
        }}
        name="password"
        id="password"
        type={isPasswordVisible ? "text" : "password"}
        placeholder="Enter your password"
        value={formData.values.password}
        onChange={formData.handleChange}
        onBlur={formData.handleBlur}
        error={formData.touched.password && formData.errors.password}
        helperText={formData.touched.password && formData.errors.password}
        InputProps={{
          endAdornment: (
            <InputAdornment
              position="end"
              sx={{
                borderLeft: "1px solid #D5D7DA",
                paddingLeft: "18px !important",
                paddingRight: "18px !important",
                minWidth: "97px",
                justifyContent: "center",
              }}
              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
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
              >
                {isPasswordVisible ? "Hide" : "Show"}
              </Text>
            </InputAdornment>
          ),
        }}
      />
      {environmentType === "PROD" && (
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
      )}
      {environmentType !== "PROD" && <NonProdLoginInstructions />}

      <SubmitButton
        data-testid="login-button"
        type="submit"
        onClick={formData.handleSubmit}
        disabled={!formData.isValid || (isReCaptchaSetup && !isRecaptchaScriptLoaded)}
        loading={isPasswordSignInLoading}
      >
        Sign In
      </SubmitButton>
    </>
  );
};

export default PasswordLoginFields;

import React, { FC } from "react";
import { Stack, Typography } from "@mui/material";
import { FormikProps } from "formik";

import Checkbox from "src/components/Checkbox/Checkbox";
import FieldLabel from "src/components/FormElements/FieldLabel/FieldLabel";
import FieldContainer from "src/components/FormElementsv2/FieldContainer/FieldContainer";
import TextField from "src/components/FormElementsv2/TextField/TextField";
import SubmitButton from "src/components/NonDashboardComponents/FormElementsV2/SubmitButton";
import { SetState } from "src/types/common/reactGenerics";

import { useLastLoginDetails } from "../hooks/useLastLoginDetails";

type EmailStepProps = {
  setCurrentStep: SetState<number>;
  formData: FormikProps<{
    email: "";
    password: "";
  }>;
  setShouldRememberLoginDetails: SetState<boolean>;
  shouldRememberLoginDetails: boolean;
};

const EmailStep: FC<EmailStepProps> = (props) => {
  const { setCurrentStep, formData, setShouldRememberLoginDetails, shouldRememberLoginDetails } = props;
  const { setEmail } = useLastLoginDetails();

  function handleNextClick() {
    formData.validateForm().then((errors) => {
      const isEmailError = errors.email;
      if (isEmailError) {
        formData.setTouched({
          email: true,
        });
        return;
      }
      if (formData.values.email.trim() !== "") {
        if (shouldRememberLoginDetails) {
          setEmail(formData.values.email);
          setCurrentStep(1); // Move to the next step
        } else {
          setEmail("");
          setCurrentStep(1); // Move to the next step
        }
      }
    });
  }

  return (
    <Stack gap="30px">
      <FieldContainer>
        <FieldLabel required>Email</FieldLabel>
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
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleNextClick();
            }
          }}
          error={formData.touched.email && formData.errors.email}
          helperText={formData.touched.email && formData.errors.email}
        />
      </FieldContainer>

      <div className="flex items-center justify-start">
        <Checkbox
          sx={{
            padding: "0px",
            marginRight: "8px",
            borderRadius: "4px",
            color: "#D5D7DA", // affects checkmark and fill
            "& .MuiSvgIcon-root": {
              backgroundColor: "#fff", // optional: makes the border clearer
            },
            "&.Mui-checked .MuiSvgIcon-root": {
              color: "#111827", // checkmark color
              backgroundColor: "#fff",
            },
          }}
          checked={shouldRememberLoginDetails}
          onChange={(e) => setShouldRememberLoginDetails(e.target.checked)}
        />

        <Typography fontWeight="500" fontSize="14px" lineHeight="20px" color="#414651" textAlign="center">
          {"Remember Me"}
        </Typography>
      </div>
      <SubmitButton
        data-testid="next-button"
        type="button" // <- important: prevent form submission here
        onClick={handleNextClick}
        loading={false}
      >
        Next
      </SubmitButton>
    </Stack>
  );
};

export default EmailStep;

import { FC, useState } from "react";
import { Box, InputAdornment, SxProps, Theme } from "@mui/material";
import Generator from "generate-password";

import FieldLabel from "../FormElements/FieldLabel/FieldLabel";
import Autocomplete from "../FormElementsv2/AutoComplete/AutoComplete";
import FieldContainer from "../FormElementsv2/FieldContainer/FieldContainer";
import FieldDescription from "../FormElementsv2/FieldDescription/FieldDescription";
import FieldError from "../FormElementsv2/FieldError/FieldError";
import TextField from "../FormElementsv2/TextField/TextField";
import KeyIcon from "../Icons/Key/KeyIcon";
import Tooltip from "../Tooltip/Tooltip";
import { Text } from "../Typography/Typography";

import { RadioField, SelectField, TextInput } from "./Common";

type DynamicFieldProps = {
  field: any;
  formData: any;
  sx?: SxProps<Theme>;
};

const PasswordInput = ({ field, formData, value }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <TextField
      inputProps={{
        "data-testid": field.dataTestId,
      }}
      autoComplete="new-password"
      type={isPasswordVisible ? "text" : "password"}
      id={field.name}
      name={field.name}
      value={value ?? formData.values[field.name] ?? ""}
      onChange={(e) => {
        field.onChange?.(e);
        formData.handleChange(e);
      }}
      error={Boolean(formData.touched[field.name] && formData.errors[field.name])}
      onBlur={(e) => {
        field.onBlur?.(e);
        formData.handleBlur(e);
      }}
      disabled={field.disabled}
      placeholder={field.placeholder}
      sx={{
        "& .MuiInputAdornment-root": {
          border: "none",
          paddingRight: 0,
        },
      }}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <Text
              size="xsmall"
              weight="medium"
              style={{
                color: "#7F56D9",
                cursor: "pointer",
                userSelect: "none",
                paddingRight: "14px",
                width: "46px",
                textAlign: "center",
              }}
              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
            >
              {isPasswordVisible ? "Hide" : "Show"}
            </Text>
            {field.showPasswordGenerator && (
              <Tooltip title="Password Generator" placement="top-end" arrow>
                <Box
                  sx={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    px: "15px",
                    backgroundColor: "#F9F5FF",
                    height: "100%",
                    borderRadius: "0 8px 8px 0",
                    borderLeft: "1px solid #D0D5DD",
                  }}
                  onClick={() => {
                    const password = Generator.generate({
                      length: 12,
                      numbers: true,
                    });

                    formData.setFieldValue(field.name, password);
                    field.onChange?.({
                      target: {
                        name: field.name,
                        value: password,
                      },
                    });
                  }}
                >
                  <KeyIcon />
                </Box>
              </Tooltip>
            )}
          </InputAdornment>
        ),
      }}
    />
  );
};

const DynamicField: FC<DynamicFieldProps> = ({ field, formData, sx = {} }) => {
  const { type, name, value, menuItems = [], isHidden, dataTestId = "", customComponent } = field;
  const { values, touched, errors } = formData;

  if (isHidden) {
    return null;
  }

  let Field: React.ReactNode | null = null;

  if (customComponent) {
    Field = customComponent;
  } else if (type === "text" || type === "description" || type === "number") {
    Field = (
      <Box mt="6px">
        <TextInput field={field} formData={formData} />
      </Box>
    );
  } else if (type === "password") {
    Field = <PasswordInput field={field} formData={formData} value={value} />;
  } else if (type === "select") {
    Field = (
      <Box mt="6px">
        <SelectField field={field} formData={formData} />
      </Box>
    );
  } else if (type === "single-select-autocomplete") {
    Field = (
      <Autocomplete
        data-testid={dataTestId}
        options={menuItems}
        name={name}
        value={value ?? ""}
        onChange={(e, newValue) => {
          field.onChange?.(e);
          formData.setFieldValue(name, newValue);
        }}
        onBlur={(e) => {
          field.onBlur?.(e);
          formData.setFieldTouched(name, true);
        }}
        disabled={field.disabled}
        getOptionLabel={(option) => option}
        error={Boolean(touched[name] && errors[name])}
      />
    );
  } else if (type === "multi-select") {
    Field = (
      <Autocomplete
        data-testid={dataTestId}
        multiple
        options={menuItems}
        name={name}
        value={value ?? values[name] ?? ""}
        onChange={(e, newValue) => {
          field.onChange?.(e);
          formData.setFieldValue(name, newValue);
        }}
        onBlur={() => {
          formData.setFieldTouched(name, true);
        }}
        disabled={field.disabled}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        error={Boolean(touched[name] && errors[name])}
      />
    );
  } else if (type === "radio") {
    Field = <RadioField field={field} formData={formData} />;
  }

  if (type === "toggle-switch") {
    return (
      <FieldContainer
        sx={{
          display: "flex",
          gap: "16px",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <FieldLabel required={field.required}>{field.label}</FieldLabel>
          {field.description && <FieldDescription>{field.description}</FieldDescription>}
          <FieldError>{formData.touched.customMetricsEnabled && formData.errors.customMetricsEnabled}</FieldError>
        </Box>

        {Field}
      </FieldContainer>
    );
  }

  return (
    <FieldContainer sx={sx}>
      <FieldLabel required={field.required}>{field.label}</FieldLabel>
      {field.description && <FieldDescription>{field.description}</FieldDescription>}
      {field.customDescription && field.customDescription}

      {Field}
      {field.additionalDescription && field.additionalDescription}
      <FieldError>{touched[field.name] && errors[field.name]}</FieldError>
    </FieldContainer>
  );
};

export default DynamicField;

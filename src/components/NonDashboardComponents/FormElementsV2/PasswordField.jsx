import { useState } from "react";
import { Box, InputAdornment, TextField, Tooltip } from "@mui/material";
import Generator from "generate-password";

import KeyIcon from "src/components/Icons/Key/KeyIcon";
import { Text } from "src/components/Typography/Typography";

const PasswordField = (props) => {
  const { disabled = false, value, dataCy, showPasswordGenerator, sx = {}, ...restProps } = props;
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <TextField
      data-cy={dataCy || "password-field"}
      type={isPasswordVisible ? "text" : "password"}
      value={value}
      disabled={disabled}
      sx={{
        ".MuiOutlinedInput-root": {
          borderRadius: "6px",
          fontSize: "14px",
          color: "#111827",
          fontWeight: "500",
          boxShadow: "0px 1px 2px 0px #1018280D",
          paddingRight: "0",
          "& .MuiOutlinedInput-input": {
            padding: "10px 12px",
            backgroundColor: "#FFF",
            "&::placeholder": {
              fontSize: "14px",
              color: "#9CA3AF",
            },
          },
        },
        [`& .MuiOutlinedInput-input:disabled`]: {
          background: "#F9FAFB",
          color: "#667085",
          // color: "#4a505d",
          WebkitTextFillColor: "#667085",
        },
        ".MuiInputAdornment-root": {
          border: "none",
          paddingRight: 0,
        },
        ...sx,
      }}
      {...restProps}
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
                paddingRight: "12px",
                width: "46px",
                textAlign: "center",
              }}
              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
            >
              {isPasswordVisible ? "Hide" : "Show"}
            </Text>
            {showPasswordGenerator && (
              <Tooltip title="Password Generator" placement="top-end">
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

                    restProps.onChange?.({
                      target: {
                        name: restProps.name,
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
        ...restProps.InputProps,
      }}
    />
  );
};
export default PasswordField;

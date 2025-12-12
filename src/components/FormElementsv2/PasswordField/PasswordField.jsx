import { useState } from "react";
import { Box, InputAdornment } from "@mui/material";
import Generator from "generate-password";

import KeyIcon from "src/components/Icons/Key/KeyIcon";
import Tooltip from "src/components/Tooltip/Tooltip";
import { Text } from "src/components/Typography/Typography";

import TextField from "../TextField/TextField";

const generatePassword = (restProps) => {
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
};

export const PasswordField = (props) => {
  const { disabled = false, value, dataTestId, showPasswordGenerator, sx = {}, ...restProps } = props;
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <TextField
      type={isPasswordVisible ? "text" : "password"}
      value={value}
      disabled={disabled}
      sx={{
        "& .MuiInputAdornment-root": {
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
                paddingRight: "14px",
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
                  onClick={() => generatePassword(restProps)}
                >
                  <KeyIcon />
                </Box>
              </Tooltip>
            )}
          </InputAdornment>
        ),
      }}
      inputProps={{ "data-testid": dataTestId || "password-field" }}
    />
  );
};

import { useState } from "react";
import { Box, InputAdornment, Tooltip } from "@mui/material";
import Generator from "generate-password";

import { StyledTextField } from "src/components/FormElementsv2/TextField/TextField";
import KeyIcon from "src/components/Icons/Key/KeyIcon";
import { Text } from "src/components/Typography/Typography";

const PasswordField = (props) => {
  const { disabled = false, value, dataCy, showPasswordGenerator, sx = {}, ...restProps } = props;
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <StyledTextField
      data-cy={dataCy || "password-field"}
      type={isPasswordVisible ? "text" : "password"}
      value={value}
      disabled={disabled}
      sx={{ ...sx }}
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
                width: "38px",
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

import { useState } from "react";
import { InputAdornment, Stack, Typography } from "@mui/material";

import Tooltip from "src/components/Tooltip/Tooltip";
import { Text } from "src/components/Typography/Typography";

function convertToAsterisks(str) {
  // Get the length of the input string
  const length = str.length > 100 ? 100 : str.length;

  // Create a new string with the same length filled with asterisks
  const asterisks = "*".repeat(length);

  return asterisks;
}

export const PasswordWithOutBorderField = (props) => {
  const { children } = props;
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <Stack direction="row" alignItems="center" justifyContent="flex-end">
      <div>
        {isPasswordVisible ? (
          <Tooltip title={children}>
            <div>
              <Text
                size="small"
                weight="semibold"
                color="#535862"
                sx={{
                  wordBreak: "break-word",
                }}
              >
                {typeof children === "string"
                  ? `${children?.slice(0, 100)}${children?.length > 100 ? "..." : ""}`
                  : children}
              </Text>
            </div>
          </Tooltip>
        ) : (
          <Text
            size="small"
            weight="semibold"
            color="#535862"
            sx={{
              wordBreak: "break-word",
            }}
          >
            {convertToAsterisks(children)}
          </Text>
        )}
      </div>
      {children && typeof children === "string" && (
        <InputAdornment position="end">
          <Typography
            fontSize="12px"
            color="#7F56D9"
            style={{
              cursor: "pointer",
              userSelect: "none",
              paddingRight: "14px",
            }}
            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            {isPasswordVisible ? "Hide" : "Show"}
          </Typography>
        </InputAdornment>
      )}
    </Stack>
  );
};

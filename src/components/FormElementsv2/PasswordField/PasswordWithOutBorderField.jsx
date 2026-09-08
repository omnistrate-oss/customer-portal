import { useState } from "react";
import { Box, Stack, Typography } from "@mui/material";

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

  const displayValue = isPasswordVisible ? children : convertToAsterisks(children);

  return (
    <Stack direction="row" alignItems="flex-start" flex="1 1 auto" minWidth={0} gap="4px">
      <Tooltip title={isPasswordVisible ? children : ""}>
        <Box minWidth={0} flex={1}>
          <Text size="small" weight="semibold" color="#535862" ellipsis>
            {displayValue}
          </Text>
        </Box>
      </Tooltip>
      {children && typeof children === "string" && (
        <Typography
          component="button"
          type="button"
          aria-label={isPasswordVisible ? "Hide secret" : "Show secret"}
          fontSize="12px"
          color="#7F56D9"
          sx={{
            background: "none",
            border: 0,
            cursor: "pointer",
            flexShrink: 0,
            padding: 0,
            paddingRight: "14px",
            userSelect: "none",
          }}
          onClick={() => setIsPasswordVisible(!isPasswordVisible)}
        >
          {isPasswordVisible ? "Hide" : "Show"}
        </Typography>
      )}
    </Stack>
  );
};

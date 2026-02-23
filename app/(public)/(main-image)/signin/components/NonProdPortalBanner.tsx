import { Box, Stack } from "@mui/material";

import AlertTriangle from "src/components/Icons/AlertTriangle/AlertTriangle";
import { Text } from "src/components/Typography/Typography";
import useEnvironmentType from "src/hooks/useEnvironmentType";

function NonProdPortalBanner() {
  const environmentType = useEnvironmentType();

  return (
    <Box p="16px" borderBottom="1px solid #E9EAEB">
      <Stack direction="row" gap="8px" alignItems="center" justifyContent="center">
        <AlertTriangle color="#F79009" height="20px" width="20px" />
        <Text size="small" weight="semibold" color="#414651">
          {environmentType} CUSTOMER PORTAL — INTERNAL USE ONLY
        </Text>
      </Stack>
      <Text size="small" weight="regular" color="#414651" textAlign="center" sx={{ marginTop: "4px" }}>
        This portal mirrors the customer experience and is intended for internal testing. Access is limited to internal
        users.
      </Text>
    </Box>
  );
}

export default NonProdPortalBanner;

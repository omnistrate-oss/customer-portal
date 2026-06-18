import { FC } from "react";
import { Box, Stack } from "@mui/material";

import AlertTriangle from "src/components/Icons/AlertTriangle/AlertTriangle";
import ChevronRightIcon from "components/Icons/ChevronRight/ChevronRightIcon";
import { Text } from "components/Typography/Typography";

const PrivateConnectivityDescription: FC = () => {
  return (
    <Box mt="6px">
      <Stack direction="row" alignItems="center" gap="4px">
        <ChevronRightIcon />
        <Text size="xsmall" weight="medium" color="#414651">
          No traffic traverses the public internet
        </Text>
      </Stack>

      <Stack direction="row" alignItems="center" gap="4px" mt="6px">
        <AlertTriangle style={{ flexShrink: 0 }} />
        <Text size="xsmall" weight="medium" color="#414651">
          Additional charges apply per endpoint-hour and GB processed
        </Text>
      </Stack>
    </Box>
  );
};

export default PrivateConnectivityDescription;

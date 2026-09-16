import { FC } from "react";
import { Stack } from "@mui/material";

import { Text } from "src/components/Typography/Typography";

export type NoRowsOverlayContentProps = {
  noRowsText?: string;
  isFilterApplied?: boolean;
  // Plural noun for the filtered message, e.g. "workflows".
  entityName?: string;
};

const NoRowsOverlayContent: FC<NoRowsOverlayContentProps> = ({
  noRowsText,
  isFilterApplied,
  entityName = "results",
}) => {
  if (!isFilterApplied) return <>{noRowsText}</>;

  return (
    <Stack alignItems="center" gap="4px" px="24px" textAlign="center">
      <Text size="small" weight="semibold">
        No {entityName} match the selected filters
      </Text>
      <Text size="small" weight="regular" color="#535862">
        Adjust the filters to view matching {entityName}.
      </Text>
    </Stack>
  );
};

export default NoRowsOverlayContent;

import { Stack } from "@mui/system";

import { ENVIRONMENT_TYPE_LABEL } from "src/constants/environmentTypes";
import useEnvironmentType from "src/hooks/useEnvironmentType";

import StatusChip from "../StatusChip/StatusChip";
import { Text } from "../Typography/Typography";

function EnvironmentTypeChip() {
  const environmentType = useEnvironmentType();
  const environmentLabel = ENVIRONMENT_TYPE_LABEL[environmentType];

  const isProduction = environmentType === "PROD";

  return environmentLabel && !isProduction ? (
    <Stack direction="row" alignItems="center" gap="6px">
      <Text size="medium" weight="semibold" color="#414651">
        {environmentLabel} - Customer Portal
      </Text>
      <StatusChip category="pending" label="Internal Use Only" />
    </Stack>
  ) : (
    ""
  );
}

export default EnvironmentTypeChip;

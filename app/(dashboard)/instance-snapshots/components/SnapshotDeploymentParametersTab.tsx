import { useMemo } from "react";
import { Box, Stack } from "@mui/material";

import PropertyDetails, { Row } from "src/components/ResourceInstance/ResourceInstanceDetails/PropertyDetails";
import { Text } from "src/components/Typography/Typography";
import { colors } from "src/themeConfig";
import { InstanceSnapshot } from "src/types/instance-snapshot";

type SnapshotDeploymentParametersTabProps = {
  snapshot: InstanceSnapshot;
};

const SnapshotDeploymentParametersTab: React.FC<SnapshotDeploymentParametersTabProps> = ({ snapshot }) => {
  const deploymentParamsRows: Row[] = useMemo(() => {
    const outputParams = snapshot?.outputParams;
    if (!outputParams || outputParams.length === 0) return [];

    return outputParams.map((el) => {
      return {
        label: el.displayName || el.key,
        value: el.value,
        valueType: el.type,
      } as Row;
    });
  }, [snapshot?.outputParams]);

  return (
    <Box sx={{ marginTop: "24px" }}>
      {deploymentParamsRows.length > 0 ? (
        <PropertyDetails
          rows={{
            title: "Deployment Parameters",
            desc: "Configuration values and connection parameters generated for this snapshot",
            rows: deploymentParamsRows,
            flexWrap: true,
          }}
        />
      ) : (
        <Stack alignItems="center" justifyContent="center" minHeight="160px" textAlign="center" gap="4px">
          <Text size="small" weight="semibold" color={colors.gray700}>
            No deployment parameters
          </Text>
          <Text size="xsmall" weight="regular" color={colors.gray500}>
            This snapshot has no deployment parameters.
          </Text>
        </Stack>
      )}
    </Box>
  );
};

export default SnapshotDeploymentParametersTab;

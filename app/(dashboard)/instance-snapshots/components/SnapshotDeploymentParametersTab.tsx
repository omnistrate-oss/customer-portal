import { useMemo } from "react";
import { Box } from "@mui/material";

import PropertyDetails, { Row } from "src/components/ResourceInstance/ResourceInstanceDetails/PropertyDetails";
import { Text } from "src/components/Typography/Typography";
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
        <Text size="small" weight="medium" color="#535862">
          No deployment parameters available for this snapshot.
        </Text>
      )}
    </Box>
  );
};

export default SnapshotDeploymentParametersTab;

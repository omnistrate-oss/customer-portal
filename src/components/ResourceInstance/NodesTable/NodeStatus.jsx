import { Box } from "@mui/material";

import StatusChip, { getChipStyles } from "src/components/StatusChip/StatusChip";

import NodeStatusTooltip from "./NodeStatusTooltip";

export const NodeStatus = (props) => {
  const { detailedHealth, isStopped, isJob } = props;
  const ConnectivityStatus = detailedHealth?.ConnectivityStatus;
  const DiskHealth = detailedHealth?.DiskHealth;
  const NodeHealth = detailedHealth?.NodeHealth;
  const ProcessHealth = detailedHealth?.ProcessHealth;
  const ProcessLiveness = detailedHealth?.ProcessLiveness;
  const detailedHealthStatus = [ConnectivityStatus, DiskHealth, NodeHealth, ProcessHealth, ProcessLiveness];

  return (
    <NodeStatusTooltip detailedHealth={detailedHealth} isJob={isJob}>
      <Box display="flex" alignItems="center" gap="6px" borderRadius="16px" p="5px 8px">
        {detailedHealthStatus.map((status, index) => {
          const chipStyles = getChipStyles(isStopped ? "UNKNOWN" : status);

          if (isStopped) {
            return <StatusChip key={index} status="UNKNOWN" label={"Unknown"} />;
          }

          return (
            <Box
              key={index}
              bgcolor={isJob ? "#A4A7AE" : chipStyles.color || "gray"}
              width="8px"
              height="8px"
              borderRadius="50%"
            />
          );
        })}
      </Box>
    </NodeStatusTooltip>
  );
};

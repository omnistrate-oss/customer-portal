import { SxProps } from "@mui/material";

import { instaceHealthStatusMap } from "src/constants/statusChipStyles/resourceInstanceHealthStatus";
import { InstanceComputedHealthStatus } from "src/types/resourceInstance";

export const getRowBorderStyles = () => {
  const styles: Record<string, SxProps> = {};

  for (const status in instaceHealthStatusMap) {
    const colorMap: Record<InstanceComputedHealthStatus, string> = {
      DEGRADED: "#F79009",
      HEALTHY: "#17B26A",
      UNHEALTHY: "#F04438",
      UNKNOWN: "#363F72",
      NA: "#676b83",
    };

    const color = colorMap[status as InstanceComputedHealthStatus];

    styles[`& .${status}::before`] = {
      content: '""',
      height: "38px",
      width: "4px",
      background: color,
      transform: "translateY(4px)",
      position: "absolute",
      borderTopRightRadius: "3px",
      borderBottomRightRadius: "3px",
    };
  }
  return styles;
};

export const isActiveInstanceLifecycle = (status?: string | null): boolean =>
  status === "ACTIVE" || status === "RUNNING";

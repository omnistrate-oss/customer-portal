import React, { FC, ReactNode, useEffect, useRef, useState } from "react";
import { Box, chipClasses, ChipProps as MuiChipProps, Stack, SxProps, Theme } from "@mui/material";
import _ from "lodash";

import { Category, chipCategoryColors } from "src/constants/statusChipStyles/index";

import Chip from "../Chip/Chip";
import Dot from "../Dot/Dot";
import TickIcon from "../Icons/Tick/TickIcon";
import { PulsatingDot } from "../PulsatingDot/PulsatingDot";

export const statuses = {
  FAILED: "Failed",
  CANCELLED: "Cancelled",
  PENDING_DEPENDENCY: "Pending Dependency",
  PENDING: "Pending",
  RUNNING: "Running",
  DEPLOYING: "Deploying",
  READY: "Ready",
  SUCCESS: "Success",
  COMPLETE: "Complete",
  STOPPED: "Stopped",
  STOPPING: "Stopping",
  HEALTHY: "Healthy",
  UNHEALTHY: "Unhealthy",
  UNKNOWN: "Unknown",
  IN_PROGRESS: "In Progress",
  DELETED: "Deleted",
  PAUSED: "Paused",
  TERMINATED: "Terminated",
  COMPLETED: "Completed",
  NOT_ENABLED: "Not Enabled",
  "N/A": "N/A",
};

export const statusStyles = {
  ACTIVE: { ...chipCategoryColors.success },
  Active: { ...chipCategoryColors.success },
  CANCELLED: { ...chipCategoryColors.failed },
  COMPLETE: { ...chipCategoryColors.success },
  COMPLETED: { ...chipCategoryColors.success },
  DELETING: { ...chipCategoryColors.failed },
  DEPLOYING: { ...chipCategoryColors.pending },
  DEPRECATED: { ...chipCategoryColors.failed },
  Draft: {
    backgroundColor: "#FCFCFC",
    color: "#6F6F6F",
  },
  FAILED: { ...chipCategoryColors.failed },
  DELETED: { ...chipCategoryColors.failed },
  HEALTHY: { ...chipCategoryColors.success },
  IN_PROGRESS: {
    backgroundColor: "#F8F9FC",
    color: "#669F2A",
  },
  NOT_ENABLED: { ...chipCategoryColors.failed },
  Open: {
    backgroundColor: "#EFF8FF",
    color: "#1942C6",
  },
  PAID: { ...chipCategoryColors.success },
  Paid: { ...chipCategoryColors.success },
  PAUSED: {
    backgroundColor: "#FEF3F2",
    color: "#C83532",
  },
  PENDING: { ...chipCategoryColors.pending },
  PENDING_DEPENDENCY: {
    backgroundColor: "#EEF4FF",
    color: "#3538CD",
  },
  PREFERRED: {
    color: "#175CD3",
    backgroundColor: "#EFF8FF",
  },
  Preferred: {
    color: "#175CD3",
    backgroundColor: "#EFF8FF",
  },
  READY: { ...chipCategoryColors.success },
  RELEASED: { ...chipCategoryColors.success },
  RUNNING: { ...chipCategoryColors.success },
  STOPPED: { ...chipCategoryColors.failed },
  STOPPING: { ...chipCategoryColors.failed },
  SUCCESS: { ...chipCategoryColors.success },
  SUSPENDED: { ...chipCategoryColors.failed },
  TERMINATED: { ...chipCategoryColors.failed },
  UNHEALTHY: { ...chipCategoryColors.failed },
  UNKNOWN: {
    color: "#363F72",
    borderColor: "#D5D9EB",
    backgroundColor: "#F8F9FC",
  },
  Voided: {
    backgroundColor: "#FEF3F2",
    color: "#C83532",
  },
  "N/A": {
    backgroundColor: "#f2f4f7",
    color: "#667085",
  },
  ENCRYPTED: { ...chipCategoryColors.unknown },
  NOT_ENCRYPTED: { ...chipCategoryColors.failed },
};

type StatusChipProps = {
  status?: string;
  sx?: SxProps<Theme>;
  fontStyles?: SxProps<Theme>;
  dot?: boolean;
  pulsateDot?: boolean;
  tick?: boolean;
  color?: string;
  backgroundColor?: string;
  capitalize?: boolean;
  label?: string;
  category?: Category;
  borderColor?: string;
  startIcon?: ReactNode;
  showOverflowTitle?: boolean;
};

type ChipProps = Omit<MuiChipProps, "color">;

const StatusChip: FC<ChipProps & StatusChipProps> = (props) => {
  const {
    status,
    sx = {},
    fontStyles = { fontSize: "12px", lineHeight: "18px" },
    dot,
    pulsateDot,
    tick,
    color,
    backgroundColor: bgColor,
    capitalize = true,
    label = statuses[status as keyof typeof statuses],
    category,
    borderColor,
    startIcon,
    showOverflowTitle,
    ...restProps
  } = props;
  let chipStyles = getChipStyles(status);

  if (category) {
    chipStyles = {
      color: chipCategoryColors[category].color,
      backgroundColor: chipCategoryColors[category].backgroundColor,
      borderColor: chipCategoryColors[category].borderColor,
    };
  }

  const fontColor = color ? color : chipStyles.color;
  const backgroundColor = bgColor ? bgColor : chipStyles.backgroundColor;

  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const displayLabel = label ? label : status ? (capitalize ? _.capitalize(status) : status) : "";

  useEffect(() => {
    if (showOverflowTitle && displayLabel && textRef.current) {
      const isOverflow = textRef.current.scrollWidth > textRef.current.clientWidth;
      setIsOverflowing(isOverflow);
    }
  }, [showOverflowTitle, displayLabel]);

  return (
    <Chip
      label={
        <Stack direction="row" alignItems="center" gap={"5px"}>
          {pulsateDot && <PulsatingDot color={fontColor} />}
          {dot && <Dot color={fontColor} />}
          {tick && <TickIcon />}
          {startIcon && startIcon}
          <Box
            component="span"
            sx={{ overflow: "hidden", textOverflow: "ellipsis" }}
            ref={textRef}
            title={showOverflowTitle && isOverflowing ? displayLabel : undefined}
          >
            {displayLabel}
          </Box>
        </Stack>
      }
      sx={{
        backgroundColor: backgroundColor,
        [`& .${chipClasses.label}`]: {
          color: fontColor,
          ...fontStyles,
        },
        ...sx,
      }}
      borderColor={borderColor || chipStyles.borderColor}
      {...restProps}
    />
  );
};

export default StatusChip;

export function getChipStyles(resourceInstanceStatus) {
  let chipStyles = statusStyles[resourceInstanceStatus];
  if (!chipStyles) chipStyles = statusStyles["PENDING"];

  return chipStyles;
}

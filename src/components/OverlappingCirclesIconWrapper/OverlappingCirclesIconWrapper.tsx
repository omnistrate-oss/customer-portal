import { FC, ReactNode } from "react";
import { Box } from "@mui/material";

export const CONFIRMATION_DIALOG_ICON_STYLES = {
  danger: {
    color: "#D92D20",
    innerCircleColor: "#FEE4E2",
    outerCircleColor: "#FEF3F2",
  },
  warning: {
    color: "#B54708",
    innerCircleColor: "#FEF0C7",
    outerCircleColor: "#FFFAEB",
  },
  approve: {
    color: "#099250",
    innerCircleColor: "#D3F8DF",
    outerCircleColor: "#EDFCF2",
  },
};

type OverlappingCirclesWrapperIconProps = {
  children?: ReactNode;
  size?: number;
  innerCircleColor?: string;
  outerCircleColor?: string;
  variant?: "danger" | "warning" | "approve";
  IconComponent?: FC<{ color?: string; width?: number; height?: number } & any>;
  width?: number;
  height?: number;
};

const OverlappingCirclesIconWrapper: FC<OverlappingCirclesWrapperIconProps> = ({
  children,
  size = 56,
  innerCircleColor,
  outerCircleColor,
  variant = "approve",
  IconComponent,
  width = 20,
  height = 20,
}) => {
  const innerCircleSize = (size / 56) * 48; // Scale based on original proportions
  const borderWidth = (size / 56) * 8;

  const styles = CONFIRMATION_DIALOG_ICON_STYLES[variant];

  const finalInnerCircleColor = innerCircleColor || styles.innerCircleColor;
  const finalOuterCircleColor = outerCircleColor || styles.outerCircleColor;

  return (
    <Box
      sx={{
        position: "relative",
        width: `${size}px`,
        height: `${size}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Outer circle */}
      <Box
        sx={{
          position: "absolute",
          width: `${innerCircleSize}px`,
          height: `${innerCircleSize}px`,
          borderRadius: "50%",
          border: `${borderWidth}px solid ${finalOuterCircleColor}`,
          backgroundColor: finalInnerCircleColor,
        }}
      />
      {/* Icon content */}
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {IconComponent ? <IconComponent color={styles.color} width={width} height={height} /> : children}
      </Box>
    </Box>
  );
};

export default OverlappingCirclesIconWrapper;

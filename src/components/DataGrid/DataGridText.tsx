import { FC, useCallback, useState } from "react";
import Link from "next/link";
import { IconButton, Stack, Typography } from "@mui/material";
import clipboard from "clipboardy";
import type * as CSS from "csstype";

import { colors } from "src/themeConfig";

import DataGridCopyIcon from "../Icons/CopyIcon/DataGridCopyIcon";
import Tooltip from "../Tooltip/Tooltip";

type LinkProps = {
  href: string;
  target?: "_self" | "_blank";
  isUnderlined?: boolean;
};

const colorMap = {
  default: "#475467",
  primary: colors.purple700,
};

type DataGridTextProps = {
  children?: string;
  showCopyButton?: boolean;
  linkProps?: LinkProps;
  onClick?: () => void;
  color?: "default" | "primary";
  style?: CSS.Properties;
  justifyContent?: "center" | "start" | "end";
};

const DataGridText: FC<DataGridTextProps> = ({
  children = "",
  showCopyButton,
  linkProps,
  onClick,
  color = "default",
  style = {},
  justifyContent = "start",
}) => {
  const [tooltipText, setTooltipText] = useState("Click to copy");
  const { href, target = "_self", isUnderlined = false } = linkProps || {};

  const onCopyIconClick = useCallback(() => {
    clipboard
      .write(children)
      .then(() => setTooltipText("Copied"))
      .catch(() => setTooltipText("Unable to copy to clipboard"))
      .finally(() => setTimeout(() => setTooltipText("Click to copy"), 1500)); // Reset the tooltip text after copying
  }, [children]);

  const textStyles = {
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 500,
    color: colorMap[color],
    textDecoration: isUnderlined ? `underline solid ${colorMap[color]} 1px` : "none",
  };

  const Content = () =>
    href ? (
      <Typography title={children} noWrap style={{ ...textStyles }}>
        <Link
          href={
            href.startsWith("/") || href.startsWith("https://") || href.startsWith("http://") ? href : `https://${href}`
          }
          target={target}
          rel="noopener noreferrer"
          style={style}
        >
          {children}
        </Link>
      </Typography>
    ) : (
      <Typography
        title={children}
        noWrap // To add ellipses
        style={{
          cursor: linkProps || onClick ? "pointer" : "auto",
          ...textStyles,
          ...style,
        }}
        onClick={onClick}
      >
        {children}
      </Typography>
    );

  return (
    <Stack direction="row" alignItems="center" justifyContent={justifyContent} gap="4px" width="100%">
      <Content />
      {children && showCopyButton && (
        <Tooltip title={tooltipText}>
          <IconButton onClick={onCopyIconClick}>
            <DataGridCopyIcon />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
};

export default DataGridText;

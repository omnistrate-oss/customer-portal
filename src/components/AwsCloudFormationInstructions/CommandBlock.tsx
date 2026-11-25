import { Box, IconButton } from "@mui/material";
import clipboard from "clipboardy";
import { FC, useState } from "react";

import CopyIcon from "src/components/CodeEditor/CopyIcon";
import Tooltip from "src/components/Tooltip/Tooltip";
import { Text } from "src/components/Typography/Typography";
import { colors } from "src/themeConfig";

const DEFAULT_TOOLTIP_TEXT = "Click to copy";

const CODE_SURFACE = "#0C0E12";
const BORDER_COLOR = "#22262F";
const SCROLL_THUMB = "#373A41";

export type CommandBlockProps = {
  title: string;
  command: string;
  dataTestId?: string;
  fixedHeight?: boolean;
  compact?: boolean;
  copyDisabledReason?: string;
};

/**
 * Terminal block for shell commands with a copy action that always writes the original command.
 * Visual wrapping keeps every flag readable in a narrow modal without altering the copied text.
 * Long create commands use a fixed-height scroll area; short commands can retain their natural height.
 */
const CommandBlock: FC<CommandBlockProps> = ({
  title,
  command,
  dataTestId,
  fixedHeight = false,
  compact = false,
  copyDisabledReason = "",
}) => {
  const [tooltipText, setTooltipText] = useState(DEFAULT_TOOLTIP_TEXT);

  return (
    <Box
      sx={{
        boxSizing: "border-box",
        backgroundColor: CODE_SURFACE,
        border: `1px solid ${BORDER_COLOR}`,
        borderRadius: "12px",
        overflow: "hidden",
        minWidth: 0,
        position: "relative",
        height: fixedHeight ? "236px" : "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          minHeight: compact ? undefined : "56px",
          position: compact ? "absolute" : "static",
          top: compact ? "10px" : undefined,
          bottom: compact ? "10px" : undefined,
          right: compact ? "16px" : undefined,
          zIndex: compact ? 1 : undefined,
          flexShrink: 0,
          padding: compact ? 0 : "11px 11px 8px 23px",
          backgroundColor: CODE_SURFACE,
          borderBottom: compact ? undefined : `1px solid ${BORDER_COLOR}`,
        }}
      >
        <Text weight="semibold" size="medium" color={colors.gray25} hidden={compact}>
          {title}
        </Text>

        <Tooltip title={copyDisabledReason || tooltipText} describeChild>
          <Box
            component="span"
            display="inline-flex"
            tabIndex={copyDisabledReason ? 0 : undefined}
            role={copyDisabledReason ? "group" : undefined}
            aria-label={copyDisabledReason ? "Copy command unavailable" : undefined}
            aria-disabled={!!copyDisabledReason || undefined}
          >
            <IconButton
              aria-label={compact ? "Copy setup script command" : `Copy ${title.toLowerCase()} command`}
              disabled={!!copyDisabledReason}
              sx={{
                width: "36px",
                height: "36px",
                flexShrink: 0,
                backgroundColor: "#13161B",
                border: "1px solid #373A41",
                borderRadius: "8px",
                boxShadow: "inset 0 0 0 1px rgba(12, 14, 18, 0.18), inset 0 -2px 0 rgba(12, 14, 18, 0.05)",
                "& svg": { width: "20px", height: "20px" },
                "& svg path": { stroke: "#CECFD2" },
                "&:hover": { backgroundColor: "#1F242C" },
              }}
              onClick={() => {
                if (copyDisabledReason) return;
                clipboard
                  .write(command)
                  .then(() => setTooltipText("Copied"))
                  .catch(() => setTooltipText("Unable to copy to clipboard"))
                  .finally(() => setTimeout(() => setTooltipText(DEFAULT_TOOLTIP_TEXT), 1500));
              }}
            >
              <CopyIcon />
            </IconButton>
          </Box>
        </Tooltip>
      </Box>

      <Box
        sx={{
          flex: fixedHeight ? 1 : "none",
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          scrollbarWidth: "thin",
          scrollbarColor: `${SCROLL_THUMB} ${CODE_SURFACE}`,
          "&::-webkit-scrollbar": { width: "10px" },
          "&::-webkit-scrollbar-track": { backgroundColor: CODE_SURFACE },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: SCROLL_THUMB,
            borderRadius: "999px",
            border: `2px solid ${CODE_SURFACE}`,
          },
          "&::-webkit-scrollbar-thumb:hover": { backgroundColor: "#44548C" },
        }}
      >
        <Box
          component="pre"
          data-testid={dataTestId}
          sx={{
            margin: 0,
            padding: compact ? "16px 72px 16px 16px" : "16px 24px",
            boxSizing: "border-box",
            width: "100%",
            minHeight: "100%",
            color: "#75E0A7",
            fontFamily: "'Roboto Mono', monospace",
            fontSize: "12px",
            lineHeight: "16px",
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
          }}
        >
          {command}
        </Box>
      </Box>
    </Box>
  );
};

export default CommandBlock;

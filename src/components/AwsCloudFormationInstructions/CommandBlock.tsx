import { FC, useId, useState } from "react";
import { Box, Dialog, IconButton, Stack } from "@mui/material";
import clipboard from "clipboardy";

import CopyIcon from "src/components/CodeEditor/CopyIcon";
import FullscreenIcon from "src/components/Icons/Fullscreen/FullscreenIcon";
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
  const [fullscreen, setFullscreen] = useState(false);
  const id = useId();
  const copyCommand = () => {
    if (copyDisabledReason) return;
    clipboard
      .write(command)
      .then(() => setTooltipText("Copied"))
      .catch(() => setTooltipText("Unable to copy to clipboard"))
      .finally(() => setTimeout(() => setTooltipText(DEFAULT_TOOLTIP_TEXT), 1500));
  };

  if (compact) {
    const code = (expanded: boolean) => (
      <Box
        component="pre"
        data-testid={expanded ? `${dataTestId}-fullscreen` : dataTestId}
        role="region"
        aria-label={expanded ? "Full AWS Command" : "AWS Command"}
        tabIndex={expanded ? undefined : 0}
        sx={{
          m: 0,
          p: "12px",
          pr: expanded ? "12px" : "104px",
          border: `1px solid ${BORDER_COLOR}`,
          borderRadius: "8px",
          bgcolor: CODE_SURFACE,
          color: colors.green300,
          fontFamily: "'Roboto Mono', monospace",
          fontSize: "12px",
          lineHeight: "18px",
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          minWidth: 0,
          maxWidth: "100%",
          boxSizing: "border-box",
          ...(!expanded && {
            height: "116px",
            overflowY: "scroll",
            overflowX: "hidden",
            scrollbarWidth: "thin",
            scrollbarColor: `${SCROLL_THUMB} ${CODE_SURFACE}`,
            "&::-webkit-scrollbar": { width: "10px" },
            "&::-webkit-scrollbar-track": { bgcolor: CODE_SURFACE },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: SCROLL_THUMB,
              borderRadius: "999px",
              border: `2px solid ${CODE_SURFACE}`,
            },
          }),
        }}
      >
        {command}
      </Box>
    );
    const copyButton = (expanded: boolean) => (
      <Tooltip title={copyDisabledReason || tooltipText} describeChild>
        <Box component="span" display="inline-flex" tabIndex={copyDisabledReason ? 0 : undefined}>
          <IconButton
            aria-label={expanded ? "Copy full AWS command" : `Copy ${title.toLowerCase()} command`}
            disabled={!!copyDisabledReason}
            onClick={copyCommand}
            sx={{
              width: "32px",
              height: "32px",
              borderRadius: "6px",
              color: expanded ? colors.gray500 : colors.gray300,
              ...(!expanded && { bgcolor: CODE_SURFACE, border: `1px solid ${SCROLL_THUMB}` }),
              "& svg": { width: 20, height: 20 },
              "& svg path": { stroke: "currentColor" },
            }}
          >
            <CopyIcon />
          </IconButton>
        </Box>
      </Tooltip>
    );
    return (
      <>
        <Box position="relative" minWidth={0}>
          {code(false)}
          <Stack direction="row" gap="6px" position="absolute" top="6px" right="16px">
            {copyButton(false)}
            <Tooltip title="Open Fullscreen">
              <IconButton
                aria-label="Open Fullscreen"
                aria-haspopup="dialog"
                onClick={() => setFullscreen(true)}
                sx={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "6px",
                  bgcolor: CODE_SURFACE,
                  border: `1px solid ${SCROLL_THUMB}`,
                  color: colors.gray300,
                }}
              >
                <FullscreenIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
        <Dialog fullScreen open={fullscreen} onClose={() => setFullscreen(false)} aria-labelledby={`${id}-title`}>
          <Stack
            direction="row"
            alignItems="center"
            gap="12px"
            p={{ xs: "16px", md: "24px" }}
            borderBottom={`1px solid ${colors.gray200}`}
          >
            <Text component="h2" id={`${id}-title`} size="large" weight="semibold" color={colors.gray900} mr="auto">
              AWS Command
            </Text>
            {copyButton(true)}
            <Tooltip title="Minimize">
              <IconButton aria-label="Minimize" autoFocus onClick={() => setFullscreen(false)}>
                <FullscreenIcon minimize color={colors.gray500} />
              </IconButton>
            </Tooltip>
          </Stack>
          <Box p={{ xs: "16px", md: "24px" }} minWidth={0} sx={{ overflowX: "hidden", overflowY: "auto" }}>
            {code(true)}
          </Box>
        </Dialog>
      </>
    );
  }

  return (
    <Box
      sx={{
        boxSizing: "border-box",
        backgroundColor: CODE_SURFACE,
        border: `1px solid ${BORDER_COLOR}`,
        borderRadius: "12px",
        overflow: "hidden",
        minWidth: 0,
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
          minHeight: "56px",
          flexShrink: 0,
          padding: "11px 11px 8px 23px",
          backgroundColor: CODE_SURFACE,
          borderBottom: `1px solid ${BORDER_COLOR}`,
        }}
      >
        <Text weight="semibold" size="medium" color="#F7F7F7">
          {title}
        </Text>

        <IconButton
          aria-label={`Copy ${title.toLowerCase()} command`}
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
          onClick={copyCommand}
        >
          <Tooltip title={tooltipText}>
            <span>
              <CopyIcon />
            </span>
          </Tooltip>
        </IconButton>
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
            padding: "16px 24px",
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

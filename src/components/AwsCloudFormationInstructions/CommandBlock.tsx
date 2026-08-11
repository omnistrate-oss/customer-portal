import { FC, useState } from "react";
import { Box, IconButton } from "@mui/material";
import clipboard from "clipboardy";

import CopyIcon from "src/components/CodeEditor/CopyIcon";
import Tooltip from "src/components/Tooltip/Tooltip";
import { Text } from "src/components/Typography/Typography";

const DEFAULT_TOOLTIP_TEXT = "Click to copy";

const HEADER_SURFACE = "#171D2D";
const HEADER_BORDER = "#2B3244";
const CODE_SURFACE = "#0E1530";
const SCROLL_THUMB = "#33406B";

export type CommandBlockProps = {
  title: string;
  command: string;
  dataTestId?: string;
};

/**
 * Terminal block for long shell commands, with the header chrome and copy behaviour of
 * `CodeEditorHeader`. Lines never wrap — a command broken mid-token renders `org-EUVvex3bVm` as
 * `or` + `g-EUVvex3bVm` and cannot be checked before running — so it scrolls horizontally instead.
 * There is no height cap, leaving vertical scrolling to the surrounding dialog.
 */
const CommandBlock: FC<CommandBlockProps> = ({ title, command, dataTestId }) => {
  const [tooltipText, setTooltipText] = useState(DEFAULT_TOOLTIP_TEXT);

  return (
    <Box
      sx={{
        backgroundColor: CODE_SURFACE,
        borderRadius: "8px",
        overflow: "hidden",
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          padding: "4px 8px 4px 16px",
          backgroundColor: HEADER_SURFACE,
          borderBottom: `1px solid ${HEADER_BORDER}`,
        }}
      >
        <Text weight="regular" size="xsmall" color="#FFFFFF">
          {title}
        </Text>

        <IconButton
          aria-label={`Copy ${title.toLowerCase()} command`}
          sx={{ flexShrink: 0 }}
          onClick={() => {
            clipboard
              .write(command)
              .then(() => setTooltipText("Copied"))
              .catch(() => setTooltipText("Unable to copy to clipboard"))
              .finally(() => setTimeout(() => setTooltipText(DEFAULT_TOOLTIP_TEXT), 1500));
          }}
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
          overflowX: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: `${SCROLL_THUMB} ${CODE_SURFACE}`,
          "&::-webkit-scrollbar": { height: "10px" },
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
            padding: "12px 16px",
            // Shrink-to-fit so the trailing padding scrolls with the content instead of sitting at
            // the container edge, where the last characters would touch the border.
            display: "inline-block",
            boxSizing: "border-box",
            minWidth: "100%",
            color: "#E6EAF5",
            fontFamily: "'Roboto Mono', 'JetBrains Mono', monospace",
            fontSize: "12.5px",
            lineHeight: "20px",
            whiteSpace: "pre",
          }}
        >
          {command}
        </Box>
      </Box>
    </Box>
  );
};

export default CommandBlock;

import { FC, Fragment, ReactNode, useState } from "react";
import { Box, IconButton, Stack, Typography } from "@mui/material";

import { ArrowUpRight, Copy02 } from "src/icons";
import Tooltip from "components/Tooltip/Tooltip";
import { Text } from "components/Typography/Typography";

const actionButtonSx = {
  height: "47px",
  width: "47px",
  border: "1px solid #373A41",
  borderRadius: "8px",
  color: "#CECFD2",
};

const CopyCommandButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <Tooltip title={copied ? "Copied" : "Copy"}>
      <IconButton aria-label="Copy" onClick={handleCopy} sx={{ ...actionButtonSx, mt: "10px" }}>
        <Copy02 />
      </IconButton>
    </Tooltip>
  );
};

export type CommandListItem = {
  title: string;
  /** Rich content is allowed so steps can link out to consoles and guides. */
  description: ReactNode;
  command: string;
  copyValue?: string;
  /** When the command is a URL, renders an open-in-new-tab button alongside the copy button. */
  href?: string;
};

type CommandListProps = {
  commands: CommandListItem[];
  titleTestId?: string;
  codeColor?: string;
  /** Drops the card gutters and outer spacing so a parent — e.g. a tab panel — can own the layout. */
  disableGutters?: boolean;
};

const CommandList: FC<CommandListProps> = ({ commands, titleTestId, codeColor = "white", disableGutters }) => {
  // The 24px between the two columns keeps the divider off the text either way; only the outer
  // edges are dropped, since a wrapping tab panel already supplies them.
  const descriptionGutter = disableGutters ? "0px 24px 0px 0px" : "0px 24px";
  const commandGutter = disableGutters ? "0px 0px 0px 24px" : "0px 24px";
  const outerSpacing = disableGutters ? "0px" : "25px";

  return (
    <Box display="grid" gridTemplateColumns="1fr 1fr">
      {commands.map((command, index) => {
        const isLast = index === commands.length - 1;
        const copyText = command.copyValue ?? command.command;

        return (
          <Fragment key={command.title}>
            <Stack
              p={descriptionGutter}
              borderRight="1px solid #E9EAEB"
              marginTop={outerSpacing}
              marginBottom={isLast ? outerSpacing : "0px"}
            >
              <Text
                size="xsmall"
                weight="semibold"
                color="#414651"
                data-testid={titleTestId && `${titleTestId}-${index}`}
              >
                {command.title}
              </Text>
              <Text size="small" weight="regular" color="#535862" marginTop="2px">
                {command.description}
              </Text>
            </Stack>
            <Stack p={commandGutter} marginTop={outerSpacing} marginBottom={isLast ? outerSpacing : "0px"}>
              <Stack
                direction="row"
                alignItems="start"
                gap="10px"
                p="10px"
                borderRadius="10px"
                sx={{ backgroundColor: "#1B2635" }}
              >
                <Box flex="1" p="10px" borderRadius="8px" sx={{ backgroundColor: "#0B1221" }}>
                  <Typography
                    fontSize="12px"
                    lineHeight="18px"
                    color={codeColor}
                    fontFamily="monospace"
                    sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", color: "#FFFFFF" }}
                  >
                    {command.command}
                  </Typography>
                </Box>
                <Stack alignItems="center">
                  {command.href && (
                    <Tooltip title="Launch in AWS">
                      <IconButton
                        aria-label="Launch in AWS"
                        component="a"
                        href={command.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={actionButtonSx}
                      >
                        <ArrowUpRight />
                      </IconButton>
                    </Tooltip>
                  )}
                  <CopyCommandButton text={copyText} />
                </Stack>
              </Stack>
            </Stack>
          </Fragment>
        );
      })}
    </Box>
  );
};

export default CommandList;

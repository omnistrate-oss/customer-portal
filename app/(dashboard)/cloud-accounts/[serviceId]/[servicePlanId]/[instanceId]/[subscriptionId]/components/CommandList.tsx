import { FC, Fragment } from "react";
import { Box, Stack, Typography } from "@mui/material";

import CopyButton from "components/Button/CopyButton";
import { Text } from "components/Typography/Typography";

export type CommandListItem = {
  title: string;
  description: string;
  command: string;
  copyValue?: string;
};

type CommandListProps = {
  commands: CommandListItem[];
  titleTestId?: string;
  codeColor?: string;
};

const CommandList: FC<CommandListProps> = ({ commands, titleTestId, codeColor = "white" }) => {
  return (
    <Box display="grid" gridTemplateColumns="1fr 1fr">
      {commands.map((command, index) => {
        const isLast = index === commands.length - 1;
        const copyText = command.copyValue ?? command.command;

        return (
          <Fragment key={command.title}>
            <Stack p="0px 24px" borderRight="1px solid #E9EAEB" marginTop="25px" marginBottom={isLast ? "25px" : "0px"}>
              <Text size="xsmall" weight="semibold" color="#414651" data-testid={titleTestId}>
                {command.title}
              </Text>
              <Text size="small" weight="regular" color="#535862" marginTop="2px">
                {command.description}
              </Text>
            </Stack>
            <Stack p="0px 24px" marginTop="25px" marginBottom={isLast ? "25px" : "0px"}>
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
                    sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                  >
                    {command.command}
                  </Typography>
                </Box>
                <CopyButton
                  text={copyText}
                  iconProps={{ width: 20, height: 20, color: "white" }}
                  iconButtonProps={{ mt: "3px" }}
                />
              </Stack>
            </Stack>
          </Fragment>
        );
      })}
    </Box>
  );
};

export default CommandList;

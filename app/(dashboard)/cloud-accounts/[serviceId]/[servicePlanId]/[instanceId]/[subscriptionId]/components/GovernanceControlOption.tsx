import { FC, ReactNode } from "react";
import { Box, Stack } from "@mui/material";

import Button from "src/components/Button/Button";
import { Text } from "src/components/Typography/Typography";
import { ArrowUpRight } from "src/icons";

const InlineCode: FC<{ children: ReactNode }> = ({ children }) => (
  <Box
    component="code"
    sx={{
      justifySelf: "start",
      fontFamily: "monospace",
      fontSize: "13px",
      lineHeight: "20px",
      color: "#414651",
      backgroundColor: "#F9FAFB",
      border: "1px solid #E9EAEB",
      borderRadius: "4px",
      padding: "1px 6px",
    }}
  >
    {children}
  </Box>
);

const ConsoleLabel: FC<{ children: ReactNode }> = ({ children }) => (
  <Box component="span" sx={{ fontWeight: 600, color: "#414651" }}>
    {children}
  </Box>
);

const StackUpdateSteps: FC<{ stackName: string }> = ({ stackName }) => (
  <Box
    component="ol"
    sx={{
      listStyle: "decimal",
      paddingLeft: "20px",
      margin: 0,
      color: "#535862",
      fontSize: "14px",
      lineHeight: "20px",
      "& > li + li": { marginTop: "6px" },
      "& > li::marker": { color: "#717680" },
    }}
  >
    <li>
      Open the <InlineCode>{stackName}</InlineCode> stack, choose <ConsoleLabel>Update</ConsoleLabel>
    </li>
    <li>
      Keep <ConsoleLabel>Use existing template</ConsoleLabel>
    </li>
    <li>Set the parameter above, leave others unchanged</li>
    <li>Acknowledge IAM capabilities, submit</li>
  </Box>
);

export type GovernanceControlOptionData = {
  title: string;
  description: string;
  /** Template parameter name as the console shows it, without the quick-create `param_` prefix. */
  parameter: string;
  value: boolean;
};

type GovernanceControlOptionProps = GovernanceControlOptionData & {
  stackName: string;
  stackUrl: string;
  titleTestId?: string;
};

const GovernanceControlOption: FC<GovernanceControlOptionProps> = ({
  title,
  description,
  parameter,
  value,
  stackName,
  stackUrl,
  titleTestId,
}) => (
  <Box
    display="grid"
    gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }}
    columnGap="48px"
    rowGap="24px"
    padding="20px 24px"
  >
    <Stack gap="4px" alignItems="flex-start">
      <Text size="small" weight="semibold" color="#414651" data-testid={titleTestId}>
        {title}
      </Text>
      <Text size="small" weight="regular" color="#535862">
        {description}
      </Text>
    </Stack>

    <Stack gap="16px" alignItems="flex-start">
      <Box display="grid" gridTemplateColumns="auto 1fr" columnGap="16px" rowGap="8px" alignItems="center">
        <Text size="small" weight="regular" color="#717680">
          Parameter
        </Text>
        <InlineCode>{parameter}</InlineCode>
        <Text size="small" weight="regular" color="#717680">
          Set to
        </Text>
        <InlineCode>{String(value)}</InlineCode>
      </Box>

      <StackUpdateSteps stackName={stackName} />

      <Button
        variant="outlined"
        size="small"
        href={stackUrl}
        target="_blank"
        rel="noopener noreferrer"
        endIcon={<ArrowUpRight size={16} />}
      >
        Open CloudFormation
      </Button>
    </Stack>
  </Box>
);

export default GovernanceControlOption;

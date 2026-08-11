import { FC, ReactNode, useState } from "react";
import { Box } from "@mui/material";

import { Tab, Tabs } from "src/components/Tab/Tab";
import { Text } from "src/components/Typography/Typography";
import {
  getAwsCloudFormationCreateStackCommand,
  getAwsCloudFormationDeleteStackCommand,
} from "src/utils/accountConfig/awsCloudFormation";

import CommandBlock from "./CommandBlock";

type InstructionsVariant = "onboarding" | "offboarding";

export type AwsCloudFormationInstructionsProps = {
  /** The URL the console instructions point at. The CLI command is derived from this exact URL. */
  cloudFormationUrl?: string | null;
  variant: InstructionsVariant;
  awsAccountId?: string;
  /** Console-based instructions, rendered unchanged under the Console tab. */
  children: ReactNode;
};

const BodyText: FC<{ children: ReactNode }> = ({ children }) => (
  <Text size="small" weight="regular" color="#344054">
    {children}
  </Text>
);

/**
 * Presents AWS CloudFormation account setup as a Console tab and a CLI tab. When no command can be
 * derived, the tabs are dropped and the console instructions render alone rather than offering a
 * command that would fail.
 */
const AwsCloudFormationInstructions: FC<AwsCloudFormationInstructionsProps> = ({
  cloudFormationUrl,
  variant,
  awsAccountId,
  children,
}) => {
  const [selectedTab, setSelectedTab] = useState<"console" | "cli">("console");

  const command =
    variant === "onboarding"
      ? getAwsCloudFormationCreateStackCommand(cloudFormationUrl)
      : getAwsCloudFormationDeleteStackCommand(cloudFormationUrl);

  if (!command) return <>{children}</>;

  const accountSuffix = awsAccountId ? ` to AWS account ${awsAccountId}` : "";

  return (
    <Box width="100%" minWidth={0}>
      <Tabs
        value={selectedTab}
        onChange={(_, value) => setSelectedTab(value)}
        aria-label="AWS CloudFormation setup method"
      >
        <Tab label="AWS Console" value="console" data-testid="aws-cloudformation-console-tab" />
        <Tab label="AWS CLI" value="cli" data-testid="aws-cloudformation-cli-tab" />
      </Tabs>

      <Box marginTop="16px" minWidth={0}>
        {selectedTab === "console" ? (
          children
        ) : (
          <Box display="flex" flexDirection="column" gap="12px" minWidth={0}>
            <BodyText>
              {variant === "onboarding"
                ? `Run this from a terminal authenticated${accountSuffix}. It creates the same CloudFormation stack as the console flow.`
                : `Run this from a terminal authenticated${accountSuffix} to delete the onboarding stack and revoke remaining access.`}
            </BodyText>

            <CommandBlock
              title={variant === "onboarding" ? "Create stack" : "Delete stack"}
              command={command}
              dataTestId="aws-cloudformation-cli-command"
            />

            {variant === "onboarding" && (
              <BodyText>
                If an existing AWSLoadBalancerControllerIAMPolicy policy causes an error, change
                CreateLoadBalancerPolicy to &quot;false&quot; and run the command again.
              </BodyText>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AwsCloudFormationInstructions;

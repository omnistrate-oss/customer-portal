import { FC } from "react";
import Link from "next/link";
import { Box, Stack } from "@mui/material";
import { getAccountControlUrl } from "app/(dashboard)/cloud-accounts/utils";

import ExternalArrowIcon from "src/components/Icons/ArrowExternal/ArrowExternal";
import { ContainerCard } from "src/components/ResourceInstance/ResourceInstanceDetails/PropertyDetails";
import { Text } from "src/components/Typography/Typography";

import CommandList, { CommandListItem } from "./CommandList";

const SETUP_GUIDE_URL = "https://docs.omnistrate.com/operate-guides/aws-cloudformation-account-controls/";
const CODE_COLOR = "#1ED88D";

const DEBUG_ACCESS_PARAM = "param_K8sDebugAccessEnabled";
const INFRA_MUTATION_PARAM = "param_AgentInfrastructureMutationEnabled";

const toCommandItem = (title: string, description: string, url: string): CommandListItem => ({
  title,
  description,
  command: url,
  href: url,
});

const getDebugAccessCommands = (cloudFormationUrl: string): CommandListItem[] => [
  toCommandItem(
    "Enable support debug access",
    "Allows the service provider to proxy requests through the Dataplane Agent to access your Kubernetes API for support and troubleshooting.",
    getAccountControlUrl(cloudFormationUrl, DEBUG_ACCESS_PARAM, true)
  ),
  toCommandItem(
    "Disable support debug access",
    "Blocks the service provider from accessing your Kubernetes API through the Dataplane Agent.",
    getAccountControlUrl(cloudFormationUrl, DEBUG_ACCESS_PARAM, false)
  ),
];

const getInfraPermissionCommands = (cloudFormationUrl: string): CommandListItem[] => [
  toCommandItem(
    "Allow AWS infrastructure changes",
    "Allows the Dataplane Agent to create, update, and delete AWS resources (EC2, VPC, EBS) required to manage your workloads.",
    getAccountControlUrl(cloudFormationUrl, INFRA_MUTATION_PARAM, true)
  ),
  toCommandItem(
    "Restrict AWS permissions to read-only",
    "Blocks AWS infrastructure modifications while preserving read-only inspection for monitoring and health status.",
    getAccountControlUrl(cloudFormationUrl, INFRA_MUTATION_PARAM, false)
  ),
];

const SetupGuideLink = () => (
  <Link
    href={SETUP_GUIDE_URL}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      color: "#6941C6",
      fontWeight: 600,
    }}
  >
    View setup guide
    <ExternalArrowIcon width={14} height={14} color="#6941C6" />
  </Link>
);

const UnavailableNotice = () => (
  <Box p="24px">
    <Text size="small" weight="regular" color="#535862">
      CloudFormation stack details are not available for this cloud account.
    </Text>
  </Box>
);

type GovernanceControlsTabProps = {
  /** The account's CloudFormation console URL, from the instance's `cloudformation_url` result param. */
  cloudFormationUrl?: string;
};

const GovernanceControlsTab: FC<GovernanceControlsTabProps> = ({ cloudFormationUrl }) => {
  return (
    <Stack gap="24px" mt="24px">
      <ContainerCard
        data-testid="agent-debug-access-card"
        title="Agent debug access"
        description={
          <>
            Control whether the service provider can access your Kubernetes API for support and troubleshooting.{" "}
            <SetupGuideLink />
          </>
        }
      >
        {cloudFormationUrl ? (
          <CommandList
            commands={getDebugAccessCommands(cloudFormationUrl)}
            codeColor={CODE_COLOR}
            titleTestId="governance-command-title"
          />
        ) : (
          <UnavailableNotice />
        )}
      </ContainerCard>

      <ContainerCard
        data-testid="agent-infra-permissions-card"
        title="Agent infrastructure permissions"
        description={
          <>
            Control whether the Dataplane Agent can create, update, or delete AWS cloud resources in your account.{" "}
            <SetupGuideLink />
          </>
        }
      >
        {cloudFormationUrl ? (
          <CommandList
            commands={getInfraPermissionCommands(cloudFormationUrl)}
            codeColor={CODE_COLOR}
            titleTestId="governance-command-title"
          />
        ) : (
          <UnavailableNotice />
        )}
      </ContainerCard>
    </Stack>
  );
};

export default GovernanceControlsTab;

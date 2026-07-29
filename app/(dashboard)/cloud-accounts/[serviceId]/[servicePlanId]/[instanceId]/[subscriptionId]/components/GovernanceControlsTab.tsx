import { FC } from "react";
import Link from "next/link";
import { Stack } from "@mui/material";

import ExternalArrowIcon from "src/components/Icons/ArrowExternal/ArrowExternal";
import { ContainerCard } from "src/components/ResourceInstance/ResourceInstanceDetails/PropertyDetails";
import { cloudProviderLabelsShort } from "src/constants/cloudProviders";
import { CloudProvider } from "src/types/common/enums";

import CommandList, { CommandListItem } from "./CommandList";

const SETUP_GUIDE_URL = "https://docs.omnistrate.com/operate-guides/aws-cloudformation-account-controls/";
const CODE_COLOR = "#1ED88D";

const getTargetCommand = (key: string, value: boolean) => `TARGET_KEY="${key}"\nTARGET_VALUE="${value}"`;

const debugAccessCommands: CommandListItem[] = [
  {
    title: "Enable debug access",
    description: "Allows the data plane agent to access the Kubernetes API for troubleshooting.",
    command: getTargetCommand("K8sDebugAccessEnabled", true),
  },
  {
    title: "Disable debug access",
    description: "Prevents the data plane agent from accessing the Kubernetes API.",
    command: getTargetCommand("K8sDebugAccessEnabled", false),
  },
];

const infraPermissionCommands: CommandListItem[] = [
  {
    title: "Allow infrastructure changes",
    description: "Allows the agent to create, update, and delete infrastructure resources.",
    command: getTargetCommand("AgentInfrastructureMutationEnabled", true),
  },
  {
    title: "Restrict to read-only",
    description: "Allows inspection access while preventing infrastructure changes.",
    command: getTargetCommand("AgentInfrastructureMutationEnabled", false),
  },
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

type GovernanceControlsTabProps = {
  cloudProvider?: CloudProvider;
};

const GovernanceControlsTab: FC<GovernanceControlsTabProps> = ({ cloudProvider }) => {
  const cloudProviderLabel = (cloudProvider && cloudProviderLabelsShort[cloudProvider]) || "cloud";

  return (
    <Stack gap="24px" mt="24px">
      <ContainerCard
        data-testid="agent-debug-access-card"
        title="Agent debug access"
        description={
          <>
            Control Kubernetes API access for troubleshooting. <SetupGuideLink />
          </>
        }
      >
        <CommandList commands={debugAccessCommands} codeColor={CODE_COLOR} titleTestId="governance-command-title" />
      </ContainerCard>

      <ContainerCard
        data-testid="agent-infra-permissions-card"
        title="Agent infrastructure permissions"
        description={
          <>
            Control whether the data plane agent can modify {cloudProviderLabel} infrastructure. <SetupGuideLink />
          </>
        }
      >
        <CommandList commands={infraPermissionCommands} codeColor={CODE_COLOR} titleTestId="governance-command-title" />
      </ContainerCard>
    </Stack>
  );
};

export default GovernanceControlsTab;

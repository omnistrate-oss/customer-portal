import { FC } from "react";
import Link from "next/link";
import { Box, Stack } from "@mui/material";
import { getAccountConfigStackName, getAccountConfigStackUrl } from "app/(dashboard)/cloud-accounts/utils";

import { ContainerCard } from "src/components/ResourceInstance/ResourceInstanceDetails/PropertyDetails";
import { Text } from "src/components/Typography/Typography";
import { ArrowUpRight } from "src/icons";

import GovernanceControlOption, { GovernanceControlOptionData } from "./GovernanceControlOption";

const SETUP_GUIDE_URL = "https://docs.omnistrate.com/operate-guides/aws-cloudformation-account-controls/";

const DEBUG_ACCESS_PARAM = "K8sDebugAccessEnabled";
const INFRA_MUTATION_PARAM = "AgentInfrastructureMutationEnabled";

type ControlSection = {
  testId: string;
  title: string;
  description: string;
  options: GovernanceControlOptionData[];
};

const CONTROL_SECTIONS: ControlSection[] = [
  {
    testId: "agent-debug-access-card",
    title: "Agent debug access",
    description: "Control whether the service provider can access your Kubernetes API for support and troubleshooting.",
    options: [
      {
        title: "Enable support debug access",
        description:
          "Allows the service provider to proxy requests through the Dataplane Agent to access your Kubernetes API for support and troubleshooting.",
        parameter: DEBUG_ACCESS_PARAM,
        value: true,
      },
      {
        title: "Disable support debug access",
        description:
          "Blocks the service provider from accessing your Kubernetes API through the Dataplane Agent. Support requests will need your manual access.",
        parameter: DEBUG_ACCESS_PARAM,
        value: false,
      },
    ],
  },
  {
    testId: "agent-infra-permissions-card",
    title: "Agent infrastructure permissions",
    description:
      "Control whether the Dataplane Agent can create, update, or delete AWS cloud resources in your account.",
    options: [
      {
        title: "Allow AWS infrastructure changes",
        description:
          "Allows the Dataplane Agent to create, update, and delete AWS resources (EC2, VPC, EBS) required to manage your workloads.",
        parameter: INFRA_MUTATION_PARAM,
        value: true,
      },
      {
        title: "Restrict AWS permissions to read only",
        description:
          "Blocks AWS infrastructure modifications while preserving read only inspection for monitoring and health status. New deployments will fail while restricted.",
        parameter: INFRA_MUTATION_PARAM,
        value: false,
      },
    ],
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
    <ArrowUpRight size={14} color="#6941C6" />
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
      {CONTROL_SECTIONS.map((section) => (
        <ContainerCard
          key={section.testId}
          data-testid={section.testId}
          title={section.title}
          description={
            <>
              {section.description} <SetupGuideLink />
            </>
          }
        >
          {cloudFormationUrl ? (
            section.options.map((option, index) => (
              <Box key={option.title} borderTop={index > 0 ? "1px solid #E9EAEB" : undefined}>
                <GovernanceControlOption
                  {...option}
                  stackName={getAccountConfigStackName(cloudFormationUrl)}
                  stackUrl={getAccountConfigStackUrl(cloudFormationUrl)}
                  titleTestId={`governance-option-${option.parameter}-${option.value}`}
                />
              </Box>
            ))
          ) : (
            <UnavailableNotice />
          )}
        </ContainerCard>
      ))}
    </Stack>
  );
};

export default GovernanceControlsTab;

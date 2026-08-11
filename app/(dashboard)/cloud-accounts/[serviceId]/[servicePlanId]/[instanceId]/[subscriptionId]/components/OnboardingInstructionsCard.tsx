import { FC } from "react";
import { Box, Stack } from "@mui/material";

import AwsCloudFormationInstructions from "src/components/AwsCloudFormationInstructions/AwsCloudFormationInstructions";
import { ContainerCard } from "src/components/ResourceInstance/ResourceInstanceDetails/PropertyDetails";
import { Text } from "src/components/Typography/Typography";
import { CloudProvider } from "src/types/common/enums";
import { ResourceInstance } from "src/types/resourceInstance";
import { hasAwsCloudFormationCliCommands } from "src/utils/accountConfig/awsCloudFormation";
import { getResultParams } from "src/utils/instance";

import CommandList from "./CommandList";
import { getOnboardingInstructions } from "./onboardingInstructions";

type OnboardingInstructionsCardProps = {
  instance: ResourceInstance;
  cloudProvider?: CloudProvider;
};

const OnboardingInstructionsCard: FC<OnboardingInstructionsCardProps> = ({ instance, cloudProvider }) => {
  const instructions = getOnboardingInstructions(instance, cloudProvider);
  if (!instructions) return null;

  const hasCliTab = hasAwsCloudFormationCliCommands(instructions.awsCloudFormationUrl);

  return (
    <ContainerCard
      data-testid="account-onboarding-card"
      title="Cloud Account Onboarding"
      description="Instructions to onboard this cloud account"
    >
      <Stack>
        <Box padding="20px 24px 0px">
          <Text size="small" weight="semibold" color="#414651">
            {instructions.header}
          </Text>
        </Box>

        {instructions.notice ? (
          <Box padding="8px 24px 20px">
            <Text size="small" weight="regular" color="#535862">
              {instructions.notice}
            </Text>
          </Box>
        ) : hasCliTab ? (
          <Box padding="16px 24px 24px">
            <AwsCloudFormationInstructions
              cloudFormationUrl={instructions.awsCloudFormationUrl}
              variant="onboarding"
              awsAccountId={getResultParams(instance)?.aws_account_id}
            >
              <CommandList commands={instructions.steps} titleTestId="account-onboarding-step" disableGutters />
            </AwsCloudFormationInstructions>
          </Box>
        ) : (
          <CommandList commands={instructions.steps} titleTestId="account-onboarding-step" />
        )}
      </Stack>
    </ContainerCard>
  );
};

export default OnboardingInstructionsCard;

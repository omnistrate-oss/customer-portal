import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import { Box, Stack, styled } from "@mui/material";
import Link from "next/link";
import { FC } from "react";

import { Text } from "components/Typography/Typography";
import AwsCloudFormationInstructions from "src/components/AwsCloudFormationInstructions/AwsCloudFormationInstructions";
import { TextContainerToCopy } from "src/components/CloudProviderAccountOrgIdModal/CloudProviderAccountOrgIdModal";
import { addQuotesToShellCommand } from "src/utils/accountConfig/accountConfig";
import { hasAwsCloudFormationCliCommands } from "src/utils/accountConfig/awsCloudFormation";

const StyledLink = styled(Link)({
  color: "#7F56D9",
  fontWeight: 400,
  // fontStyle: "italic",
});

const List = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  marginTop: "12px",
});

const ListItem = styled(Box)({
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "flex-start",
  gap: "4px",
});

const ListItemIcon = styled(Box)({
  flexShrink: 0,
});

const ArrowBullet = (props) => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.7515 17.6485C8.28287 17.1799 8.28287 16.4201 8.7515 15.9515L12.703 12L8.7515 8.04853C8.28287 7.5799 8.28287 6.8201 8.7515 6.35147C9.22013 5.88284 9.97992 5.88284 10.4486 6.35147L15.2486 11.1515C15.7172 11.6201 15.7172 12.3799 15.2486 12.8485L10.4486 17.6485C9.97992 18.1172 9.22013 18.1172 8.7515 17.6485Z"
      fill="#344054"
    />
  </svg>
);

const StepBullet = styled(Box)({
  display: "block",
  width: "5px",
  height: "5px",
  flexShrink: 0,
  marginTop: "8px",
  borderRadius: "50%",
  backgroundColor: "#344054",
});

export type OffboardInstructionDetails = {
  awsAccountID?: string;
  /** Onboarding quick-create URL, used to derive the stack the CLI offboarding command targets. */
  awsCloudFormationUrl?: string;
  gcpProjectID?: string;
  gcpProjectNumber?: string;
  gcpOffboardCommand?: string;
  azureSubscriptionID?: string;
  azureTenantID?: string;
  azureOffboardCommand?: string;
  ociTenancyID?: string;
  ociDomainID?: string;
  ociOffboardCommand?: string;
  byocOnpremClusterName?: string;
  byocOnpremUninstallCommand?: string;
};

export const OffboardingInstructions: FC<{ offboardingInstructionDetails: OffboardInstructionDetails }> = ({
  offboardingInstructionDetails,
}) => {
  return (
    <Box width={"100%"} mb="30px">
      {offboardingInstructionDetails?.awsAccountID && (
        <Box marginBottom={"20px"}>
          <Text size="small" weight="semibold" color="#374151">
            AWS Account ID
          </Text>
          <TextContainerToCopy text={offboardingInstructionDetails?.awsAccountID} marginTop="6px" />
        </Box>
      )}

      {offboardingInstructionDetails?.gcpProjectID && (
        <Stack direction={"row"} alignItems={"flex-start"} gap="12px" marginBottom={"20px"}>
          <Box flex={1} maxWidth={"50%"}>
            <Text size="small" weight="semibold" color="#374151">
              GCP Project ID
            </Text>
            <TextContainerToCopy text={offboardingInstructionDetails?.gcpProjectID} marginTop="6px" />
          </Box>
          <Box flex={1} maxWidth={"50%"}>
            <Text size="small" weight="semibold" color="#374151">
              GCP Project Number
            </Text>
            <TextContainerToCopy text={offboardingInstructionDetails?.gcpProjectNumber} marginTop="6px" />
          </Box>
        </Stack>
      )}

      {offboardingInstructionDetails?.azureSubscriptionID && (
        <Stack direction={"row"} alignItems={"flex-start"} gap="12px" marginBottom={"20px"}>
          <Box flex={1} maxWidth={"50%"}>
            <Text size="small" weight="semibold" color="#374151">
              Azure Subscription ID
            </Text>
            <TextContainerToCopy text={offboardingInstructionDetails?.azureSubscriptionID} marginTop="6px" />
          </Box>
          <Box flex={1} maxWidth={"50%"}>
            <Text size="small" weight="semibold" color="#374151">
              Azure Tenant ID
            </Text>
            <TextContainerToCopy text={offboardingInstructionDetails?.azureTenantID} marginTop="6px" />
          </Box>
        </Stack>
      )}

      {offboardingInstructionDetails?.ociTenancyID && (
        <Stack direction={"row"} alignItems={"flex-start"} gap="12px" marginBottom={"20px"}>
          <Box flex={1} maxWidth={"50%"}>
            <Text size="small" weight="semibold" color="#374151">
              OCI Tenancy OCID
            </Text>
            <TextContainerToCopy text={offboardingInstructionDetails?.ociTenancyID} marginTop="6px" />
          </Box>
          <Box flex={1} maxWidth={"50%"}>
            <Text size="small" weight="semibold" color="#374151">
              OCI Domain OCID
            </Text>
            <TextContainerToCopy text={offboardingInstructionDetails?.ociDomainID} marginTop="6px" />
          </Box>
        </Stack>
      )}

      {offboardingInstructionDetails?.byocOnpremClusterName && (
        <Box marginBottom={"20px"}>
          <Text size="small" weight="semibold" color="#374151">
            Kubernetes Cluster Name
          </Text>
          <TextContainerToCopy text={offboardingInstructionDetails?.byocOnpremClusterName} marginTop="6px" />
        </Box>
      )}

      <Text size="small" weight="medium" color="#414651">
        This cloud account instance is marked for deletion
      </Text>

      <List>
        {offboardingInstructionDetails?.awsAccountID && (
          <ListItem>
            {!hasAwsCloudFormationCliCommands(offboardingInstructionDetails?.awsCloudFormationUrl) && (
              <ListItemIcon>
                <ArrowBullet />
              </ListItemIcon>
            )}

            <Box overflow="hidden" flex={1}>
              <AwsCloudFormationInstructions
                cloudFormationUrl={offboardingInstructionDetails?.awsCloudFormationUrl}
                variant="offboarding"
                awsAccountId={offboardingInstructionDetails?.awsAccountID}
              >
                <Text size="medium" weight="regular" color="#374151">
                  Delete the CloudFormation stack that was created during onboarding:
                </Text>
                <List sx={{ marginTop: "8px", gap: "6px" }}>
                  <ListItem sx={{ gap: "8px" }}>
                    <ListItemIcon>
                      <StepBullet />
                    </ListItemIcon>
                    <Text size="small" weight="regular" color="#374151">
                      Open the{" "}
                      <StyledLink
                        target="_blank"
                        rel="noopener noreferrer"
                        href="https://console.aws.amazon.com/cloudformation/"
                      >
                        AWS CloudFormation Console
                        <ArrowOutwardIcon
                          sx={{
                            fontSize: "1.3em !important",
                            flexShrink: 0,
                            color: "inherit",
                            verticalAlign: "middle",
                            ml: "2px",
                          }}
                          aria-hidden="true"
                        />
                      </StyledLink>
                    </Text>
                  </ListItem>
                  <ListItem sx={{ gap: "8px" }}>
                    <ListItemIcon>
                      <StepBullet />
                    </ListItemIcon>
                    <Text size="small" weight="regular" color="#374151">
                      Locate the onboarding stack created during setup
                    </Text>
                  </ListItem>
                  <ListItem sx={{ gap: "8px" }}>
                    <ListItemIcon>
                      <StepBullet />
                    </ListItemIcon>
                    <Text size="small" weight="regular" color="#374151">
                      Select the stack and choose Delete
                    </Text>
                  </ListItem>
                  <ListItem sx={{ gap: "8px" }}>
                    <ListItemIcon>
                      <StepBullet />
                    </ListItemIcon>
                    <Text size="small" weight="regular" color="#374151">
                      Wait for the stack deletion to complete
                    </Text>
                  </ListItem>
                </List>
              </AwsCloudFormationInstructions>
            </Box>
          </ListItem>
        )}

        {offboardingInstructionDetails?.gcpProjectID && (
          <ListItem>
            <ListItemIcon>
              <ArrowBullet />
            </ListItemIcon>
            <Box overflow={"hidden"} flex={1}>
              <Text size="small" weight="regular" color="#414651">
                {/* <b>Using GCP Cloud Shell:</b>  */}
                Open the Google Cloud Shell environment using the following link{" "}
                <StyledLink
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://shell.cloud.google.com/?cloudshell_ephemeral=true&show=terminal"
                >
                  Google Cloud Shell
                </StyledLink>
                . Once the terminal is open, execute the following command to complete the off-boarding process and
                remove remaining access from your cloud account.
              </Text>
              {offboardingInstructionDetails?.gcpOffboardCommand && (
                <TextContainerToCopy
                  text={addQuotesToShellCommand(offboardingInstructionDetails?.gcpOffboardCommand)}
                  marginTop="12px"
                />
              )}
            </Box>
          </ListItem>
        )}

        {offboardingInstructionDetails?.azureSubscriptionID && (
          <ListItem>
            <ListItemIcon>
              <ArrowBullet />
            </ListItemIcon>

            <Box overflow={"hidden"} flex={1}>
              <Text size="small" weight="regular" color="#414651">
                {/* <b>Using GCP Cloud Shell:</b>  */}
                Open the Azure Cloud Shell environment using the following link{" "}
                <StyledLink target="_blank" rel="noopener noreferrer" href="https://portal.azure.com/#cloudshell/">
                  Azure Cloud Shell
                </StyledLink>
                . Once the terminal is open, execute the following command to complete the off-boarding process and
                revoke our access.
              </Text>

              {offboardingInstructionDetails?.azureOffboardCommand && (
                <TextContainerToCopy
                  text={addQuotesToShellCommand(offboardingInstructionDetails?.azureOffboardCommand)}
                  marginTop="12px"
                />
              )}
            </Box>
          </ListItem>
        )}

        {offboardingInstructionDetails?.ociTenancyID && (
          <ListItem>
            <ListItemIcon>
              <ArrowBullet />
            </ListItemIcon>

            <Box overflow={"hidden"} flex={1}>
              <Text size="small" weight="regular" color="#414651">
                Open the OCI Cloud Shell environment using the following link{" "}
                <StyledLink target="_blank" rel="noopener noreferrer" href="https://cloud.oracle.com/?cloudshell=true">
                  OCI Cloud Shell
                </StyledLink>
                . Once the terminal is open, execute the following command to complete the off-boarding process and
                revoke our access.
              </Text>

              {offboardingInstructionDetails?.ociOffboardCommand && (
                <TextContainerToCopy
                  text={addQuotesToShellCommand(offboardingInstructionDetails?.ociOffboardCommand)}
                  marginTop="12px"
                />
              )}
            </Box>
          </ListItem>
        )}

        {offboardingInstructionDetails?.byocOnpremClusterName && (
          <ListItem>
            <ListItemIcon>
              <ArrowBullet />
            </ListItemIcon>

            <Box overflow={"hidden"} flex={1}>
              <Text size="small" weight="regular" color="#414651">
                Run the following Helm uninstall command in the target Kubernetes cluster to complete the off-boarding
                process and remove the agent from your cluster.
              </Text>

              {offboardingInstructionDetails?.byocOnpremUninstallCommand && (
                <TextContainerToCopy
                  text={addQuotesToShellCommand(offboardingInstructionDetails.byocOnpremUninstallCommand)}
                  marginTop="12px"
                />
              )}
            </Box>
          </ListItem>
        )}

        <ListItem sx={{ marginTop: "8px" }}>
          <ListItemIcon>
            <ArrowBullet />
          </ListItemIcon>

          <Box overflow={"hidden"} flex={1}>
            <Text size="medium" weight="regular" color="#374151">
              After completing the above step, continue with offboarding below
            </Text>
          </Box>
        </ListItem>
      </List>
    </Box>
  );
};

import { FC } from "react";
import Link from "next/link";
import { Box, Stack, styled } from "@mui/material";

import { TextContainerToCopy } from "src/components/CloudProviderAccountOrgIdModal/CloudProviderAccountOrgIdModal";
import { addQuotesToShellCommand } from "src/utils/accountConfig/accountConfig";
import { Text } from "components/Typography/Typography";

const StyledLink = styled(Link)({
  textDecoration: "underline",
  color: "#7F56D9",
  fontWeight: 700,
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

export type OffboardInstructionDetails = {
  awsAccountID?: string;
  gcpProjectID?: string;
  gcpProjectNumber?: string;
  gcpOffboardCommand?: string;
  azureSubscriptionID?: string;
  azureTenantID?: string;
  azureOffboardCommand?: string;
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

      <Text size="small" weight="medium" color="#414651">
        This cloud account instance is marked for deletion
      </Text>

      <List>
        {offboardingInstructionDetails?.awsAccountID && (
          <ListItem>
            <ListItemIcon>
              <ArrowBullet />
            </ListItemIcon>

            <Text size="medium" weight="regular" color="#374151">
              {/* <b>Using CloudFormation:</b>  */}
              Follow the provided steps{" "}
              <StyledLink
                target="_blank"
                rel="noopener noreferrer"
                href="https://docs.omnistrate.com/getting-started/account-offboarding/"
              >
                here
              </StyledLink>{" "}
              to complete the off-boarding process and revoke remaining access from your cloud account
            </Text>
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

// import { CLOUD_PROVIDERS } from "src/constants/cloudProviders";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import CloseIcon from "@mui/icons-material/Close";
import { Box, Dialog, IconButton, Stack, styled } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

import Button from "src/components/Button/Button";
import { Text } from "src/components/Typography/Typography";
import useEnvironmentType from "src/hooks/useEnvironmentType";
import { addQuotesToShellCommand } from "src/utils/accountConfig/accountConfig";
import {
  // ACCOUNT_CREATION_METHODS,
  getAccountConfigStatusBasedHeader,
} from "src/utils/constants/accountConfig";
import getSafeExternalURL from "src/utils/getSafeExternalURL";
import { getResultParams } from "src/utils/instance";

import AwsCloudFormationInstructions from "../AwsCloudFormationInstructions/AwsCloudFormationInstructions";
import CommandBlock from "../AwsCloudFormationInstructions/CommandBlock";
import LoadingSpinnerSmall from "../CircularProgress/CircularProgress";
import CopyToClipboardButton from "../CopyClipboardButton/CopyClipboardButton";
import InstructionsModalIcon from "../Icons/AccountConfig/InstructionsModalIcon";
import CircleCheckIcon from "../Icons/CircleCheck/CircleCheckIcon";
import InfoCircleTooltipIcon from "../Icons/InfoCircleTooltip/InfoCircleTooltip";

const AWS_CLOUD_FORMATION_GUIDE_URL = "https://youtu.be/c3HNnM8UJBE";

const StyledContainer = styled(Box)({
  position: "fixed",
  top: "50%",
  right: "50%",
  transform: "translateX(50%) translateY(-50%)",
  background: "white",
  borderRadius: "12px",
  boxShadow: "0px 8px 8px -4px rgba(16, 24, 40, 0.03), 0px 20px 24px -4px rgba(16, 24, 40, 0.08)",
  padding: 0,
  width: "calc(100% - 32px)",
  maxWidth: "543px",
  // Without a bound, the fixed positioning lets tall content run past the viewport, taking the
  // footer's Close button with it.
  maxHeight: "calc(100vh - 40px)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
});

const Header = styled(Box)({
  boxSizing: "border-box",
  minHeight: "92px",
  padding: "24px 12px 20px 24px",
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexShrink: 0,
});

const Content = styled(Box)({
  boxSizing: "border-box",
  padding: "0 24px",
  width: "100%",
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  // Left `visible`, CSS promotes this to `auto` and stray overflow becomes a body-wide scrollbar.
  overflowX: "hidden",
});

const Footer = styled(Box)({
  boxSizing: "border-box",
  padding: "32px 24px 24px",
  width: "100%",
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: "16px",
  flexShrink: 0,
});

const StyledLink = styled(Link)({
  textDecoration: "underline",
  color: "#7F56D9",
  fontWeight: 600,
});

const List = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "20px",
  marginTop: "12px",
});

const ListItem = styled(Box)({
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "flex-start",
  gap: "6px",
});

const BodyText = ({ children, ...restProps }) => {
  return (
    <Text size="small" weight="regular" color="#344054" {...restProps}>
      {children}
    </Text>
  );
};

export const TextContainerToCopy = (props) => {
  const { text, marginTop = "20px", dataTestId } = props;
  return (
    <Box
      data-testid={dataTestId}
      sx={{
        marginTop: marginTop,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        // A flex item defaults to min-width:auto, so an unbroken value like an OCI OCID sets the
        // floor for the whole column and pushes it past the dialog instead of ellipsing.
        minWidth: 0,
        maxWidth: "100%",
      }}
    >
      <Box
        sx={{
          width: "100%",
          padding: "6px 14px",
          borderRadius: "8px",
          border: "1px solid #D0D5DD",
          background: "#F9FAFB",
          boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <Text
          size="medium"
          weight="regular"
          color="#667085"
          ellipsis
          title={text}
          sx={{ flex: 1, minWidth: 0, overflow: "hidden", whiteSpace: "nowrap" }}
        >
          {text}
        </Text>

        <CopyToClipboardButton text={text} iconProps={{ color: "#98A2B3" }} />
      </Box>
    </Box>
  );
};

/** Explains how to retry AWS setup when its named load-balancer policy already exists. */
const ExistingLoadBalancerPolicyNotice = () => (
  <Box sx={{ borderTop: "1px solid #E9EAEB", paddingTop: "12px" }}>
    <Stack direction="row" alignItems="flex-start" gap="6px">
      <Box sx={{ display: "flex", paddingTop: "2px", flexShrink: 0 }}>
        <InfoCircleTooltipIcon color="#7F56D9" width="16px" height="16px" />
      </Box>
      <Stack gap="5px" minWidth={0}>
        <Text size="small" weight="semibold" color="#717680">
          Existing load balancer policy
        </Text>
        <Text size="small" weight="regular" color="#535862">
          If an existing AWSLoadBalancerControllerIAMPolicy policy causes an error, set CreateLoadBalancerPolicy to
          &quot;false&quot; and try again.
        </Text>
      </Stack>
    </Stack>
  </Box>
);

/** Renders the ready-state AWS reconfiguration instructions from the Cloud Accounts design. */
const AwsReconfigurationInstructions = ({ awsAccountId, cloudFormationUrl }) => {
  return (
    <Stack gap="20px">
      <Box>
        <BodyText weight="medium">AWS Account ID</BodyText>
        <TextContainerToCopy dataTestId="aws-account-id" text={awsAccountId} marginTop="6px" />
      </Box>

      <Stack gap="12px">
        <Stack
          direction="row"
          alignItems="center"
          gap="4px"
          sx={{ "& > svg": { width: "18px", height: "18px", flexShrink: 0 } }}
        >
          <CircleCheckIcon />
          <Text size="small" weight="semibold" color="#344054">
            This account has already been configured successfully.
          </Text>
        </Stack>

        <AwsCloudFormationInstructions
          cloudFormationUrl={cloudFormationUrl}
          variant="onboarding"
          awsAccountId={awsAccountId}
          contentSpacing="12px"
          cliDescription={
            <Text size="small" weight="regular" color="#344054">
              To reconfigure this account, run the command below from a terminal authenticated to AWS account{" "}
              <Box component="span" sx={{ fontWeight: 600 }}>
                {awsAccountId}
              </Box>
              . It creates the same CloudFormation stack as the console flow.
            </Text>
          }
          footer={<ExistingLoadBalancerPolicyNotice />}
        >
          <Stack gap="28px">
            <Text size="small" weight="regular" color="#344054">
              To reconfigure it, please create your CloudFormation Stack for AWS account{" "}
              <Box component="span" sx={{ fontWeight: 600 }}>
                {awsAccountId}
              </Box>{" "}
              using the{" "}
              <StyledLink href={cloudFormationUrl} target="_blank" rel="noopener noreferrer">
                link
              </StyledLink>
              .
            </Text>

            <Text size="small" weight="regular" color="#344054">
              For guidance, our instructional video is available{" "}
              <StyledLink href={AWS_CLOUD_FORMATION_GUIDE_URL} target="_blank" rel="noopener noreferrer">
                here
              </StyledLink>
              .
            </Text>
          </Stack>
        </AwsCloudFormationInstructions>
      </Stack>
    </Stack>
  );
};

/** Displays lifecycle copy with the same compact success treatment used by the AWS reference. */
const AccountConfigurationStatus = ({ status, accountConfigId }) => {
  if (status?.toUpperCase() === "READY") {
    return (
      <Stack
        direction="row"
        alignItems="center"
        gap="4px"
        sx={{ "& > svg": { width: "18px", height: "18px", flexShrink: 0 } }}
      >
        <CircleCheckIcon />
        <Text size="small" weight="semibold" color="#344054">
          This account has already been configured successfully.
        </Text>
      </Stack>
    );
  }

  return (
    <Text size="small" weight="semibold" color="#344054">
      {getAccountConfigStatusBasedHeader(status, accountConfigId)}
    </Text>
  );
};

/** Displays provider bootstrap commands with the shared command-viewer treatment. */
const ShellCommandBlock = ({ command, dataTestId }) => (
  <Box marginTop="12px">
    <CommandBlock title="Run command" command={command} dataTestId={dataTestId} />
  </Box>
);

const CreationTimeInstructions = (props) => {
  const {
    accountConfigStatus,
    cloudformationlink,
    cloudFormationGuide,
    cloudFormationTemplateUrl,
    gcpBootstrapShellCommand,
    gcpCloudShellLink,
    gcpShellScriptGuide,
    azureCloudShellLink,
    azureShellScriptGuide,
    azureBootstrapShellCommand,
    ociCloudShellLink,
    // ociShellScriptGuide,
    accountInstructionDetails,
    fetchClickedInstanceDetails,
    setClickedInstance,
  } = props;

  const environmentType = useEnvironmentType();
  const queryClient = useQueryClient();
  const [isPolling, setIsPolling] = useState(true);
  const timeoutId = useRef();
  // poll for three times with an interval of 2 seconds
  const pollCountRef = useRef(0);
  const pollInterval = 2000;
  const isMounted = useRef(true);

  const startPolling = async () => {
    if (!isMounted.current) return;

    let resourceInstance;

    try {
      const resourceInstanceResponse = await fetchClickedInstanceDetails();
      resourceInstance = resourceInstanceResponse.data;
    } catch {}

    if (!isMounted.current) return;

    const resultParams = getResultParams(resourceInstance);
    if (resultParams?.cloud_provider_account_config_id) {
      setClickedInstance((prev) => ({
        ...prev,
        result_params: { ...getResultParams(prev), ...resultParams },
      }));

      queryClient.setQueryData(
        [
          "get",
          "/2022-09-01-00/resource-instance",
          {
            params: {
              query: { environmentType },
            },
          },
        ],
        (oldData) => {
          const resultParams = {
            // @ts-ignore
            ...oldData?.resourceInstances?.result_params,
            ...getResultParams(resourceInstance),
          };

          return {
            resourceInstances: [
              ...(oldData?.resourceInstances || []).map((instance) =>
                instance?.id === resourceInstance?.id
                  ? {
                      ...(resourceInstance || {}),
                      result_params: resultParams,
                    }
                  : instance
              ),
            ],
          };
        }
      );

      setIsPolling(false);
    } else if (pollCountRef.current < 3) {
      pollCountRef.current += 1;
      timeoutId.current = setTimeout(() => {
        startPolling();
      }, pollInterval);
    } else {
      setIsPolling(false);
    }
  };

  useEffect(() => {
    if (
      (accountInstructionDetails?.gcpProjectID && !gcpBootstrapShellCommand) ||
      (accountInstructionDetails?.azureSubscriptionID && !azureBootstrapShellCommand) ||
      (accountInstructionDetails?.awsAccountID && !cloudFormationTemplateUrl) ||
      (accountInstructionDetails?.ociTenancyID && !accountInstructionDetails?.ociBootstrapShellCommand)
    ) {
      startPolling();
    } else {
      setIsPolling(false);
    }

    return () => {};
  }, []);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (timeoutId.current) clearTimeout(timeoutId.current);
    };
  }, []);

  if (isPolling) {
    return (
      <Stack direction="column" gap="20px" alignItems={"center"}>
        <LoadingSpinnerSmall sx={{ marginLeft: 0 }} />
        <BodyText>Fetching account config setup instructions</BodyText>
      </Stack>
    );
  }

  if (accountConfigStatus === "FAILED") {
    return (
      <BodyText>
        The account configuration could not be saved because of system error. Please try again. If the issue continues,
        reach out to support for assistance.{" "}
      </BodyText>
    );
  }

  if (accountInstructionDetails?.awsAccountID) {
    return (
      <>
        <BodyText weight="medium">AWS Account ID</BodyText>
        <TextContainerToCopy text={accountInstructionDetails?.awsAccountID} marginTop="6px" />

        {cloudFormationTemplateUrl ? (
          <Box marginTop="20px">
            <AwsCloudFormationInstructions
              cloudFormationUrl={cloudFormationTemplateUrl}
              variant="onboarding"
              awsAccountId={accountInstructionDetails?.awsAccountID}
              contentSpacing="12px"
              footer={<ExistingLoadBalancerPolicyNotice />}
            >
              <Stack gap="28px">
                <BodyText>
                  Your account details have been saved. To complete the setup, create your CloudFormation Stack using
                  the provided template {cloudformationlink}.
                </BodyText>

                <BodyText>For guidance, our instructional video is available {cloudFormationGuide}.</BodyText>
              </Stack>
            </AwsCloudFormationInstructions>
          </Box>
        ) : (
          <BodyText sx={{ marginTop: "20px" }}>
            Your CloudFormation Stack is being configured. Please check back shortly for detailed setup instructions.
          </BodyText>
        )}
      </>
    );
  } else if (accountInstructionDetails?.gcpProjectID) {
    return (
      <>
        <Stack direction={"row"} alignItems={"flex-start"} gap="12px">
          <Box flex={1} minWidth={0}>
            <BodyText weight="medium">GCP Project ID</BodyText>
            <TextContainerToCopy text={accountInstructionDetails?.gcpProjectID} marginTop="6px" />
          </Box>
          <Box flex={1} minWidth={0}>
            <BodyText weight="medium">GCP Project Number</BodyText>
            <TextContainerToCopy text={accountInstructionDetails?.gcpProjectNumber} marginTop="6px" />
          </Box>
        </Stack>

        <>
          {gcpBootstrapShellCommand ? (
            <>
              <BodyText sx={{ marginTop: "20px" }}>
                Please open the Google Cloud Shell environment using the following link {gcpCloudShellLink} and execute
                the below command.
              </BodyText>
              <ShellCommandBlock
                command={addQuotesToShellCommand(gcpBootstrapShellCommand)}
                dataTestId="gcp-bootstrap-command"
              />
              <BodyText sx={{ marginTop: "20px" }}>
                For guidance, our instructional video is available {gcpShellScriptGuide}.
              </BodyText>
            </>
          ) : (
            <BodyText sx={{ marginTop: "20px" }}>
              Your GCP shell script is being configured. Please check back shortly for detailed setup instructions.
            </BodyText>
          )}
        </>
      </>
    );
  } else if (accountInstructionDetails?.azureSubscriptionID) {
    return (
      <>
        <Stack direction={"row"} alignItems={"flex-start"} gap="12px">
          <Box flex={1} minWidth={0}>
            <BodyText weight="medium">Azure Subscription ID</BodyText>
            <TextContainerToCopy text={accountInstructionDetails?.azureSubscriptionID} marginTop="6px" />
          </Box>
          <Box flex={1} minWidth={0}>
            <BodyText weight="medium">Azure Tenant ID</BodyText>
            <TextContainerToCopy text={accountInstructionDetails?.azureTenantID} marginTop="6px" />
          </Box>
        </Stack>

        <>
          {azureBootstrapShellCommand ? (
            <>
              <BodyText sx={{ marginTop: "20px" }}>
                Please open the Azure Cloud Shell environment using the following link {azureCloudShellLink} and execute
                the below command.
              </BodyText>
              <ShellCommandBlock
                command={addQuotesToShellCommand(azureBootstrapShellCommand)}
                dataTestId="azure-bootstrap-command"
              />
              <BodyText sx={{ marginTop: "20px" }}>
                For guidance, our instructional video is available {azureShellScriptGuide}.
              </BodyText>
            </>
          ) : (
            <BodyText sx={{ marginTop: "20px" }}>
              Your Azure shell script is being configured. Please check back shortly for detailed setup instructions.
            </BodyText>
          )}
        </>
      </>
    );
  } else if (accountInstructionDetails?.ociTenancyID) {
    return (
      <>
        <Stack direction={"row"} alignItems={"flex-start"} gap="12px">
          <Box flex={1} minWidth={0}>
            <BodyText weight="medium">OCI Tenancy OCID</BodyText>
            <TextContainerToCopy text={accountInstructionDetails?.ociTenancyID} marginTop="6px" />
          </Box>
          <Box flex={1} minWidth={0}>
            <BodyText weight="medium">OCI Domain OCID</BodyText>
            <TextContainerToCopy text={accountInstructionDetails?.ociDomainID} marginTop="6px" />
          </Box>
        </Stack>

        <>
          {accountInstructionDetails?.ociBootstrapShellCommand ? (
            <>
              <BodyText sx={{ marginTop: "20px" }}>
                Please open the OCI Cloud Shell environment using the following link {ociCloudShellLink} and execute the
                below command.
              </BodyText>
              <ShellCommandBlock
                command={addQuotesToShellCommand(accountInstructionDetails?.ociBootstrapShellCommand)}
                dataTestId="oci-bootstrap-command"
              />
              {/* <BodyText sx={{ marginTop: "20px" }}>
                For guidance, our instructional video is available {ociShellScriptGuide}.
              </BodyText> */}
            </>
          ) : (
            <BodyText sx={{ marginTop: "20px" }}>
              Your OCI shell script is being configured. Please check back shortly for detailed setup instructions.
            </BodyText>
          )}
        </>
      </>
    );
  } else {
    return (
      <BodyText>
        Your account details are being configured. Please check back shortly for detailed setup instructions.
      </BodyText>
    );
  }
};

const NonCreationTimeInstructions = (props) => {
  const {
    selectedAccountConfig,
    cloudformationlink,
    cloudFormationGuide,
    cloudFormationTemplateUrl,
    gcpBootstrapShellCommand,
    gcpCloudShellLink,
    gcpShellScriptGuide,
    azureCloudShellLink,
    azureBootstrapShellCommand,
    azureShellScriptGuide,
    ociCloudShellLink,
    // ociShellScriptGuide,
    accountInstructionDetails,
    isAwsReconfiguration,
  } = props;

  if (
    !accountInstructionDetails?.awsAccountID &&
    !accountInstructionDetails?.gcpProjectID &&
    !accountInstructionDetails?.azureSubscriptionID &&
    !accountInstructionDetails?.ociTenancyID
  ) {
    return (
      <BodyText>
        Your account details are being configured. Please check back shortly for detailed setup instructions.
      </BodyText>
    );
  }

  if (isAwsReconfiguration) {
    return (
      <AwsReconfigurationInstructions
        awsAccountId={accountInstructionDetails.awsAccountID}
        cloudFormationUrl={cloudFormationTemplateUrl}
      />
    );
  }

  const status = String(selectedAccountConfig?.status ?? "").toUpperCase();
  const isReady = status === "READY";

  return (
    <>
      <Box width={"100%"}>
        {accountInstructionDetails?.awsAccountID && (
          <>
            <BodyText weight="medium">AWS Account ID</BodyText>
            <TextContainerToCopy text={accountInstructionDetails?.awsAccountID} marginTop="6px" />
          </>
        )}

        {accountInstructionDetails?.gcpProjectID && (
          <Stack direction={"row"} alignItems={"flex-start"} gap="12px">
            <Box flex={1} minWidth={0}>
              <BodyText weight="medium">GCP Project ID</BodyText>
              <TextContainerToCopy text={accountInstructionDetails?.gcpProjectID} marginTop="6px" />
            </Box>
            <Box flex={1} minWidth={0}>
              <BodyText weight="medium">GCP Project Number</BodyText>
              <TextContainerToCopy text={accountInstructionDetails?.gcpProjectNumber} marginTop="6px" />
            </Box>
          </Stack>
        )}

        {accountInstructionDetails?.azureSubscriptionID && (
          <Stack direction={"row"} alignItems={"flex-start"} gap="12px">
            <Box flex={1} minWidth={0}>
              <BodyText weight="medium">Azure Subscription ID</BodyText>
              <TextContainerToCopy text={accountInstructionDetails?.azureSubscriptionID} marginTop="6px" />
            </Box>
            <Box flex={1} minWidth={0}>
              <BodyText weight="medium">Azure Tenant ID</BodyText>
              <TextContainerToCopy text={accountInstructionDetails?.azureTenantID} marginTop="6px" />
            </Box>
          </Stack>
        )}

        {accountInstructionDetails?.ociTenancyID && (
          <Stack direction={"row"} alignItems={"flex-start"} gap="12px">
            <Box flex={1} minWidth={0}>
              <BodyText weight="medium">OCI Tenancy OCID</BodyText>
              <TextContainerToCopy text={accountInstructionDetails?.ociTenancyID} marginTop="6px" />
            </Box>
            <Box flex={1} minWidth={0}>
              <BodyText weight="medium">OCI Domain OCID</BodyText>
              <TextContainerToCopy text={accountInstructionDetails?.ociDomainID} marginTop="6px" />
            </Box>
          </Stack>
        )}

        <Box marginTop="20px">
          <AccountConfigurationStatus
            status={status}
            accountConfigId={getResultParams(selectedAccountConfig)?.cloud_provider_account_config_id}
          />
        </Box>

        <List>
          <>
            {accountInstructionDetails?.awsAccountID && (
              <ListItem>
                {cloudFormationTemplateUrl ? (
                  <Box flex={1} minWidth={0}>
                    <AwsCloudFormationInstructions
                      cloudFormationUrl={cloudFormationTemplateUrl}
                      variant="onboarding"
                      awsAccountId={accountInstructionDetails?.awsAccountID}
                      contentSpacing="12px"
                      footer={<ExistingLoadBalancerPolicyNotice />}
                    >
                      <Stack gap="28px">
                        <BodyText>
                          Please create your CloudFormation Stack using the provided template {cloudformationlink}.
                        </BodyText>
                        <BodyText>For guidance, our instructional video is available {cloudFormationGuide}.</BodyText>
                      </Stack>
                    </AwsCloudFormationInstructions>
                  </Box>
                ) : selectedAccountConfig?.status === "FAILED" ? (
                  <Box display={"flex"} flexDirection={"column"} gap={"10px"}>
                    <BodyText>
                      You may delete this failed configuration and retry adding it after carefully verifying the AWS
                      Account ID
                    </BodyText>
                    <BodyText>If the issue persists, please contact Support for assistance.</BodyText>
                  </Box>
                ) : (
                  <BodyText>
                    Your account details are being configured. Please check back shortly for detailed setup
                    instructions.
                  </BodyText>
                )}
              </ListItem>
            )}
            {accountInstructionDetails?.gcpProjectID && (
              <>
                <ListItem>
                  {gcpBootstrapShellCommand ? (
                    <Box flex={1} overflow={"hidden"}>
                      <BodyText>
                        {isReady ? "To reconfigure this account, open " : "Open "}
                        {gcpCloudShellLink} and run the command below.
                      </BodyText>

                      <ShellCommandBlock
                        command={addQuotesToShellCommand(gcpBootstrapShellCommand)}
                        dataTestId="gcp-bootstrap-command"
                      />
                      <BodyText sx={{ marginTop: "20px" }}>
                        For guidance, our instructional video is available {gcpShellScriptGuide}.
                      </BodyText>
                    </Box>
                  ) : selectedAccountConfig?.status === "FAILED" ? (
                    <Box display={"flex"} flexDirection={"column"} gap={"10px"}>
                      <BodyText>
                        You may delete this failed configuration and retry adding it after carefully verifying the GCP
                        Project ID and Project Number.
                      </BodyText>
                      <BodyText>If the issue persists, please contact Support for assistance.</BodyText>
                    </Box>
                  ) : (
                    <BodyText>
                      Your account details are being configured. Please check back shortly for detailed setup
                      instructions.
                    </BodyText>
                  )}
                </ListItem>
              </>
            )}

            {accountInstructionDetails?.azureSubscriptionID && (
              <ListItem>
                {azureBootstrapShellCommand ? (
                  <Box flex={1} overflow={"hidden"}>
                    <BodyText>
                      {isReady ? "To reconfigure this account, open " : "Open "}
                      {azureCloudShellLink} and run the command below.
                    </BodyText>

                    <ShellCommandBlock
                      command={addQuotesToShellCommand(azureBootstrapShellCommand)}
                      dataTestId="azure-bootstrap-command"
                    />
                    <BodyText sx={{ marginTop: "20px" }}>
                      For guidance, our instructional video is available {azureShellScriptGuide}.
                    </BodyText>
                  </Box>
                ) : selectedAccountConfig?.status === "FAILED" ? (
                  <Box display={"flex"} flexDirection={"column"} gap={"10px"}>
                    <BodyText>
                      You may delete this failed configuration and retry adding it after carefully verifying the Azure
                      Subscription ID and Tenant ID.
                    </BodyText>
                    <BodyText>If the issue persists, please contact Support for assistance.</BodyText>
                  </Box>
                ) : (
                  <BodyText flex={1} overflow={"hidden"}>
                    Your account details are being configured. Please check back shortly for detailed setup
                    instructions.
                  </BodyText>
                )}
              </ListItem>
            )}

            {accountInstructionDetails?.ociTenancyID && (
              <ListItem>
                {accountInstructionDetails?.ociBootstrapShellCommand ? (
                  <Box flex={1} overflow={"hidden"}>
                    <BodyText>
                      {isReady ? "To reconfigure this account, open " : "Open "}
                      {ociCloudShellLink} and run the command below.
                    </BodyText>

                    <ShellCommandBlock
                      command={addQuotesToShellCommand(accountInstructionDetails?.ociBootstrapShellCommand)}
                      dataTestId="oci-bootstrap-command"
                    />
                    {/* <BodyText sx={{ marginTop: "20px" }}>
                      For guidance, our instructional video is available {ociShellScriptGuide}.
                    </BodyText> */}
                  </Box>
                ) : selectedAccountConfig?.status === "FAILED" ? (
                  <Box display={"flex"} flexDirection={"column"} gap={"10px"}>
                    <BodyText>
                      You may delete this failed configuration and retry adding it after carefully verifying the OCI
                      Tenancy OCID and Domain OCID.
                    </BodyText>
                    <BodyText>If the issue persists, please contact Support for assistance.</BodyText>
                  </Box>
                ) : (
                  <BodyText flex={1} overflow={"hidden"}>
                    Your account details are being configured. Please check back shortly for detailed setup
                    instructions.
                  </BodyText>
                )}
              </ListItem>
            )}
          </>
        </List>
      </Box>
    </>
  );
};

function CloudProviderAccountOrgIdModal(props) {
  const {
    open,
    handleClose,
    isAccountCreation,
    cloudFormationTemplateUrl,
    isAccessPage = false,
    accountConfigId,
    selectedAccountConfig,
    gcpBootstrapShellCommand,
    azureBootstrapShellCommand,
    accountInstructionDetails,
    accountConfigMethod,
    fetchClickedInstanceDetails,
    setClickedInstance,
  } = props;

  const gcpCloudShellLink = (
    <StyledLink
      href="https://shell.cloud.google.com/?cloudshell_ephemeral=true&show=terminal"
      target="_blank"
      rel="noopener noreferrer"
    >
      Google Cloud Shell
    </StyledLink>
  );

  const safeCloudFormationTemplateUrl = getSafeExternalURL(cloudFormationTemplateUrl);

  const cloudformationlink = safeCloudFormationTemplateUrl ? (
    <StyledLink href={safeCloudFormationTemplateUrl} target="_blank" rel="noopener noreferrer">
      here
    </StyledLink>
  ) : (
    "here"
  );

  const azureCloudShellLink = (
    <StyledLink href="https://portal.azure.com/#cloudshell/" target="_blank" rel="noopener noreferrer">
      Azure Cloud Shell
    </StyledLink>
  );

  const ociCloudShellLink = (
    <StyledLink href="https://cloud.oracle.com/?cloudshell=true" target="_blank" rel="noopener noreferrer">
      OCI Cloud Shell
    </StyledLink>
  );

  // links pointing to guides for different methods
  const azureShellScriptGuide = isAccessPage ? (
    <StyledLink href="https://youtu.be/7A9WbZjuXgQ?si=y-AvMmtdFIycqzOS" target="_blank" rel="noopener noreferrer">
      here
    </StyledLink>
  ) : (
    <StyledLink href="https://youtu.be/7A9WbZjuXgQ?si=y-AvMmtdFIycqzOS" target="_blank" rel="noopener noreferrer">
      here
    </StyledLink>
  );

  // TODO: Update once video is ready
  // const ociShellScriptGuide = (
  //   <StyledLink href="#" target="_blank" rel="noopener noreferrer">
  //     here
  //   </StyledLink>
  // );

  const gcpShellScriptGuide = isAccessPage ? (
    <StyledLink href="https://youtu.be/isTGi8tQA2w?si=a12mJXnlA-y2ipVC" target="_blank" rel="noopener noreferrer">
      here
    </StyledLink>
  ) : (
    <StyledLink href="https://youtu.be/isTGi8tQA2w?si=a12mJXnlA-y2ipVC" target="_blank" rel="noopener noreferrer">
      here
    </StyledLink>
  );

  const cloudFormationGuide = isAccessPage ? (
    <StyledLink href={AWS_CLOUD_FORMATION_GUIDE_URL} target="_blank" rel="noopener noreferrer">
      {isAccountCreation ? "here" : "guide"}
    </StyledLink>
  ) : (
    <StyledLink href="https://youtu.be/Mu-4jppldwk" target="_blank" rel="noopener noreferrer">
      {isAccountCreation ? "here" : "guide"}
    </StyledLink>
  );

  const isAwsReconfiguration =
    !isAccountCreation &&
    String(selectedAccountConfig?.status ?? "").toUpperCase() === "READY" &&
    Boolean(accountInstructionDetails?.awsAccountID && safeCloudFormationTemplateUrl);

  return (
    <Dialog disableRestoreFocus open={open} onClose={handleClose} fullWidth>
      <StyledContainer data-testid="account-configuration-dialog">
        <Header>
          <Stack direction="row" alignItems="center" gap="16px">
            <Box
              sx={{
                border: "1px solid #E4E7EC",
                boxShadow: "0px 1px 2px 0px #1018280D, 0px -2px 0px 0px #1018280D,0px 0px 0px 1px #1018282E",
                borderRadius: "10px",
                width: "48px",
                height: "48px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <InstructionsModalIcon />
            </Box>
            <Text size="large" weight="semibold">
              Account Configuration Instructions
            </Text>
          </Stack>
          <IconButton onClick={handleClose} sx={{ alignSelf: "flex-start", width: "44px", height: "44px" }}>
            <CloseIcon sx={{ color: "#98A2B3" }} />
          </IconButton>
        </Header>
        <Content>
          {isAccountCreation ? (
            <CreationTimeInstructions
              cloudformationlink={cloudformationlink}
              cloudFormationGuide={cloudFormationGuide}
              accountConfigStatus={selectedAccountConfig?.status}
              accountConfigId={accountConfigId}
              cloudFormationTemplateUrl={safeCloudFormationTemplateUrl}
              gcpBootstrapShellCommand={gcpBootstrapShellCommand}
              gcpCloudShellLink={gcpCloudShellLink}
              gcpShellScriptGuide={gcpShellScriptGuide}
              azureCloudShellLink={azureCloudShellLink}
              azureShellScriptGuide={azureShellScriptGuide}
              azureBootstrapShellCommand={azureBootstrapShellCommand}
              ociCloudShellLink={ociCloudShellLink}
              // ociShellScriptGuide={ociShellScriptGuide}
              accountInstructionDetails={accountInstructionDetails}
              accountConfigMethod={accountConfigMethod}
              fetchClickedInstanceDetails={fetchClickedInstanceDetails}
              setClickedInstance={setClickedInstance}
            />
          ) : (
            <NonCreationTimeInstructions
              selectedAccountConfig={selectedAccountConfig}
              cloudformationlink={cloudformationlink}
              cloudFormationGuide={cloudFormationGuide}
              cloudFormationTemplateUrl={safeCloudFormationTemplateUrl}
              gcpBootstrapShellCommand={gcpBootstrapShellCommand}
              gcpCloudShellLink={gcpCloudShellLink}
              gcpShellScriptGuide={gcpShellScriptGuide}
              accountInstructionDetails={accountInstructionDetails}
              accountConfigMethod={accountConfigMethod}
              azureCloudShellLink={azureCloudShellLink}
              azureShellScriptGuide={azureShellScriptGuide}
              azureBootstrapShellCommand={azureBootstrapShellCommand}
              ociCloudShellLink={ociCloudShellLink}
              isAwsReconfiguration={isAwsReconfiguration}
              // ociShellScriptGuide={ociShellScriptGuide}
            />
          )}
        </Content>
        <Footer>
          <Button
            variant="contained"
            onClick={handleClose}
            data-testid="close-instructions-button"
            sx={{ width: "71px" }}
          >
            Close
          </Button>
        </Footer>
      </StyledContainer>
    </Dialog>
  );
}

export default CloudProviderAccountOrgIdModal;

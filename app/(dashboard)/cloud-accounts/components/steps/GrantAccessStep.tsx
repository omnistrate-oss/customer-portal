"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Stack } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";

import CardWithTitle from "src/components/Card/CardWithTitle";
import LoadingSpinnerSmall from "src/components/CircularProgress/CircularProgress";
import CopyToClipboardButton from "src/components/CopyClipboardButton/CopyClipboardButton";
import StepperSuccessIcon from "src/components/Stepper/StepperSuccessIcon";
import { Text } from "src/components/Typography/Typography";
import { addQuotesToShellCommand } from "src/utils/accountConfig/accountConfig";
import useEnvironmentType from "src/hooks/useEnvironmentType";
import { getResultParams } from "src/utils/instance";

import sandClock from "public/assets/images/cloud-account/sandclock.gif";

const StyledLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    style={{ textDecoration: "underline", color: "#7F56D9", fontWeight: 600 }}
  >
    {children}
  </Link>
);

const TextContainerToCopy = ({ text, marginTop = "20px" }: { text: string; marginTop?: string }) => (
  <Box
    sx={{
      marginTop,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
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
      }}
    >
      <Text size="medium" weight="regular" color="#667085" ellipsis title={text}>
        {text}
      </Text>
      <CopyToClipboardButton text={text} iconProps={{ color: "#98A2B3" }} />
    </Box>
  </Box>
);

type ChecklistItemProps = {
  label: string;
  isComplete: boolean;
  isInProgress?: boolean;
  children?: React.ReactNode;
};

const ChecklistItem = ({ label, isComplete, isInProgress, children }: ChecklistItemProps) => (
  <Stack direction="column" gap="12px">
    <Stack direction="row" alignItems="center" gap="12px">
      <Box sx={{ flexShrink: 0 }}>
        {isComplete ? (
          <StepperSuccessIcon />
        ) : isInProgress ? (
          <Image src={sandClock} alt="in progress" width={24} height={24} />
        ) : (
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              border: "2px solid #D0D5DD",
              bgcolor: "#F9FAFB",
            }}
          />
        )}
      </Box>
      <Text size="small" weight="semibold" color="#101828">
        {label}
      </Text>
    </Stack>
    {children && (
      <Box sx={{ ml: "36px" }}>
        {children}
      </Box>
    )}
  </Stack>
);

export type GrantAccessStepProps = {
  selectedAccountConfig: any;
  cloudFormationTemplateUrl?: string;
  gcpBootstrapShellCommand?: string;
  azureBootstrapShellCommand?: string;
  accountInstructionDetails: {
    awsAccountID?: string;
    gcpProjectID?: string;
    gcpProjectNumber?: string;
    azureSubscriptionID?: string;
    azureTenantID?: string;
    ociTenancyID?: string;
    ociDomainID?: string;
    ociBootstrapShellCommand?: string;
  };
  isAccessPage?: boolean;
  fetchClickedInstanceDetails?: () => Promise<any>;
  setClickedInstance?: (fn: (prev: any) => any) => void;
};

const GrantAccessStep: React.FC<GrantAccessStepProps> = ({
  selectedAccountConfig,
  cloudFormationTemplateUrl,
  gcpBootstrapShellCommand,
  azureBootstrapShellCommand,
  accountInstructionDetails,
  isAccessPage = true,
  fetchClickedInstanceDetails,
  setClickedInstance,
}) => {
  const environmentType = useEnvironmentType();
  const queryClient = useQueryClient();
  const [isPolling, setIsPolling] = useState(false);
  const timeoutId = useRef<ReturnType<typeof setTimeout>>();
  const pollCountRef = useRef(0);
  const pollInterval = 2000;
  const isMounted = useRef(true);

  const hasAwsAccount = !!accountInstructionDetails?.awsAccountID;
  const hasGcpAccount = !!accountInstructionDetails?.gcpProjectID;
  const hasAzureAccount = !!accountInstructionDetails?.azureSubscriptionID;
  const hasOciAccount = !!accountInstructionDetails?.ociTenancyID;

  const needsCloudFormation = hasAwsAccount && !cloudFormationTemplateUrl;
  const needsGcpScript = hasGcpAccount && !gcpBootstrapShellCommand;
  const needsAzureScript = hasAzureAccount && !azureBootstrapShellCommand;
  const needsOciScript =
    hasOciAccount && !accountInstructionDetails?.ociBootstrapShellCommand;

  const startPolling = async () => {
    if (!isMounted.current || !fetchClickedInstanceDetails || !setClickedInstance) return;

    let resourceInstance;
    try {
      const res = await fetchClickedInstanceDetails();
      resourceInstance = res.data;
    } catch {
      // ignore
    }

    if (!isMounted.current) return;

    const resultParams = getResultParams(resourceInstance);
    if (resultParams?.cloud_provider_account_config_id) {
      setClickedInstance((prev: any) => ({
        ...prev,
        result_params: { ...getResultParams(prev), ...resultParams },
      }));
      queryClient.setQueryData(
        [
          "get",
          "/2022-09-01-00/resource-instance",
          { params: { query: { environmentType } } },
        ],
        (oldData: any) => ({
          resourceInstances: (oldData?.resourceInstances || []).map((inst: any) =>
            inst?.id === resourceInstance?.id
              ? { ...(resourceInstance || {}), result_params: { ...oldData?.result_params, ...resultParams } }
              : inst
          ),
        })
      );
      setIsPolling(false);
    } else if (pollCountRef.current < 3) {
      pollCountRef.current += 1;
      timeoutId.current = setTimeout(startPolling, pollInterval);
    } else {
      setIsPolling(false);
    }
  };

  useEffect(() => {
    isMounted.current = true;
    if (needsCloudFormation || needsGcpScript || needsAzureScript || needsOciScript) {
      setIsPolling(true);
      startPolling();
    }
    return () => {
      isMounted.current = false;
      if (timeoutId.current) clearTimeout(timeoutId.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const accountConfigStatus = selectedAccountConfig?.status;
  const isFailed = accountConfigStatus === "FAILED";
  const isReady = accountConfigStatus === "READY";

  // Determine checklist states
  const isSetupComplete = true; // Account was just created
  const isVerificationComplete =
    (hasAwsAccount && !!cloudFormationTemplateUrl) ||
    (hasGcpAccount && !!gcpBootstrapShellCommand) ||
    (hasAzureAccount && !!azureBootstrapShellCommand) ||
    (hasOciAccount && !!accountInstructionDetails?.ociBootstrapShellCommand);
  const isStackDeployed = isReady;

  const cloudFormationGuide = (
    <StyledLink href="https://youtu.be/c3HNnM8UJBE">here</StyledLink>
  );
  const cloudformationlink = cloudFormationTemplateUrl ? (
    <StyledLink href={cloudFormationTemplateUrl}>here</StyledLink>
  ) : null;

  const gcpCloudShellLink = (
    <StyledLink href="https://shell.cloud.google.com/?cloudshell_ephemeral=true&show=terminal">
      Google Cloud Shell
    </StyledLink>
  );
  const gcpShellScriptGuide = (
    <StyledLink href="https://youtu.be/isTGi8tQA2w?si=a12mJXnlA-y2ipVC">here</StyledLink>
  );

  const azureCloudShellLink = (
    <StyledLink href="https://portal.azure.com/#cloudshell/">Azure Cloud Shell</StyledLink>
  );
  const azureShellScriptGuide = (
    <StyledLink href="https://youtu.be/7A9WbZjuXgQ?si=y-AvMmtdFIycqzOS">here</StyledLink>
  );

  const ociCloudShellLink = (
    <StyledLink href="https://cloud.oracle.com/?cloudshell=true">OCI Cloud Shell</StyledLink>
  );

  const renderVerificationInstructions = () => {
    if (isFailed) {
      const providerText = hasAwsAccount
        ? "AWS Account ID"
        : hasGcpAccount
          ? "GCP Project ID and Project Number"
          : hasAzureAccount
            ? "Azure Subscription ID and Tenant ID"
            : "OCI Tenancy OCID and Domain OCID";
      return (
        <Stack gap="8px">
          <Text size="small" weight="regular" color="#344054">
            You may delete this failed configuration and retry after carefully verifying the{" "}
            {providerText}.
          </Text>
          <Text size="small" weight="regular" color="#344054">
            If the issue persists, please contact Support for assistance.
          </Text>
        </Stack>
      );
    }

    if (isPolling) {
      return (
        <Stack direction="row" alignItems="center" gap="8px">
          <LoadingSpinnerSmall sx={{ marginLeft: 0 }} />
          <Text size="small" weight="regular" color="#344054">
            Setting up account configuration instructions…
          </Text>
        </Stack>
      );
    }

    if (hasAwsAccount) {
      return (
        <Stack gap="12px">
          <Box>
            <Text size="small" weight="medium" color="#344054">
              AWS Account ID
            </Text>
            <TextContainerToCopy text={accountInstructionDetails.awsAccountID!} marginTop="6px" />
          </Box>
          {cloudFormationTemplateUrl ? (
            <Stack gap="8px">
              <Text size="small" weight="semibold" color="#344054">
                To complete the account configuration, the instructions are provided below:
              </Text>
              <Text size="small" weight="regular" color="#344054">
                Please create your CloudFormation Stack using the provided template{" "}
                {cloudformationlink}.
              </Text>
              <Text size="small" weight="regular" color="#344054">
                If an existing AWSLoadBalancerControllerIAMPolicy policy causes an error while
                creating the CloudFormation stack, set the parameter CreateLoadBalancerPolicy to
                &quot;false&quot;.
              </Text>
              <Text size="small" weight="regular" color="#344054">
                For guidance, our instructional video is available {cloudFormationGuide}.
              </Text>
            </Stack>
          ) : (
            <Text size="small" weight="regular" color="#344054">
              Your account details are being configured. Please check back shortly for detailed
              setup instructions.
            </Text>
          )}
        </Stack>
      );
    }

    if (hasGcpAccount) {
      return (
        <Stack gap="12px">
          <Stack direction="row" gap="12px">
            <Box flex={1}>
              <Text size="small" weight="medium" color="#344054">
                GCP Project ID
              </Text>
              <TextContainerToCopy text={accountInstructionDetails.gcpProjectID!} marginTop="6px" />
            </Box>
            <Box flex={1}>
              <Text size="small" weight="medium" color="#344054">
                GCP Project Number
              </Text>
              <TextContainerToCopy
                text={accountInstructionDetails.gcpProjectNumber || ""}
                marginTop="6px"
              />
            </Box>
          </Stack>
          {gcpBootstrapShellCommand ? (
            <Stack gap="8px">
              <Text size="small" weight="regular" color="#344054">
                Please open the {gcpCloudShellLink} environment and execute the command below.
              </Text>
              <TextContainerToCopy text={addQuotesToShellCommand(gcpBootstrapShellCommand)} />
              <Text size="small" weight="regular" color="#344054">
                For guidance, our instructional video is available {gcpShellScriptGuide}.
              </Text>
            </Stack>
          ) : (
            <Text size="small" weight="regular" color="#344054">
              Your account details are being configured. Please check back shortly.
            </Text>
          )}
        </Stack>
      );
    }

    if (hasAzureAccount) {
      return (
        <Stack gap="12px">
          <Stack direction="row" gap="12px">
            <Box flex={1}>
              <Text size="small" weight="medium" color="#344054">
                Azure Subscription ID
              </Text>
              <TextContainerToCopy
                text={accountInstructionDetails.azureSubscriptionID!}
                marginTop="6px"
              />
            </Box>
            <Box flex={1}>
              <Text size="small" weight="medium" color="#344054">
                Azure Tenant ID
              </Text>
              <TextContainerToCopy
                text={accountInstructionDetails.azureTenantID || ""}
                marginTop="6px"
              />
            </Box>
          </Stack>
          {azureBootstrapShellCommand ? (
            <Stack gap="8px">
              <Text size="small" weight="regular" color="#344054">
                Please open the {azureCloudShellLink} environment and execute the command below.
              </Text>
              <TextContainerToCopy text={addQuotesToShellCommand(azureBootstrapShellCommand)} />
              <Text size="small" weight="regular" color="#344054">
                For guidance, our instructional video is available {azureShellScriptGuide}.
              </Text>
            </Stack>
          ) : (
            <Text size="small" weight="regular" color="#344054">
              Your account details are being configured. Please check back shortly.
            </Text>
          )}
        </Stack>
      );
    }

    if (hasOciAccount) {
      return (
        <Stack gap="12px">
          <Stack direction="row" gap="12px">
            <Box flex={1}>
              <Text size="small" weight="medium" color="#344054">
                OCI Tenancy OCID
              </Text>
              <TextContainerToCopy
                text={accountInstructionDetails.ociTenancyID!}
                marginTop="6px"
              />
            </Box>
            <Box flex={1}>
              <Text size="small" weight="medium" color="#344054">
                OCI Domain OCID
              </Text>
              <TextContainerToCopy
                text={accountInstructionDetails.ociDomainID || ""}
                marginTop="6px"
              />
            </Box>
          </Stack>
          {accountInstructionDetails.ociBootstrapShellCommand ? (
            <Stack gap="8px">
              <Text size="small" weight="regular" color="#344054">
                Please open the {ociCloudShellLink} environment and execute the command below.
              </Text>
              <TextContainerToCopy
                text={addQuotesToShellCommand(
                  accountInstructionDetails.ociBootstrapShellCommand
                )}
              />
            </Stack>
          ) : (
            <Text size="small" weight="regular" color="#344054">
              Your account details are being configured. Please check back shortly.
            </Text>
          )}
        </Stack>
      );
    }

    return (
      <Text size="small" weight="regular" color="#344054">
        Your account details are being configured. Please check back shortly for detailed setup
        instructions.
      </Text>
    );
  };

  const stackDeployedLabel = hasAwsAccount
    ? "CloudFormation stack deployed"
    : hasGcpAccount
      ? "GCP bootstrap script executed"
      : hasAzureAccount
        ? "Azure bootstrap script executed"
        : "Account bootstrap completed";

  return (
    <CardWithTitle title="Grant Access">
      <Stack gap="20px">
        <ChecklistItem label="Account configuration setup completed" isComplete={isSetupComplete} />

        <Box
          sx={{
            width: "2px",
            height: "20px",
            bgcolor: "#E9EAEB",
            ml: "11px",
          }}
        />

        <ChecklistItem
          label="This account configuration verification succeeded"
          isComplete={isVerificationComplete && !isFailed}
          isInProgress={isPolling}
        >
          {renderVerificationInstructions()}
        </ChecklistItem>

        <Box
          sx={{
            width: "2px",
            height: "20px",
            bgcolor: "#E9EAEB",
            ml: "11px",
          }}
        />

        <ChecklistItem
          label={stackDeployedLabel}
          isComplete={isStackDeployed}
          isInProgress={isVerificationComplete && !isStackDeployed && !isFailed}
        />
      </Stack>
    </CardWithTitle>
  );
};

export default GrantAccessStep;

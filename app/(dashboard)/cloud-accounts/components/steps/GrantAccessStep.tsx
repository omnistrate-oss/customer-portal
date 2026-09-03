"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Box, Stack } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

import AwsCloudFormationInstructions from "src/components/AwsCloudFormationInstructions/AwsCloudFormationInstructions";
import CommandBlock from "src/components/AwsCloudFormationInstructions/CommandBlock";
import CardWithTitle from "src/components/Card/CardWithTitle";
import LoadingSpinnerSmall from "src/components/CircularProgress/CircularProgress";
import CopyToClipboardButton from "src/components/CopyClipboardButton/CopyClipboardButton";
import StepperErrorIcon from "src/components/Stepper/StepperErrorIcon";
import StepperSuccessIcon from "src/components/Stepper/StepperSuccessIcon";
import { Text } from "src/components/Typography/Typography";
import useEnvironmentType from "src/hooks/useEnvironmentType";
import { addQuotesToShellCommand } from "src/utils/accountConfig/accountConfig";
import { getResultParams } from "src/utils/instance";
import { getPollingInterval } from "src/utils/polling";

import sandClock from "public/assets/images/cloud-account/sandclock.gif";

import StepperDefaultIcon from "../../../../../src/components/Stepper/StepperDefaultIcon";

export const StyledLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
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
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      <Text
        size="medium"
        weight="regular"
        color="#667085"
        ellipsis
        title={text}
        sx={{ minWidth: 0, flex: 1, overflow: "hidden" }}
      >
        {text}
      </Text>
      <CopyToClipboardButton text={text} iconProps={{ color: "#98A2B3" }} />
    </Box>
  </Box>
);

const POLL_MAX_DURATION_MS = 60 * 60 * 1000;

type ChecklistItemProps = {
  label: string;
  isComplete: boolean;
  isInProgress?: boolean;
  isFailed?: boolean;
  connectorColor?: string;
  children?: React.ReactNode;
};

const ChecklistItem = ({ label, isComplete, isInProgress, isFailed, connectorColor, children }: ChecklistItemProps) => (
  <Stack
    direction="column"
    gap="12px"
    sx={
      connectorColor
        ? {
            position: "relative",
            zIndex: 1,
            "&::after": {
              content: '""',
              position: "absolute",
              top: "26px",
              bottom: "-18px",
              left: "11px",
              width: "2px",
              bgcolor: connectorColor,
              zIndex: 0,
            },
          }
        : { position: "relative", zIndex: 1 }
    }
  >
    <Stack direction="row" alignItems="center" gap="12px">
      <Box sx={{ flexShrink: 0 }}>
        {isFailed ? (
          <StepperErrorIcon />
        ) : isComplete ? (
          <StepperSuccessIcon />
        ) : isInProgress ? (
          <Image src={sandClock} alt="in progress" width={24} height={24} />
        ) : (
          <StepperDefaultIcon />
        )}
      </Box>
      <Text size="small" weight="semibold" color="#101828">
        {label}
      </Text>
    </Stack>
    {children && <Box sx={{ ml: "36px", minWidth: 0 }}>{children}</Box>}
  </Stack>
);

export type GrantAccessStepProps = {
  selectedAccountConfig?: {
    status?: string;
    result_params?: unknown;
    launch_input_params?: unknown;
    [key: string]: unknown;
  };
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
    nebiusTenantID?: string;
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
  fetchClickedInstanceDetails,
  setClickedInstance,
}) => {
  const environmentType = useEnvironmentType();
  const queryClient = useQueryClient();
  const [isPolling, setIsPolling] = useState(false);
  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollStartTimeRef = useRef(0);
  const isMounted = useRef(true);

  const hasAwsAccount = !!accountInstructionDetails?.awsAccountID;
  const hasGcpAccount = !!accountInstructionDetails?.gcpProjectID;
  const hasAzureAccount = !!accountInstructionDetails?.azureSubscriptionID;
  const hasOciAccount = !!accountInstructionDetails?.ociTenancyID;
  const hasNebiusAccount = !!accountInstructionDetails?.nebiusTenantID;

  const needsCloudFormation = hasAwsAccount && !cloudFormationTemplateUrl;
  const needsGcpScript = hasGcpAccount && !gcpBootstrapShellCommand;
  const needsAzureScript = hasAzureAccount && !azureBootstrapShellCommand;
  const needsOciScript = hasOciAccount && !accountInstructionDetails?.ociBootstrapShellCommand;

  const startPolling = async () => {
    if (!isMounted.current || !fetchClickedInstanceDetails || !setClickedInstance) return;

    let resourceInstance;
    try {
      const res = await fetchClickedInstanceDetails();
      resourceInstance = res.data;
    } catch {
      // Error is intentionally ignored: polling will retry automatically.
      // Failed fetches during background polling don't need to surface to the user.
    }

    if (!isMounted.current) return;

    const resultParams = getResultParams(resourceInstance);
    const status = String(resourceInstance?.status || resultParams.account_config_status || "").toUpperCase();
    const hasInstructions =
      (hasAwsAccount && !!(resultParams.cloudformation_url || resultParams.cloudformation_url_no_lb)) ||
      (hasGcpAccount && !!resultParams.gcp_bootstrap_shell_script) ||
      (hasAzureAccount && !!resultParams.azure_bootstrap_shell_script) ||
      (hasOciAccount && !!resultParams.oci_bootstrap_shell_script);

    if (resourceInstance) {
      setClickedInstance((prev: any) => ({
        ...prev,
        status: resourceInstance.status || prev?.status,
        result_params: { ...getResultParams(prev), ...resultParams },
      }));
      queryClient.setQueryData(
        ["get", "/2022-09-01-00/resource-instance", { params: { query: { environmentType } } }],
        (oldData: any) => ({
          resourceInstances: (oldData?.resourceInstances || []).map((inst: any) =>
            inst?.id === resourceInstance?.id
              ? { ...(resourceInstance || {}), result_params: { ...getResultParams(inst), ...resultParams } }
              : inst
          ),
        })
      );
    }

    if (status === "FAILED" || (resultParams?.cloud_provider_account_config_id && hasInstructions)) {
      setIsPolling(false);
    } else if (Date.now() - pollStartTimeRef.current < POLL_MAX_DURATION_MS) {
      timeoutId.current = setTimeout(startPolling, getPollingInterval(Date.now() - pollStartTimeRef.current));
    } else {
      setIsPolling(false);
    }
  };

  useEffect(() => {
    isMounted.current = true;
    if (needsCloudFormation || needsGcpScript || needsAzureScript || needsOciScript) {
      setIsPolling(true);
      pollStartTimeRef.current = Date.now();
      startPolling();
    }
    return () => {
      isMounted.current = false;
      if (timeoutId.current) clearTimeout(timeoutId.current);
    };
    // This effect runs only once on mount to initiate polling for setup instructions.
    // The dependency flags (needsCloudFormation etc.) are derived from the initial props
    // snapshot and should not trigger re-runs; re-running would restart polling prematurely.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Status polling: poll every 5s, max 60 min, until READY or FAILED ───
  const [isStatusPolling, setIsStatusPolling] = useState(false);
  const statusPollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusPollStart = useRef<number>(0);

  const accountConfigResultParams = getResultParams(selectedAccountConfig);
  const accountConfigId = accountConfigResultParams.cloud_provider_account_config_id;
  const accountConfigStatus = selectedAccountConfig?.status || accountConfigResultParams.account_config_status;
  const normalizedAccountConfigStatus = String(accountConfigStatus || "").toUpperCase();
  const isFailed = normalizedAccountConfigStatus === "FAILED";
  const isReady = ["READY", "RUNNING", "COMPLETE"].includes(normalizedAccountConfigStatus);

  const isVerificationComplete =
    (hasAwsAccount && !!cloudFormationTemplateUrl) ||
    (hasGcpAccount && !!gcpBootstrapShellCommand) ||
    (hasAzureAccount && !!azureBootstrapShellCommand) ||
    (hasOciAccount && !!accountInstructionDetails?.ociBootstrapShellCommand);

  useEffect(() => {
    // Start status polling as soon as the account config exists, even if instructions arrive later.
    if (!accountConfigId || isReady || isFailed || !fetchClickedInstanceDetails || !setClickedInstance) return;

    setIsStatusPolling(true);
    statusPollStart.current = Date.now();

    const pollStatus = async () => {
      if (!isMounted.current) return;

      // Check if max duration exceeded
      if (Date.now() - statusPollStart.current >= POLL_MAX_DURATION_MS) {
        setIsStatusPolling(false);
        return;
      }

      try {
        const res = await fetchClickedInstanceDetails();
        const resourceInstance = res?.data;
        const resultParams = getResultParams(resourceInstance);

        if (!isMounted.current) return;

        if (resultParams) {
          setClickedInstance((prev: any) => ({
            ...prev,
            status: resourceInstance?.status || prev?.status,
            result_params: { ...getResultParams(prev), ...resultParams },
          }));

          const status = String(resultParams.account_config_status || resourceInstance?.status || "").toUpperCase();
          const TERMINAL_STATUSES = ["READY", "RUNNING", "COMPLETE", "FAILED"];
          if (status && TERMINAL_STATUSES.includes(status)) {
            setIsStatusPolling(false);
            return;
          }
        }
      } catch {
        // Silently retry on error
      }

      if (isMounted.current) {
        statusPollTimer.current = setTimeout(pollStatus, getPollingInterval(Date.now() - statusPollStart.current));
      }
    };

    pollStatus();

    return () => {
      if (statusPollTimer.current) clearTimeout(statusPollTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountConfigId, isReady, isFailed]);

  // Clean up status polling on unmount
  useEffect(() => {
    return () => {
      if (statusPollTimer.current) clearTimeout(statusPollTimer.current);
    };
  }, []);

  const isRequestOrDataPending =
    isPolling ||
    isStatusPolling ||
    ["PENDING", "VERIFYING", "DEPLOYING", "ATTACHING", "CONNECTING"].includes(normalizedAccountConfigStatus);

  // Determine checklist states
  const isSetupComplete = true; // Account was just created
  const isStackDeployed = isReady;
  // Step 3 must not start until verification (step 2) has completed. While
  // setup instructions are still being generated, only step 2 is in progress.
  const isStackDeploymentInProgress = isVerificationComplete && isRequestOrDataPending && !isStackDeployed && !isFailed;

  const cloudFormationGuide = <StyledLink href="https://youtu.be/c3HNnM8UJBE">here</StyledLink>;
  const cloudformationlink = cloudFormationTemplateUrl ? (
    <StyledLink href={cloudFormationTemplateUrl}>here</StyledLink>
  ) : null;

  const gcpCloudShellLink = (
    <StyledLink href="https://shell.cloud.google.com/?cloudshell_ephemeral=true&show=terminal">
      Google Cloud Shell
    </StyledLink>
  );
  const gcpShellScriptGuide = <StyledLink href="https://youtu.be/isTGi8tQA2w?si=a12mJXnlA-y2ipVC">here</StyledLink>;

  const azureCloudShellLink = <StyledLink href="https://portal.azure.com/#cloudshell/">Azure Cloud Shell</StyledLink>;
  const azureShellScriptGuide = <StyledLink href="https://youtu.be/7A9WbZjuXgQ?si=y-AvMmtdFIycqzOS">here</StyledLink>;

  const ociCloudShellLink = <StyledLink href="https://cloud.oracle.com/?cloudshell=true">OCI Cloud Shell</StyledLink>;

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
            You may delete this failed configuration and retry after carefully verifying the {providerText}.
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
            <Stack gap="8px" minWidth={0}>
              <Text size="small" weight="semibold" color="#344054">
                To complete the account configuration, the instructions are provided below:
              </Text>
              <AwsCloudFormationInstructions
                cloudFormationUrl={cloudFormationTemplateUrl}
                variant="onboarding"
                awsAccountId={accountInstructionDetails.awsAccountID}
              >
                <Stack gap="8px">
                  <Text size="small" weight="regular" color="#344054">
                    Please create your CloudFormation Stack using the provided template {cloudformationlink}.
                  </Text>
                  <Text size="small" weight="regular" color="#344054">
                    If an existing AWSLoadBalancerControllerIAMPolicy policy causes an error while creating the
                    CloudFormation stack, set the parameter CreateLoadBalancerPolicy to &quot;false&quot;.
                  </Text>
                  <Text size="small" weight="regular" color="#344054">
                    For guidance, our instructional video is available {cloudFormationGuide}.
                  </Text>
                </Stack>
              </AwsCloudFormationInstructions>
            </Stack>
          ) : (
            <Text size="small" weight="regular" color="#344054">
              Your account details are being configured. Please check back shortly for detailed setup instructions.
            </Text>
          )}
        </Stack>
      );
    }

    if (hasGcpAccount) {
      return (
        <Stack gap="12px">
          <Stack direction="row" gap="12px" sx={{ minWidth: 0, width: "100%" }}>
            <Box flex={1} minWidth={0}>
              <Text size="small" weight="medium" color="#344054">
                GCP Project ID
              </Text>
              <TextContainerToCopy text={accountInstructionDetails.gcpProjectID!} marginTop="6px" />
            </Box>
            <Box flex={1} minWidth={0}>
              <Text size="small" weight="medium" color="#344054">
                GCP Project Number
              </Text>
              <TextContainerToCopy text={accountInstructionDetails.gcpProjectNumber || ""} marginTop="6px" />
            </Box>
          </Stack>
          {gcpBootstrapShellCommand ? (
            <Stack gap="8px">
              <Text size="small" weight="regular" color="#344054">
                Please open the {gcpCloudShellLink} environment and execute the command below.
              </Text>
              <CommandBlock
                title="Run command"
                command={addQuotesToShellCommand(gcpBootstrapShellCommand)}
                dataTestId="gcp-bootstrap-command"
              />
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
          <Stack direction="row" gap="12px" sx={{ minWidth: 0, width: "100%" }}>
            <Box flex={1} minWidth={0}>
              <Text size="small" weight="medium" color="#344054">
                Azure Subscription ID
              </Text>
              <TextContainerToCopy text={accountInstructionDetails.azureSubscriptionID!} marginTop="6px" />
            </Box>
            <Box flex={1} minWidth={0}>
              <Text size="small" weight="medium" color="#344054">
                Azure Tenant ID
              </Text>
              <TextContainerToCopy text={accountInstructionDetails.azureTenantID || ""} marginTop="6px" />
            </Box>
          </Stack>
          {azureBootstrapShellCommand ? (
            <Stack gap="8px">
              <Text size="small" weight="regular" color="#344054">
                Please open the {azureCloudShellLink} environment and execute the command below.
              </Text>
              <CommandBlock
                title="Run command"
                command={addQuotesToShellCommand(azureBootstrapShellCommand)}
                dataTestId="azure-bootstrap-command"
              />
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
          <Stack direction="row" gap="12px" sx={{ minWidth: 0, width: "100%" }}>
            <Box flex={1} minWidth={0}>
              <Text size="small" weight="medium" color="#344054">
                OCI Tenancy OCID
              </Text>
              <TextContainerToCopy text={accountInstructionDetails.ociTenancyID!} marginTop="6px" />
            </Box>
            <Box flex={1} minWidth={0}>
              <Text size="small" weight="medium" color="#344054">
                OCI Domain OCID
              </Text>
              <TextContainerToCopy text={accountInstructionDetails.ociDomainID || ""} marginTop="6px" />
            </Box>
          </Stack>
          {accountInstructionDetails.ociBootstrapShellCommand ? (
            <Stack gap="8px">
              <Text size="small" weight="regular" color="#344054">
                Please open the {ociCloudShellLink} environment and execute the command below.
              </Text>
              <CommandBlock
                title="Run command"
                command={addQuotesToShellCommand(accountInstructionDetails.ociBootstrapShellCommand)}
                dataTestId="oci-bootstrap-command"
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
        Your account details are being configured. Please check back shortly for detailed setup instructions.
      </Text>
    );
  };

  const stackDeployedLabel = hasNebiusAccount ? "Nebius binding validated" : "Access granted and verified ";

  const stackInProgressLabel = hasAwsAccount
    ? "Waiting for you to create the CloudFormation stack above - we will verify the access automatically"
    : hasAzureAccount || hasGcpAccount || hasOciAccount
      ? "Waiting for you to run the command above - we will verify the access automatically"
      : hasNebiusAccount
        ? "Validating Nebius binding..."
        : "Deploying account bootstrap...";

  return (
    <CardWithTitle title="Grant Access">
      <Stack
        gap="20px"
        sx={{
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: "12px",
            bottom: "12px",
            left: "11px",
            width: "2px",
            bgcolor: "#E9EAEB",
            zIndex: 0,
          },
        }}
      >
        <ChecklistItem
          label="Account configurations added"
          isComplete={isSetupComplete}
          connectorColor={isSetupComplete ? "#079455" : "#E9EAEB"}
        />

        <ChecklistItem
          label={
            isFailed
              ? "This account configuration verification failed"
              : isRequestOrDataPending
                ? "Verifying Account configuration"
                : "Account configuration prechecks succeeded"
          }
          isComplete={isVerificationComplete && !isFailed}
          isInProgress={isRequestOrDataPending && !isVerificationComplete && !isFailed}
          isFailed={isFailed}
          connectorColor={isVerificationComplete && !isFailed ? "#079455" : "#E9EAEB"}
        >
          {renderVerificationInstructions()}
        </ChecklistItem>

        <ChecklistItem
          label={isVerificationComplete && !isStackDeployed && !isFailed ? stackInProgressLabel : stackDeployedLabel}
          isComplete={isStackDeployed}
          isInProgress={isStackDeploymentInProgress}
        />
      </Stack>
    </CardWithTitle>
  );
};

export default GrantAccessStep;

"use client";

import CloseIcon from "@mui/icons-material/Close";
import { Box, CircularProgress, Dialog, IconButton, Stack } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getResourceInstanceDetails } from "src/api/resourceInstance";
import Button from "src/components/Button/Button";
import { TextContainerToCopy } from "src/components/CloudProviderAccountOrgIdModal/CloudProviderAccountOrgIdModal";
import CopyToClipboardButton from "src/components/CopyClipboardButton/CopyClipboardButton";
import InstructionsModalIcon from "src/components/Icons/AccountConfig/InstructionsModalIcon";
import { Text } from "src/components/Typography/Typography";
import useInstallCommand from "src/hooks/useInstallCommand";
import { ServiceOffering } from "src/types/serviceOffering";
import { getResultParams } from "src/utils/instance";

type SetupPrivateClusterDialogProps = {
  open: boolean;
  onClose: () => void;
  /** The instance ID returned after creation */
  instanceId: string;
  /** Cluster name entered by the user */
  clusterName: string;
  /** Offering for the created instance (needed to poll details) */
  offering?: ServiceOffering;
  /** Subscription ID */
  subscriptionId?: string;
};

type PrivateClusterResultParams = {
  cluster_name?: string;
  byoc_onprem_install_command?: string;
};

const POLLING_INTERVAL_MS = 5000;
const MAX_POLLING_ATTEMPTS = 24;

const getHttpStatus = (error: unknown) => {
  if (!error || typeof error !== "object" || !("response" in error)) {
    return undefined;
  }

  const response = error.response;
  if (!response || typeof response !== "object" || !("status" in response)) {
    return undefined;
  }

  return typeof response.status === "number" ? response.status : undefined;
};

/**
 * SetupPrivateClusterDialog
 *
 * After a byoc-onprem cloud account instance is created, this dialog:
 * 1. Polls the instance for result_params.byoc_onprem_install_command
 * 2. While polling, shows a spinner
 * 3. Once available, shows the Kubernetes Cluster ID and the helm install command
 */
const SetupPrivateClusterDialog: React.FC<SetupPrivateClusterDialogProps> = ({
  open,
  onClose,
  instanceId,
  clusterName,
  offering,
  subscriptionId,
}) => {
  const { getActionProxyUrl } = useInstallCommand();
  const [isPolling, setIsPolling] = useState(true);
  const [pollingError, setPollingError] = useState<string | null>(null);
  const [resultParams, setResultParams] = useState<PrivateClusterResultParams | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingAttemptsRef = useRef(0);
  const serviceProviderId = offering?.serviceProviderId;
  const serviceURLKey = offering?.serviceURLKey;
  const serviceAPIVersion = offering?.serviceAPIVersion;
  const serviceEnvironmentURLKey = offering?.serviceEnvironmentURLKey;
  const serviceModelURLKey = offering?.serviceModelURLKey;
  const productTierURLKey = offering?.productTierURLKey;
  const selectedResourceURLKey = offering?.resourceParameters?.find((r) =>
    r.resourceId.startsWith("r-injectedaccountconfig")
  )?.urlKey;

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const pollForResultParams = useCallback(async () => {
    if (
      !instanceId ||
      !serviceProviderId ||
      !serviceURLKey ||
      !serviceAPIVersion ||
      !serviceEnvironmentURLKey ||
      !serviceModelURLKey ||
      !productTierURLKey
    ) {
      return;
    }

    if (!selectedResourceURLKey) {
      setPollingError("Unable to find the account configuration resource for this cluster.");
      setIsPolling(false);
      stopPolling();
      return;
    }

    pollingAttemptsRef.current += 1;

    try {
      const response = await getResourceInstanceDetails(
        serviceProviderId,
        serviceURLKey,
        serviceAPIVersion,
        serviceEnvironmentURLKey,
        serviceModelURLKey,
        productTierURLKey,
        selectedResourceURLKey,
        instanceId,
        subscriptionId
      );

      const instance = response.data;
      const params = getResultParams(instance);

      if (params?.byoc_onprem_install_command) {
        setResultParams(params);
        setIsPolling(false);
        stopPolling();
        return;
      }
    } catch (error) {
      if (getHttpStatus(error) === 404) {
        setPollingError(
          "Unable to find the cluster setup resource. The instance may have been deleted or is unavailable."
        );
        setIsPolling(false);
        stopPolling();
        return;
      }
    }

    if (pollingAttemptsRef.current >= MAX_POLLING_ATTEMPTS) {
      setPollingError("The cluster setup command is not ready yet. Close this dialog and try again in a few minutes.");
      setIsPolling(false);
      stopPolling();
    }
  }, [
    instanceId,
    serviceProviderId,
    serviceURLKey,
    serviceAPIVersion,
    serviceEnvironmentURLKey,
    serviceModelURLKey,
    productTierURLKey,
    selectedResourceURLKey,
    subscriptionId,
    stopPolling,
  ]);

  useEffect(() => {
    stopPolling();

    if (
      !open ||
      !instanceId ||
      !serviceProviderId ||
      !serviceURLKey ||
      !serviceAPIVersion ||
      !serviceEnvironmentURLKey ||
      !serviceModelURLKey ||
      !productTierURLKey
    ) {
      return;
    }

    setIsPolling(true);
    setPollingError(null);
    setResultParams(null);
    pollingAttemptsRef.current = 0;

    // Initial fetch
    pollForResultParams();

    // Poll every 5 seconds
    pollingIntervalRef.current = setInterval(pollForResultParams, POLLING_INTERVAL_MS);

    return stopPolling;
  }, [
    open,
    instanceId,
    serviceProviderId,
    serviceURLKey,
    serviceAPIVersion,
    serviceEnvironmentURLKey,
    serviceModelURLKey,
    productTierURLKey,
    pollForResultParams,
    stopPolling,
  ]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setResultParams(null);
      setPollingError(null);
      setIsPolling(true);
      pollingAttemptsRef.current = 0;
      stopPolling();
    }
  }, [open, stopPolling]);

  const displayClusterName = resultParams?.cluster_name || clusterName || "";
  const installCommand = resultParams?.byoc_onprem_install_command || "";
  const installCommandWithProxy = useMemo(() => {
    if (!installCommand) return "";

    const urlRegex = /https?:\/\/[^\s"']+/g;

    return installCommand.replace(urlRegex, (rawUrl) => {
      if (!rawUrl.includes("/account-setup/")) {
        return rawUrl;
      }
      const proxied = getActionProxyUrl(rawUrl, true);
      return proxied || rawUrl;
    });
  }, [installCommand, getActionProxyUrl]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          position: "fixed",
          top: 0,
          right: "50%",
          transform: "translateX(50%)",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "620px",
          width: "100%",
          boxShadow: "0px 8px 8px -4px rgba(16, 24, 40, 0.03), 0px 20px 24px -4px rgba(16, 24, 40, 0.08)",
          margin: 0,
        },
      }}
    >
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb="20px">
        <Stack direction="row" alignItems="center" gap="12px">
          <Box
            sx={{
              width: "48px",
              height: "48px",
              borderRadius: "10px",
              border: "1px solid #E4E7EC",
              boxShadow: "0px 1px 2px 0px #1018280D, 0px -2px 0px 0px #1018280D, 0px 0px 0px 1px #1018282E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <InstructionsModalIcon />
          </Box>
          <Text size="large" weight="semibold" color="#181D27">
            Connect Private Kubernetes Cluster
          </Text>
        </Stack>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" sx={{ color: "#98A2B3" }} />
        </IconButton>
      </Stack>

      {/* Content */}
      {pollingError ? (
        <Stack alignItems="center" justifyContent="center" sx={{ py: "60px" }} gap="12px">
          <Text size="small" weight="semibold" color="#B42318">
            Setup command unavailable
          </Text>
          <Text size="small" weight="regular" color="#535862" sx={{ textAlign: "center" }}>
            {pollingError}
          </Text>
        </Stack>
      ) : isPolling ? (
        <Stack alignItems="center" justifyContent="center" sx={{ py: "60px" }} gap="16px">
          <CircularProgress size={32} />
          <Text size="small" weight="medium" color="#535862">
            Setting up your cluster connection...
          </Text>
        </Stack>
      ) : (
        <Stack gap="20px">
          {/* Kubernetes Cluster ID */}
          <Box>
            <Text size="small" weight="medium" color="#414651" sx={{ mb: "6px" }}>
              Kubernetes Cluster Name
            </Text>

            <TextContainerToCopy text={displayClusterName} marginTop="6px" />
          </Box>

          {/* Deploy this chart */}
          <Box>
            <Text size="small" weight="semibold" color="#414651" sx={{ mb: "4px" }}>
              Run this command
            </Text>
            <Text size="small" weight="regular" color="#535862" sx={{ mb: "12px" }}>
              Run the command below from a terminal that has kubectl access to the Kubernetes cluster you want to
              connect
            </Text>
            <Box
              sx={{
                position: "relative",
                padding: "14px 16px",
                borderRadius: "8px",
                background: "#1B2559",
                overflow: "hidden",
              }}
            >
              <Text
                size="xsmall"
                weight="medium"
                sx={{
                  color: "#75E0A7",
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  pr: "40px",
                }}
              >
                {installCommandWithProxy}
              </Text>
              <Box
                sx={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                }}
              >
                <CopyToClipboardButton
                  text={installCommandWithProxy}
                  iconProps={{ color: "#CECFD2", width: "20px", height: "20px" }}
                />
              </Box>
            </Box>
            <Box
              sx={{
                mt: "16px",
                p: "16px",
                borderRadius: "8px",
                border: "1px solid #E9EAEB",
                background: "#F9FAFB",
              }}
            >
              <Text size="small" weight="semibold" color="#414651" sx={{ mb: "12px" }}>
                What happens next
              </Text>
              <Stack gap="10px">
                <Text size="small" weight="regular" color="#535862" sx={{ mb: "12px" }}>
                  The command installs the dataplane agent and registers this cluster with your account configuration.
                  After the installation completes successfully, registration can take up to 15 minutes to finish, and
                  the lifecycle status will change to Ready
                </Text>
              </Stack>
            </Box>
          </Box>
        </Stack>
      )}

      {/* Footer */}
      <Stack direction="row" justifyContent="flex-end" mt="24px">
        <Button variant="contained" onClick={onClose} data-testid="close-setup-cluster-dialog-button">
          Close
        </Button>
      </Stack>
    </Dialog>
  );
};

export default SetupPrivateClusterDialog;

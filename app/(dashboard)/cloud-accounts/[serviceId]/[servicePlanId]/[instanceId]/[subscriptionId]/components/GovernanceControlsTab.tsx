import { FC, useEffect, useId, useRef, useState } from "react";
import { Box, Dialog, Stack, useTheme } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";

import { $api } from "src/api/query";
import AlertText from "src/components/AlertText/AlertText";
import CommandBlock from "src/components/AwsCloudFormationInstructions/CommandBlock";
import Button from "src/components/Button/Button";
import Card from "src/components/Card/Card";
import ExternalArrowIcon from "src/components/Icons/ArrowExternal/ArrowExternal";
import CloseIcon from "src/components/Icons/Close/CloseIcon";
import DisconnectIcon from "src/components/Icons/Disconnect/Disconnect";
import FullscreenIcon from "src/components/Icons/Fullscreen/FullscreenIcon";
import InfoCircleTooltipIcon from "src/components/Icons/InfoCircleTooltip/InfoCircleTooltip";
import LoadingSpinner from "src/components/LoadingSpinner/LoadingSpinner";
import StatusChip from "src/components/StatusChip/StatusChip";
import Switch from "src/components/Switch/Switch";
import Tooltip from "src/components/Tooltip/Tooltip";
import { Text } from "src/components/Typography/Typography";
import useSnackbar from "src/hooks/useSnackbar";
import { useProviderOrgDetails } from "src/providers/ProviderOrgDetailsProvider";
import { colors } from "src/themeConfig";
import { AccountConfig, AccountGovernanceControls } from "src/types/account-config";
import {
  getAwsCloudFormationUpdateStackCommand,
  parseAwsCloudFormationQuickCreateUrl,
  parseAwsCloudFormationUpdateUrl,
} from "src/utils/accountConfig/awsCloudFormation";
import getSafeExternalURL from "src/utils/getSafeExternalURL";

const fields = ["connected", "debugAccessEnabled", "infrastructureMutationEnabled"] as const;
type GovernanceValues = Required<AccountGovernanceControls>;
type GovernanceSettingsFormProps = {
  account: AccountConfig;
  canUpdate: boolean;
  canUpdateAgentPermissions: boolean;
  cloudFormationCreateUrl?: string;
};
type GovernanceControlsTabProps = {
  accountConfigId: string;
  canUpdate: boolean;
  canUpdateAgentPermissions: boolean;
  cloudFormationCreateUrl?: string;
};

const validationSchema = Yup.object({
  connected: Yup.boolean().required(),
  debugAccessEnabled: Yup.boolean().required(),
  infrastructureMutationEnabled: Yup.boolean().required(),
});

type AccountConnectionConfirmationDialogProps = Pick<AccountConfig, "awsAccountID"> & {
  open: boolean;
  connected: boolean;
  hasUnsavedPermissionChanges: boolean;
  isLoading: boolean;
  disabledReason: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

const AccountConnectionConfirmationDialog: FC<AccountConnectionConfirmationDialogProps> = ({
  open,
  connected,
  awsAccountID,
  hasUnsavedPermissionChanges,
  isLoading,
  disabledReason,
  onClose,
  onConfirm,
}) => {
  const id = useId();
  const theme = useTheme();
  const { orgName } = useProviderOrgDetails();
  const providerName = orgName || "Your service provider";
  const title = connected ? "Connect Account" : "Disconnect Account";
  const loadingReason = isLoading ? "Account settings are being saved." : "";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby={`${id}-heading`}
      aria-describedby={`${id}-description`}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: "12px", boxSizing: "border-box" } }}
    >
      <Stack direction="row" alignItems="center" gap="16px" px="24px" pt="24px" pb={connected ? "12px" : "20px"}>
        {!connected && <DisconnectIcon color={colors.error700} width="24" height="24" aria-hidden />}
        <Text component="h2" id={`${id}-heading`} size="large" weight="semibold" color={colors.gray900} flex={1}>
          {connected ? "Connect AWS Account?" : "Disconnect AWS Account?"}
        </Text>
        {!connected && (
          <Button
            type="button"
            variant="text"
            aria-label="Close disconnect confirmation"
            disabled={isLoading}
            disabledMessage={loadingReason}
            onClick={onClose}
            sx={{ p: "4px" }}
          >
            <CloseIcon color={colors.gray400} aria-hidden />
          </Button>
        )}
      </Stack>

      <Stack id={`${id}-description`} gap="12px" px="24px" pb="16px" minHeight={0} sx={{ overflowY: "auto" }}>
        <Text weight="regular" color={colors.gray700}>
          {providerName} will {connected ? "" : "no longer "}be able to manage{" "}
          {awsAccountID ? "AWS account " : "this AWS account"}
          {!!awsAccountID && (
            <Text component="span" weight="bold" color={colors.gray700}>
              {awsAccountID}
            </Text>
          )}
          {" and its workloads after you apply this change in AWS."}
        </Text>
        <Text weight="regular" color={colors.gray500}>
          After confirming, run the AWS command to complete the {connected ? "connection" : "disconnect"}.
        </Text>
        {!!hasUnsavedPermissionChanges && (
          <Text weight="regular" color={colors.gray500}>
            Your unsaved permission changes will also be saved.
          </Text>
        )}
      </Stack>

      <Stack
        direction="row"
        justifyContent="flex-end"
        gap={connected ? "8px" : "16px"}
        px="24px"
        pt={connected ? 0 : "12px"}
        pb="24px"
      >
        <Button
          type="button"
          variant="outlined"
          disabled={isLoading}
          disabledMessage={loadingReason}
          onClick={onClose}
          autoFocus
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant={connected ? "contained" : "outlined"}
          bgColor={connected ? theme.palette.primary.main : undefined}
          outlineColor={connected ? undefined : colors.error300}
          fontColor={connected ? colors.white : colors.error700}
          disabled={!!disabledReason || isLoading}
          disabledMessage={disabledReason || loadingReason}
          isLoading={isLoading}
          onClick={onConfirm}
        >
          {title}
        </Button>
      </Stack>
    </Dialog>
  );
};

const GovernanceSettingsForm: FC<GovernanceSettingsFormProps> = ({
  account,
  canUpdate,
  canUpdateAgentPermissions,
  cloudFormationCreateUrl,
}) => {
  const theme = useTheme();
  const id = useId();
  const snackbar = useSnackbar();
  const { orgName } = useProviderOrgDetails();
  const providerName = orgName || "Your service provider";
  const providerPossessive = orgName ? `${orgName}${/s$/i.test(orgName) ? "’" : "’s"}` : "your service provider’s";
  const queryClient = useQueryClient();
  const [connectionAction, setConnectionAction] = useState<"connect" | "disconnect">("disconnect");
  const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false);
  const [pendingUpdateDismissed, setPendingUpdateDismissed] = useState(false);
  const [isCommandExpanded, setIsCommandExpanded] = useState(false);
  const commandContainer = useRef<HTMLDivElement | null>(null);
  const expandCommandButton = useRef<HTMLButtonElement | null>(null);
  const commandId = `${id}-command`;
  const connectionRequestInFlight = useRef(false);
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsCommandExpanded(document.fullscreenElement === commandContainer.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);
  const toggleCommandSize = async () => {
    const container = commandContainer.current;
    if (!container) return;
    try {
      if (document.fullscreenElement === container) {
        await document.exitFullscreen();
        expandCommandButton.current?.focus();
      } else {
        await container.requestFullscreen();
      }
    } catch {
      snackbar.showError("Unable to resize the command view. Please try again.");
    }
  };
  const requested = account.requestedSettings?.accountGovernanceControls;
  const appliedControls = account.appliedSettings?.accountGovernanceControls;
  const applied: GovernanceValues = {
    connected: appliedControls?.connected ?? true,
    debugAccessEnabled: appliedControls?.debugAccessEnabled ?? false,
    infrastructureMutationEnabled: appliedControls?.infrastructureMutationEnabled ?? true,
  };
  const initialValues: GovernanceValues = {
    connected: requested?.connected ?? applied.connected,
    debugAccessEnabled: requested?.debugAccessEnabled ?? applied.debugAccessEnabled,
    infrastructureMutationEnabled: requested?.infrastructureMutationEnabled ?? applied.infrastructureMutationEnabled,
  };
  const getSaveValues = (values: GovernanceValues): GovernanceValues => ({
    ...values,
    ...(!canUpdateAgentPermissions && {
      debugAccessEnabled: initialValues.debugAccessEnabled,
      infrastructureMutationEnabled: initialValues.infrastructureMutationEnabled,
    }),
  });
  const update = $api.useMutation("put", "/2022-09-01-00/accountconfig/{id}", {
    onSuccess: async (_data, variables) => {
      const restoresAppliedSettings = fields.every(
        (field) => variables.body.settings?.accountGovernanceControls?.[field] === applied[field]
      );
      await queryClient.invalidateQueries({ queryKey: ["get", "/2022-09-01-00/accountconfig/{id}"] });
      setPendingUpdateDismissed(restoresAppliedSettings);
      snackbar.showSuccess(
        restoresAppliedSettings
          ? "Previous account settings restored."
          : "Account settings saved. Apply your changes in AWS."
      );
    },
    onError: () => snackbar.showError("Unable to save account settings. Please try again later."),
  });
  const form = useFormik<GovernanceValues>({
    initialValues,
    enableReinitialize: true,
    validationSchema,
    onSubmit: (values) => {
      const savedValues = getSaveValues(values);
      if (!canUpdate || update.isPending || fields.every((field) => savedValues[field] === initialValues[field]))
        return;
      update.mutate({
        params: { path: { id: account.id } },
        headers: { "x-ignore-global-error": true },
        body: { settings: { accountGovernanceControls: savedValues } },
      });
    },
  });
  const effectiveValues = getSaveValues(form.values);
  const unsaved = fields.filter((field) => effectiveValues[field] !== initialValues[field]).length;
  const effectiveFields = initialValues.connected ? fields : (["connected"] as const);
  const needsApply =
    effectiveFields.some((field) => applied[field] !== initialValues[field]) || account.status === "PENDING_UPDATE";
  const isVerifying =
    account.status === "PENDING_UPDATE" && effectiveFields.every((field) => applied[field] === initialValues[field]);
  const showPendingUpdate = needsApply && !(isVerifying && pendingUpdateDismissed);
  const pendingConnectionChange = applied.connected !== initialValues.connected;
  const discardValues = getSaveValues(applied);
  const canDiscardPending =
    needsApply && !isVerifying && fields.some((field) => discardValues[field] !== initialValues[field]);
  const canEditAgentPermissions =
    canUpdateAgentPermissions &&
    (applied?.connected === true || (applied?.connected === false && needsApply && initialValues.connected));
  const updateURL = getSafeExternalURL(account.awsCloudFormationUpdateURL);
  const stack =
    parseAwsCloudFormationUpdateUrl(updateURL) ??
    parseAwsCloudFormationQuickCreateUrl(getSafeExternalURL(cloudFormationCreateUrl ?? updateURL));
  const updateCommand = getAwsCloudFormationUpdateStackCommand(updateURL, cloudFormationCreateUrl, [
    { key: "AccountAction", value: initialValues.connected ? "Connect" : "Disconnect" },
    { key: "AgentInfrastructureMutationEnabled", value: String(initialValues.infrastructureMutationEnabled) },
    { key: "K8sDebugAccessEnabled", value: String(initialValues.debugAccessEnabled) },
  ]);
  const cloudShellURL = updateCommand ? "https://console.aws.amazon.com/cloudshell/home" : "";
  const awsDetails = [
    account.awsAccountID ? `AWS account ${account.awsAccountID}` : "",
    stack ? `Stack ${stack.stackName}` : "",
    stack?.region,
  ]
    .filter(Boolean)
    .join(" · ");
  const disabledReason = !canUpdate
    ? "You do not have permission to update this cloud account."
    : update.isPending
      ? "Account settings are being saved."
      : "";
  const discardDisabledReason =
    disabledReason ||
    (!unsaved && !canDiscardPending
      ? isVerifying
        ? "Wait for the account settings to refresh."
        : "No changes to discard."
      : "");
  const discardChanges = () => {
    if (discardDisabledReason) return;
    if (unsaved) {
      form.resetForm();
      return;
    }
    update.mutate({
      params: { path: { id: account.id } },
      headers: { "x-ignore-global-error": true },
      body: { settings: { accountGovernanceControls: discardValues } },
    });
  };
  const confirmConnectionChange = async () => {
    if (!isConnectionDialogOpen || disabledReason || connectionRequestInFlight.current) return;
    connectionRequestInFlight.current = true;
    try {
      await update.mutateAsync({
        params: { path: { id: account.id } },
        headers: { "x-ignore-global-error": true },
        body: {
          settings: { accountGovernanceControls: { ...effectiveValues, connected: connectionAction === "connect" } },
        },
      });
      setIsConnectionDialogOpen(false);
    } catch {
      return;
    } finally {
      connectionRequestInFlight.current = false;
    }
  };
  const applyDisabledReason =
    disabledReason ||
    (unsaved
      ? "Save or discard your edits before opening AWS CloudShell."
      : isVerifying
        ? "Wait for the account settings to refresh."
        : !cloudShellURL
          ? "The AWS update command is not available yet. Please try again later."
          : "");
  const copyDisabledReason =
    disabledReason ||
    (unsaved
      ? "Save or discard your edits before copying the AWS command."
      : isVerifying
        ? "Wait for the account settings to refresh."
        : !updateCommand
          ? "The AWS update command is not available yet. Please try again later."
          : "");
  const sections = [
    {
      field: "connected" as const,
      label: `Account Access for ${providerName}`,
      description: `Allow ${providerName} to manage this AWS account and its workloads.`,
      warning: `Without access, ${providerName} can’t manage workloads in this account.`,
      pendingDetail: `Access stays ${applied.connected ? "enabled" : "disabled"} until you apply this change in AWS.`,
    },
    {
      field: "debugAccessEnabled" as const,
      label: "Allow Support Debug Access",
      description: `Allow ${providerName} to access your Kubernetes API for support and troubleshooting.`,
      warning: "Disabling support debug access may require you to provide access manually for troubleshooting.",
      pendingDetail: `Support debug access stays ${applied.debugAccessEnabled ? "enabled" : "disabled"} until you apply this change in AWS.`,
    },
    {
      field: "infrastructureMutationEnabled" as const,
      label: "Allow AWS Infrastructure Changes",
      description: `Allow ${providerName} to create, update, and delete AWS resources for your workloads.`,
      warning: `${providerName} can’t complete workload operations that require AWS changes while this is disabled.`,
      pendingDetail: applied.infrastructureMutationEnabled
        ? "The agent can still change AWS resources until you apply this change in AWS."
        : "AWS permissions stay read-only until you apply this change in AWS.",
    },
  ];

  return (
    <Stack component="form" onSubmit={form.handleSubmit} aria-labelledby={`${id}-heading`}>
      <Stack gap="6px" mb={{ xs: "24px", md: "28px" }}>
        <Stack direction="row" gap="12px" alignItems="center" flexWrap="wrap">
          <Text size="large" weight="semibold" color={colors.gray900} component="h2" id={`${id}-heading`}>
            Governance Controls
          </Text>
        </Stack>
        <Text weight="regular" color={colors.gray500}>
          Control access and permissions for {providerName} in this AWS account.
        </Text>
      </Stack>

      {!!showPendingUpdate && (
        <Card
          role="status"
          aria-label={isVerifying ? "Refreshing account settings" : "AWS update required"}
          mb={{ xs: "24px", md: "28px" }}
          py={{ xs: "16px", md: "18px" }}
          px={{ xs: "16px", md: "20px" }}
          sx={{ bgcolor: colors.white, borderColor: colors.warning200, boxShadow: "none", borderRadius: "8px" }}
        >
          <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} gap="16px">
            <Stack flex={1} minWidth={0}>
              <Text weight="semibold" color={colors.gray900}>
                Pending AWS Update
              </Text>
              {!!updateCommand && (
                <Text weight="regular" color={colors.gray700} sx={{ mt: "4px" }}>
                  Copy the command below, then paste and run it in AWS CloudShell or your terminal to apply your saved
                  access changes.
                </Text>
              )}
              <Text weight="regular" color={colors.gray500} sx={{ mt: "6px" }}>
                The account status refreshes automatically once those changes are applied in AWS.
              </Text>
              <Text size="xsmall" weight="regular" color={colors.gray500} sx={{ mt: "8px" }}>
                {awsDetails}
              </Text>
            </Stack>
            <Button
              variant="outlined"
              href={!applyDisabledReason ? cloudShellURL : undefined}
              target="_blank"
              rel="noopener noreferrer"
              disabled={!!applyDisabledReason}
              disabledMessage={applyDisabledReason}
              endIcon={<ExternalArrowIcon color="currentColor" aria-hidden />}
            >
              Open AWS CloudShell
            </Button>
          </Stack>
          <Stack mt="12px" minWidth={0}>
            {updateCommand ? (
              <Box
                ref={commandContainer}
                id={commandId}
                role="region"
                aria-label="AWS update command"
                onKeyDown={(event) => {
                  if (isCommandExpanded && event.key === "Escape") {
                    event.preventDefault();
                    void toggleCommandSize();
                  }
                }}
                sx={{
                  minWidth: 0,
                  position: "relative",
                  "& > fieldset > div:first-of-type > div:first-of-type": { pr: "64px" },
                  "&:fullscreen": { width: "100%", height: "100%", bgcolor: colors.gray900 },
                  "&:fullscreen > fieldset": { height: "100%" },
                  "&:fullscreen > fieldset > div:first-of-type": { height: "100%", borderRadius: 0 },
                }}
              >
                <Box
                  component="fieldset"
                  disabled={!!copyDisabledReason}
                  sx={{
                    m: 0,
                    p: 0,
                    border: 0,
                    minWidth: 0,
                    ...(copyDisabledReason && {
                      "& .MuiIconButton-root": { opacity: 0.38, pointerEvents: "none" },
                    }),
                  }}
                >
                  <CommandBlock
                    title="AWS Command"
                    command={updateCommand}
                    fixedHeight={isCommandExpanded}
                    dataTestId="aws-governance-update-command"
                    copyDisabledReason={copyDisabledReason}
                  />
                </Box>
                <Tooltip title={isCommandExpanded ? "Minimize" : "Open Fullscreen"}>
                  <Button
                    ref={expandCommandButton}
                    type="button"
                    variant="outlined"
                    aria-label={isCommandExpanded ? "Minimize" : "Open Fullscreen"}
                    aria-pressed={isCommandExpanded}
                    onClick={() => void toggleCommandSize()}
                    fontColor={colors.gray300}
                    outlineBg={colors.gray900}
                    outlineColor={colors.gray700}
                    sx={{
                      position: "absolute",
                      top: "12px",
                      right: "16px",
                      width: "32px",
                      height: "32px",
                      p: "6px",
                      borderRadius: "6px",
                      boxShadow: "none",
                      "&:hover": { bgcolor: colors.gray800 },
                      "& svg path": { stroke: "currentColor" },
                    }}
                  >
                    <FullscreenIcon minimize={isCommandExpanded} />
                  </Button>
                </Tooltip>
              </Box>
            ) : (
              <Text size="xsmall" weight="regular" color={colors.gray500} role="status">
                The AWS command is not available yet.
              </Text>
            )}
          </Stack>
        </Card>
      )}

      <Card
        role="region"
        aria-labelledby={`${id}-access-heading`}
        py={{ xs: "16px", md: "18px" }}
        px={{ xs: "16px", md: "20px" }}
        sx={{ borderColor: colors.gray200, boxShadow: "none", borderRadius: "8px" }}
      >
        {sections.map((section) => {
          const field = section.field;
          const permissionLocked = field !== "connected" && !canEditAgentPermissions;
          const permissionReason = !canUpdateAgentPermissions
            ? "Only root and admin can change support debug access and AWS infrastructure permissions."
            : typeof applied?.connected !== "boolean"
              ? "Account access has not yet been verified. Please try again later."
              : effectiveValues.connected
                ? `Save your request to enable ${providerPossessive} access before changing agent permissions.`
                : "Connect this account to change its permissions.";
          const fieldDisabledReason = disabledReason || (permissionLocked ? permissionReason : "");
          const pending =
            needsApply && typeof applied?.[field] === "boolean" && applied[field] !== initialValues[field];
          const changed = effectiveValues[field] !== initialValues[field];
          const pendingDetail =
            section.pendingDetail + (changed ? " You also have an unsaved change to this setting." : "");
          const warning =
            !isVerifying &&
            applied?.[field] === true &&
            initialValues[field] &&
            !effectiveValues[field] &&
            !fieldDisabledReason;
          const selection = `${changed ? "Unsaved: " : pending ? "Requested: " : ""}${effectiveValues[field] ? "Enabled" : "Disabled"}`;
          const descriptionId = `${id}-${field}-description`;
          const selectionId = `${id}-${field}-selection`;
          const pendingId = `${id}-${field}-pending`;
          const warningId = `${id}-${field}-warning`;
          const lockId = `${id}-${field}-lock`;
          return (
            <Box
              key={field}
              mt={field === "debugAccessEnabled" ? "20px" : undefined}
              pt={field === "debugAccessEnabled" ? "20px" : undefined}
              borderTop={field === "debugAccessEnabled" ? `1px solid ${colors.gray200}` : undefined}
            >
              {field === "debugAccessEnabled" && (
                <Text component="h4" size="small" color={colors.gray500} pl={{ xs: "12px", md: "24px" }}>
                  Support and Infrastructure Permissions
                </Text>
              )}
              <Box
                display="grid"
                gridTemplateColumns={{
                  xs: field === "connected" ? "minmax(0, 1fr)" : "minmax(0, 1fr) auto",
                  md: "minmax(0, 1fr) auto",
                }}
                gap={{ xs: "16px", md: "24px" }}
                alignItems="center"
                ml={field !== "connected" ? { xs: "12px", md: "24px" } : undefined}
                pt={field !== "connected" ? "18px" : undefined}
                pb={field === "debugAccessEnabled" ? "18px" : undefined}
                borderBottom={field === "debugAccessEnabled" ? `1px solid ${colors.gray200}` : undefined}
              >
                <Stack gap="5px" minWidth={0}>
                  <Stack direction="row" alignItems="center" flexWrap="wrap" gap="8px">
                    <Text
                      component={field === "connected" ? "h3" : "h4"}
                      id={field === "connected" ? `${id}-access-heading` : undefined}
                      size={field === "connected" ? "medium" : "small"}
                      color={colors.gray900}
                    >
                      {section.label}
                    </Text>
                    {!!pending && (
                      <Stack direction="row" alignItems="center" gap="4px">
                        <Tooltip title={pendingDetail} describeChild>
                          <Button
                            type="button"
                            variant="text"
                            aria-label={`AWS setting details: ${section.label}`}
                            fontColor={colors.gray500}
                            sx={{ "&.MuiButton-sizeMedium": { p: "3px" } }}
                          >
                            <InfoCircleTooltipIcon color={colors.gray500} aria-hidden />
                          </Button>
                        </Tooltip>
                        <StatusChip category="pending" label="Pending AWS update" />
                      </Stack>
                    )}
                  </Stack>
                  <Text id={descriptionId} weight="regular" color={colors.gray500} maxWidth="680px">
                    {section.description}
                  </Text>
                  {!!pending && (
                    <Box component="span" id={pendingId} hidden>
                      {pendingDetail}
                    </Box>
                  )}
                  {!!warning && (
                    <Box id={warningId} mt="8px">
                      <AlertText
                        containerStyles={{
                          m: 0,
                          p: 0,
                          border: 0,
                          borderRadius: 0,
                          bgcolor: "transparent",
                          alignItems: "flex-start",
                          "& > svg": { width: 20, height: 20 },
                        }}
                        textStyles={{ color: colors.gray700 }}
                      >
                        {section.warning}
                      </AlertText>
                    </Box>
                  )}
                  {!!fieldDisabledReason && (
                    <Box component="span" id={lockId} hidden>
                      {fieldDisabledReason}
                    </Box>
                  )}
                </Stack>
                <Stack alignItems="flex-end" gap="8px" minWidth={0}>
                  <Tooltip title={field === "connected" ? "" : fieldDisabledReason} describeChild>
                    <Box
                      component="span"
                      tabIndex={fieldDisabledReason ? 0 : undefined}
                      role={fieldDisabledReason ? "group" : undefined}
                      aria-label={fieldDisabledReason ? `${section.label} unavailable` : undefined}
                      aria-disabled={!!fieldDisabledReason || undefined}
                      aria-describedby={fieldDisabledReason ? lockId : undefined}
                      sx={{ display: "inline-flex", "& .Mui-disabled": { pointerEvents: "none" } }}
                    >
                      {field === "connected" ? (
                        !pendingConnectionChange && (
                          <Button
                            type="button"
                            variant={form.values.connected ? "outlined" : "contained"}
                            outlineColor={form.values.connected ? colors.error300 : undefined}
                            bgColor={form.values.connected ? undefined : theme.palette.primary.main}
                            fontColor={form.values.connected ? colors.error700 : colors.white}
                            aria-haspopup={form.values.connected ? "dialog" : undefined}
                            disabled={!!fieldDisabledReason}
                            disabledMessage={fieldDisabledReason}
                            aria-describedby={[
                              descriptionId,
                              selectionId,
                              pending ? pendingId : "",
                              warning ? warningId : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            onClick={() => {
                              if (!fieldDisabledReason) {
                                if (form.values.connected) {
                                  setConnectionAction("disconnect");
                                  setIsConnectionDialogOpen(true);
                                } else {
                                  update.mutate({
                                    params: { path: { id: account.id } },
                                    headers: { "x-ignore-global-error": true },
                                    body: {
                                      settings: { accountGovernanceControls: { ...effectiveValues, connected: true } },
                                    },
                                  });
                                }
                              }
                            }}
                          >
                            {form.values.connected ? "Disconnect Account" : "Connect Account"}
                          </Button>
                        )
                      ) : (
                        <Switch
                          checked={effectiveValues[field]}
                          disabled={!!fieldDisabledReason}
                          inputProps={{
                            role: "switch",
                            "aria-label": section.label,
                            "aria-describedby": [
                              descriptionId,
                              selectionId,
                              pending ? pendingId : "",
                              warning ? warningId : "",
                              fieldDisabledReason ? lockId : "",
                            ]
                              .filter(Boolean)
                              .join(" "),
                          }}
                          onChange={(_, checked: boolean) => {
                            if (!fieldDisabledReason) void form.setFieldValue(field, checked);
                          }}
                          sx={{
                            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                              backgroundColor: theme.palette.primary.main,
                            },
                            "& .MuiSwitch-switchBase.Mui-focusVisible .MuiSwitch-thumb": {
                              color: theme.palette.primary.main,
                            },
                          }}
                        />
                      )}
                    </Box>
                  </Tooltip>
                  <Text id={selectionId} size="xsmall" weight="regular" color={colors.gray600} hidden>
                    {selection}
                  </Text>
                </Stack>
              </Box>
            </Box>
          );
        })}
      </Card>

      <Stack
        component="footer"
        direction={{ xs: "column", md: "row" }}
        alignItems={{ md: "center" }}
        gap="20px"
        py="18px"
        borderBottom={`1px solid ${colors.gray200}`}
      >
        <Stack gap="6px" flex={1} minWidth={0}>
          <Box px="10px" py="6px" borderRadius="6px" bgcolor={colors.lightBlue50} alignSelf="flex-start">
            <Text weight="regular" color={colors.blue600}>
              Save your permission changes here, then run the command in AWS to apply them.
            </Text>
          </Box>
        </Stack>
        <Stack direction="row" justifyContent="flex-end" gap="10px" flexShrink={0}>
          <Button
            variant="outlined"
            size="small"
            disabled={!!discardDisabledReason}
            disabledMessage={discardDisabledReason}
            onClick={discardChanges}
          >
            Discard
          </Button>
          <Button
            type="submit"
            variant="contained"
            size="small"
            bgColor={theme.palette.primary.main}
            isLoading={update.isPending}
            disabled={!!disabledReason || !unsaved}
            disabledMessage={disabledReason || "No changes to save."}
          >
            Save Changes
          </Button>
        </Stack>
      </Stack>

      <AccountConnectionConfirmationDialog
        open={isConnectionDialogOpen}
        onClose={() => {
          if (!update.isPending) setIsConnectionDialogOpen(false);
        }}
        connected={connectionAction === "connect"}
        awsAccountID={account.awsAccountID}
        hasUnsavedPermissionChanges={!!unsaved}
        isLoading={update.isPending}
        disabledReason={disabledReason}
        onConfirm={confirmConnectionChange}
      />
    </Stack>
  );
};

const GovernanceControlsTab: FC<GovernanceControlsTabProps> = ({
  accountConfigId,
  canUpdate,
  canUpdateAgentPermissions,
  cloudFormationCreateUrl,
}) => {
  const query = $api.useQuery(
    "get",
    "/2022-09-01-00/accountconfig/{id}",
    {
      params: { path: { id: accountConfigId } },
      headers: { "x-ignore-global-error": true },
    },
    { enabled: !!accountConfigId, refetchInterval: 10000, refetchOnWindowFocus: true }
  );
  if (accountConfigId && query.isPending) return <LoadingSpinner />;
  return (
    <Box mt="32px">
      {query.data ? (
        <GovernanceSettingsForm
          account={query.data}
          canUpdate={canUpdate}
          canUpdateAgentPermissions={canUpdateAgentPermissions}
          cloudFormationCreateUrl={cloudFormationCreateUrl}
        />
      ) : (
        <Text weight="regular" color={colors.gray600}>
          Account settings are unavailable. Please try again later.
        </Text>
      )}
    </Box>
  );
};

export default GovernanceControlsTab;

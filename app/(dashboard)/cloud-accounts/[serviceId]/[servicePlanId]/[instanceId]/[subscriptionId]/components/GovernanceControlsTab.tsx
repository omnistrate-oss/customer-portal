import { FC, useId, useRef, useState } from "react";
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
import ConnectIcon from "src/components/Icons/Connect/Connect";
import DisconnectIcon from "src/components/Icons/Disconnect/Disconnect";
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
  parseAwsCloudFormationUpdateUrl,
} from "src/utils/accountConfig/awsCloudFormation";
import getSafeExternalURL from "src/utils/getSafeExternalURL";

const fields = ["connected", "debugAccessEnabled", "infrastructureMutationEnabled"] as const;
type GovernanceValues = Required<AccountGovernanceControls>;
type GovernanceSettingsFormProps = { account: AccountConfig; canUpdate: boolean; cloudFormationUrl?: string };
type GovernanceControlsTabProps = { accountConfigId: string; canUpdate: boolean; cloudFormationUrl?: string };

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
      PaperProps={{
        sx: {
          width: connected ? "min(600px, calc(100vw - 64px))" : "min(588px, calc(100vw - 48px))",
          maxWidth: "none",
          maxHeight: connected ? "calc(100% - 64px)" : "calc(100% - 48px)",
          m: connected ? "32px" : "24px",
          p: "24px",
          borderRadius: "12px",
          boxSizing: "border-box",
        },
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" position="relative" mb="20px">
        <Stack direction="row" alignItems="center" gap="16px" minWidth={0} pr={connected ? "40px" : undefined}>
          {connected ? (
            <ConnectIcon color={theme.palette.primary.main} aria-hidden />
          ) : (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              width="56px"
              height="56px"
              flexShrink={0}
              borderRadius="50%"
              border={`8px solid ${colors.error50}`}
              bgcolor={colors.error200}
              boxSizing="border-box"
            >
              <DisconnectIcon width={24} height={24} color={colors.error700} aria-hidden />
            </Box>
          )}
          <Text
            component="h2"
            id={`${id}-heading`}
            size="large"
            weight={connected ? "semibold" : "bold"}
            color={colors.gray900}
          >
            {title}
          </Text>
        </Stack>
        <Button
          type="button"
          variant="text"
          fontColor={colors.gray500}
          aria-label={`Close ${title.toLowerCase()} dialog`}
          disabled={isLoading}
          disabledMessage={loadingReason}
          onClick={onClose}
          sx={{
            "&.MuiButton-sizeMedium": { p: "8px", minWidth: "auto" },
            ...(connected ? { position: "absolute", top: "-8px", right: "-8px" } : { alignSelf: "flex-start" }),
          }}
        >
          <CloseIcon color="currentColor" aria-hidden />
        </Button>
      </Stack>

      <Stack id={`${id}-description`} gap="12px" minHeight={0} sx={{ overflowY: "auto" }}>
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
        gap={connected ? "20px" : "16px"}
        mt={connected ? "28px" : "24px"}
      >
        <Button
          type="button"
          variant="outlined"
          disabled={isLoading}
          disabledMessage={loadingReason}
          onClick={onClose}
          sx={!connected ? { height: "40px", px: "14px" } : undefined}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="contained"
          bgColor={connected ? theme.palette.primary.main : colors.error700}
          disabled={!!disabledReason || isLoading}
          disabledMessage={disabledReason || loadingReason}
          isLoading={isLoading}
          onClick={onConfirm}
          sx={!connected ? { height: "40px", px: "14px" } : undefined}
        >
          {title}
        </Button>
      </Stack>
    </Dialog>
  );
};

const GovernanceSettingsForm: FC<GovernanceSettingsFormProps> = ({ account, canUpdate }) => {
  const theme = useTheme();
  const id = useId();
  const snackbar = useSnackbar();
  const { orgName } = useProviderOrgDetails();
  const providerName = orgName || "Your service provider";
  const providerPossessive = orgName ? `${orgName}${/s$/i.test(orgName) ? "’" : "’s"}` : "your service provider’s";
  const queryClient = useQueryClient();
  const [connectionAction, setConnectionAction] = useState<"connect" | "disconnect">("disconnect");
  const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false);
  const connectionRequestInFlight = useRef(false);
  const requested = account.requestedSettings?.accountGovernanceControls;
  const applied = account.appliedSettings?.accountGovernanceControls;
  const initialValues: GovernanceValues = {
    connected: requested?.connected ?? applied?.connected ?? true,
    debugAccessEnabled: requested?.debugAccessEnabled ?? applied?.debugAccessEnabled ?? false,
    infrastructureMutationEnabled:
      requested?.infrastructureMutationEnabled ?? applied?.infrastructureMutationEnabled ?? true,
  };
  const update = $api.useMutation("put", "/2022-09-01-00/accountconfig/{id}", {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["get", "/2022-09-01-00/accountconfig/{id}"] });
      snackbar.showSuccess("Account settings saved. Apply your changes in AWS.");
    },
    onError: () => snackbar.showError("Unable to save account settings. Please try again later."),
  });
  const form = useFormik<GovernanceValues>({
    initialValues,
    enableReinitialize: true,
    validationSchema,
    onSubmit: (values) => {
      if (!canUpdate || update.isPending || fields.every((field) => values[field] === initialValues[field])) return;
      update.mutate({
        params: { path: { id: account.id } },
        headers: { "x-ignore-global-error": true },
        body: { settings: { accountGovernanceControls: values } },
      });
    },
  });
  const unsaved = fields.filter((field) => form.values[field] !== initialValues[field]).length;
  const effectiveFields = initialValues.connected ? fields : (["connected"] as const);
  const appliedKnown = effectiveFields.every((field) => typeof applied?.[field] === "boolean");
  const needsApply =
    effectiveFields.some((field) => typeof applied?.[field] === "boolean" && applied[field] !== initialValues[field]) ||
    account.status === "PENDING_UPDATE";
  const isVerifying =
    account.status === "PENDING_UPDATE" &&
    appliedKnown &&
    effectiveFields.every((field) => applied?.[field] === initialValues[field]);
  const canEditAgentPermissions =
    applied?.connected === true || (applied?.connected === false && needsApply && initialValues.connected);
  const updateURL = getSafeExternalURL(account.awsCloudFormationUpdateURL);
  const stack = parseAwsCloudFormationUpdateUrl(updateURL);
  const updateCommand = getAwsCloudFormationUpdateStackCommand(updateURL, initialValues);
  const cloudShellURL = stack ? getSafeExternalURL(`https://console.aws.amazon.com/cloudshell/home`) : "";
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
  const confirmConnectionChange = async () => {
    if (!isConnectionDialogOpen || disabledReason || connectionRequestInFlight.current) return;
    connectionRequestInFlight.current = true;
    try {
      await update.mutateAsync({
        params: { path: { id: account.id } },
        headers: { "x-ignore-global-error": true },
        body: {
          settings: { accountGovernanceControls: { ...form.values, connected: connectionAction === "connect" } },
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
      pendingDetail: `Access stays ${applied?.connected ? "enabled" : "disabled"} until you apply this change in AWS.`,
    },
    {
      field: "debugAccessEnabled" as const,
      label: "Allow Support Debug Access",
      description: `Allow ${providerName} to access your Kubernetes API for support and troubleshooting.`,
      warning: "Disabling support debug access may require you to provide access manually for troubleshooting.",
      pendingDetail: `Support debug access stays ${applied?.debugAccessEnabled ? "enabled" : "disabled"} until you apply this change in AWS.`,
    },
    {
      field: "infrastructureMutationEnabled" as const,
      label: "Allow AWS Infrastructure Changes",
      description: `Allow ${providerName} to create, update, and delete AWS resources for your workloads.`,
      warning: `${providerName} can’t complete workload operations that require AWS changes while this is disabled.`,
      pendingDetail: applied?.infrastructureMutationEnabled
        ? "The agent can still change AWS resources until you apply this change in AWS."
        : "AWS permissions stay read-only until you apply this change in AWS.",
    },
  ];

  return (
    <Stack component="form" onSubmit={form.handleSubmit} aria-labelledby={`${id}-heading`}>
      <Stack gap="6px" mb="24px">
        <Stack direction="row" gap="12px" alignItems="center" flexWrap="wrap">
          <Text size="large" weight="semibold" color={colors.gray900} component="h2" id={`${id}-heading`}>
            Governance Controls
          </Text>
        </Stack>
        <Text weight="regular" color={colors.gray500}>
          Control access and permissions for {providerName} in this AWS account.
        </Text>
      </Stack>

      {!!needsApply && (
        <Card
          role="status"
          aria-label={isVerifying ? "Refreshing account settings" : "AWS update required"}
          mb="24px"
          p={{ xs: "14px", md: "18px" }}
          sx={{ bgcolor: colors.white, borderColor: colors.warning200, boxShadow: "none", borderRadius: "8px" }}
        >
          <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} gap="16px">
            <Stack gap="6px" flex={1} minWidth={0}>
              <Text color={colors.gray900}>{isVerifying ? "Updating account settings" : "Pending AWS Update"}</Text>
              <Text weight="regular" color={colors.gray700}>
                {isVerifying
                  ? "The AWS update is complete. We’re updating the account status automatically."
                  : "Copy the command below, then paste and run it in AWS CloudShell or a Bash terminal authenticated to this AWS account to apply your saved access changes."}
              </Text>
              {!isVerifying && (
                <Text weight="regular" color={colors.gray500}>
                  The account status refreshes automatically once those changes are applied in AWS.
                </Text>
              )}
              <Text size="xsmall" weight="regular" color={colors.gray500}>
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
          <Box mt="16px" minWidth={0}>
            <Tooltip title={copyDisabledReason} describeChild>
              <Box
                tabIndex={copyDisabledReason ? 0 : undefined}
                role={copyDisabledReason ? "group" : undefined}
                aria-label={copyDisabledReason ? "AWS update command unavailable" : undefined}
                aria-disabled={!!copyDisabledReason || undefined}
              >
                <Box
                  component="fieldset"
                  disabled={!!copyDisabledReason}
                  sx={{
                    m: 0,
                    p: 0,
                    border: 0,
                    minWidth: 0,
                    ...(copyDisabledReason && { "& .MuiIconButton-root": { opacity: 0.38, pointerEvents: "none" } }),
                  }}
                >
                  <CommandBlock
                    title="AWS update"
                    command={updateCommand ?? "The AWS update command is not available yet. Please try again later."}
                    dataTestId="aws-governance-update-command"
                    fixedHeight
                  />
                </Box>
              </Box>
            </Tooltip>
          </Box>
        </Card>
      )}

      <Card
        role="region"
        aria-labelledby={`${id}-access-heading`}
        p={{ xs: "18px", md: "24px" }}
        sx={{ borderColor: colors.gray200, boxShadow: "none", borderRadius: "12px" }}
      >
        {sections.map((section) => {
          const field = section.field;
          const permissionLocked = field !== "connected" && !canEditAgentPermissions;
          const permissionReason =
            typeof applied?.connected !== "boolean"
              ? "Account access has not yet been verified. Please try again later."
              : form.values.connected
                ? `Save your request to enable ${providerPossessive} access before changing agent permissions.`
                : `Agent permissions can’t be changed while ${providerPossessive} access is disabled.`;
          const fieldDisabledReason = disabledReason || (permissionLocked ? permissionReason : "");
          const pending =
            needsApply && typeof applied?.[field] === "boolean" && applied[field] !== initialValues[field];
          const changed = form.values[field] !== initialValues[field];
          const pendingDetail =
            section.pendingDetail + (changed ? " You also have an unsaved change to this setting." : "");
          const warning =
            !isVerifying &&
            applied?.[field] === true &&
            initialValues[field] &&
            !form.values[field] &&
            !fieldDisabledReason;
          const selection = `${changed ? "Unsaved: " : pending ? "Requested: " : ""}${form.values[field] ? "Enabled" : "Disabled"}`;
          const descriptionId = `${id}-${field}-description`;
          const selectionId = `${id}-${field}-selection`;
          const pendingId = `${id}-${field}-pending`;
          const warningId = `${id}-${field}-warning`;
          const lockId = `${id}-${field}-lock`;
          return (
            <Box
              key={field}
              mx={field !== "connected" ? { xs: 0, md: "24px" } : undefined}
              mt={field !== "connected" ? "24px" : undefined}
              pb={field !== "infrastructureMutationEnabled" ? "24px" : undefined}
              borderBottom={field !== "infrastructureMutationEnabled" ? `1px solid ${colors.gray200}` : undefined}
            >
              {field === "debugAccessEnabled" && (
                <Text component="h4" size="medium" color={colors.gray500} mb="24px">
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
              >
                <Stack gap="5px" minWidth={0}>
                  <Stack direction="row" alignItems="center" flexWrap="wrap" gap="8px">
                    <Text
                      component={field === "connected" ? "h3" : "h4"}
                      id={field === "connected" ? `${id}-access-heading` : undefined}
                      size={field === "connected" ? "large" : "medium"}
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
                  <Text id={descriptionId} weight="regular" color={colors.gray500}>
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
                <Stack alignItems="flex-end" gap="8px" minWidth={0} pt="3px">
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
                        <Button
                          type="button"
                          variant="outlined"
                          outlineColor={form.values.connected ? theme.palette.error.main : theme.palette.primary.main}
                          fontColor={colors.gray700}
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
                              setConnectionAction(form.values.connected ? "disconnect" : "connect");
                              setIsConnectionDialogOpen(true);
                            }
                          }}
                        >
                          {form.values.connected ? "Disconnect Account" : "Connect Account"}
                        </Button>
                      ) : (
                        <Switch
                          checked={form.values[field]}
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
                  <Text
                    id={selectionId}
                    size="xsmall"
                    weight="regular"
                    color={colors.gray600}
                    hidden={!changed && !pending}
                  >
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
      >
        <Stack gap="6px" flex={1}>
          <Box px="12px" py="10px" borderRadius="8px" bgcolor={colors.lightBlue50} alignSelf="flex-start">
            <Text weight="regular" color={colors.blue600}>
              Save your permission changes here, then run the command in AWS to apply them.
            </Text>
          </Box>
          {!appliedKnown && (
            <Text size="xsmall" weight="regular" color={colors.gray500}>
              Applied settings have not yet been verified.
            </Text>
          )}
        </Stack>
        <Stack direction="row" justifyContent="flex-end" gap="10px" flexShrink={0}>
          <Button
            variant="outlined"
            disabled={update.isPending || !unsaved}
            disabledMessage={update.isPending ? "Account settings are being saved." : "No changes to discard."}
            onClick={() => form.resetForm()}
          >
            Discard
          </Button>
          <Button
            type="submit"
            variant="contained"
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

const GovernanceControlsTab: FC<GovernanceControlsTabProps> = ({ accountConfigId, canUpdate, cloudFormationUrl }) => {
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
    <Box mt="24px">
      {query.data ? (
        <GovernanceSettingsForm account={query.data} canUpdate={canUpdate} cloudFormationUrl={cloudFormationUrl} />
      ) : (
        <Text weight="regular" color={colors.gray600}>
          Account settings are unavailable. Please try again later.
        </Text>
      )}
    </Box>
  );
};

export default GovernanceControlsTab;

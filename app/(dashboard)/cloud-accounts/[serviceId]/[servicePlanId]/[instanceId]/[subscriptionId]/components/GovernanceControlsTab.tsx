import { FC, ReactNode, useId, useMemo, useRef } from "react";
import { Box, Stack, useTheme } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";

import { $api } from "src/api/query";
import AlertText from "src/components/AlertText/AlertText";
import CommandBlock from "src/components/AwsCloudFormationInstructions/CommandBlock";
import Button from "src/components/Button/Button";
import Card from "src/components/Card/Card";
import ExternalArrowIcon from "src/components/Icons/ArrowExternal/ArrowExternal";
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
import { accountSetupUrlsWithProxy } from "src/utils/accountConfig/accountSetupProxy";
import {
  parseAwsCloudFormationQuickCreateUrl,
  parseAwsCloudFormationUpdateUrl,
} from "src/utils/accountConfig/awsCloudFormation";
import getSafeExternalURL from "src/utils/getSafeExternalURL";

const fields = ["connected", "debugAccessEnabled", "infrastructureMutationEnabled"] as const;
type GovernanceValues = Required<AccountGovernanceControls>;
type GovernanceControlsTabProps = {
  accountConfigId: string;
  instanceStatus?: string;
  canUpdate: boolean;
  canUpdateAgentPermissions: boolean;
  cloudFormationCreateUrl?: string;
  awsCloudFormationTemplateURL?: string;
};
type GovernanceSettingsFormProps = Omit<GovernanceControlsTabProps, "accountConfigId" | "instanceStatus"> & {
  account: AccountConfig;
};
type GovernanceSection = {
  field: keyof GovernanceValues;
  label: string;
  description: string;
  warning: string;
};

const validationSchema = Yup.object({
  connected: Yup.boolean().required(),
  debugAccessEnabled: Yup.boolean().required(),
  infrastructureMutationEnabled: Yup.boolean().required(),
});

const GovernanceSettingsForm: FC<GovernanceSettingsFormProps> = ({
  account,
  canUpdate,
  canUpdateAgentPermissions,
  cloudFormationCreateUrl,
  awsCloudFormationTemplateURL,
}) => {
  const id = useId();
  const theme = useTheme();
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();
  const formContainer = useRef<HTMLFormElement | null>(null);
  const commandContainer = useRef<HTMLDivElement | null>(null);
  const saveInFlight = useRef(false);
  const { orgName } = useProviderOrgDetails();
  const providerName = orgName || "Your service provider";
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
    onSubmit: async (values, helpers) => {
      const savedValues = getSaveValues(values);
      if (!canUpdate || saveInFlight.current || fields.every((field) => savedValues[field] === initialValues[field]))
        return;
      saveInFlight.current = true;
      try {
        await update.mutateAsync({
          params: { path: { id: account.id } },
          headers: { "x-ignore-global-error": true },
          body: { settings: { accountGovernanceControls: savedValues } },
        });
        helpers.resetForm({ values: savedValues });
        commandContainer.current?.querySelector<HTMLButtonElement>("button")?.focus();
      } catch {
        // Keep the draft available for retry when the save fails.
      } finally {
        saveInFlight.current = false;
      }
    },
  });
  const effectiveValues = getSaveValues(form.values);
  const unsaved = fields.some((field) => effectiveValues[field] !== initialValues[field]);
  const allAppliedSettingsMatch =
    !!appliedControls &&
    fields.every(
      (field) => typeof appliedControls[field] === "boolean" && appliedControls[field] === initialValues[field]
    );
  const needsApply = !allAppliedSettingsMatch;
  const backendCommand = account.awsBootstrapShellCommand;
  const awsBootstrapShellCommand = useMemo(() => {
    return accountSetupUrlsWithProxy(backendCommand?.trim() || "", true);
  }, [backendCommand]);
  const stack =
    parseAwsCloudFormationUpdateUrl(getSafeExternalURL(account.awsCloudFormationTemplateURL)) ??
    parseAwsCloudFormationQuickCreateUrl(getSafeExternalURL(cloudFormationCreateUrl ?? awsCloudFormationTemplateURL));
  const cloudShellURL = "https://console.aws.amazon.com/cloudshell/home";
  const awsDetails = [account.awsAccountID ? `AWS Account ${account.awsAccountID}` : "", stack?.region]
    .filter(Boolean)
    .join(" · ");
  const disabledReason = !canUpdate
    ? "You do not have permission to update this cloud account."
    : update.isPending || form.isSubmitting
      ? "Account settings are being saved."
      : "";
  const commandDisabledReason =
    disabledReason ||
    (unsaved
      ? "Save or discard your edits before copying the script command or opening AWS CloudShell."
      : !awsBootstrapShellCommand
        ? "The setup script is not available yet. Try again later."
        : "");
  const discardChanges = () => {
    if (disabledReason || !unsaved) return;
    form.resetForm();
    formContainer.current?.querySelector<HTMLInputElement>('input[role="switch"]')?.focus();
  };
  const sections: GovernanceSection[] = [
    {
      field: "connected",
      label: `Account Access for ${providerName}`,
      description: `Allow ${providerName} to manage this AWS account and its workloads.`,
      warning: `Without access, ${providerName} can’t manage workloads in this account.`,
    },
    {
      field: "debugAccessEnabled",
      label: "Allow Support Debug Access",
      description: `Allow ${providerName} to access your Kubernetes API for support and troubleshooting.`,
      warning: "Disabling support debug access may require you to provide access manually for troubleshooting.",
    },
    {
      field: "infrastructureMutationEnabled",
      label: "Allow AWS Infrastructure Changes",
      description: `Allow ${providerName} to create, update, and delete AWS resources for your workloads.`,
      warning: `${providerName} can’t complete workload operations that require AWS changes while this is disabled.`,
    },
  ];
  const renderSetting = (section: GovernanceSection): ReactNode => {
    const field = section.field;
    const permissionReason =
      field !== "connected" &&
      (!canUpdateAgentPermissions
        ? "Only root and admin can change support debug access and AWS infrastructure permissions."
        : !effectiveValues.connected
          ? "Enable account access to change its permissions."
          : "");
    const fieldDisabledReason = disabledReason || permissionReason || "";
    const pending = needsApply && applied[field] !== initialValues[field];
    const changed = effectiveValues[field] !== initialValues[field];
    const selection = `${changed ? "Unsaved: " : pending ? "Requested: " : ""}${effectiveValues[field] ? "Enabled" : "Disabled"}`;
    const pendingDetail = `This setting stays ${applied[field] ? "enabled" : "disabled"} until you apply your saved changes in AWS.${changed ? " You also have an unsaved change to this setting." : ""}`;
    const warning = applied[field] && initialValues[field] && !effectiveValues[field] && !disabledReason;
    const descriptionId = `${id}-${field}-description`;
    const selectionId = `${id}-${field}-selection`;
    const lockId = `${id}-${field}-lock`;
    return (
      <Box
        key={field}
        data-setting={field}
        display="grid"
        gridTemplateColumns="minmax(0, 1fr) auto"
        gap={{ xs: "16px", md: "24px" }}
        alignItems="center"
        pt={field === "connected" ? 0 : field === "debugAccessEnabled" ? "24px" : "18px"}
        pb={field === "debugAccessEnabled" ? "18px" : 0}
        borderBottom={field === "debugAccessEnabled" ? `1px solid ${colors.gray200}` : undefined}
      >
        <Stack gap="5px" minWidth={0}>
          <Stack direction="row" alignItems="center" flexWrap="wrap" gap="8px">
            <Text
              component={field === "connected" ? "h3" : "h4"}
              id={field === "connected" ? `${id}-access-heading` : undefined}
              size={field === "connected" ? "medium" : "small"}
              weight="semibold"
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
                    sx={{ p: "3px" }}
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
          {!!warning && (
            <Box mt="8px">
              <AlertText
                containerStyles={{ m: 0, p: 0, border: 0, bgcolor: "transparent" }}
                textStyles={{ color: colors.gray700 }}
              >
                {section.warning}
              </AlertText>
            </Box>
          )}
        </Stack>
        <Stack alignItems="flex-end" gap="8px">
          <Tooltip title={fieldDisabledReason} describeChild>
            <Box
              component="span"
              tabIndex={fieldDisabledReason ? 0 : undefined}
              role={fieldDisabledReason ? "group" : undefined}
              aria-label={fieldDisabledReason ? `${section.label} unavailable` : undefined}
              aria-disabled={!!fieldDisabledReason || undefined}
              aria-describedby={fieldDisabledReason ? lockId : undefined}
              sx={{ display: "inline-flex", "& .Mui-disabled": { pointerEvents: "none" } }}
            >
              <Switch
                checked={effectiveValues[field]}
                disabled={!!fieldDisabledReason}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: theme.palette.primary.main,
                  },
                }}
                inputProps={{
                  role: "switch",
                  "aria-label": section.label,
                  "aria-describedby": `${descriptionId} ${selectionId}${fieldDisabledReason ? ` ${lockId}` : ""}`,
                }}
                onChange={(_, checked: boolean) => {
                  if (!fieldDisabledReason) void form.setFieldValue(field, checked);
                }}
              />
            </Box>
          </Tooltip>
          <Text id={selectionId} size="xsmall" weight="regular" color={colors.gray600} hidden>
            {selection}
          </Text>
          {!!fieldDisabledReason && (
            <Box component="span" id={lockId} hidden>
              {fieldDisabledReason}
            </Box>
          )}
        </Stack>
      </Box>
    );
  };

  return (
    <Stack ref={formContainer} component="form" onSubmit={form.handleSubmit} aria-labelledby={`${id}-heading`}>
      <Stack gap="6px" mb={{ xs: "24px", md: "28px" }}>
        <Text size="large" weight="semibold" color={colors.gray900} component="h2" id={`${id}-heading`}>
          Governance Controls
        </Text>
        <Text weight="regular" color={colors.gray500}>
          Control access and permissions for {providerName} in this AWS account.
        </Text>
      </Stack>
      {!!needsApply && (
        <Card
          role="status"
          aria-label="AWS update required"
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
              {!!awsBootstrapShellCommand && (
                <Text weight="regular" color={colors.gray700} sx={{ mt: "4px" }}>
                  Copy and run the command below in AWS CloudShell or a local terminal. It downloads and runs the script
                  to apply your saved changes.
                </Text>
              )}
              <Text weight="regular" color={colors.gray500} sx={{ mt: "6px" }}>
                The account status refreshes automatically once those changes are applied in AWS.
              </Text>
              {!!awsDetails && (
                <Text size="xsmall" weight="regular" color={colors.gray500} sx={{ mt: "8px" }}>
                  {awsDetails}
                </Text>
              )}
            </Stack>
            <Button
              type="button"
              variant="outlined"
              href={!commandDisabledReason ? cloudShellURL : undefined}
              target="_blank"
              rel="noopener noreferrer"
              disabled={!!commandDisabledReason}
              disabledMessage={commandDisabledReason}
              endIcon={<ExternalArrowIcon color="currentColor" aria-hidden />}
            >
              Open AWS CloudShell
            </Button>
          </Stack>
          <Box ref={commandContainer} mt="12px" minWidth={0} role="region" aria-label="Saved setup script command">
            {awsBootstrapShellCommand ? (
              <CommandBlock
                title="AWS Command"
                command={awsBootstrapShellCommand}
                compact
                dataTestId="aws-governance-update-command"
                copyDisabledReason={commandDisabledReason}
              />
            ) : (
              <Text size="xsmall" weight="regular" color={colors.gray500}>
                The setup script is not available yet. Try again later.
              </Text>
            )}
          </Box>
        </Card>
      )}
      <Card
        role="region"
        aria-labelledby={`${id}-access-heading`}
        py={{ xs: "16px", md: "18px" }}
        px={{ xs: "16px", md: "20px" }}
        sx={{ borderColor: colors.gray200, boxShadow: "none", borderRadius: "8px" }}
      >
        {renderSetting(sections[0])}
        <Card
          component="section"
          aria-labelledby={`${id}-permissions-heading`}
          mt="20px"
          mx={{ xs: "12px", md: "24px" }}
          p="16px"
          sx={{ bgcolor: colors.gray50, borderColor: colors.gray200, boxShadow: "none", borderRadius: "8px" }}
        >
          <Text component="h4" id={`${id}-permissions-heading`} size="xsmall" weight="medium" color={colors.gray500}>
            Support and Infrastructure Permissions
          </Text>
          {sections.slice(1).map(renderSetting)}
        </Card>
      </Card>
      <Stack
        component="footer"
        direction={{ xs: "column", md: "row" }}
        alignItems={{ md: "center" }}
        gap="20px"
        py="18px"
        borderBottom={`1px solid ${colors.gray200}`}
      >
        <Box px="10px" py="6px" borderRadius="6px" bgcolor={colors.lightBlue50} width="fit-content" maxWidth="100%">
          <Text weight="regular" color={colors.blue600}>
            Save your changes to get a command. Run it in AWS CloudShell or a local terminal to apply them.
          </Text>
        </Box>
        <Stack direction="row" justifyContent="flex-end" gap="10px" flexShrink={0} ml={{ md: "auto" }}>
          <Button
            type="button"
            variant="outlined"
            size="small"
            disabled={!!disabledReason || !unsaved}
            disabledMessage={disabledReason || "No changes to discard."}
            onClick={discardChanges}
          >
            Discard
          </Button>
          <Button
            type="submit"
            variant="contained"
            size="small"
            isLoading={update.isPending || form.isSubmitting}
            disabled={!!disabledReason || !unsaved}
            disabledMessage={disabledReason || "No changes to save."}
          >
            Save Changes
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
};

const GovernanceControlsTab: FC<GovernanceControlsTabProps> = ({ accountConfigId, instanceStatus, ...props }) => {
  const query = $api.useQuery(
    "get",
    "/2022-09-01-00/accountconfig/{id}",
    {
      params: { path: { id: accountConfigId } },
      headers: { "x-ignore-global-error": true },
    },
    { enabled: !!accountConfigId, refetchInterval: 10000, refetchOnWindowFocus: true }
  );
  const normalizedInstanceStatus = instanceStatus?.toUpperCase();
  const accountSetupRequired =
    normalizedInstanceStatus === "FAILED" ||
    (normalizedInstanceStatus === "DEPLOYING" && query.data?.status === "VERIFYING");

  if (accountSetupRequired) {
    return (
      <Stack minHeight="50vh" alignItems="center" justifyContent="center" gap="6px" textAlign="center">
        <Text component="h2" size="large" weight="semibold" color={colors.gray900}>
          Account Setup Required
        </Text>
        <Text weight="regular" color={colors.gray600}>
          Governance controls are available once account setup is complete.
        </Text>
      </Stack>
    );
  }

  if (accountConfigId && query.isPending) return <LoadingSpinner />;

  if (!query.data) {
    return (
      <Stack minHeight="50vh" alignItems="center" justifyContent="center">
        <Text weight="regular" color={colors.gray600}>
          Account settings are unavailable. Please try again later.
        </Text>
      </Stack>
    );
  }

  const requestedControls = query.data.requestedSettings?.accountGovernanceControls;
  const appliedControls = query.data.appliedSettings?.accountGovernanceControls;
  const baselineKey = fields
    .map((field) => requestedControls?.[field] ?? appliedControls?.[field] ?? "missing")
    .join(":");

  return (
    <Box mt="32px">
      <GovernanceSettingsForm key={`${accountConfigId}:${baselineKey}`} account={query.data} {...props} />
    </Box>
  );
};

export default GovernanceControlsTab;

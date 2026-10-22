import { Box, Stack, useTheme } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";

import { $api } from "src/api/query";
import AlertText from "src/components/AlertText/AlertText";
import Button from "src/components/Button/Button";
import Card from "src/components/Card/Card";
import LoadingSpinner from "src/components/LoadingSpinner/LoadingSpinner";
import StatusChip from "src/components/StatusChip/StatusChip";
import Switch from "src/components/Switch/Switch";
import Tooltip from "src/components/Tooltip/Tooltip";
import { Text } from "src/components/Typography/Typography";
import useSnackbar from "src/hooks/useSnackbar";
import { colors } from "src/themeConfig";
import { AccountConfig, AccountGovernanceControls } from "src/types/account-config";
import getSafeExternalURL from "src/utils/getSafeExternalURL";

const fields = ["connected", "debugAccessEnabled", "infrastructureMutationEnabled"] as const;
type GovernanceValues = Required<AccountGovernanceControls>;

const validationSchema = Yup.object({
  connected: Yup.boolean().required(),
  debugAccessEnabled: Yup.boolean().required(),
  infrastructureMutationEnabled: Yup.boolean().required(),
});

const GovernanceSettingsForm = ({ account, canUpdate }: { account: AccountConfig; canUpdate: boolean }) => {
  const theme = useTheme();
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();
  const requested = account.requestedSettings?.accountGovernanceControls;
  const applied = account.appliedSettings?.accountGovernanceControls;
  const initialValues: GovernanceValues = {
    connected: requested?.connected ?? true,
    debugAccessEnabled: requested?.debugAccessEnabled ?? false,
    infrastructureMutationEnabled: requested?.infrastructureMutationEnabled ?? true,
  };
  const update = $api.useMutation("put", "/2022-09-01-00/accountconfig/{id}", {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["get", "/2022-09-01-00/accountconfig/{id}"] });
      snackbar.showSuccess("Account settings saved. Update the CloudFormation stack to apply the changes.");
    },
  });
  const form = useFormik<GovernanceValues>({
    initialValues,
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      await update.mutateAsync({
        params: { path: { id: account.id } },
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
  const updateURL = getSafeExternalURL(account.awsCloudFormationUpdateURL);
  const disabledReason = !canUpdate
    ? "You do not have permission to update this cloud account."
    : update.isPending
      ? "Account settings are being saved."
      : "";
  const sections = [
    {
      field: "connected" as const,
      title: "Dataplane connectivity to control plane",
      description: "Manage control-plane access to this account and all its entities.",
      label: "Account access",
      detail: form.values.connected
        ? "Allow the service provider to manage your dataplane and workloads."
        : "Revoke control-plane access. Your existing dataplane workloads continue to run.",
    },
    {
      field: "debugAccessEnabled" as const,
      title: "Agent debug access",
      description: "Control Kubernetes API access for support and troubleshooting.",
      label: "Enable support debug access",
      detail: "Allow the service provider to access your Kubernetes API through the Dataplane Agent.",
    },
    {
      field: "infrastructureMutationEnabled" as const,
      title: "Agent infrastructure permissions",
      description: "Control whether the Dataplane Agent can modify AWS resources in your account.",
      label: "Allow AWS infrastructure changes",
      detail: form.values.infrastructureMutationEnabled
        ? "Allow creation, updates, and deletion of AWS resources required to manage your workloads."
        : "Keep read-only permissions for monitoring and health checks. New deployments will fail while restricted.",
    },
  ];
  return (
    <Stack component="form" onSubmit={form.handleSubmit} gap="16px">
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap="8px">
        <Text weight="regular" color={colors.gray600}>
          Choose your settings, save them, then apply them to your AWS account.
        </Text>
        <Text size="xsmall" color={colors.gray600}>
          Account config {account.id}
        </Text>
      </Stack>
      {sections.map((section, index) => (
        <Stack key={section.field} gap="16px">
          {index === 1 && !form.values.connected && (
            <Card p="16px" bgcolor={colors.gray50}>
              <Text weight="regular" color={colors.gray600}>
                The controls below remain editable. Your choices are saved, but will take effect after you reconnect the
                account.
              </Text>
            </Card>
          )}
          <Card p={0}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              gap="16px"
              p="20px 24px"
              borderBottom={`1px solid ${colors.gray200}`}
            >
              <Stack gap="4px">
                <Text size="large" color={theme.palette.primary.main}>
                  {section.title}
                </Text>
                <Text weight="regular" color={colors.gray600}>
                  {section.description}
                </Text>
              </Stack>
              {index === 0 && (
                <Stack direction="row" alignItems="center" gap="8px">
                  <Text size="xsmall" color={colors.gray600}>
                    Current status
                  </Text>
                  <StatusChip status={account.status} />
                </Stack>
              )}
            </Stack>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ sm: "center" }}
              gap="16px"
              p="20px 24px"
            >
              <Stack gap="4px">
                <Text color={colors.gray700}>{section.label}</Text>
                <Text weight="regular" color={colors.gray600}>
                  {section.detail}
                </Text>
              </Stack>
              <Tooltip title={disabledReason}>
                <Stack direction="row" alignItems="center" gap="12px">
                  <Text color={form.values[section.field] ? theme.palette.primary.main : colors.gray600}>
                    {section.field === "connected"
                      ? form.values.connected
                        ? "Connected"
                        : "Disconnected"
                      : form.values[section.field]
                        ? "Enabled"
                        : "Disabled"}
                  </Text>
                  <Switch
                    checked={form.values[section.field]}
                    disabled={!!disabledReason}
                    inputProps={{ "aria-label": section.label }}
                    onChange={(_, checked: boolean) => void form.setFieldValue(section.field, checked)}
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                        backgroundColor: theme.palette.primary.main,
                      },
                    }}
                  />
                </Stack>
              </Tooltip>
            </Stack>
          </Card>
        </Stack>
      ))}
      <Card>
        <Stack gap="16px">
          <Stack direction="row" justifyContent="space-between" gap="8px">
            <Text color={colors.gray700}>Apply account settings</Text>
            <StatusChip
              category={unsaved || needsApply ? "pending" : appliedKnown ? "success" : "unknown"}
              label={
                unsaved
                  ? `${unsaved} unsaved change${unsaved === 1 ? "" : "s"}`
                  : needsApply
                    ? "CloudFormation update required"
                    : appliedKnown
                      ? "Settings up to date"
                      : "Applied settings not yet verified"
              }
            />
          </Stack>
          {!!needsApply && (
            <AlertText>
              Account settings saved. Update the CloudFormation stack in your AWS account to apply the changes.
            </AlertText>
          )}
          <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }} gap="24px">
            <Stack gap="8px" alignItems="flex-start">
              <Text weight="regular" color={colors.gray600}>
                Step 1. Save your desired account settings.
              </Text>
              <Button
                type="submit"
                variant="contained"
                bgColor={theme.palette.primary.main}
                isLoading={update.isPending}
                disabled={!!disabledReason || !unsaved}
                disabledMessage={disabledReason || "Nothing to update"}
              >
                Update account config settings
              </Button>
            </Stack>
            <Stack gap="8px" alignItems="flex-start">
              <Text weight="regular" color={colors.gray600}>
                Step 2. Apply the saved settings in your AWS account.
              </Text>
              <Button
                variant="contained"
                bgColor={theme.palette.primary.main}
                href={!unsaved && !disabledReason && updateURL ? updateURL : undefined}
                target="_blank"
                rel="noopener noreferrer"
                disabled={!!disabledReason || !!unsaved || !updateURL}
                disabledMessage={
                  disabledReason ||
                  (unsaved
                    ? "Save the account settings before applying them to CloudFormation."
                    : "The CloudFormation update link is not available yet.")
                }
              >
                Update account config CloudFormation
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Card>
    </Stack>
  );
};

const GovernanceControlsTab = ({ accountConfigId, canUpdate }: { accountConfigId: string; canUpdate: boolean }) => {
  const query = $api.useQuery(
    "get",
    "/2022-09-01-00/accountconfig/{id}",
    {
      params: { path: { id: accountConfigId } },
      headers: { "x-ignore-global-error": true },
    },
    { enabled: !!accountConfigId, refetchInterval: 10000 }
  );
  if (accountConfigId && query.isPending) return <LoadingSpinner />;
  return (
    <Box mt="24px">
      {query.data ? (
        <GovernanceSettingsForm account={query.data} canUpdate={canUpdate} />
      ) : (
        <Text weight="regular" color={colors.gray600}>
          Account settings are unavailable. Please try again later.
        </Text>
      )}
    </Box>
  );
};

export default GovernanceControlsTab;

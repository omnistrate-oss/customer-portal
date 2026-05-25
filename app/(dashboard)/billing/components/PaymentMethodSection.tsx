"use client";

import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Alert, Box, IconButton, Stack } from "@mui/material";

import TextConfirmationDialog from "src/components/TextConfirmationDialog/TextConfirmationDialog";
import Tooltip from "src/components/Tooltip/Tooltip";
import useSnackbar from "src/hooks/useSnackbar";
import { colors } from "src/themeConfig";
import { ConsumptionPaymentMethod } from "src/types/consumption";
import Button from "components/Button/Button";
import LoadingSpinnerSmall from "components/CircularProgress/CircularProgress";
import { Text } from "components/Typography/Typography";

import usePaymentMethods from "../hooks/usePaymentMethods";
import useRemovePaymentMethod from "../hooks/useRemovePaymentMethod";
import useSetDefaultPaymentMethod from "../hooks/useSetDefaultPaymentMethod";
import useStripeBillingConfig from "../hooks/useStripeBillingConfig";

import AddPaymentMethodModal from "./AddPaymentMethodModal";
import PaymentMethodItem from "./PaymentMethodItem";
import { getErrorMessage, getPaymentMethodPrimaryLabel } from "./paymentMethodUtils";

type PaymentMethodSectionProps = {
  enabled: boolean;
  onPaymentMethodsChanged: () => Promise<void> | void;
  isRefetchingBillingDetails?: boolean;
};

const PaymentMethodSection = ({ enabled, onPaymentMethodsChanged }: PaymentMethodSectionProps) => {
  const snackbar = useSnackbar();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [methodToRemove, setMethodToRemove] = useState<ConsumptionPaymentMethod | null>(null);

  const configQuery = useStripeBillingConfig(enabled && isAddOpen);
  const paymentMethodsQuery = usePaymentMethods(enabled);
  const removeMutation = useRemovePaymentMethod();
  const setDefaultMutation = useSetDefaultPaymentMethod();
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const paymentMethods = paymentMethodsQuery.data || [];
  const isLoading = paymentMethodsQuery.isPending;
  const isMutating = removeMutation.isPending || setDefaultMutation.isPending;
  const errorMessage = paymentMethodsQuery.error
    ? getErrorMessage(paymentMethodsQuery.error, "Unable to load payment methods.")
    : "";

  const refreshAll = async () => {
    await paymentMethodsQuery.refetch();
    await onPaymentMethodsChanged();
  };

  const refreshBillingState = async () => {
    await onPaymentMethodsChanged();
  };

  const handleAddSuccess = async (options?: { defaultFailed?: boolean }) => {
    setIsAddOpen(false);
    await refreshAll();
    if (options?.defaultFailed) {
      snackbar.showError("Payment method added, but it could not be set as default. Choose Set Default from the list.");
    } else {
      snackbar.showSuccess("Payment method added successfully");
    }
  };

  const handleSetDefault = async (method: ConsumptionPaymentMethod) => {
    setSettingDefaultId(method.id);
    try {
      await setDefaultMutation.mutateAsync(method.id);
      snackbar.showSuccess("Default payment method updated");
    } catch (error) {
      snackbar.showError(getErrorMessage(error, "Failed to update default payment method"));
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleConfirmRemove = async () => {
    if (!methodToRemove) {
      return false;
    }

    try {
      await removeMutation.mutateAsync(methodToRemove.id);
      setMethodToRemove(null);
      await refreshBillingState();
      snackbar.showSuccess("Payment method removed successfully");
    } catch (error) {
      snackbar.showError(getErrorMessage(error, "Failed to remove payment method"));
      return false;
    }
  };

  return (
    <Box marginTop="18px">
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap="16px" marginBottom="14px">
        <Box>
          <Text size="medium" weight="semibold" color={colors.gray900}>
            Saved Payment Methods
          </Text>
          <Text size="small" weight="regular" color={colors.gray500} mt="4px">
            Manage the methods used for automatic invoice collection.
          </Text>
        </Box>
        <Stack direction="row" alignItems="center" gap="8px" flexShrink={0}>
          <Tooltip title="Refresh payment methods">
            <span>
              <IconButton
                size="small"
                disabled={isLoading || paymentMethodsQuery.isFetching}
                aria-label="Refresh payment methods"
                onClick={() => refreshAll()}
                sx={{
                  border: `1px solid ${colors.gray300}`,
                  borderRadius: "8px",
                  width: 36,
                  height: 36,
                }}
              >
                {paymentMethodsQuery.isFetching ? (
                  <LoadingSpinnerSmall sx={{ marginLeft: 0 }} />
                ) : (
                  <RefreshIcon sx={{ fontSize: 18 }} />
                )}
              </IconButton>
            </span>
          </Tooltip>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon sx={{ fontSize: 18 }} />}
            disabled={isLoading || Boolean(errorMessage)}
            onClick={() => setIsAddOpen(true)}
          >
            Add
          </Button>
        </Stack>
      </Stack>

      {isLoading ? (
        <Stack alignItems="center" justifyContent="center" minHeight="140px">
          <LoadingSpinnerSmall />
        </Stack>
      ) : errorMessage ? (
        <Box sx={{ my: "16px" }}>
          <Alert severity="error">{errorMessage}</Alert>
        </Box>
      ) : paymentMethods.length === 0 ? (
        <Box
          sx={{
            border: `1px dashed ${colors.gray300}`,
            borderRadius: "8px",
            padding: "20px",
            backgroundColor: colors.gray50,
          }}
        >
          <Text size="small" weight="semibold" color={colors.gray900}>
            No payment methods configured.
          </Text>
          <Text size="small" weight="regular" color={colors.gray500} mt={0.5}>
            Add a payment method to continue.
          </Text>
        </Box>
      ) : (
        <Stack gap="10px">
          {paymentMethods.map((method) => (
            <PaymentMethodItem
              key={method.id}
              method={method}
              disableActions={isMutating}
              isSettingDefault={settingDefaultId === method.id}
              onRemove={(selectedMethod) => {
                setMethodToRemove(selectedMethod);
              }}
              onSetDefault={handleSetDefault}
            />
          ))}
        </Stack>
      )}

      <AddPaymentMethodModal
        open={isAddOpen}
        config={configQuery.data}
        configError={configQuery.error}
        isConfigLoading={isAddOpen && (configQuery.isPending || configQuery.isFetching)}
        existingMethods={paymentMethods}
        onClose={() => setIsAddOpen(false)}
        onSuccess={handleAddSuccess}
      />
      <TextConfirmationDialog
        open={Boolean(methodToRemove)}
        handleClose={() => setMethodToRemove(null)}
        title="Remove Payment Method"
        subtitle={
          methodToRemove
            ? `Remove ${getPaymentMethodPrimaryLabel(methodToRemove)} from this billing account?${paymentMethods.length === 1 ? "\n\nRemoval is blocked when unpaid invoices, current usage, or active subscriptions still require a payment method." : ""}`
            : "Remove this payment method from this billing account?"
        }
        message="To confirm removal, please enter <b>remove</b>, in the field below:"
        confirmationText="remove"
        buttonLabel="Remove"
        isLoading={removeMutation.isPending}
        onConfirm={handleConfirmRemove}
      />
    </Box>
  );
};

export default PaymentMethodSection;

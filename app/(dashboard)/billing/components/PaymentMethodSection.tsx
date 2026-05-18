"use client";

import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Alert, Box, IconButton, Stack, Tooltip } from "@mui/material";

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
import { getErrorMessage } from "./paymentMethodUtils";
import RemovePaymentMethodModal from "./RemovePaymentMethodModal";

type PaymentMethodSectionProps = {
  enabled: boolean;
  onPaymentMethodsChanged: () => Promise<void> | void;
};

const PaymentMethodSection = ({ enabled, onPaymentMethodsChanged }: PaymentMethodSectionProps) => {
  const snackbar = useSnackbar();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [methodToRemove, setMethodToRemove] = useState<ConsumptionPaymentMethod | null>(null);
  const [removeError, setRemoveError] = useState("");

  const configQuery = useStripeBillingConfig(enabled);
  const paymentMethodsQuery = usePaymentMethods(enabled);
  const removeMutation = useRemovePaymentMethod();
  const setDefaultMutation = useSetDefaultPaymentMethod();

  const paymentMethods = paymentMethodsQuery.data || [];
  const isLoading = configQuery.isPending || paymentMethodsQuery.isPending;
  const isMutating = removeMutation.isPending || setDefaultMutation.isPending;
  const errorMessage = configQuery.error
    ? getErrorMessage(configQuery.error, "Unable to load Stripe configuration.")
    : paymentMethodsQuery.error
      ? getErrorMessage(paymentMethodsQuery.error, "Unable to load payment methods.")
      : "";

  const refreshAll = async () => {
    await paymentMethodsQuery.refetch();
    await onPaymentMethodsChanged();
  };

  const handleAddSuccess = async () => {
    setIsAddOpen(false);
    await refreshAll();
    snackbar.showSuccess("Payment method added successfully");
  };

  const handleSetDefault = async (method: ConsumptionPaymentMethod) => {
    try {
      await setDefaultMutation.mutateAsync(method.id);
      await refreshAll();
      snackbar.showSuccess("Default payment method updated");
    } catch (error) {
      snackbar.showError(getErrorMessage(error, "Failed to update default payment method"));
    }
  };

  const handleConfirmRemove = async () => {
    if (!methodToRemove) {
      return;
    }

    setRemoveError("");
    try {
      await removeMutation.mutateAsync(methodToRemove.id);
      setMethodToRemove(null);
      await refreshAll();
      snackbar.showSuccess("Payment method removed successfully");
    } catch (error) {
      setRemoveError(getErrorMessage(error, "Failed to remove payment method"));
    }
  };

  return (
    <Box marginTop="18px">
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap="16px" marginBottom="14px">
        <Box>
          <Text size="medium" weight="semibold" color={colors.gray900}>
            Saved Payment Methods
          </Text>
          <Text size="small" weight="regular" color={colors.gray500} mt={0.25}>
            Manage the methods used for automatic invoice collection.
          </Text>
        </Box>
        <Stack direction="row" alignItems="center" gap="8px" flexShrink={0}>
          <Tooltip title="Refresh payment methods">
            <span>
              <IconButton
                size="small"
                disabled={isLoading || paymentMethodsQuery.isFetching}
                onClick={() => refreshAll()}
                sx={{
                  border: `1px solid ${colors.gray300}`,
                  borderRadius: "8px",
                  width: 36,
                  height: 36,
                }}
              >
                {paymentMethodsQuery.isFetching ? <LoadingSpinnerSmall /> : <RefreshIcon sx={{ fontSize: 18 }} />}
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
        <Alert severity="error">{errorMessage}</Alert>
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
              onRemove={(selectedMethod) => {
                setRemoveError("");
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
        existingMethods={paymentMethods}
        onClose={() => setIsAddOpen(false)}
        onSuccess={handleAddSuccess}
      />
      <RemovePaymentMethodModal
        open={Boolean(methodToRemove)}
        method={methodToRemove}
        isLoading={removeMutation.isPending}
        errorMessage={removeError}
        onClose={() => setMethodToRemove(null)}
        onConfirm={handleConfirmRemove}
      />
    </Box>
  );
};

export default PaymentMethodSection;

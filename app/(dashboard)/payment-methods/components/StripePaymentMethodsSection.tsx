"use client";

import { useState } from "react";
import Link from "next/link";
import AddIcon from "@mui/icons-material/Add";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Alert, Box, Stack } from "@mui/material";
import { useMutation } from "@tanstack/react-query";

import { removeConsumptionPaymentMethod } from "src/api/consumption";
import StatusChip from "src/components/StatusChip/StatusChip";
import TextConfirmationDialog from "src/components/TextConfirmationDialog/TextConfirmationDialog";
import useSnackbar from "src/hooks/useSnackbar";
import { colors } from "src/themeConfig";
import { ConsumptionPaymentMethod } from "src/types/consumption";
import getSafeExternalURL from "src/utils/getSafeExternalURL";
import Button from "components/Button/Button";
import Card from "components/Card/Card";
import LoadingSpinnerSmall from "components/CircularProgress/CircularProgress";
import { Text } from "components/Typography/Typography";

import usePaymentMethods from "../hooks/usePaymentMethods";
import useSetDefaultPaymentMethod from "../hooks/useSetDefaultPaymentMethod";
import useStripeBillingConfig from "../hooks/useStripeBillingConfig";
import { getErrorMessage, getPaymentMethodPrimaryLabel } from "../utils/paymentMethodUtils";

import AddPaymentMethodModal from "./AddPaymentMethodModal";
import PaymentMethodItem from "./PaymentMethodItem";

type StripePaymentMethodsSectionProps = {
  enabled: boolean;
  isCustomPaymentPortalEnabled: boolean;
  paymentConfigured?: boolean;
  paymentInfoPortalURL?: string;
  onPaymentMethodsChanged: () => Promise<void> | void;
};

const StripePaymentMethodsSection = ({
  enabled,
  isCustomPaymentPortalEnabled,
  paymentConfigured,
  paymentInfoPortalURL,
  onPaymentMethodsChanged,
}: StripePaymentMethodsSectionProps) => {
  const snackbar = useSnackbar();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [methodToRemove, setMethodToRemove] = useState<ConsumptionPaymentMethod | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const configQuery = useStripeBillingConfig(enabled && isAddOpen);
  const paymentMethodsQuery = usePaymentMethods(enabled);
  const setDefaultMutation = useSetDefaultPaymentMethod();

  const removeMutation = useMutation({
    mutationFn: removeConsumptionPaymentMethod,
    onSuccess: async () => {
      await paymentMethodsQuery.refetch();
    },
  });

  const paymentMethods = paymentMethodsQuery.data || [];
  const isLoading = paymentMethodsQuery.isPending;
  const isMutating = removeMutation.isPending || setDefaultMutation.isPending;
  const errorMessage = paymentMethodsQuery.error
    ? getErrorMessage(paymentMethodsQuery.error, "Unable to load payment methods.")
    : "";
  const removeDialogSubtitle = methodToRemove ? (
    <>
      {`Remove ${getPaymentMethodPrimaryLabel(methodToRemove)} from this billing account?`}
      {paymentMethods.length === 1 && (
        <>
          <br />
          <br />
          Removal is blocked when unpaid invoices, current usage, or active subscriptions still require a payment
          method.
        </>
      )}
    </>
  ) : (
    "Remove this payment method from this billing account?"
  );

  const refreshAll = async () => {
    await paymentMethodsQuery.refetch();
    await onPaymentMethodsChanged();
  };

  const handleAddSuccess = async (options?: { defaultFailed?: boolean }) => {
    setIsAddOpen(false);
    if (options?.defaultFailed) {
      snackbar.showError("Payment method added, but it could not be set as default. Choose Set Default from the list.");
    } else {
      snackbar.showSuccess("Payment method added successfully");
    }
    await refreshAll();
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
      await onPaymentMethodsChanged();
      snackbar.showSuccess("Payment method removed successfully");
      return true;
    } catch (error) {
      snackbar.showError(getErrorMessage(error, "Failed to remove payment method"));
      return false;
    }
  };

  if (!isCustomPaymentPortalEnabled) {
    const safePaymentInfoPortalURL = getSafeExternalURL(paymentInfoPortalURL);

    return (
      <Card
        sx={{
          mt: "12px",
          boxShadow: "0px 1px 2px 0px #0A0D120D",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          gap="16px"
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
        >
          <Box>
            <Text size="medium" weight="semibold" color={colors.gray900}>
              Payment Method
            </Text>
            <Text size="small" weight="regular" color={colors.gray500} sx={{ mt: "2px" }}>
              Configure payment methods using the Stripe billing portal.
            </Text>
          </Box>

          <Stack direction="row" gap="12px" alignItems="center" flexWrap="wrap">
            <StatusChip
              label={paymentConfigured ? "Configured" : "Not Configured"}
              category={paymentConfigured ? "success" : "failed"}
            />
            {safePaymentInfoPortalURL ? (
              <Link href={safePaymentInfoPortalURL} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="contained"
                  size="small"
                  endIcon={
                    <ArrowOutwardIcon
                      sx={{
                        fontSize: "18px",
                      }}
                    />
                  }
                >
                  Configure
                </Button>
              </Link>
            ) : (
              <Button
                variant="contained"
                size="small"
                endIcon={
                  <ArrowOutwardIcon
                    sx={{
                      fontSize: "18px",
                    }}
                  />
                }
                disabled
              >
                Configure
              </Button>
            )}
          </Stack>
        </Stack>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        mt: "12px",
        boxShadow: "0px 1px 2px 0px #0A0D120D",
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap="16px" marginBottom="14px">
        <Box>
          <Text size="medium" weight="semibold" color={colors.gray900}>
            Saved payment methods
          </Text>
          <Text size="small" weight="regular" color={colors.gray500} sx={{ mt: "2px" }}>
            Methods used for automatic invoice collection. Default is charged first.
          </Text>
        </Box>
        <Stack direction="row" alignItems="center" gap="12px" flexShrink={0}>
          <Button
            variant="outlined"
            size="small"
            startIcon={
              paymentMethodsQuery.isFetching ? (
                <LoadingSpinnerSmall sx={{ marginLeft: 0 }} />
              ) : (
                <RefreshIcon sx={{ fontSize: 18 }} />
              )
            }
            disabled={isLoading || paymentMethodsQuery.isFetching}
            onClick={() => refreshAll()}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon sx={{ fontSize: 18 }} />}
            disabled={isLoading || Boolean(errorMessage)}
            onClick={() => setIsAddOpen(true)}
          >
            Add payment method
          </Button>
        </Stack>
      </Stack>

      {isLoading ? (
        <Stack alignItems="center" justifyContent="center" minHeight="180px">
          <LoadingSpinnerSmall />
        </Stack>
      ) : errorMessage ? (
        <Box sx={{ my: "16px" }}>
          <Alert severity="error">{errorMessage}</Alert>
        </Box>
      ) : paymentMethods.length === 0 ? (
        <Stack alignItems="center" justifyContent="center" minHeight="180px">
          <Text size="medium" weight="medium" color={colors.gray500}>
            No payment methods configured.
          </Text>
        </Stack>
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
        subtitle={removeDialogSubtitle}
        message="To confirm removal, please enter <b>remove</b> in the field below:"
        confirmationText="remove"
        buttonLabel="Remove"
        closeButtonAriaLabel="Close remove payment method dialog"
        isLoading={removeMutation.isPending}
        onConfirm={handleConfirmRemove}
      />
    </Card>
  );
};

export default StripePaymentMethodsSection;

"use client";

import { useEffect, useMemo, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Skeleton, Stack } from "@mui/material";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import useSnackbar from "src/hooks/useSnackbar";
import { colors } from "src/themeConfig";
import { ConsumptionPaymentMethod, ConsumptionStripeConfigResponse } from "src/types/consumption";
import Button from "components/Button/Button";
import { Text } from "components/Typography/Typography";

import useCreateSetupIntent from "../hooks/useCreateSetupIntent";
import useSetDefaultPaymentMethod from "../hooks/useSetDefaultPaymentMethod";
import { getErrorMessage } from "../utils/paymentMethodUtils";

type AddPaymentMethodModalProps = {
  open: boolean;
  config?: ConsumptionStripeConfigResponse;
  configError?: unknown;
  isConfigLoading?: boolean;
  existingMethods: ConsumptionPaymentMethod[];
  onClose: () => void;
  onSuccess: (options?: { defaultFailed?: boolean }) => Promise<void> | void;
};

type AddPaymentMethodFormProps = {
  existingMethods: ConsumptionPaymentMethod[];
  isSubmitting: boolean;
  onCancel: () => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  onSuccess: (options?: { defaultFailed?: boolean }) => Promise<void> | void;
};

const AddPaymentMethodForm = ({
  existingMethods,
  isSubmitting,
  onCancel,
  setIsSubmitting,
  onSuccess,
}: AddPaymentMethodFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const setDefaultMutation = useSetDefaultPaymentMethod();
  const snackbar = useSnackbar();

  const handleSubmit = async () => {
    if (!stripe || !elements) {
      return;
    }

    setIsSubmitting(true);

    const result = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-methods?setup_complete=true`,
      },
      redirect: "if_required",
    });

    if (result.error) {
      snackbar.showError(result.error.message || "Payment method setup failed. Please try again.");
      setIsSubmitting(false);
      return;
    }

    const paymentMethodID =
      typeof result.setupIntent?.payment_method === "string" ? result.setupIntent.payment_method : undefined;

    let defaultFailed = false;

    if (!existingMethods.some((method) => method.isDefault) && paymentMethodID) {
      try {
        await setDefaultMutation.mutateAsync(paymentMethodID);
      } catch {
        defaultFailed = true;
      }
    }

    try {
      await onSuccess({ defaultFailed });
    } catch (error) {
      snackbar.showError(
        getErrorMessage(error, "Payment method was saved, but the payment methods list could not refresh.")
      );
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
  };

  return (
    <>
      <DialogContent sx={{ px: "24px", py: 0 }}>
        <PaymentElement
          options={{
            fields: {
              billingDetails: {
                address: "auto",
              },
            },
            wallets: {
              link: "never",
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ p: "24px", gap: "12px" }}>
        <Button variant="outlined" disabled={isSubmitting} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!stripe || !elements || isSubmitting}
          isLoading={isSubmitting}
          onClick={handleSubmit}
        >
          Save Payment Method
        </Button>
      </DialogActions>
    </>
  );
};

const AddPaymentMethodModal = ({
  open,
  config,
  configError,
  isConfigLoading = false,
  existingMethods,
  onClose,
  onSuccess,
}: AddPaymentMethodModalProps) => {
  const createSetupIntentMutation = useCreateSetupIntent();
  const [clientSecret, setClientSecret] = useState("");
  const [setupErrorMessage, setSetupErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const configErrorMessage = configError ? getErrorMessage(configError, "Unable to load Stripe configuration.") : "";
  const modalErrorMessage = configErrorMessage || setupErrorMessage;
  const isInitializing = createSetupIntentMutation.isPending || isConfigLoading;

  const stripePromise = useMemo(() => {
    if (!config?.publishableKey) {
      return null;
    }

    return loadStripe(config.publishableKey, {
      stripeAccount: config.stripeAccountId,
    });
  }, [config?.publishableKey, config?.stripeAccountId]);

  useEffect(() => {
    let cancelled = false;

    const createSetupIntent = async () => {
      if (!open || !config?.publishableKey || configErrorMessage) {
        return;
      }

      setClientSecret("");
      setSetupErrorMessage("");

      try {
        const result = await createSetupIntentMutation.mutateAsync();
        if (!cancelled) {
          setClientSecret(result.clientSecret);
        }
      } catch (error) {
        if (!cancelled) {
          setSetupErrorMessage(getErrorMessage(error, "Failed to initialize payment setup. Please try again."));
        }
      }
    };

    createSetupIntent();

    return () => {
      cancelled = true;
    };
    // mutateAsync is stable enough for this flow; including it reopens setup for internal mutation state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.publishableKey, configErrorMessage, open]);

  const handleClose = () => {
    if (isInitializing || isSubmitting) {
      return;
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{
        style: {
          borderRadius: "12px",
          minWidth: "620px",
          maxWidth: "620px",
        },
      }}
    >
      <DialogTitle
        sx={{
          px: "24px",
          pt: "24px",
          pb: "16px",
          position: "relative",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap="16px">
          <Text size="large" weight="bold">
            Add Payment Method
          </Text>
        </Stack>
        <IconButton
          onClick={handleClose}
          aria-label="Close add payment method dialog"
          disabled={isInitializing || isSubmitting}
          sx={{
            position: "absolute",
            right: "16px",
            top: "16px",
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {modalErrorMessage ? (
        <DialogContent sx={{ px: "24px", pt: "48px", pb: "24px" }}>
          <Text
            size="small"
            weight="medium"
            color={colors.error700}
            sx={{
              backgroundColor: colors.error50,
              border: `1px solid ${colors.error200}`,
              borderRadius: "8px",
              padding: "10px 12px",
            }}
          >
            {modalErrorMessage}
          </Text>
        </DialogContent>
      ) : isConfigLoading || !stripePromise || createSetupIntentMutation.isPending || !clientSecret ? (
        <>
          <DialogContent sx={{ px: "24px", py: 0 }}>
            <Stack gap="16px">
              <Skeleton variant="rounded" height={44} />
              <Stack direction="row" gap="12px">
                <Skeleton variant="rounded" height={44} sx={{ flex: 1 }} />
                <Skeleton variant="rounded" height={44} sx={{ flex: 1 }} />
              </Stack>
              <Skeleton variant="rounded" height={44} />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: "24px", gap: "12px" }}>
            <Skeleton variant="rounded" width={90} height={40} />
            <Skeleton variant="rounded" width={180} height={40} />
          </DialogActions>
        </>
      ) : (
        <Stack sx={{ minHeight: "200px" }}>
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  borderRadius: "8px",
                  colorPrimary: "#079455",
                },
              },
            }}
          >
            <AddPaymentMethodForm
              existingMethods={existingMethods}
              isSubmitting={isSubmitting}
              onCancel={handleClose}
              setIsSubmitting={setIsSubmitting}
              onSuccess={onSuccess}
            />
          </Elements>
        </Stack>
      )}
    </Dialog>
  );
};

export default AddPaymentMethodModal;

"use client";

import { useEffect, useMemo, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack } from "@mui/material";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import { colors } from "src/themeConfig";
import { ConsumptionPaymentMethod, ConsumptionStripeConfigResponse } from "src/types/consumption";
import Button from "components/Button/Button";
import LoadingSpinner from "components/LoadingSpinner/LoadingSpinner";
import { Text } from "components/Typography/Typography";

import useCreateSetupIntent from "../hooks/useCreateSetupIntent";
import useSetDefaultPaymentMethod from "../hooks/useSetDefaultPaymentMethod";

import { getErrorMessage } from "./paymentMethodUtils";

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
  onCancel: () => void;
  onSuccess: (options?: { defaultFailed?: boolean }) => Promise<void> | void;
  setErrorMessage: (message: string) => void;
};

const AddPaymentMethodForm = ({ existingMethods, onCancel, onSuccess, setErrorMessage }: AddPaymentMethodFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const setDefaultMutation = useSetDefaultPaymentMethod();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!stripe || !elements) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    const result = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/billing?setup_complete=true`,
      },
      redirect: "if_required",
    });

    if (result.error) {
      setErrorMessage(result.error.message || "Payment method setup failed. Please try again.");
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
      setErrorMessage(
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
          }}
        />
      </DialogContent>
      <DialogActions sx={{ p: "24px", gap: "12px" }}>
        <Button variant="outlined" size="large" disabled={isSubmitting} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="contained"
          size="large"
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
  const [errorMessage, setErrorMessage] = useState("");

  const configErrorMessage = configError ? getErrorMessage(configError, "Unable to load Stripe configuration.") : "";

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
      setErrorMessage("");

      try {
        const result = await createSetupIntentMutation.mutateAsync();
        if (!cancelled) {
          setClientSecret(result.clientSecret);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(getErrorMessage(error, "Failed to initialize payment setup. Please try again."));
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
    if (createSetupIntentMutation.isPending || isConfigLoading) {
      return;
    }
    onClose();
  };

  const modalErrorMessage = configErrorMessage || errorMessage;

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
        <DialogContent sx={{ px: "24px", pt: 0, pb: "24px" }}>
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
        <DialogContent sx={{ px: "24px", py: 0 }}>
          <Stack alignItems="center" justifyContent="center" minHeight={180}>
            <LoadingSpinner />
          </Stack>
        </DialogContent>
      ) : (
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
            onCancel={handleClose}
            onSuccess={onSuccess}
            setErrorMessage={setErrorMessage}
          />
        </Elements>
      )}

      {errorMessage && clientSecret && (
        <Text
          size="small"
          weight="medium"
          color={colors.error700}
          mt={2}
          sx={{
            backgroundColor: colors.error50,
            border: `1px solid ${colors.error200}`,
            borderRadius: "8px",
            padding: "10px 12px",
          }}
        >
          {errorMessage}
        </Text>
      )}
    </Dialog>
  );
};

export default AddPaymentMethodModal;

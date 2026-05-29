import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Box, Stack } from "@mui/material";

import Button from "src/components/Button/Button";
import LoadingSpinnerSmall from "src/components/CircularProgress/CircularProgress";
import AlertTriangle from "src/components/Icons/AlertTriangle/AlertTriangle";
import { Text } from "src/components/Typography/Typography";
import useSnackbar from "src/hooks/useSnackbar";
import { colors } from "src/themeConfig";
import { getPaymentMethodsRoute } from "src/utils/routes";

import { PaymentMethodIcon } from "../../payment-methods/components/Icons";
import usePaymentMethods from "../../payment-methods/hooks/usePaymentMethods";
import useSetDefaultPaymentMethod from "../../payment-methods/hooks/useSetDefaultPaymentMethod";
import {
  getErrorMessage,
  getPaymentMethodPrimaryLabel,
  getPaymentMethodSecondaryLabel,
} from "../../payment-methods/utils/paymentMethodUtils";

type StripeDefaultPaymentMethodSummaryProps = {
  enabled: boolean;
  onPaymentMethodsEmptyChange?: (isEmpty: boolean) => void;
  onDefaultPaymentMethodChanged: () => Promise<void> | void;
};

const StripeDefaultPaymentMethodSummary = ({
  enabled,
  onPaymentMethodsEmptyChange,
  onDefaultPaymentMethodChanged,
}: StripeDefaultPaymentMethodSummaryProps) => {
  const snackbar = useSnackbar();
  const [defaultingPaymentMethodId, setDefaultingPaymentMethodId] = useState<string | null>(null);
  const attemptedDefaultPaymentMethodIdRef = useRef<string | null>(null);
  const paymentMethodsQuery = usePaymentMethods(enabled);
  const setDefaultMutation = useSetDefaultPaymentMethod();

  const paymentMethods = paymentMethodsQuery.data || [];
  const defaultPaymentMethod = paymentMethods.find((method) => method.isDefault);
  const firstPaymentMethod = paymentMethods[0];
  const errorMessage = paymentMethodsQuery.error
    ? getErrorMessage(paymentMethodsQuery.error, "Unable to load default payment method.")
    : "";

  useEffect(() => {
    if (!onPaymentMethodsEmptyChange) {
      return;
    }

    if (!enabled || paymentMethodsQuery.isPending || errorMessage) {
      onPaymentMethodsEmptyChange(false);
      return;
    }

    onPaymentMethodsEmptyChange(paymentMethods.length === 0);
  }, [enabled, errorMessage, onPaymentMethodsEmptyChange, paymentMethods.length, paymentMethodsQuery.isPending]);

  useEffect(() => {
    if (
      !enabled ||
      paymentMethodsQuery.isPending ||
      defaultPaymentMethod ||
      !firstPaymentMethod?.id ||
      defaultingPaymentMethodId ||
      attemptedDefaultPaymentMethodIdRef.current === firstPaymentMethod.id
    ) {
      return;
    }

    const setInitialDefaultPaymentMethod = async () => {
      attemptedDefaultPaymentMethodIdRef.current = firstPaymentMethod.id;
      setDefaultingPaymentMethodId(firstPaymentMethod.id);

      try {
        await setDefaultMutation.mutateAsync(firstPaymentMethod.id);
        await onDefaultPaymentMethodChanged();
      } catch {
        snackbar.showError("Unable to set default payment method.");
      } finally {
        setDefaultingPaymentMethodId(null);
      }
    };

    void setInitialDefaultPaymentMethod();
  }, [
    defaultPaymentMethod,
    defaultingPaymentMethodId,
    enabled,
    firstPaymentMethod?.id,
    onDefaultPaymentMethodChanged,
    paymentMethodsQuery.isPending,
    setDefaultMutation,
    snackbar,
  ]);

  if (paymentMethodsQuery.isPending || defaultingPaymentMethodId) {
    return (
      <Stack alignItems="center" justifyContent="center" minHeight="88px" marginTop="10px">
        <LoadingSpinnerSmall />
      </Stack>
    );
  }

  if (errorMessage) {
    return (
      <Stack direction="row" gap="24px" justifyContent="space-between" alignItems="center" marginTop="16px">
        <Text size="small" weight="medium" color={colors.error700}>
          {errorMessage}
        </Text>
        <Link href={getPaymentMethodsRoute()}>
          <Button variant="contained" size="small">
            Configure
          </Button>
        </Link>
      </Stack>
    );
  }

  if (paymentMethods.length === 0) {
    return (
      <Stack alignItems="center" justifyContent="center" gap="14px" minHeight="88px" marginTop="20px">
        <Text size="small" weight="medium" color={"#DC6803"} sx={{ maxWidth: "360px", textAlign: "center" }}>
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              mr: "8px",
              verticalAlign: "text-bottom",
            }}
          >
            <AlertTriangle color={"#DC6803"} height={18} width={18} />
          </Box>
          Add a payment method to pay invoices and outstanding balances.
        </Text>
        <Link href={getPaymentMethodsRoute()}>
          <Button variant="outlined" size="small">
            Add payment method
          </Button>
        </Link>
      </Stack>
    );
  }

  if (!defaultPaymentMethod) {
    return (
      <Stack direction="row" gap="24px" justifyContent="space-between" alignItems="center" marginTop="16px">
        <Text size="small" weight="medium" color={colors.gray500}>
          No default payment method selected.
        </Text>
        <Link href={getPaymentMethodsRoute()}>
          <Button variant="contained" size="small">
            Configure
          </Button>
        </Link>
      </Stack>
    );
  }

  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      alignItems={{ xs: "flex-start", md: "center" }}
      justifyContent="space-between"
      gap="16px"
      marginTop="18px"
      minWidth={0}
    >
      <Stack direction="row" alignItems="center" gap="16px" minWidth={0}>
        <PaymentMethodIcon method={defaultPaymentMethod} />
        <Box minWidth={0}>
          <Text size="small" weight="medium" color={colors.gray700} ellipsis maxWidth="180px">
            {getPaymentMethodPrimaryLabel(defaultPaymentMethod)}
          </Text>
          <Text size="small" weight="regular" color={colors.gray700}>
            {getPaymentMethodSecondaryLabel(defaultPaymentMethod)}
          </Text>
        </Box>
      </Stack>
      <Box flexShrink={0}>
        <Link href={getPaymentMethodsRoute()}>
          <Button variant="outlined" size="small" sx={{ whiteSpace: "nowrap" }}>
            Change default payment method
          </Button>
        </Link>
      </Box>
    </Stack>
  );
};

export default StripeDefaultPaymentMethodSummary;

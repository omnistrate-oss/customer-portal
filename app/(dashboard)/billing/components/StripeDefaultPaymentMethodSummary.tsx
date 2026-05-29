import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import { Box, Stack } from "@mui/material";

import Button from "src/components/Button/Button";
import LoadingSpinnerSmall from "src/components/CircularProgress/CircularProgress";
import { Text } from "src/components/Typography/Typography";
import useSnackbar from "src/hooks/useSnackbar";
import { colors } from "src/themeConfig";
// import type { ConsumptionPaymentMethod } from "src/types/consumption";
import { getPaymentMethodsRoute } from "src/utils/routes";

import usePaymentMethods from "../hooks/usePaymentMethods";
import useSetDefaultPaymentMethod from "../hooks/useSetDefaultPaymentMethod";

import { getErrorMessage, getPaymentMethodPrimaryLabel, getPaymentMethodSecondaryLabel } from "./paymentMethodUtils";

const PaymentMethodBadge = () => {
  return (
    <Box
      sx={{
        width: 46,
        height: 36,
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.gray50,
        border: `1px solid ${colors.gray200}`,
        flexShrink: 0,
      }}
    >
      <CreditCardIcon sx={{ fontSize: 20, color: colors.gray600 }} />
    </Box>
  );
};

type StripeDefaultPaymentMethodSummaryProps = {
  enabled: boolean;
  onDefaultPaymentMethodChanged: () => Promise<void> | void;
};

const StripeDefaultPaymentMethodSummary = ({
  enabled,
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

  if (!defaultPaymentMethod) {
    return (
      <Stack direction="row" gap="24px" justifyContent="space-between" alignItems="center" marginTop="16px">
        <Text size="small" weight="medium" color={colors.gray500}>
          Payment methods are not configured.
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
    <Stack direction="row" alignItems="center" gap="14px" marginTop="18px" minWidth={0}>
      <PaymentMethodBadge />
      <Box minWidth={0}>
        <Text size="medium" weight="semibold" color={colors.gray700} ellipsis maxWidth="320px">
          {getPaymentMethodPrimaryLabel(defaultPaymentMethod)}
        </Text>
        <Text size="small" weight="regular" color={colors.gray500} sx={{ mt: "4px" }}>
          {getPaymentMethodSecondaryLabel(defaultPaymentMethod)}
        </Text>
      </Box>
    </Stack>
  );
};

export default StripeDefaultPaymentMethodSummary;

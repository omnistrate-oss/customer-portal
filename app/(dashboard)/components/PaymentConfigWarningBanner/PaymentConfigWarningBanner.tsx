"use client";

import { FC } from "react";
import Link from "next/link";
import { Box, useTheme } from "@mui/material";
import useInstances from "app/(dashboard)/instances/hooks/useInstances";

import AlertTriangle from "src/components/Icons/AlertTriangle/AlertTriangle";
import { Text } from "src/components/Typography/Typography";
import { useGlobalData } from "src/providers/GlobalDataProvider";
import { colors } from "src/themeConfig";

const PaymentConfigWarningBanner: FC = () => {
  const { subscriptionsObj, isSubscriptionsPending } = useGlobalData();
  const { isPending: isInstancesPending, data: instances } = useInstances();
  const theme = useTheme();

  if (isInstancesPending || isSubscriptionsPending) return null;

  const subscriptionIds = new Set(
    instances?.flatMap((instance) => {
      const subscription = instance.subscriptionId ? subscriptionsObj[instance.subscriptionId] : undefined;
      return subscription?.roleType === "root" &&
        !subscription.paymentMethodConfigured &&
        !subscription.allowCreatesWhenPaymentNotConfigured
        ? [subscription.id]
        : [];
    })
  );
  if (subscriptionIds.size === 0) return null;

  const subscriptionName =
    subscriptionIds.size === 1 ? subscriptionsObj[Array.from(subscriptionIds)[0]]?.productTierName : undefined;

  return (
    <Box
      className="py-2 px-6 border-b text-center flex items-center gap-2 justify-center"
      sx={{ borderColor: colors.gray200, bgcolor: colors.warning50 }}
      data-testid="payment-config-warning"
    >
      <Box className="flex-shrink-0 self-start mt-0.5">
        <AlertTriangle />
      </Box>
      <Text size="small" weight="medium" color={theme.palette.warning.main}>
        {subscriptionName
          ? `${subscriptionName} subscription requires a payment method to continue running instances.`
          : "Some subscriptions require a payment method to continue running instances."}{" "}
        <Link className="underline underline-offset-4" href="/billing">
          Go to Billing
        </Link>
      </Text>
    </Box>
  );
};

export default PaymentConfigWarningBanner;

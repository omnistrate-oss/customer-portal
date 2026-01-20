"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "@mui/material";
import useBillingDetails from "app/(dashboard)/billing/hooks/useBillingDetails";
import useBillingStatus from "app/(dashboard)/billing/hooks/useBillingStatus";
import useInstances from "app/(dashboard)/instances/hooks/useInstances";

import AlertTriangle from "src/components/Icons/AlertTriangle/AlertTriangle";
import { Text } from "src/components/Typography/Typography";
import { useGlobalData } from "src/providers/GlobalDataProvider";
import { Subscription } from "src/types/subscription";

//Shows a payment config warning banner if there are instances running under subscriptions that require a payment method but no payment method is configured
function PaymentConfigWarningBanner() {
  const [showPaymentWarning, setShowPaymentWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState<ReactNode>("");
  const { subscriptionsObj, isSubscriptionsPending } = useGlobalData();
  const theme = useTheme();

  const billingStatusQuery = useBillingStatus();

  const isBillingEnabled = Boolean(billingStatusQuery.data?.enabled);

  const { isPending: isBillingDetailsPending, data: billingDetails } = useBillingDetails(isBillingEnabled);

  const isPaymentMethodConfigured = Boolean(billingDetails?.paymentConfigured);

  const { isPending: isInstancesPending, data: instances } = useInstances();

  useEffect(() => {
    if (!isInstancesPending && !isSubscriptionsPending && !isBillingDetailsPending) {
      if (!isPaymentMethodConfigured && instances && instances.length > 0) {
        const subscriptionsRequiringPayment = new Set<Subscription>();
        const instancesRequiringPaymentMethod = instances.filter((instance) => {
          const subscriptionId = instance.subscriptionId as string;
          const subscription = subscriptionsObj[subscriptionId];

          let requiresPayment = false;
          if (subscription && subscription.roleType === "root") {
            requiresPayment = !subscription.allowCreatesWhenPaymentNotConfigured;
            if (requiresPayment) {
              subscriptionsRequiringPayment.add(subscription);
            }
          }
          return requiresPayment;
        });

        const hasInstancesRequiringPaymentMethod = instancesRequiringPaymentMethod.length > 0;

        if (hasInstancesRequiringPaymentMethod) {
          /*
          show warning message in one of these formats
          {Subscription_Name} subsription requires a payment method to continue running instances. Go to Billing - single subscription
          Some subscriptions require a payment method to continue running instances. Go to Billing - multiple subscriptions
          */

          const subscriptionNames = Array.from(subscriptionsRequiringPayment).map((sub) => sub.productTierName);
          if (subscriptionNames.length === 1) {
            setWarningMessage(
              <>
                {`${subscriptionNames[0]} subscription requires a payment method to continue running instances.`}{" "}
                <Link className="underline underline-offset-4" href="/billing">
                  Go to Billing
                </Link>
              </>
            );
          } else {
            setWarningMessage(
              <>
                Some subscriptions require a payment method to continue running instances.{" "}
                <Link className="underline underline-offset-4" href="/billing">
                  Go to Billing
                </Link>
                .
              </>
            );
          }
          setShowPaymentWarning(true);
        } else {
          setShowPaymentWarning(false);
          setWarningMessage("");
        }
      } else {
        setShowPaymentWarning(false);
        setWarningMessage("");
      }
    }
  }, [
    instances,
    isInstancesPending,
    subscriptionsObj,
    isSubscriptionsPending,
    isBillingDetailsPending,
    isPaymentMethodConfigured,
  ]);

  if (!showPaymentWarning) {
    return null;
  }

  return (
    <div className="py-2 px-6 border-b border-[#E4E7EC] bg-[#FFFCF5] text-center flex items-center gap-2 justify-center">
      <div className="flex-shrink-0 self-start mt-0.5">
        <AlertTriangle />
      </div>
      <Text size="small" weight="medium" color={theme.palette.warning.main}>
        {warningMessage}
      </Text>
    </div>
  );
}

export default PaymentConfigWarningBanner;

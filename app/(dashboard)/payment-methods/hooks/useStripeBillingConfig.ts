import { useQuery } from "@tanstack/react-query";

import { getConsumptionStripeConfig } from "src/api/consumption";
import type { ConsumptionStripeConfigResponse } from "src/types/consumption";

export const stripeBillingConfigQueryKey = ["consumption-stripe-config"];

const getLocalStripeConfig = (): ConsumptionStripeConfigResponse | undefined => {
  if (process.env.NODE_ENV === "production" || !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return undefined;
  }

  return {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    stripeAccountId: process.env.NEXT_PUBLIC_STRIPE_ACCOUNT_ID,
  };
};

function useStripeBillingConfig(enabled = false) {
  return useQuery({
    queryKey: stripeBillingConfigQueryKey,
    queryFn: async () => {
      // const response = await getConsumptionStripeConfig();
      // return response.data;

      const localConfig = getLocalStripeConfig();

      try {
        const response = await getConsumptionStripeConfig();
        if (response.data.publishableKey) {
          return {
            ...response.data,
            stripeAccountId: response.data.stripeAccountId || localConfig?.stripeAccountId,
          };
        }
      } catch (error) {
        if (!localConfig) {
          throw error;
        }
      }

      if (!localConfig) {
        throw new Error("Stripe publishable key is not configured.");
      }

      return localConfig;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export default useStripeBillingConfig;

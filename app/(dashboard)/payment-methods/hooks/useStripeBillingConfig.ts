import { useQuery } from "@tanstack/react-query";

import { getConsumptionStripeConfig } from "src/api/consumption";

export const stripeBillingConfigQueryKey = ["consumption-stripe-config"];

function useStripeBillingConfig(enabled = false) {
  return useQuery({
    queryKey: stripeBillingConfigQueryKey,
    queryFn: async () => {
      const response = await getConsumptionStripeConfig();
      return response.data;
    },
    enabled,
  });
}

export default useStripeBillingConfig;

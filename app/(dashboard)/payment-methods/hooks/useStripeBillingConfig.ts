import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";

import { getConsumptionStripeConfig } from "src/api/consumption";
import { selectUserrootData } from "src/slices/userDataSlice";

export const getStripeBillingConfigQueryKey = (userId?: string) => ["consumption-stripe-config", userId];

function useStripeBillingConfig(enabled = false) {
  const selectUser = useSelector(selectUserrootData);
  const userId = selectUser?.id;

  return useQuery({
    queryKey: getStripeBillingConfigQueryKey(userId),
    queryFn: async () => {
      const response = await getConsumptionStripeConfig();
      return response.data;
    },
    enabled: enabled && Boolean(userId),
  });
}

export default useStripeBillingConfig;

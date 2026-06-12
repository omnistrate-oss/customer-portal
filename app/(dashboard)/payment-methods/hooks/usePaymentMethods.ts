import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";

import { listConsumptionPaymentMethods } from "src/api/consumption";
import { selectUserrootData } from "src/slices/userDataSlice";

export const getPaymentMethodsQueryKey = (userId?: string) => ["consumption-stripe-payment-methods", userId];

function usePaymentMethods(enabled = false) {
  const selectUser = useSelector(selectUserrootData);
  const userId = selectUser?.id;

  return useQuery({
    queryKey: getPaymentMethodsQueryKey(userId),
    queryFn: async () => {
      const response = await listConsumptionPaymentMethods();
      return response.data.paymentMethods || [];
    },
    enabled: enabled && Boolean(userId),
  });
}

export default usePaymentMethods;

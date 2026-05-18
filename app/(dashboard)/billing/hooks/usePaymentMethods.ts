import { useQuery } from "@tanstack/react-query";

import { listConsumptionPaymentMethods } from "src/api/consumption";

export const paymentMethodsQueryKey = ["consumption-stripe-payment-methods"];

function usePaymentMethods(enabled = false) {
  return useQuery({
    queryKey: paymentMethodsQueryKey,
    queryFn: async () => {
      const response = await listConsumptionPaymentMethods();
      return response.data.paymentMethods || [];
    },
    enabled,
    refetchOnWindowFocus: true,
  });
}

export default usePaymentMethods;

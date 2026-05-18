import { useMutation, useQueryClient } from "@tanstack/react-query";

import { removeConsumptionPaymentMethod } from "src/api/consumption";

import { paymentMethodsQueryKey } from "./usePaymentMethods";

function useRemovePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeConsumptionPaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentMethodsQueryKey });
      queryClient.invalidateQueries({ queryKey: ["consumption-billing-details"] });
    },
  });
}

export default useRemovePaymentMethod;

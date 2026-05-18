import { useMutation, useQueryClient } from "@tanstack/react-query";

import { setDefaultConsumptionPaymentMethod } from "src/api/consumption";

import { paymentMethodsQueryKey } from "./usePaymentMethods";

function useSetDefaultPaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setDefaultConsumptionPaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentMethodsQueryKey });
      queryClient.invalidateQueries({ queryKey: ["consumption-billing-details"] });
    },
  });
}

export default useSetDefaultPaymentMethod;

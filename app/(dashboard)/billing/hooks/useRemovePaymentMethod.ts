import { useMutation, useQueryClient } from "@tanstack/react-query";

import { removeConsumptionPaymentMethod } from "src/api/consumption";
import { ConsumptionPaymentMethod } from "src/types/consumption";

import { paymentMethodsQueryKey } from "./usePaymentMethods";

function useRemovePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeConsumptionPaymentMethod,
    onSuccess: (_response, paymentMethodId) => {
      queryClient.setQueryData<ConsumptionPaymentMethod[]>(paymentMethodsQueryKey, (paymentMethods) => {
        const removedMethod = paymentMethods?.find((method) => method.id === paymentMethodId);
        const remainingMethods = paymentMethods?.filter((method) => method.id !== paymentMethodId);

        if (!remainingMethods || !removedMethod?.isDefault || remainingMethods.length === 0) {
          return remainingMethods;
        }

        return remainingMethods.map((method, index) => ({
          ...method,
          isDefault: index === 0,
        }));
      });
    },
  });
}

export default useRemovePaymentMethod;

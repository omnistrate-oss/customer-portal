import { useMutation, useQueryClient } from "@tanstack/react-query";

import { setDefaultConsumptionPaymentMethod } from "src/api/consumption";
import { ConsumptionPaymentMethod } from "src/types/consumption";

import { paymentMethodsQueryKey } from "./usePaymentMethods";

function useSetDefaultPaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setDefaultConsumptionPaymentMethod,
    onSuccess: (_response, paymentMethodId) => {
      queryClient.setQueryData<ConsumptionPaymentMethod[]>(paymentMethodsQueryKey, (paymentMethods) => {
        return paymentMethods?.map((method) => ({
          ...method,
          isDefault: method.id === paymentMethodId,
        }));
      });
    },
  });
}

export default useSetDefaultPaymentMethod;

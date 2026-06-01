import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";

import { setDefaultConsumptionPaymentMethod } from "src/api/consumption";
import { selectUserrootData } from "src/slices/userDataSlice";
import { ConsumptionPaymentMethod } from "src/types/consumption";

import { getPaymentMethodsQueryKey } from "./usePaymentMethods";

function useSetDefaultPaymentMethod() {
  const queryClient = useQueryClient();
  const selectUser = useSelector(selectUserrootData);
  const userId = selectUser?.id;
  const paymentMethodsQueryKey = getPaymentMethodsQueryKey(userId);

  return useMutation({
    mutationFn: setDefaultConsumptionPaymentMethod,
    onSuccess: (_response, paymentMethodId) => {
      queryClient.setQueryData<ConsumptionPaymentMethod[]>(paymentMethodsQueryKey, (paymentMethods) => {
        if (!paymentMethods?.some((method) => method.id === paymentMethodId)) {
          return paymentMethods;
        }

        return paymentMethods?.map((method) => ({
          ...method,
          isDefault: method.id === paymentMethodId,
        }));
      });
      queryClient.invalidateQueries({ queryKey: paymentMethodsQueryKey });
    },
  });
}

export default useSetDefaultPaymentMethod;

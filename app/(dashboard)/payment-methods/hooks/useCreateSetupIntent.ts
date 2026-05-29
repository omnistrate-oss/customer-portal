import { useMutation } from "@tanstack/react-query";

import { createConsumptionSetupIntent } from "src/api/consumption";

function useCreateSetupIntent() {
  return useMutation({
    mutationFn: async () => {
      const response = await createConsumptionSetupIntent();
      return response.data;
    },
  });
}

export default useCreateSetupIntent;

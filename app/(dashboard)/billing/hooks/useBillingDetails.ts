import { useQuery } from "@tanstack/react-query";

import { getBillingDetails } from "src/api/consumption";

function useBillingDetails(isBillingEnabled = false) {
  const baseURL = typeof window !== "undefined" ? `${window.location.origin}/billing` : "";

  const query = useQuery({
    queryKey: ["consumption-billing-details", baseURL],
    queryFn: async () => {
      const response = await getBillingDetails({
        returnUrl: baseURL,
      });

      return response.data;
    },
    enabled: isBillingEnabled,
  });

  return query;
}

export default useBillingDetails;

import { $api } from "src/api/query";

import { isMarketplaceBillingProvider } from "../../components/BillingProviders/BillingProviderLabel";

const useBillingDetails = (isBillingEnabled = false) => {
  const returnUrl = typeof window !== "undefined" ? `${window.location.origin}/billing` : "";

  return $api.useQuery(
    "get",
    "/2022-09-01-00/resource-instance/billing-details",
    {
      params: { query: { returnUrl, supportsCustomPaymentPortal: true } },
      headers: { "x-ignore-global-error": true },
    },
    {
      enabled: isBillingEnabled,
      refetchOnWindowFocus: true,
      select: (data) =>
        data.billingProviders?.some(
          (provider) => provider.type !== "MARKETPLACE" && isMarketplaceBillingProvider(provider.type)
        )
          ? { ...data, billingProviders: data.billingProviders.filter((provider) => provider.type !== "MARKETPLACE") }
          : data,
    }
  );
};

export default useBillingDetails;

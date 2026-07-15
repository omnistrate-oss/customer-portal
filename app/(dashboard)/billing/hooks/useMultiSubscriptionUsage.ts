import { useQuery } from "@tanstack/react-query";

import { getConsumptionUsage } from "src/api/consumption";

import { BillingUsageTotals, getUsageDimensionTotals } from "../utils/usageDimensions";

function useMultiSubscriptionUsage(queryParams: { subscriptionIds: string[] }) {
  const { subscriptionIds = [] } = queryParams;

  const enabled = subscriptionIds.length > 0;

  const query = useQuery({
    queryKey: ["multi-subscription-consumption", subscriptionIds],
    queryFn: async () => {
      const subscriptionUsageDataMap: Record<
        string,
        BillingUsageTotals
      > = {};

      await Promise.all(
        subscriptionIds.map((subscriptionId) =>
          getConsumptionUsage({ subscriptionID: subscriptionId }).then((response) => {
            const usage = response.data.usage || [];
            subscriptionUsageDataMap[subscriptionId] = getUsageDimensionTotals(usage);
          })
        )
      );

      return subscriptionUsageDataMap;
    },
    enabled: enabled,
  });

  return query;
}

export default useMultiSubscriptionUsage;

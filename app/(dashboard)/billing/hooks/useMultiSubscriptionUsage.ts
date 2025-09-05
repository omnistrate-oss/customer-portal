import { useQuery } from "@tanstack/react-query";

import { getConsumptionUsage } from "src/api/consumption";

function useMultiSubscriptionUsage(queryParams: { subscriptionIds: string[] }) {
  const { subscriptionIds = [] } = queryParams;

  const enabled = subscriptionIds.length > 0;

  const query = useQuery({
    queryKey: ["multi-subscription-consumption", subscriptionIds],
    queryFn: async () => {
      const subscriptionUsageDataMap: Record<
        string,
        {
          storageGiBHours: number;
          memoryGiBHours: number;
          cpuCoreHours: number;
          replicaHours: number;
        }
      > = {};

      await Promise.all(
        subscriptionIds.map((subscriptionId) =>
          getConsumptionUsage({ subscriptionID: subscriptionId }).then((response) => {
            const usage = response.data.usage || [];

            const usageData = {
              storageGiBHours: 0,
              memoryGiBHours: 0,
              cpuCoreHours: 0,
              replicaHours: 0,
            };
            usage.forEach((usageDatapoint) => {
              //aggregate storage cpu and memory data points
              const { dimension, total } = usageDatapoint;
              if (total) {
                if (dimension === "Memory GiB hours") {
                  usageData.memoryGiBHours = total;
                } else if (dimension === "Storage GiB hours") {
                  usageData.storageGiBHours = total;
                } else if (dimension === "CPU core hours") {
                  usageData.cpuCoreHours = total;
                } else if (dimension === "Replica hours") {
                  usageData.replicaHours = total;
                }
              }
            });

            subscriptionUsageDataMap[subscriptionId] = usageData;
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

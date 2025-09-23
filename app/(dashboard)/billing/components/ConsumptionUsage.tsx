import { FC, useMemo, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { Collapse } from "@mui/material";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import Button from "src/components/Button/Button";
import { Text } from "src/components/Typography/Typography";
import { useGlobalData } from "src/providers/GlobalDataProvider";
import { ConsumptionUsage as ConsumptionUsageData, UsageDimension } from "src/types/consumption";

import useMultiSubscriptionUsage from "../hooks/useMultiSubscriptionUsage";

import SubscriptionUsageTable, { SubscriptionUsageRow } from "./SubscriptionUsageTable";
import UsageDimensionCard from "./UsageDimensionCard";

dayjs.extend(utc);

type ConsumptionUsageProps = {
  // consumptionUsagePerDayData: ConsumptionUsagePerDay | undefined;
  consumptionUsageData: ConsumptionUsageData | undefined;
};

const ConsumptionUsage: FC<ConsumptionUsageProps> = (props) => {
  const { consumptionUsageData } = props;
  const [showUsageBreakdown, setShowUsageBreakdown] = useState(false);

  const aggregatedConsumptionDataHash = useMemo(() => {
    const hash: Record<
      UsageDimension,
      {
        total: number;
      }
    > = {
      "Memory GiB hours": {
        total: 0,
      },
      "Storage GiB hours": {
        total: 0,
      },
      "CPU core hours": {
        total: 0,
      },
      "Replica hours": {
        total: 0,
      },
    };

    const usage = consumptionUsageData?.usage || [];

    usage.forEach((usageDatapoint) => {
      const { dimension, total } = usageDatapoint;
      if (dimension) {
        if (hash[dimension]) {
          hash[dimension] = {
            total: hash[dimension].total + (total !== undefined ? total : 0),
          };
        } else {
          hash[usageDatapoint.dimension as string] = {
            total: total !== undefined ? total : 0,
          };
        }
      }
    });

    return hash;
  }, [consumptionUsageData]);

  const { subscriptions } = useGlobalData();

  const rootSubscriptions = useMemo(() => {
    return subscriptions
      .filter((subscription) => {
        return subscription.roleType === "root";
      })
      .sort((subscriptionA, subscriptionB) =>
        subscriptionA.productTierName.toLowerCase() < subscriptionB.productTierName.toLowerCase() ? -1 : 1
      );
  }, [subscriptions]);

  const subscriptionIds = useMemo(() => rootSubscriptions.map((subscription) => subscription.id), [rootSubscriptions]);

  const {
    data: subscriptionUsageHashmap,
    isFetched: isSubscriptionUsageFetched,
    isPending: isSubscriptionsUsagePending,
  } = useMultiSubscriptionUsage({
    subscriptionIds,
  });

  const rows = useMemo(() => {
    let rows: SubscriptionUsageRow[] = [];
    if (isSubscriptionUsageFetched && subscriptionUsageHashmap) {
      rows = rootSubscriptions.map((subscription) => {
        const { id, serviceName, serviceLogoURL, productTierName, serviceId } = subscription;
        const usageData = subscriptionUsageHashmap[id] || {
          cpuCoreHours: 0,
          memoryGiBHours: 0,
          storageGiBHours: 0,
          podHours: 0,
        };
        const rowData: SubscriptionUsageRow = {
          subscriptionId: id,
          serviceId: serviceId,
          cpuCoreHours: usageData.cpuCoreHours,
          memoryGiBHours: usageData.memoryGiBHours,
          storageGiBHours: usageData.storageGiBHours,
          replicaHours: usageData.replicaHours,
          serviceName: serviceName,
          subscriptionPlanName: productTierName,
          serviceLogoURL: serviceLogoURL,
        };
        return rowData;
      });
    }

    return rows;
  }, [isSubscriptionUsageFetched, subscriptionUsageHashmap, rootSubscriptions]);

  return (
    <div
      className="mt-[20px] border border-[#E9EAEB] rounded-[12px] bg-[#FFF]"
      style={{ boxShadow: "0px 1px 2px 0px var(#0A0D120D)" }}
    >
      <div className="py-[20px] px-[24px]">
        <div className="flex flex-row items-center justify-between">
          <div>
            <Text size="large" weight="semibold" color="#181D27">
              Current Usage
            </Text>
            <Text size="xsmall" weight="medium" color="#414651">
              Usage This Month{" "}
              {consumptionUsageData?.endTime &&
                `(Until ${dayjs.utc(consumptionUsageData?.endTime).format("MMM DD, YYYY, HH:mm:ss")} UTC)`}
            </Text>
          </div>
          <Button
            variant="outlined"
            startIcon={showUsageBreakdown ? <RemoveIcon /> : <AddIcon />}
            onClick={() => {
              setShowUsageBreakdown((prev) => !prev);
            }}
          >
            {showUsageBreakdown ? "Hide" : "Show"} Usage Breakdown
          </Button>
        </div>
      </div>
      <div className="border-t border-[#E9EAEB] py-3 px-6">
        <div className="flex gap-x-3 justify-center max-w-[900px] mx-auto">
          <UsageDimensionCard
            title="Memory Usage"
            dimensionName="Memory GiB hours"
            value={aggregatedConsumptionDataHash["Memory GiB hours"].total}
          />
          <UsageDimensionCard
            title="Storage Usage"
            dimensionName="Storage GiB hours"
            value={aggregatedConsumptionDataHash["Storage GiB hours"].total}
          />
          <UsageDimensionCard
            title="CPU Usage"
            dimensionName="CPU core hours"
            value={aggregatedConsumptionDataHash["CPU core hours"].total}
          />
          <UsageDimensionCard
            title="Replicas Usage"
            dimensionName="Replica hours"
            value={aggregatedConsumptionDataHash["Replica hours"].total}
          />
        </div>
      </div>
      <Collapse in={showUsageBreakdown}>
        <SubscriptionUsageTable rows={rows} isSubscriptionsUsagePending={isSubscriptionsUsagePending} />
      </Collapse>
    </div>
  );
};

export default ConsumptionUsage;

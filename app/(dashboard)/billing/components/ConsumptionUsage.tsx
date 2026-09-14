import { FC, useCallback, useMemo, useState } from "react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { Collapse } from "@mui/material";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import Button from "src/components/Button/Button";
import { Text } from "src/components/Typography/Typography";
import useProductTierCustomMetrics from "src/hooks/query/useProductTierCustomMetrics";
import { useGlobalData } from "src/providers/GlobalDataProvider";
import { ConsumptionUsage as ConsumptionUsageData } from "src/types/consumption";

import useMultiSubscriptionUsage from "../hooks/useMultiSubscriptionUsage";
import {
  billingUsageDimensionFields,
  createUsageMetricValues,
  getUsageMetricRegistry,
  getUsageMetricValues,
} from "../utils/usageDimensions";

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
  const [showAdditionalMetrics, setShowAdditionalMetrics] = useState(false);
  const [fixedMetricInlineOverflow, setFixedMetricInlineOverflow] = useState<Record<string, boolean>>({});

  const handleFixedMetricInlineOverflowChange = useCallback((dimensionName: string, overflows: boolean) => {
    setFixedMetricInlineOverflow((currentOverflow) => {
      if (currentOverflow[dimensionName] === overflows) return currentOverflow;
      return { ...currentOverflow, [dimensionName]: overflows };
    });
  }, []);

  const forceFixedMetricUnitsBelow = Object.values(fixedMetricInlineOverflow).some(Boolean);

  const aggregatedConsumptionDataHash = useMemo(() => {
    return getUsageMetricValues(consumptionUsageData?.usage || []);
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

  const { data: productTierCustomMetricsData } = useProductTierCustomMetrics(subscriptionIds);

  const {
    data: subscriptionUsageHashmap,
    isFetched: isSubscriptionUsageFetched,
    isPending: isSubscriptionsUsagePending,
  } = useMultiSubscriptionUsage({
    subscriptionIds,
  });

  const configuredMetricNamesByProductTierId = useMemo(() => {
    return Object.entries(productTierCustomMetricsData?.productTiers ?? {}).reduce<Record<string, ReadonlySet<string>>>(
      (configuredMetrics, [productTierId, productTier]) => {
        configuredMetrics[productTierId] = new Set(productTier.metrics.map((metric) => metric.name));
        return configuredMetrics;
      },
      {}
    );
  }, [productTierCustomMetricsData]);

  const configuredCustomMetricNames = useMemo(() => {
    return rootSubscriptions.flatMap(
      (subscription) =>
        productTierCustomMetricsData?.productTiers[subscription.productTierId]?.metrics.map((metric) => metric.name) ??
        []
    );
  }, [productTierCustomMetricsData, rootSubscriptions]);

  const observedDimensions = useMemo(() => {
    const aggregateDimensions = Object.keys(aggregatedConsumptionDataHash);
    const subscriptionDimensions = Object.values(subscriptionUsageHashmap ?? {}).flatMap((metricValues) =>
      Object.keys(metricValues)
    );

    return [...aggregateDimensions, ...subscriptionDimensions];
  }, [aggregatedConsumptionDataHash, subscriptionUsageHashmap]);

  const { additionalFields: additionalMetricFields } = useMemo(
    () => getUsageMetricRegistry(configuredCustomMetricNames, observedDimensions),
    [configuredCustomMetricNames, observedDimensions]
  );

  const rows = useMemo(() => {
    let rows: SubscriptionUsageRow[] = [];
    if (isSubscriptionUsageFetched && subscriptionUsageHashmap) {
      rows = rootSubscriptions.map((subscription) => {
        const { id, serviceName, serviceLogoURL, productTierId, productTierName, serviceId } = subscription;
        const rowData: SubscriptionUsageRow = {
          subscriptionId: id,
          serviceId: serviceId,
          productTierId,
          metricValues: subscriptionUsageHashmap[id] || createUsageMetricValues(),
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
    <div className="mt-[20px]">
      <div className="pb-2 pt-4 border-b border-[#E9EAEB]">
        <div className="flex flex-row items-center justify-between">
          <div>
            <Text size="medium" weight="semibold" color="#181D27">
              Current Usage
            </Text>
            <Text size="xsmall" weight="regular" color="#535862">
              Usage This Month{" "}
              {consumptionUsageData?.endTime &&
                `(Until ${dayjs.utc(consumptionUsageData?.endTime).format("MMM DD, YYYY, HH:mm:ss")} UTC)`}
            </Text>
          </div>
          <Button
            variant="outlined"
            onClick={() => {
              setShowUsageBreakdown((prev) => !prev);
            }}
            fontColor={"#5925DC"}
            outlineColor={"#5925DC"}
          >
            {showUsageBreakdown ? "Hide" : "Show"} Usage Breakdown
          </Button>
        </div>
      </div>
      <div className=" py-3">
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {billingUsageDimensionFields.map((field) => (
            <UsageDimensionCard
              key={field.dimension}
              title={field.title}
              dimensionName={field.dimension}
              value={aggregatedConsumptionDataHash[field.dimension] ?? 0}
              forceUnitBelow={forceFixedMetricUnitsBelow}
              onInlineValueOverflowChange={handleFixedMetricInlineOverflowChange}
            />
          ))}
        </div>
        {additionalMetricFields.length > 0 && (
          <div className="mt-3">
            <div className="flex justify-end">
              <Button
                endIcon={showAdditionalMetrics ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                onClick={() => setShowAdditionalMetrics((visible) => !visible)}
              >
                {showAdditionalMetrics ? "Hide additional metrics" : "Show additional metrics"}
              </Button>
            </div>
            <Collapse in={showAdditionalMetrics}>
              <div className="mt-3 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
                {additionalMetricFields.map((field) => (
                  <UsageDimensionCard
                    key={field.dimension}
                    title={field.title}
                    dimensionName={field.dimension}
                    unit={field.unit}
                    value={aggregatedConsumptionDataHash[field.dimension] ?? 0}
                  />
                ))}
              </div>
            </Collapse>
          </div>
        )}
      </div>
      <Collapse in={showUsageBreakdown}>
        <SubscriptionUsageTable
          rows={rows}
          isSubscriptionsUsagePending={isSubscriptionsUsagePending}
          additionalMetricFields={additionalMetricFields}
          configuredMetricNamesByProductTierId={configuredMetricNamesByProductTierId}
          showAdditionalMetrics={showAdditionalMetrics}
        />
      </Collapse>
    </div>
  );
};

export default ConsumptionUsage;

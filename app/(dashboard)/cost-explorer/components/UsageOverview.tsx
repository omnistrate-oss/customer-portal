import { FC, useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import _ from "lodash";

import { DateRange, DateTimePickerPopover } from "src/components/DateRangePicker/DateTimeRangePickerStatic";
import MenuItem from "src/components/FormElementsv2/MenuItem/MenuItem";
import Select from "src/components/FormElementsv2/Select/Select";
import { Text } from "src/components/Typography/Typography";
import { useGlobalData } from "src/providers/GlobalDataProvider";
import { SetState } from "src/types/common/reactGenerics";
import { ConsumptionUsagePerDay } from "src/types/consumption";
import type { ProductTierCustomMetricsResponse } from "src/types/productTierCustomMetrics";
import { ServiceOffering } from "src/types/serviceOffering";

import ConsumptionUsageChart from "../../billing/components/ConsumptionUsageChart";
import { getUsageMetricRegistry } from "../../billing/utils/usageDimensions";
import { ENABLE_COST_EXPLORER_METRIC_VISIBILITY_CONTROLS } from "../constants";
import { getVisibleMetricFields, reconcileSelectedMetricNames } from "../utils/metricVisibility";

import MetricVisibilitySelector from "./MetricVisibilitySelector";

dayjs.extend(utc);

type UsageOverviewProps = {
  consumptionUsagePerDayData: ConsumptionUsagePerDay | undefined;
  productTierCustomMetricsData: ProductTierCustomMetricsResponse | undefined;
  isFetchingUsagePerDay: boolean;
  dateRange: DateRange;
  setDateRange: SetState<DateRange>;
  initialDateRangeState: DateRange;
  selectedSubscriptionId: string | null;
  setSelectedSubscriptionId: SetState<string | null>;
};

const UsageOverview: FC<UsageOverviewProps> = (props) => {
  const {
    consumptionUsagePerDayData,
    productTierCustomMetricsData,
    isFetchingUsagePerDay,
    dateRange,
    setDateRange,
    initialDateRangeState,
    selectedSubscriptionId,
    setSelectedSubscriptionId,
  } = props;
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedAdditionalMetricNames, setSelectedAdditionalMetricNames] = useState<string[]>([]);
  const pendingSubscriptionScopeRef = useRef<string | null>(null);
  const lastProcessedUsageScopeRef = useRef(selectedSubscriptionId || "all-subscriptions");
  const { subscriptions, serviceOfferings } = useGlobalData();

  const rootSubscriptions = useMemo(
    () =>
      subscriptions
        .filter((subscription) => subscription.roleType === "root")
        .sort((left, right) => left.productTierName.localeCompare(right.productTierName)),
    [subscriptions]
  );

  const servicePlansGroupedByServiceId: Record<string, (ServiceOffering & { subscriptionId: string })[]> =
    useMemo(() => {
      const servicePlansGroupedByServiceId: Record<string, (ServiceOffering & { subscriptionId: string })[]> = {};

      rootSubscriptions.forEach((subscription) => {
        const serviceOffering = serviceOfferings.find(
          (offering) => offering.productTierID === subscription.productTierId
        );

        const serviceId = subscription.serviceId;
        if (serviceOffering) {
          if (serviceId in servicePlansGroupedByServiceId) {
            servicePlansGroupedByServiceId[serviceId].push({
              ...serviceOffering,
              subscriptionId: subscription.id,
            });
          } else {
            servicePlansGroupedByServiceId[serviceId] = [{ ...serviceOffering, subscriptionId: subscription.id }];
          }
        }
      });

      return servicePlansGroupedByServiceId;
    }, [rootSubscriptions, serviceOfferings]);

  const rootSubscriptionServices: { serviceId; serviceName }[] = useMemo(() => {
    const rootSubscriptionServices = rootSubscriptions.map((subscription) => ({
      serviceId: subscription.serviceId,
      serviceName: subscription.serviceName,
    }));

    const deduplicated = _.uniqBy(rootSubscriptionServices, "serviceId");

    const services = deduplicated
      .filter((service) => (service.serviceId in servicePlansGroupedByServiceId ? true : false))
      .sort((serviceA, serviceB) => (serviceA.serviceName.toLowerCase() < serviceB.serviceName.toLowerCase() ? -1 : 1));

    return services;
  }, [rootSubscriptions, servicePlansGroupedByServiceId]);

  // Contains custom metric names configured on the product tiers in the current subscription scope.
  // This may include names that have no usage in the selected date range and may contain duplicates across tiers.
  const configuredCustomMetricNames = useMemo(() => {
    const scopedSubscriptions = selectedSubscriptionId
      ? rootSubscriptions.filter((subscription) => subscription.id === selectedSubscriptionId)
      : rootSubscriptions;

    return scopedSubscriptions.flatMap(
      (subscription) =>
        productTierCustomMetricsData?.productTiers[subscription.productTierId]?.metrics.map((metric) => metric.name) ??
        []
    );
  }, [productTierCustomMetricsData, rootSubscriptions, selectedSubscriptionId]);

  // Contains every metric name returned by the current usage response, including fixed metrics,
  // configured custom metrics with usage, and unconfigured legacy/observed-only metrics.
  const observedDimensions = useMemo(
    () =>
      (consumptionUsagePerDayData?.usage ?? []).flatMap((usage) =>
        typeof usage.dimension === "string" && usage.dimension ? [usage.dimension] : []
      ),
    [consumptionUsagePerDayData]
  );

  // Contains metrics currently available from product-tier configuration or the current usage response.
  const availableMetricRegistry = useMemo(
    () => getUsageMetricRegistry(configuredCustomMetricNames, observedDimensions),
    [configuredCustomMetricNames, observedDimensions]
  );

  const subscriptionScope = selectedSubscriptionId || "all-subscriptions";

  useEffect(() => {
    if (lastProcessedUsageScopeRef.current === subscriptionScope) return;

    lastProcessedUsageScopeRef.current = subscriptionScope;
    pendingSubscriptionScopeRef.current = subscriptionScope;
  }, [subscriptionScope]);

  useEffect(() => {
    if (
      !ENABLE_COST_EXPLORER_METRIC_VISIBILITY_CONTROLS ||
      isFetchingUsagePerDay ||
      pendingSubscriptionScopeRef.current !== subscriptionScope
    ) {
      return;
    }

    setSelectedAdditionalMetricNames((selectedNames) =>
      reconcileSelectedMetricNames(selectedNames, availableMetricRegistry.additionalFields)
    );
    pendingSubscriptionScopeRef.current = null;
  }, [availableMetricRegistry.additionalFields, isFetchingUsagePerDay, subscriptionScope]);

  // Includes selected observed-only metrics even if they disappear after a date-range change, so they remain
  // selectable and render as an empty series until the subscription scope changes.
  const selectableMetricRegistry = useMemo(
    () =>
      getUsageMetricRegistry(configuredCustomMetricNames, [...observedDimensions, ...selectedAdditionalMetricNames]),
    [configuredCustomMetricNames, observedDimensions, selectedAdditionalMetricNames]
  );

  // Contains the metric definitions rendered by the chart. Controls disabled means all available metrics;
  // controls enabled means the six fixed metrics plus the user's selected additional metrics.
  const visibleMetricFields = useMemo(
    () =>
      getVisibleMetricFields({
        controlsEnabled: ENABLE_COST_EXPLORER_METRIC_VISIBILITY_CONTROLS,
        availableMetricRegistry,
        selectableMetricRegistry,
        selectedAdditionalMetricNames,
      }),
    [availableMetricRegistry, selectableMetricRegistry, selectedAdditionalMetricNames]
  );

  const serviceOptions = [{ serviceName: "All Products", serviceId: "" }, ...rootSubscriptionServices];

  let servicePlanOptions = [{ label: "All Subscription Plans", value: "" }];
  if (selectedServiceId) {
    servicePlanOptions = servicePlansGroupedByServiceId[selectedServiceId].map((servicePlan) => ({
      label: servicePlan.productTierName,
      value: servicePlan.subscriptionId,
    }));
  }

  return (
    <div
      className="mt-5 border border-[#E9EAEB] rounded-3 bg-[#FFF]"
      style={{ boxShadow: "0px 1px 2px 0px #0A0D120D" }}
    >
      <div className="py-5 px-6">
        <div className="flex flex-row items-center justify-between gap-4">
          <div>
            <Text size="large" weight="semibold" color="#181D27">
              Cost and usage graph{" "}
            </Text>
            <Text size="xsmall" weight="medium" color="#414651">
              Usage by Product or subscription plan.{" "}
            </Text>
          </div>
          <div className="flex items-center gap-3">
            <DateTimePickerPopover
              dateRange={dateRange}
              setDateRange={setDateRange}
              hideClearButton={true}
              selectionType="date"
              initialDateRange={initialDateRangeState}
            />

            <Select
              sx={{ marginTop: "0px", width: "260px", maxHeight: "40px" }}
              value={selectedServiceId}
              displayEmpty
              onChange={(event) => {
                const serviceId = event.target.value;
                setSelectedServiceId(serviceId);
                if (!serviceId) {
                  setSelectedSubscriptionId("");
                } else {
                  //select first available subscription
                  const subscriptionId = servicePlansGroupedByServiceId[serviceId][0].subscriptionId;
                  setSelectedSubscriptionId(subscriptionId);
                }
              }}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 400,
                  },
                },
              }}
            >
              {serviceOptions.map((option) => {
                return (
                  <MenuItem value={option.serviceId} key={option.serviceId}>
                    {option.serviceName}
                  </MenuItem>
                );
              })}
            </Select>

            <Select
              sx={{ marginTop: "0px", width: "260px", maxHeight: 40 }}
              value={selectedSubscriptionId}
              displayEmpty
              onChange={(event) => {
                const subscriptionId = event.target.value;
                setSelectedSubscriptionId(subscriptionId);
              }}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 400,
                  },
                },
              }}
            >
              {servicePlanOptions.map((option) => {
                return (
                  <MenuItem value={option.value} key={option.value}>
                    {option.label}
                  </MenuItem>
                );
              })}
            </Select>
          </div>
        </div>
        {ENABLE_COST_EXPLORER_METRIC_VISIBILITY_CONTROLS && selectableMetricRegistry.additionalFields.length > 0 && (
          <div className="mt-4 flex justify-end">
            <MetricVisibilitySelector
              metricFields={selectableMetricRegistry.additionalFields}
              selectedMetricNames={selectedAdditionalMetricNames}
              onChange={setSelectedAdditionalMetricNames}
            />
          </div>
        )}
      </div>
      <div className="border-t border-[#E9EAEB] py-3 px-6">
        <ConsumptionUsageChart
          usagePerDayData={consumptionUsagePerDayData}
          isFetchingUsagePerDay={isFetchingUsagePerDay}
          metricFields={visibleMetricFields}
        />
      </div>
    </div>
  );
};

export default UsageOverview;

import { FC, useMemo, useState } from "react";
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
import { ServiceOffering } from "src/types/serviceOffering";

import ConsumptionUsageChart from "../../billing/components/ConsumptionUsageChart";

dayjs.extend(utc);

type UsageOverviewProps = {
  consumptionUsagePerDayData: ConsumptionUsagePerDay | undefined;
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
    isFetchingUsagePerDay,
    dateRange,
    setDateRange,
    initialDateRangeState,
    selectedSubscriptionId,
    setSelectedSubscriptionId,
  } = props;
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const { subscriptions, serviceOfferings } = useGlobalData();

  const servicePlansGroupedByServiceId: Record<string, (ServiceOffering & { subscriptionId: string })[]> =
    useMemo(() => {
      const rootSubscriptions = subscriptions
        .filter((subscription) => {
          return subscription.roleType === "root";
        })
        .sort((subscriptionA, subscriptionB) =>
          subscriptionA.productTierName.toLowerCase() < subscriptionB.productTierName.toLowerCase() ? -1 : 1
        );

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
    }, [subscriptions, serviceOfferings]);

  const rootSubscriptionServices: { serviceId; serviceName }[] = useMemo(() => {
    const rootSubscriptionServices = subscriptions
      .filter((subscription) => {
        return subscription.roleType === "root";
      })
      .map((subscription) => ({
        serviceId: subscription.serviceId,
        serviceName: subscription.serviceName,
      }));

    const deduplicated = _.uniqBy(rootSubscriptionServices, "serviceId");

    const services = deduplicated
      .filter((service) => (service.serviceId in servicePlansGroupedByServiceId ? true : false))
      .sort((serviceA, serviceB) => (serviceA.serviceName.toLowerCase() < serviceB.serviceName.toLowerCase() ? -1 : 1));

    return services;
  }, [subscriptions, servicePlansGroupedByServiceId]);

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
      </div>
      <div className="border-t border-[#E9EAEB] py-3 px-6">
        <ConsumptionUsageChart
          usagePerDayData={consumptionUsagePerDayData}
          isFetchingUsagePerDay={isFetchingUsagePerDay}
        />
      </div>
    </div>
  );
};

export default UsageOverview;

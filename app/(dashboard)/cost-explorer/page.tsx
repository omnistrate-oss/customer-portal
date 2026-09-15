"use client";

import { useMemo, useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useSelector } from "react-redux";

import { DateRange } from "src/components/DateRangePicker/DateTimeRangePickerStatic";
import LoadingSpinner from "src/components/LoadingSpinner/LoadingSpinner";
import useProductTierCustomMetrics from "src/hooks/query/useProductTierCustomMetrics";
import { useGlobalData } from "src/providers/GlobalDataProvider";
import { selectUserrootData } from "src/slices/userDataSlice";
import { getEndOfCurrentUTCDay, getFirstDayOfUTCMonth } from "src/utils/time";

import useConsumptionUsagePerDay from "../billing/hooks/useConsumptionUsagePerDay";
import AccountManagementHeader from "../components/AccountManagement/AccountManagementHeader";
import CostExplorerIcon from "../components/Icons/CostExplorer";
import PageContainer from "../components/Layout/PageContainer";
import PageTitle from "../components/Layout/PageTitle";

import UsageOverview from "./components/UsageOverview";
dayjs.extend(utc);

const defaultDailyDateRange = {
  startDate: getFirstDayOfUTCMonth(),
  endDate: getEndOfCurrentUTCDay(),
};

function CostExplorerPage() {
  const selectUser = useSelector(selectUserrootData);
  const { subscriptions, isSubscriptionsPending } = useGlobalData();
  const [dateRange, setDateRange] = useState<DateRange>(defaultDailyDateRange);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string>("");

  let filterEndDate;
  if (dateRange.endDate) {
    //add 1 day to end date to get data, otherwise backend doesn't send the data for last date
    filterEndDate = dayjs.utc(dateRange.endDate).add(1, "day").toISOString();
  }

  const {
    data: usagePerDayData,
    isFetching: isFetchingUsagePerDay,
    isLoading: isLoadingUsagePerDay,
  } = useConsumptionUsagePerDay({
    startDate: dateRange.startDate,
    endDate: filterEndDate,
    subscriptionID: selectedSubscriptionId.trim() !== "" ? selectedSubscriptionId : undefined,
  });

  const rootSubscriptionIds = useMemo(
    () =>
      subscriptions.filter((subscription) => subscription.roleType === "root").map((subscription) => subscription.id),
    [subscriptions]
  );
  const { data: productTierCustomMetricsData, isLoading: isProductTierCustomMetricsLoading } =
    useProductTierCustomMetrics(rootSubscriptionIds);

  //show page spinner only on initial load
  const isInitialLoad =
    isSubscriptionsPending ||
    isProductTierCustomMetricsLoading ||
    (isLoadingUsagePerDay &&
      !selectedSubscriptionId.trim() &&
      dateRange.startDate === defaultDailyDateRange.startDate &&
      dateRange.endDate === defaultDailyDateRange.endDate);

  return (
    <div>
      <AccountManagementHeader userName={selectUser?.name} userEmail={selectUser?.email} />
      <PageContainer>
        <PageTitle icon={CostExplorerIcon} className="mb-6">
          Cost Explorer
        </PageTitle>
        {isInitialLoad ? (
          <LoadingSpinner />
        ) : (
          <UsageOverview
            consumptionUsagePerDayData={usagePerDayData}
            productTierCustomMetricsData={productTierCustomMetricsData}
            isFetchingUsagePerDay={isFetchingUsagePerDay}
            dateRange={dateRange}
            setDateRange={setDateRange}
            initialDateRangeState={defaultDailyDateRange}
            selectedSubscriptionId={selectedSubscriptionId}
            setSelectedSubscriptionId={setSelectedSubscriptionId}
          />
        )}
      </PageContainer>
    </div>
  );
}

export default CostExplorerPage;

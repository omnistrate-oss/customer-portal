"use client";

import { useEffect, useState } from "react";

import { COLUMN_PREFERENCE_TABLE_IDS } from "src/components/ColumnPreference/tableIds";
import { DateRange } from "src/components/DateRangePicker/DateTimeRangePickerStatic";
import { useGlobalData } from "src/providers/GlobalDataProvider";
import type { SetState } from "src/types/common/reactGenerics";
import { EventType } from "src/types/event";
import { initialRangeState } from "components/DateRangePicker/DateTimeRangePickerStatic";

import EventsTable from "../components/EventsTable/EventsTable";
import AuditLogsIcon from "../components/Icons/AuditLogsIcon";
import PageContainer from "../components/Layout/PageContainer";
import PageTitle from "../components/Layout/PageTitle";

import EventsTableHeader from "./components/EventsTableHeader";
import useAuditLogs from "./hooks/useAuditLogs";

const EventsPage = () => {
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>(initialRangeState);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedEventTypes, setSelectedEventTypes] = useState<EventType[]>([]);

  const handleSelectedEventTypesChange: SetState<EventType[]> = (value) => {
    setPageIndex(0);
    setSelectedEventTypes(value);
  };

  const { serviceOfferings, isSubscriptionsPending } = useGlobalData();

  const {
    data: auditLogs,
    refetch: refetchAuditLogs,
    isFetching: isFetchingAuditLogs,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useAuditLogs({
    startDate: selectedDateRange.startDate ?? undefined,
    endDate: selectedDateRange.endDate ?? undefined,
    eventSourceTypes: selectedEventTypes.length
      ? selectedEventTypes
      : ["Customer", "Infra", "Maintenance", "Operations"],
    serviceID: selectedServiceId,
  });

  useEffect(() => {
    setPageIndex(0);
  }, [selectedDateRange, selectedServiceId]);

  return (
    <PageContainer>
      <PageTitle icon={AuditLogsIcon} className="mb-6">
        Audit Logs
      </PageTitle>

      <div>
        <EventsTable
          tableId={COLUMN_PREFERENCE_TABLE_IDS.auditLogs}
          presentation="auditLogs"
          HeaderComponent={EventsTableHeader}
          HeaderProps={{
            refetchAuditLogs: () => {
              setPageIndex(0);
              refetchAuditLogs();
            },
            selectedDateRange,
            setSelectedDateRange,
            isFetchingAuditLogs,
            selectedServiceId,
            setSelectedServiceId,
            serviceOfferings,
            selectedEventTypes,
            setSelectedEventTypes: handleSelectedEventTypesChange,
          }}
          columns={[
            "expand",
            "time",
            "type",
            "action",
            "auditProduct",
            "auditPlan",
            "auditId",
            "auditMessage",
            "user",
            "subscriptionOwner",
          ]}
          data={auditLogs}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          isLoading={isFetchingAuditLogs || isSubscriptionsPending}
          pageIndex={pageIndex}
          setPageIndex={setPageIndex}
          showPagination={true}
          noRowsText="No audit logs"
          isFilterApplied={Boolean(
            selectedDateRange?.startDate || selectedDateRange?.endDate || selectedServiceId || selectedEventTypes.length
          )}
          entityName="audit logs"
        />
      </div>
    </PageContainer>
  );
};

export default EventsPage;

import { DateRange, DateTimePickerPopover } from "src/components/DateRangePicker/DateTimeRangePickerStatic";
import AuditLogsEventFilterDropdown from "src/components/ResourceInstance/AuditLogs/components/AuditLogsEventFilterDropdown";
import { SetState } from "src/types/common/reactGenerics";
import { EventType } from "src/types/event";
import { ServiceOffering } from "src/types/serviceOffering";
import DataGridHeaderTitle from "components/Headers/DataGridHeaderTitle";
import RefreshWithToolTip from "components/RefreshWithTooltip/RefreshWithToolTip";

import ServiceFilter from "./ServiceFilter";

type EventsTableHeaderProps = {
  refetchAuditLogs: () => void;
  isFetchingAuditLogs: boolean;
  selectedDateRange: DateRange;
  setSelectedDateRange: SetState<DateRange>;
  selectedServiceId: string;
  setSelectedServiceId: SetState<string>;
  serviceOfferings: ServiceOffering[];
  selectedEventTypes: EventType[];
  setSelectedEventTypes: SetState<EventType[]>;
};

const EventsTableHeader: React.FC<EventsTableHeaderProps> = ({
  refetchAuditLogs,
  isFetchingAuditLogs,
  selectedDateRange,
  setSelectedDateRange,
  selectedServiceId,
  setSelectedServiceId,
  serviceOfferings,
  selectedEventTypes,
  setSelectedEventTypes,
}) => {
  return (
    <div className="flex items-center justify-between gap-4 py-5 px-6 border-b border-[#EAECF0]">
      <DataGridHeaderTitle title="List of Audit Logs" desc="Details of instance audit logs" />

      <div className="flex justify-end items-center gap-4 flex-wrap flex-grow">
        <RefreshWithToolTip refetch={refetchAuditLogs} disabled={isFetchingAuditLogs} />
        <DateTimePickerPopover dateRange={selectedDateRange} setDateRange={setSelectedDateRange} />
        <AuditLogsEventFilterDropdown
          selectedEventTypes={selectedEventTypes}
          setSelectedEventTypes={setSelectedEventTypes}
          filterEventTypes={["Customer", "Infra", "Maintenance"]}
        />

        <ServiceFilter
          selectedServiceId={selectedServiceId}
          setSelectedServiceId={setSelectedServiceId}
          serviceOfferings={serviceOfferings}
        />
      </div>
    </div>
  );
};

export default EventsTableHeader;

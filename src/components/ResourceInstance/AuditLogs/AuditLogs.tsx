import { FC, useMemo, useState } from "react";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { Box, IconButton, Stack } from "@mui/material";
import { createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { pageElements } from "page-objects/instance-details-page";
import { OnCopyProps } from "react-json-view";

import CopyButton from "src/components/Button/CopyButton";
import SearchInput from "src/components/DataGrid/SearchInput";
import DataTable from "src/components/DataTable/DataTable";
import {
  DateRange,
  DateTimePickerPopover,
  initialRangeState,
} from "src/components/DateRangePicker/DateTimeRangePickerStatic";
import GridCellExpand from "src/components/GridCellExpand/GridCellExpand";
import JSONView from "src/components/JSONView/JSONView";
import useUserData from "src/hooks/usersData";
import { AuditEvent } from "src/types/auditEvent";
import { SetState } from "src/types/common/reactGenerics";
import { EventType } from "src/types/event";
import formatDateUTC from "src/utils/formatDateUTC";
import { getAccessControlRoute } from "src/utils/route/access/accessRoute";
import DataGridHeaderTitle from "components/Headers/DataGridHeaderTitle";

import EventTypeChip from "../../EventsTable/EventTypeChip";

import AuditLogsEventFilterDropdown from "./components/AuditLogsEventFilterDropdown";
import useAccessInstanceAuditLogs from "./hooks/useAccessInstanceAuditLogs";
import MessageInput from "src/components/MessageInput/MessageInput";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

type AuditLogsTableHeaderProps = {
  count: number;
  searchText: string;
  setSearchText: SetState<string>;
  refetchLogs: () => void;
  isRefetching: boolean;
  selectedDateRange: DateRange;
  setSelectedDateRange: SetState<DateRange>;
  selectedEventTypes: EventType[];
  setSelectedEventTypes: SetState<EventType[]>;
};

const columnHelper = createColumnHelper<AuditEvent>();

const AuditLogsTableHeader: FC<AuditLogsTableHeaderProps> = (props) => {
  const {
    count,
    searchText,
    setSearchText,
    selectedDateRange,
    setSelectedDateRange,
    selectedEventTypes,
    setSelectedEventTypes,
  } = props;

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      p="20px 24px 14px"
      borderBottom="1px solid #EAECF0"
    >
      <DataGridHeaderTitle
        title={pageElements.auditLogsTableTitle}
        desc="Detailed audit trail of user actions performed on deployment instances"
        count={count}
        units={{
          singular: "Log",
          plural: "Logs",
        }}
      />
      <Stack direction="row" justifyContent="flex-end" flexGrow={1} flexWrap={"wrap"} alignItems="center" gap="12px">
        <SearchInput
          searchText={searchText}
          setSearchText={setSearchText}
          placeholder="Search by Message/User"
          width="250px"
        />
        <DateTimePickerPopover dateRange={selectedDateRange} setDateRange={setSelectedDateRange} />
        <AuditLogsEventFilterDropdown
          selectedEventTypes={selectedEventTypes}
          setSelectedEventTypes={setSelectedEventTypes}
        />
      </Stack>
    </Stack>
  );
};

type AuditLogsTabProps = {
  instanceId: string;
  subscriptionId: string;
};

function DetailTableRowView(props: { rowData: AuditEvent }) {
  const { rowData: event } = props;
  const { workflowFailures } = event;
  return (
    <Box sx={{ margin: "10px 12px" }}>
      <JSONView
        src={workflowFailures || {}}
        theme="isotope"
        enableClipboard={(copy: OnCopyProps) => {
          navigator.clipboard.writeText(JSON.stringify(copy.src));
        }}
        displayDataTypes={false}
        style={{
          flex: 1,
          padding: "16px",
          borderRadius: "12px",
          minHeight: "140px",
          maxHeight: "160px",
          overflowY: "auto",
        }}
      />
    </Box>
  );
}

const AuditLogs: FC<AuditLogsTabProps> = ({ instanceId, subscriptionId }) => {
  const [searchText, setSearchText] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>(initialRangeState);
  const [selectedEventTypes, setSelectedEventTypes] = useState<EventType[]>([]);
  const data = useUserData();
  const currentUserOrgId = data.userData?.orgId;

  const {
    data: events = [],
    isFetching: isFetchingEvents,
    refetch: refetchLogs,
  } = useAccessInstanceAuditLogs({
    instanceId,
    subscriptionId,
  });

  const dataTableColumns = useMemo(() => {
    return [
      columnHelper.display({
        id: "expandAction",
        header: "",
        cell: (data) => {
          const isRowExpandible = data.row.getCanExpand();
          return isRowExpandible ? (
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={data.row.getToggleExpandedHandler()}
              disabled={!isRowExpandible}
            >
              {data.row.getIsExpanded() ? (
                <RemoveCircleOutlineIcon sx={{ fontSize: "20px" }} />
              ) : (
                <AddCircleOutlineIcon sx={{ fontSize: "20px" }} />
              )}
            </IconButton>
          ) : (
            ""
          );
        },
        meta: {
          width: 75,
        },
      }),
      columnHelper.accessor("eventSource", {
        id: "type",
        header: "Type",
        cell: (data) => {
          return data.row.original.eventSource ? (
            <EventTypeChip eventType={data.row.original.eventSource as EventType} />
          ) : (
            "-"
          );
        },
      }),
      columnHelper.accessor((row) => formatDateUTC(row.time), {
        id: "time",
        header: "Time",
        cell: (data) => (data.row.original.time ? formatDateUTC(data.row.original.time) : "-"),
      }),
      columnHelper.accessor("message", {
        id: "message",
        header: "Message",
        cell: (data) => {
          return data.row.original.message ? <MessageInput message={data.row.original.message} showCopyButton /> : "-";
        },
        meta: {
          flex: 2,
        },
      }),

      columnHelper.accessor("userName", {
        id: "userName",
        header: "User",
        cell: (data) => {
          const userId = data.row.original.userId;
          const userName = data.row.original.userName;
          const orgName = data.row.original.orgName;

          const isUserOmnistrateSystem = userName === "System" && orgName === "System";

          const isUserServiceProvider =
            data.row.original.orgId && currentUserOrgId !== data.row.original.orgId && !isUserOmnistrateSystem;

          let pageLink: string | undefined;
          if (!isUserServiceProvider && !isUserOmnistrateSystem && userId) {
            pageLink = getAccessControlRoute(userId);
          }

          let userDisplayLabel = userName;

          if (isUserServiceProvider) {
            userDisplayLabel = `SaaS Provider`;
          }

          return <GridCellExpand href={pageLink} target="_blank" value={userDisplayLabel || "-"} />;
        },
      }),
    ];
  }, [currentUserOrgId]);

  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (searchText) {
      const searchTerm = searchText.toLowerCase().trim();
      filtered = filtered.filter(
        (event) =>
          event.userName?.toLowerCase().includes(searchTerm) || event.message.toLowerCase().includes(searchTerm)
      );
    }

    if (selectedEventTypes.length > 0) {
      filtered = filtered.filter((event) => {
        return selectedEventTypes.includes(event.eventSource as EventType);
      });
    }

    if (selectedDateRange && selectedDateRange.startDate && selectedDateRange.endDate) {
      const startDate = dayjs(selectedDateRange.startDate);
      const endDate = dayjs(selectedDateRange.endDate);

      filtered = filtered.filter((event) => {
        const eventDate = dayjs(event.time);

        return dayjs(eventDate).isSameOrAfter(startDate) && dayjs(eventDate).isSameOrBefore(endDate);
      });
    }

    return filtered;
  }, [events, searchText, selectedEventTypes, selectedDateRange]);

  return (
    <Box mt="32px">
      <DataTable
        // @ts-ignore
        columns={dataTableColumns}
        rows={filteredEvents}
        renderDetailsComponent={DetailTableRowView}
        noRowsText="No events"
        getRowCanExpand={(rowData) => Boolean(Number(rowData.original.workflowFailures?.length) > 0)}
        HeaderComponent={AuditLogsTableHeader}
        headerProps={{
          count: filteredEvents.length,
          searchText: searchText,
          setSearchText: setSearchText,
          refetchLogs: refetchLogs,
          selectedDateRange: selectedDateRange,
          setSelectedDateRange: setSelectedDateRange,
          selectedEventTypes: selectedEventTypes,
          setSelectedEventTypes: setSelectedEventTypes,
          isRefetching: isFetchingEvents,
        }}
        isLoading={isFetchingEvents}
      />
    </Box>
  );
};

export default AuditLogs;

import { FC, useMemo, useState } from "react";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { Range } from "react-date-range";
import { OnCopyProps } from "react-json-view";

import SearchInput from "src/components/DataGrid/SearchInput";
import DataTable from "src/components/DataTable/DataTable";
import DataGridHeaderTitle from "src/components/Headers/DataGridHeaderTitle";
import RefreshWithToolTip from "src/components/RefreshWithTooltip/RefreshWithToolTip";
import AuditLogsEventFilterDropdown from "src/components/ResourceInstance/AuditLogs/components/AuditLogsEventFilterDropdown";
import { AuditEvent } from "src/types/auditEvent";
import { SetState } from "src/types/common/reactGenerics";
import { EventType } from "src/types/event";
import formatDateUTC from "src/utils/formatDateUTC";
import { getAccessControlRoute } from "src/utils/route/access/accessRoute";

import DateRangePicker, { initialRangeState } from "../DateRangePicker/DateRangePicker";
import GridCellExpand from "../GridCellExpand/GridCellExpand";
import JSONView from "../JSONView/JSONView";

import EventTypeChip from "./EventTypeChip";
import MessageInput from "../MessageInput/MessageInput";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
const columnHelper = createColumnHelper<AuditEvent>();

type EventsTableHeaderProps = {
  count: number;
  searchText: string;
  setSearchText: SetState<string>;
  refetchEvents: () => void;
  isRefetching: boolean;
  selectedDateRange: Range;
  setSelectedDateRange: SetState<Range>;
  selectedEventTypes: EventType[];
  setSelectedEventTypes: SetState<EventType[]>;
  disableTypeFilter?: boolean;
  entityName: string;
  filterEventTypes?: EventType[];
  desc?: string;
};

const EventsTableHeader: FC<EventsTableHeaderProps> = (props) => {
  const {
    count,
    searchText,
    setSearchText,
    refetchEvents,
    isRefetching,
    selectedDateRange,
    setSelectedDateRange,
    selectedEventTypes,
    setSelectedEventTypes,
    disableTypeFilter = false,
    entityName = "Event",
    filterEventTypes,
    desc = "",
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
        title={
          <Typography
            sx={{
              fontSize: "18px",
              fontWeight: 600,
              lineHeight: "28px",
              color: "#101828",
            }}
          >
            List of {entityName}s
          </Typography>
        }
        count={count}
        desc={desc}
        units={{
          singular: entityName ? entityName : "",
          plural: entityName ? `${entityName}s` : "",
        }}
      />
      <Stack direction="row" alignItems="center" gap="12px">
        <SearchInput
          searchText={searchText}
          setSearchText={setSearchText}
          placeholder="Search by Message/User"
          width="250px"
        />
        <RefreshWithToolTip refetch={refetchEvents} disabled={isRefetching} />
        <DateRangePicker dateRange={selectedDateRange} setDateRange={setSelectedDateRange} />
        {!disableTypeFilter && (
          <AuditLogsEventFilterDropdown
            selectedEventTypes={selectedEventTypes}
            setSelectedEventTypes={setSelectedEventTypes}
            filterEventTypes={filterEventTypes}
          />
        )}
      </Stack>
    </Stack>
  );
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

type EventsTableProps = {
  events: AuditEvent[];
  serviceId: string;
  environmentId: string;
  productTierId: string;
  subscriptionId: string;
  refetchEvents: () => void;
  isRefetching: boolean;
  isRootSubscription: boolean;
  disableTypeFilter?: boolean;
  hideTypeColumn?: boolean;
  entityName?: string;
  filterEventTypes?: EventType[];
  desc?: string;
};

const EventsTable: FC<EventsTableProps> = (props) => {
  const {
    serviceId,
    environmentId,
    productTierId,
    subscriptionId,
    events,
    isRefetching,
    refetchEvents,
    isRootSubscription,
    disableTypeFilter = false,
    hideTypeColumn = false,
    entityName = "Event",
    filterEventTypes,
    desc,
  } = props;

  const [searchText, setSearchText] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState<Range>(initialRangeState);
  const [selectedEventTypes, setSelectedEventTypes] = useState<EventType[]>([]);

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
      columnHelper.accessor("resourceName", {
        id: "resourceName",
        header: "Resource Name",
        meta: {
          flex: 0.7,
        },
      }),
      columnHelper.accessor("resourceInstanceId", {
        id: "resourceInstanceId",
        header: "Instance ID",
      }),
      ...(!hideTypeColumn
        ? [
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
              meta: {
                flex: 0.8,
              },
            }),
          ]
        : []),
      columnHelper.accessor((row) => formatDateUTC(row.time), {
        id: "time",
        header: "Time",
        cell: (data) => (data.row.original.time ? formatDateUTC(data.row.original.time) : "-"),
      }),

      columnHelper.accessor("userName", {
        id: "userName",
        header: "User",
        cell: (data) => {
          const userId = data.row.original.userId;
          const userName = data.row.original.userName;
          const orgName = data.row.original.orgName;

          const isUserOmnistrateSystem = userName === "System" && orgName === "System";

          let pageLink: string;
          if (!isUserOmnistrateSystem && userId) {
            pageLink = getAccessControlRoute(userId);
          }

          return (
            <GridCellExpand
              // @ts-ignore
              href={isRootSubscription ? pageLink : ""}
              target="_blank"
              value={userName || "-"}
            />
          );
        },
      }),

      columnHelper.accessor("message", {
        id: "message",
        header: "Message",
        cell: (data) => {
          return data.row.original.message ? <MessageInput message={data.row.original.message} showCopyButton /> : "-";
        },
      }),
    ];
  }, [isRootSubscription, serviceId, environmentId, productTierId, subscriptionId, hideTypeColumn]);

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
      const startDate = dayjs(selectedDateRange.startDate).format("YYYY-MM-DD");
      const endDate = dayjs(selectedDateRange.endDate).format("YYYY-MM-DD");

      filtered = filtered.filter((event) => {
        const eventDate = dayjs(event.time).format("YYYY-MM-DD");

        return dayjs(eventDate).isSameOrAfter(startDate) && dayjs(eventDate).isSameOrBefore(endDate);
      });
    }

    return filtered;
  }, [events, searchText, selectedEventTypes, selectedDateRange]);

  return (
    <Box>
      <DataTable
        columns={dataTableColumns}
        rows={filteredEvents}
        renderDetailsComponent={DetailTableRowView}
        noRowsText={`No ${entityName?.toLowerCase()}s`}
        getRowCanExpand={(rowData) => Boolean(Number(rowData.original.workflowFailures?.length) > 0)}
        HeaderComponent={EventsTableHeader}
        headerProps={{
          count: filteredEvents.length,
          searchText: searchText,
          setSearchText: setSearchText,
          refetchLogs: refetchEvents,
          selectedDateRange: selectedDateRange,
          setSelectedDateRange: setSelectedDateRange,
          selectedEventTypes: selectedEventTypes,
          setSelectedEventTypes: setSelectedEventTypes,
          isRefetching: isRefetching,
          refetchEvents: refetchEvents,
          disableTypeFilter: disableTypeFilter,
          entityName: entityName,
          filterEventTypes: filterEventTypes,
          desc: desc,
        }}
        isLoading={isRefetching}
      />
    </Box>
  );
};

export default EventsTable;

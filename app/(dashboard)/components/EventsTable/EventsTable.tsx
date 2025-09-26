import { useMemo } from "react";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { IconButton } from "@mui/material";
import { createColumnHelper } from "@tanstack/react-table";

import DataGridText from "src/components/DataGrid/DataGridText";
import CursorPaginatedDataTable from "src/components/DataTable/CursorPaginatedDataTable";
import EventDetailsView from "src/components/EventsTable/EventDetailsView";
import EventTypeChip from "src/components/EventsTable/EventTypeChip";
import ServiceNameWithLogo from "src/components/ServiceNameWithLogo/ServiceNameWithLogo";
import { useGlobalData } from "src/providers/GlobalDataProvider";
import { AuditEvent } from "src/types/auditEvent";
import { EventType } from "src/types/event";
import formatDateUTC from "src/utils/formatDateUTC";
import { getAccessControlRoute } from "src/utils/route/access/accessRoute";
import MessageInput from "src/components/MessageInput/MessageInput";

const columnHelper = createColumnHelper<AuditEvent>();

export type ColumnType =
  | "expand"
  | "deploymentId"
  | "serviceName"
  | "resourceType"
  | "time"
  | "type"
  | "message"
  | "user"
  | "subscriptionPlan"
  | "subscriptionOwner";

const EventsTable = ({
  columns,
  showPagination,
  HeaderComponent,
  pageIndex,
  setPageIndex,
  data,
  HeaderProps,
  isLoading,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
  minHeight = "667px",
  noRowsText,
}: any) => {
  const { subscriptionsObj } = useGlobalData();

  const columnsConfig: Record<ColumnType, any> = useMemo(
    () => ({
      expand: columnHelper.display({
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
          width: 60,
        },
        enableSorting: false,
      }),
      deploymentId: columnHelper.accessor("resourceInstanceId", {
        id: "resourceInstanceId",
        header: "Instance ID",
        meta: {
          minWidth: 200,
        },
        enableSorting: false,
      }),
      serviceName: columnHelper.accessor(
        (row) => {
          const subscription = subscriptionsObj[row.subscriptionId];
          return subscription?.serviceName || "-";
        },
        {
          id: "serviceName",
          header: "Product Name",
          cell: (data) => {
            const { serviceLogoURL, serviceName } = subscriptionsObj[data.row.original.subscriptionId] || {};
            if (!serviceName) return "-";

            return <ServiceNameWithLogo serviceName={serviceName} serviceLogoURL={serviceLogoURL} />;
          },
          meta: {
            minWidth: 230,
          },
          enableSorting: false,
        }
      ),
      resourceType: columnHelper.accessor("resourceName", {
        id: "resourceName",
        header: "Resource Name",
        enableSorting: false,
      }),
      time: columnHelper.accessor((row) => formatDateUTC(row.time), {
        id: "time",
        header: "Time",
        cell: (data) => (data.row.original.time ? formatDateUTC(data.row.original.time) : "-"),
        meta: {
          minWidth: 200,
        },
        enableSorting: false,
      }),
      type: columnHelper.accessor("eventSource", {
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
        enableSorting: false,
      }),
      message: columnHelper.accessor("message", {
        id: "message",
        header: "Message",
        cell: (data) => {
          return data.row.original.message ? <MessageInput message={data.row.original.message} showCopyButton /> : "-";
        },
        meta: {
          flex: 2,
        },
        enableSorting: false,
      }),

      user: columnHelper.accessor("userName", {
        id: "userName",
        header: "User",
        cell: (data) => {
          const userId = data.row.original.userId;
          const userName = data.row.original.userName;
          const orgName = data.row.original.orgName;

          const isUserOmnistrateSystem = userName === "System" && orgName === "System";

          // Special Case for Disabling the Link
          // When the Logged in User Doesn't Have "root" Role for a Subscription, They Don't Have Read Access for Access Control Page.
          const subscription = subscriptionsObj[data.row.original.subscriptionId];

          let pageLink = "",
            props = {};
          if (!isUserOmnistrateSystem && userId && subscription?.roleType === "root") {
            pageLink = getAccessControlRoute(userId);
            props = {
              color: "primary",
              linkProps: {
                href: pageLink,
                target: "_blank",
              },
            };
          }

          return <DataGridText {...props}>{userName || "System"}</DataGridText>;
        },
        enableSorting: false,
      }),
      subscriptionPlan: columnHelper.accessor(
        (row) => {
          return subscriptionsObj[row.subscriptionId]?.productTierName || "-";
        },
        {
          id: "servicePlanName",
          header: "Subscription Plan",
          enableSorting: false,
        }
      ),
      subscriptionOwner: columnHelper.accessor(
        (row) => {
          return subscriptionsObj[row.subscriptionId]?.subscriptionOwnerName || "-";
        },
        {
          id: "subscriptionOwnerName",
          header: "Subscription Owner",
          enableSorting: false,
        }
      ),
    }),
    [subscriptionsObj]
  );

  const selectedColumns = useMemo(() => {
    return columns.map((columnName) => columnsConfig[columnName]);
  }, [columns, columnsConfig]);

  return (
    <CursorPaginatedDataTable
      pageIndex={pageIndex}
      setPageIndex={setPageIndex}
      columns={selectedColumns}
      data={data}
      renderDetailsComponent={EventDetailsView}
      noRowsText={noRowsText || "No events"}
      getRowCanExpand={(rowData) => Number(rowData.original.workflowFailures?.length) > 0}
      HeaderComponent={HeaderComponent}
      headerProps={HeaderProps}
      isLoading={isLoading}
      hasNextPage={hasNextPage}
      fetchNextPage={fetchNextPage}
      isFetchingNextPage={isFetchingNextPage}
      pageSize={10}
      rowId="id"
      showPagination={showPagination}
      minHeight={minHeight}
      tableStyles={{
        "& tr": {
          height: "52px",
        },
      }}
    />
  );
};

export default EventsTable;

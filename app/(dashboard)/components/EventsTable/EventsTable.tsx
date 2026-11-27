import { useMemo } from "react";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { IconButton } from "@mui/material";
import { createColumnHelper } from "@tanstack/react-table";

import { useTableColumnPreference } from "src/components/ColumnPreference/useColumnPreference";
import DataGridText from "src/components/DataGrid/DataGridText";
import CursorPaginatedDataTable from "src/components/DataTable/CursorPaginatedDataTable";
import AuditLogEventDetailsView from "src/components/EventsTable/AuditLogEventDetailsView";
import EventDetailsView from "src/components/EventsTable/EventDetailsView";
import EventTypeChip from "src/components/EventsTable/EventTypeChip";
import MessageInput from "src/components/MessageInput/MessageInput";
import ServiceNameWithLogo from "src/components/ServiceNameWithLogo/ServiceNameWithLogo";
import StatusChip from "src/components/StatusChip/StatusChip";
import type { Category } from "src/constants/statusChipStyles";
import { useGlobalData } from "src/providers/GlobalDataProvider";
import type { AuditEvent, JITAuditAction } from "src/types/auditEvent";
import type { EventType } from "src/types/event";
import { normalizeJITAuditEvent } from "src/utils/auditEvent";
import formatDateUTC from "src/utils/formatDateUTC";
import { getAccessControlRoute } from "src/utils/route/access/accessRoute";

const columnHelper = createColumnHelper<AuditEvent>();
const EMPTY_VALUE = "-";

const actionCategories: Record<JITAuditAction, Category> = {
  Requested: "inProgress",
  Approved: "success",
  Denied: "failed",
  Revoked: "info",
  Expired: "unknown",
};

export type ColumnType =
  | "expand"
  | "deploymentId"
  | "serviceName"
  | "resourceType"
  | "time"
  | "type"
  | "action"
  | "auditProduct"
  | "auditPlan"
  | "auditId"
  | "auditMessage"
  | "message"
  | "user"
  | "subscriptionPlan"
  | "subscriptionOwner"
  | "userAgent";

const EventsTable = ({
  tableId,
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
  isFilterApplied,
  entityName,
  presentation = "default",
}: any) => {
  const { subscriptionsObj } = useGlobalData();
  const isAuditLogsPresentation = presentation === "auditLogs";

  const columnsConfig: Record<ColumnType, any> = useMemo(
    () => ({
      expand: columnHelper.display({
        id: "expandAction",
        header: "",
        cell: (data) => {
          const isRowExpandible = data.row.getCanExpand();
          return isRowExpandible ? (
            <IconButton
              aria-label={`${data.row.getIsExpanded() ? "Collapse" : "Expand"} audit event ${data.row.original.id}`}
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
      action: columnHelper.display({
        id: "action",
        header: "Action",
        cell: (data) => {
          const jitEvent = normalizeJITAuditEvent(data.row.original);
          return jitEvent?.action ? (
            <StatusChip label={jitEvent.action} category={actionCategories[jitEvent.action]} />
          ) : (
            EMPTY_VALUE
          );
        },
        meta: {
          minWidth: 120,
        },
        enableSorting: false,
      }),
      auditProduct: columnHelper.display({
        id: "serviceName",
        header: "Product",
        cell: (data) => {
          if (normalizeJITAuditEvent(data.row.original)) return EMPTY_VALUE;

          const { serviceLogoURL, serviceName } = subscriptionsObj[data.row.original.subscriptionId] || {};
          if (!serviceName) return "-";

          return <ServiceNameWithLogo serviceName={serviceName} serviceLogoURL={serviceLogoURL} />;
        },
        meta: {
          minWidth: 180,
        },
        enableSorting: false,
      }),
      auditPlan: columnHelper.display({
        id: "servicePlanName",
        header: "Plan",
        cell: (data) => {
          if (normalizeJITAuditEvent(data.row.original)) return EMPTY_VALUE;
          return subscriptionsObj[data.row.original.subscriptionId]?.productTierName || "-";
        },
        meta: {
          minWidth: 140,
        },
        enableSorting: false,
      }),
      auditId: columnHelper.display({
        id: "auditEventResourceId",
        header: "ID",
        cell: (data) => {
          const event = data.row.original;
          const jitEvent = normalizeJITAuditEvent(event);
          const rawId = jitEvent ? event.cloudProviderAccountId : event.resourceInstanceId;
          const displayId = jitEvent && rawId ? `account-${rawId}` : rawId || EMPTY_VALUE;

          return (
            <DataGridText
              copyAriaLabel={jitEvent ? "Copy account ID" : "Copy instance ID"}
              copyText={rawId}
              showCopyButton={Boolean(rawId)}
            >
              {displayId}
            </DataGridText>
          );
        },
        meta: {
          minWidth: 200,
        },
        enableSorting: false,
      }),
      auditMessage: columnHelper.accessor("message", {
        id: "auditMessage",
        header: "Message",
        cell: (data) => {
          const message = data.row.original.message;

          return (
            <DataGridText copyAriaLabel="Copy message" showCopyButton={Boolean(message)}>
              {message || EMPTY_VALUE}
            </DataGridText>
          );
        },
        meta: {
          flex: 2,
          minWidth: 300,
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
          const event = data.row.original;
          const userId = event.userId;
          const userName = event.userName;
          const orgName = event.orgName;

          if (normalizeJITAuditEvent(event)) {
            return <DataGridText>{userName === "System" ? "System" : userId || EMPTY_VALUE}</DataGridText>;
          }

          const isUserOmnistrateSystem = userName === "System" && orgName === "System";

          // Special Case for Disabling the Link
          // When the Logged in User Doesn't Have "root" Role for a Subscription, They Don't Have Read Access for Access Control Page.
          const subscription = subscriptionsObj[event.subscriptionId];

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
          if (normalizeJITAuditEvent(row)) return EMPTY_VALUE;
          return subscriptionsObj[row.subscriptionId]?.subscriptionOwnerName || "-";
        },
        {
          id: "subscriptionOwnerName",
          header: "Subscription Owner",
          enableSorting: false,
        }
      ),
      userAgent: columnHelper.accessor((row) => row.userAgent || "-", {
        id: "userAgent",
        header: "User Agent",
        meta: {
          width: 250,
        },
        enableSorting: false,
      }),
    }),
    [subscriptionsObj]
  );

  const selectedColumns = useMemo(() => {
    return columns.map((columnName) => columnsConfig[columnName]);
  }, [columns, columnsConfig]);

  const {
    columns: preferredColumns,
    columnVisibility,
    columnPreference,
  } = useTableColumnPreference<AuditEvent>({
    tableId,
    columns: selectedColumns,
    clickableColumnIds: isAuditLogsPresentation ? ["auditEventResourceId", "userName"] : ["userName"],
  });

  return (
    <CursorPaginatedDataTable
      pageIndex={pageIndex}
      setPageIndex={setPageIndex}
      columns={preferredColumns}
      columnVisibility={columnVisibility}
      data={data}
      renderDetailsComponent={isAuditLogsPresentation ? AuditLogEventDetailsView : EventDetailsView}
      noRowsText={noRowsText || "No events"}
      isFilterApplied={isFilterApplied}
      entityName={entityName}
      getRowCanExpand={(rowData) => isAuditLogsPresentation || Number(rowData.original.workflowFailures?.length) > 0}
      HeaderComponent={HeaderComponent}
      headerProps={{ ...HeaderProps, columnPreference }}
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

import { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import useInstances from "app/(dashboard)/instances/hooks/useInstances";

import DataTable from "src/components/DataTable/DataTable";
import EventTypeChip from "src/components/EventsTable/EventTypeChip";
import ServiceNameWithLogo from "src/components/ServiceNameWithLogo/ServiceNameWithLogo";
import { useGlobalData } from "src/providers/GlobalDataProvider";
import { EventType } from "src/types/event";
import { ResourceInstance } from "src/types/resourceInstance";
import formatDateUTC from "src/utils/formatDateUTC";

import NotificationsTableHeader from "./NotificationsTableHeader";
import MessageInput from "src/components/MessageInput/MessageInput";

const columnHelper = createColumnHelper<
  ResourceInstance & {
    message: string;
  }
>();

const statusMap = {
  IN_PROGRESS: "in progress",
  COMPLETE: "complete",
  SCHEDULED: "scheduled",
  PENDING: "pending",
  FAILED: "failed",
  PAUSED: "paused",
  CANCELLED: "cancelled",
};

const NotificationsTable = () => {
  const { subscriptionsObj, serviceOfferingsObj } = useGlobalData();

  const {
    data: instances = [],
    isPending: isInstancesPending,
    isFetching: isFetchingInstances,
    refetch: refetchInstances,
  } = useInstances();

  const rows = useMemo(() => {
    return instances
      .filter(
        // @ts-ignore
        (instance) => instance.maintenanceTasks?.upgrade_paths?.length > 0
      )
      .map((instance) => {
        const upgradePath = instance.maintenanceTasks?.upgrade_paths?.[0];
        const status = upgradePath?.upgrade_status;
        const scheduledTime = upgradePath?.upgrade_path_scheduled_at;
        const message = `Upgrade is ${statusMap[status] || status}${scheduledTime ? " at " + formatDateUTC(scheduledTime) : ""}`;
        return {
          ...instance,
          message,
        };
      });
  }, [instances]);

  const dataTableColumns = useMemo(() => {
    return [
      columnHelper.accessor("id", {
        id: "id",
        header: "Instance ID",
        meta: {
          minWidth: 200,
        },
      }),
      columnHelper.accessor(
        (row) => {
          const subscription = subscriptionsObj[row.subscriptionId as string];
          return subscription?.serviceName || "-";
        },
        {
          id: "serviceName",
          header: "Product Name",
          cell: (data) => {
            const { serviceLogoURL, serviceName } = subscriptionsObj[data.row.original.subscriptionId as string] || {};
            if (!serviceName) return "-";

            return <ServiceNameWithLogo serviceName={serviceName} serviceLogoURL={serviceLogoURL} />;
          },
          meta: {
            minWidth: 230,
          },
        }
      ),
      columnHelper.accessor(
        (row) => {
          const subscription = subscriptionsObj[row.subscriptionId as string];
          const offering = serviceOfferingsObj[subscription?.serviceId]?.[subscription?.productTierId];
          const resource = offering?.resourceParameters?.find((resource) => resource.resourceId === row.resourceID);
          return resource?.name || "-";
        },
        {
          id: "resourceName",
          header: "Resource Name",
        }
      ),
      columnHelper.accessor(() => "Maintenance", {
        id: "notificationType",
        header: "Notification Type",
        cell: () => {
          return <EventTypeChip eventType={"Maintenance" as EventType} />;
        },
        meta: {
          flex: 0.8,
        },
      }),
      columnHelper.accessor("message", {
        id: "message",
        header: "Message",
        cell: (data) => {
          return data.row.original.message ? <MessageInput message={data.row.original.message} showCopyButton /> : "-";
        },
        meta: {
          flex: 1.5,
        },
      }),
      columnHelper.accessor(
        (row) => {
          return subscriptionsObj[row.subscriptionId as string]?.productTierName || "-";
        },
        {
          id: "servicePlanName",
          header: "Subscription Plan",
        }
      ),
    ];
  }, [subscriptionsObj, serviceOfferingsObj]);

  return (
    <DataTable
      columns={dataTableColumns}
      rows={rows}
      noRowsText="No alerts"
      HeaderComponent={NotificationsTableHeader}
      headerProps={{
        refetchNotifications: refetchInstances,
        isFetchingNotifications: isFetchingInstances,
      }}
      isLoading={isInstancesPending}
    />
  );
};

export default NotificationsTable;

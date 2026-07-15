import { FC, useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import DataTable from "src/components/DataTable/DataTable";
import ServiceNameWithLogo from "src/components/ServiceNameWithLogo/ServiceNameWithLogo";
import { Text } from "src/components/Typography/Typography";

import { billingUsageDimensionFields, BillingUsageTotals } from "../utils/usageDimensions";

dayjs.extend(utc);

const TableHeader = () => {
  return (
    <div className=" py-5 px-6 border-b border-[#E4E7EC]">
      <Text size="large" weight="semibold" color="#101828">
        Usage Breakdown
      </Text>
    </div>
  );
};

export type SubscriptionUsageRow = BillingUsageTotals & {
  subscriptionId: string;
  serviceId: string;
  serviceName: string;
  subscriptionPlanName: string;
  serviceLogoURL?: string;
};

const columnHelper = createColumnHelper<SubscriptionUsageRow>();

type SubscriptionUsageTableProps = {
  rows: SubscriptionUsageRow[];
  isSubscriptionsUsagePending: boolean;
};

const SubscriptionUsageTable: FC<SubscriptionUsageTableProps> = ({ rows, isSubscriptionsUsagePending }) => {
  const columns = useMemo(() => {
    return [
      //@ts-ignore
      columnHelper.accessor("serviceName", {
        id: "serviceName",
        header: "Product Name",
        meta: {
          minWidth: 320,
        },
        cell: (data) => {
          const { serviceName, serviceLogoURL } = data.row.original;

          return (
            <ServiceNameWithLogo
              serviceName={serviceName}
              serviceLogoURL={serviceLogoURL}
              textStyles={{
                color: "#535862",
                cursor: "auto",
              }}
            />
          );
        },
      }),
      columnHelper.accessor("subscriptionPlanName", {
        id: "subscriptionPlanName",
        header: "Subscription Plan",
        meta: {
          minWidth: 240,
        },
        cell: (data) => {
          const subscriptionPlanName = data.row.original.subscriptionPlanName;
          return (
            <Text size="small" weight="regular" color="#475467" ellipsis>
              {subscriptionPlanName}
            </Text>
          );
        },
      }),
      ...billingUsageDimensionFields.map((field) =>
        columnHelper.accessor(field.rowField, {
          id: field.rowField,
          header: field.tableHeader,
          meta: {
            minWidth: field.rowField === "deploymentCellHours" ? 190 : 150,
          },
          cell: (data) => {
            return (
              <Text size="small" weight="regular" color="#475467" ellipsis>
                {data.row.original[field.rowField]}
              </Text>
            );
          },
        })
      ),
    ];
  }, []);

  return (
    <DataTable
      columns={columns}
      rows={rows}
      HeaderComponent={TableHeader}
      noRowsText="No subscriptions"
      isLoading={isSubscriptionsUsagePending}
      hidePagination={rows.length < 11}
    />
  );
};

export default SubscriptionUsageTable;

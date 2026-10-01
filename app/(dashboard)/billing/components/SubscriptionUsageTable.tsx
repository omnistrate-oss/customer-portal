import { FC, useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import DataTable from "src/components/DataTable/DataTable";
import DataGridHeaderTitle from "src/components/Headers/DataGridHeaderTitle";
import ServiceNameWithLogo from "src/components/ServiceNameWithLogo/ServiceNameWithLogo";
import { Text } from "src/components/Typography/Typography";

import {
  billingUsageDimensionFields,
  getUsageMetricTableValue,
  UsageMetricField,
  UsageMetricValues,
} from "../utils/usageDimensions";

dayjs.extend(utc);

type TableHeaderProps = {
  count: number;
};

const TableHeader: FC<TableHeaderProps> = ({ count }) => {
  return (
    <div className=" py-5 px-6 border-b border-[#E4E7EC]">
      <DataGridHeaderTitle
        title="Usage Breakdown"
        units={{ singular: "Subscription", plural: "Subscriptions" }}
        count={count}
      />
    </div>
  );
};

export type SubscriptionUsageRow = {
  subscriptionId: string;
  serviceId: string;
  productTierId: string;
  serviceName: string;
  subscriptionPlanName: string;
  serviceLogoURL?: string;
  metricValues: UsageMetricValues;
};

const columnHelper = createColumnHelper<SubscriptionUsageRow>();

type SubscriptionUsageTableProps = {
  rows: SubscriptionUsageRow[];
  isSubscriptionsUsagePending: boolean;
  additionalMetricFields: UsageMetricField[];
  configuredMetricNamesByProductTierId: Record<string, ReadonlySet<string>>;
  showAdditionalMetrics: boolean;
};

const SubscriptionUsageTable: FC<SubscriptionUsageTableProps> = ({
  rows,
  isSubscriptionsUsagePending,
  additionalMetricFields,
  configuredMetricNamesByProductTierId,
  showAdditionalMetrics,
}) => {
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
        columnHelper.accessor((row) => row.metricValues[field.dimension] ?? 0, {
          id: field.rowField,
          header: field.tableHeader,
          meta: {
            minWidth: field.rowField === "deploymentCellHours" || field.rowField === "gpu" ? 190 : 150,
          },
          cell: (data) => {
            return (
              <Text size="small" weight="regular" color="#475467" ellipsis>
                {data.getValue()}
              </Text>
            );
          },
        })
      ),
      ...(showAdditionalMetrics
        ? additionalMetricFields.map((field) =>
            columnHelper.accessor(
              (row) =>
                getUsageMetricTableValue(
                  row.metricValues,
                  field.dimension,
                  configuredMetricNamesByProductTierId[row.productTierId] ?? new Set<string>()
                ),
              {
                id: field.key,
                header: field.tableHeader,
                sortingFn: "basic",
                sortUndefined: "last",
                meta: {
                  minWidth: 180,
                },
                cell: (data) => (
                  <Text size="small" weight="regular" color="#475467" ellipsis>
                    {data.getValue() ?? "-"}
                  </Text>
                ),
              }
            )
          )
        : []),
    ];
  }, [additionalMetricFields, configuredMetricNamesByProductTierId, showAdditionalMetrics]);

  return (
    <DataTable
      columns={columns}
      rows={rows}
      HeaderComponent={TableHeader}
      headerProps={{ count: rows.length }}
      noRowsText="No subscriptions"
      isLoading={isSubscriptionsUsagePending}
      hidePagination={rows.length < 11}
    />
  );
};

export default SubscriptionUsageTable;

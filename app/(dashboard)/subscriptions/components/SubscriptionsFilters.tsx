import { FC, useCallback, useMemo } from "react";

import DataGridFilter from "src/components/DataGridFilter/DataGridFilter";
import { FilterConfig } from "src/components/DataGridFilter/types";
import { deriveOptionsFromData } from "src/components/DataGridFilter/utils";
import { statuses } from "src/components/StatusChip/StatusChip";
import { SetState } from "src/types/common/reactGenerics";
import { Subscription } from "src/types/subscription";
import formatDateUTC from "src/utils/formatDateUTC";

type SubscriptionsFiltersProps = {
  subscriptions: Subscription[];
  setFilteredSubscriptions: SetState<Subscription[]>;
  searchText: string;
  setSearchText: SetState<string>;
};

const formatLabel = (value: string): string =>
  statuses[value as keyof typeof statuses] ?? `${value.charAt(0).toUpperCase()}${value.slice(1).toLowerCase()}`;

const SubscriptionsFilters: FC<SubscriptionsFiltersProps> = ({
  subscriptions,
  setFilteredSubscriptions,
  searchText,
  setSearchText,
}) => {
  const filterConfig: FilterConfig<Subscription> = useMemo(
    () => ({
      role: {
        leftMenuLabel: "Role",
        filterType: "multi-select",
        accessor: "roleType",
        options: deriveOptionsFromData(subscriptions, "roleType", formatLabel),
      },
      "product-name": {
        leftMenuLabel: "Product Name",
        filterType: "multi-select",
        accessor: "serviceName",
        options: deriveOptionsFromData(subscriptions, "serviceName"),
      },
      plan: {
        leftMenuLabel: "Plan",
        filterType: "multi-select",
        accessor: "productTierName",
        options: deriveOptionsFromData(subscriptions, "productTierName"),
      },
      status: {
        leftMenuLabel: "Status",
        filterType: "multi-select",
        accessor: "status",
        options: deriveOptionsFromData(subscriptions, "status", formatLabel),
      },
      "subscription-owner": {
        leftMenuLabel: "Subscription Owner",
        filterType: "multi-select",
        accessor: "subscriptionOwnerName",
        options: deriveOptionsFromData(subscriptions, "subscriptionOwnerName"),
      },
      "subscription-date": {
        leftMenuLabel: "Subscription Date",
        filterType: "date-range",
        accessor: "createdAt",
      },
    }),
    [subscriptions]
  );

  const getSearchableText = useCallback(
    (subscription: Subscription) =>
      [
        subscription.id,
        formatLabel(subscription.roleType),
        subscription.serviceName,
        subscription.productTierName,
        formatLabel(subscription.status),
        formatDateUTC(subscription.createdAt),
        subscription.subscriptionOwnerName,
      ].join(" "),
    []
  );

  return (
    <DataGridFilter
      data={subscriptions}
      setFilteredData={setFilteredSubscriptions}
      filterConfig={filterConfig}
      getSearchableText={getSearchableText}
      searchText={searchText}
      setSearchText={setSearchText}
    />
  );
};

export default SubscriptionsFilters;

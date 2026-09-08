import { FC, useCallback, useMemo } from "react";

import DataGridFilter from "src/components/DataGridFilter/DataGridFilter";
import { FilterConfig } from "src/components/DataGridFilter/types";
import { deriveOptionsFromData } from "src/components/DataGridFilter/utils";
import { SetState } from "src/types/common/reactGenerics";
import { SubscriptionUser } from "src/types/consumptionUser";
import { Subscription } from "src/types/subscription";

type AccessControlFiltersProps = {
  users: SubscriptionUser[];
  setFilteredUsers: SetState<SubscriptionUser[]>;
  subscriptionsObj: Record<string, Subscription>;
  searchText: string;
  setSearchText: SetState<string>;
};

const formatRole = (role: string): string => `${role.charAt(0).toUpperCase()}${role.slice(1)}`;

const AccessControlFilters: FC<AccessControlFiltersProps> = ({
  users,
  setFilteredUsers,
  subscriptionsObj,
  searchText,
  setSearchText,
}) => {
  const filterConfig: FilterConfig<SubscriptionUser> = useMemo(
    () => ({
      role: {
        leftMenuLabel: "Role",
        filterType: "multi-select",
        accessor: "roleType",
        options: deriveOptionsFromData(users, "roleType", formatRole),
      },
      "product-name": {
        leftMenuLabel: "Product Name",
        filterType: "multi-select",
        accessor: (user) => subscriptionsObj[user.subscriptionId]?.serviceName,
        options: deriveOptionsFromData(users, (user) => subscriptionsObj[user.subscriptionId]?.serviceName ?? ""),
      },
      "subscription-plan": {
        leftMenuLabel: "Subscription Plan",
        filterType: "multi-select",
        accessor: (user) => subscriptionsObj[user.subscriptionId]?.productTierName,
        options: deriveOptionsFromData(users, (user) => subscriptionsObj[user.subscriptionId]?.productTierName ?? ""),
      },
      "subscription-owner": {
        leftMenuLabel: "Subscription Owner",
        filterType: "multi-select",
        accessor: (user) => subscriptionsObj[user.subscriptionId]?.subscriptionOwnerName,
        options: deriveOptionsFromData(
          users,
          (user) => subscriptionsObj[user.subscriptionId]?.subscriptionOwnerName ?? ""
        ),
      },
    }),
    [subscriptionsObj, users]
  );

  const getSearchableText = useCallback(
    (user: SubscriptionUser) => {
      const subscription = subscriptionsObj[user.subscriptionId];
      return [
        user.name,
        user.email,
        user.userId,
        formatRole(user.roleType),
        subscription?.serviceName,
        subscription?.productTierName,
        subscription?.subscriptionOwnerName,
      ].join(" ");
    },
    [subscriptionsObj]
  );

  return (
    <DataGridFilter
      data={users}
      setFilteredData={setFilteredUsers}
      filterConfig={filterConfig}
      getSearchableText={getSearchableText}
      searchText={searchText}
      setSearchText={setSearchText}
    />
  );
};

export default AccessControlFilters;

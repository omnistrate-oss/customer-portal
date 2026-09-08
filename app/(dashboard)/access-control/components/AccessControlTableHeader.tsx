import { FC } from "react";

import DataGridHeaderTitle from "src/components/Headers/DataGridHeaderTitle";
import RefreshWithToolTip from "src/components/RefreshWithTooltip/RefreshWithToolTip";
import { SetState } from "src/types/common/reactGenerics";
import { SubscriptionUser } from "src/types/consumptionUser";
import { Subscription } from "src/types/subscription";

import AccessControlFilters from "./AccessControlFilters";

type AccessControlTableHeaderProps = {
  users: SubscriptionUser[];
  setFilteredUsers: SetState<SubscriptionUser[]>;
  subscriptionsObj: Record<string, Subscription>;
  searchText: string;
  setSearchText: SetState<string>;
  refetchUsers: () => void;
  isFetchingUsers: boolean;
  count: number;
};

const AccessControlTableHeader: FC<AccessControlTableHeaderProps> = ({
  users,
  setFilteredUsers,
  subscriptionsObj,
  searchText,
  setSearchText,
  refetchUsers,
  isFetchingUsers,
  count,
}) => {
  return (
    <>
      <div className="flex items-center justify-between gap-4 py-5 px-6 border-b border-[#EAECF0]">
        <DataGridHeaderTitle
          title="Access Permissions"
          desc="Manage user roles and permissions for your Product subscriptions"
          count={count}
          units={{
            singular: "Access Permission",
            plural: "Access Permissions",
          }}
        />

        <div className="flex items-center gap-4 flex-shrink-0">
          <RefreshWithToolTip refetch={refetchUsers} disabled={isFetchingUsers} />
        </div>
      </div>
      <div className="px-6 py-4 border-b border-[#EAECF0]">
        <AccessControlFilters
          users={users}
          setFilteredUsers={setFilteredUsers}
          subscriptionsObj={subscriptionsObj}
          searchText={searchText}
          setSearchText={setSearchText}
        />
      </div>
    </>
  );
};

export default AccessControlTableHeader;

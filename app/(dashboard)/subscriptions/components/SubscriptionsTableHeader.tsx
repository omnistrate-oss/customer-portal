import { FC } from "react";

import RefreshWithToolTip from "src/components/RefreshWithTooltip/RefreshWithToolTip";
import useFeatureFlags from "src/hooks/useFeatureFlags";
import { SetState } from "src/types/common/reactGenerics";
import { Subscription } from "src/types/subscription";
import { isManageableSubscriptionRole } from "src/utils/consumptionSubscriptionAdminRBAC";
import Button from "components/Button/Button";
import DataGridHeaderTitle from "components/Headers/DataGridHeaderTitle";

import SubscriptionsFilters from "./SubscriptionsFilters";

type SubscriptionsTableHeaderProps = {
  selectedRows: string[];
  subscriptions: Subscription[];
  setFilteredSubscriptions: SetState<Subscription[]>;
  searchText: string;
  setSearchText: SetState<string>;
  onManageSubscriptions: () => void;
  onUnsubscribe: () => void;
  isUnsubscribing: boolean;
  count: number;
  isFetchingSubscriptions: boolean;
  refetchSubscriptions: () => void;
  selectedSubscription?: Subscription;
};

const SubscriptionsTableHeader: FC<SubscriptionsTableHeaderProps> = ({
  selectedRows,
  subscriptions,
  setFilteredSubscriptions,
  searchText,
  setSearchText,
  onManageSubscriptions,
  onUnsubscribe,
  isUnsubscribing,
  count,
  isFetchingSubscriptions,
  refetchSubscriptions,
  selectedSubscription,
}) => {
  const { consumptionSubscriptionAdminRBAC } = useFeatureFlags();

  return (
    <>
      <div className="py-5 px-6 flex items-center justify-between gap-8 border-b border-[#EAECF0]">
        <DataGridHeaderTitle
          title="Detailed list of your Product subscriptions"
          desc="Explore your current Product subscriptions here"
          units={{
            singular: "Subscription",
            plural: "Subscriptions",
          }}
          count={count}
        />

        <div className="flex items-center gap-4 flex-shrink-0">
          <RefreshWithToolTip refetch={refetchSubscriptions} disabled={isFetchingSubscriptions} />
          <Button
            variant="outlined"
            onClick={onUnsubscribe}
            disabled={
              selectedRows.length !== 1 ||
              selectedSubscription?.defaultSubscription || // Cannot Unsubscribe From Default Subscription
              isUnsubscribing ||
              isFetchingSubscriptions ||
              !isManageableSubscriptionRole(selectedSubscription?.roleType, consumptionSubscriptionAdminRBAC)
            }
            disabledMessage={
              selectedRows.length !== 1
                ? "Please select a subscription to unsubscribe"
                : selectedSubscription?.defaultSubscription
                  ? "Cannot unsubscribe from Default subscription"
                  : selectedSubscription &&
                      !isManageableSubscriptionRole(selectedSubscription?.roleType, consumptionSubscriptionAdminRBAC)
                    ? consumptionSubscriptionAdminRBAC
                      ? "Cannot unsubscribe without Root or Admin access"
                      : "Cannot unsubscribe without Root access"
                    : ""
            }
          >
            Unsubscribe
          </Button>
          <Button
            variant="contained"
            onClick={onManageSubscriptions}
            disabled={isUnsubscribing || isFetchingSubscriptions}
            disableRipple
          >
            Manage Subscriptions
          </Button>
        </div>
      </div>
      <div className="px-6 py-4 border-b border-[#EAECF0]">
        <SubscriptionsFilters
          subscriptions={subscriptions}
          setFilteredSubscriptions={setFilteredSubscriptions}
          searchText={searchText}
          setSearchText={setSearchText}
        />
      </div>
    </>
  );
};

export default SubscriptionsTableHeader;

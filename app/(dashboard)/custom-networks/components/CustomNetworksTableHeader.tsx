import { FC, useMemo } from "react";
import { useSelector } from "react-redux";

import Button from "src/components/Button/Button";
import DataGridHeaderTitle from "src/components/Headers/DataGridHeaderTitle";
import RefreshWithToolTip from "src/components/RefreshWithTooltip/RefreshWithToolTip";
import useFeatureFlags from "src/hooks/useFeatureFlags";
import { selectUserrootData } from "src/slices/userDataSlice";
import { SetState } from "src/types/common/reactGenerics";
import { CustomNetwork } from "src/types/customNetwork";
import { Subscription } from "src/types/subscription";
import { isSubscriptionWriteRole } from "src/utils/consumptionSubscriptionAdminRBAC";

import CustomNetworksFilters from "./CustomNetworksFilters";

type CustomNetworksTableHeaderProps = {
  count: number;
  filterableCustomNetworks: CustomNetwork[];
  setFilteredCustomNetworks: SetState<CustomNetwork[]>;
  refetchCustomNetworks: () => void;
  isFetchingCustomNetworks: boolean;
  onPeeringInfoClick: () => void;
  onDeleteClick: () => void;
  onCreateClick: () => void;
  onModifyClick: () => void;
  selectedRows: string[];
  customNetworks?: CustomNetwork[];
  subscriptions?: Subscription[];
};

const CustomNetworksTableHeader: FC<CustomNetworksTableHeaderProps> = ({
  count,
  filterableCustomNetworks,
  setFilteredCustomNetworks,
  refetchCustomNetworks,
  isFetchingCustomNetworks,
  onPeeringInfoClick,
  onDeleteClick,
  onCreateClick,
  onModifyClick,
  selectedRows,
  customNetworks = [],
  subscriptions = [],
}) => {
  const currentUser = useSelector(selectUserrootData);
  const { consumptionSubscriptionAdminRBAC } = useFeatureFlags();

  /**
   * Determines whether the currently selected network's actions should be blocked
   * due to ownership restrictions.
   *
   * Returns `true` (blocked) when:
   * - Exactly one row is selected
   * - The selected network has an `owningUserId`
   * - The logged-in user is NOT the owner
   * - The logged-in user does NOT have write-capable access on any subscription
   *   whose owner matches the network's `owningUserId`
   */
  const isOwnershipBlocked = useMemo(() => {
    if (selectedRows.length !== 1) return false;
    const selectedNetwork = customNetworks.find((n) => n.id === selectedRows[0]);
    // No owningUserId means no ownership restriction
    if (!selectedNetwork?.owningUserId) return false;

    const networkOwnerId = selectedNetwork.owningUserId;

    // If the logged-in user is the owner, allow
    if (networkOwnerId === currentUser?.id) return false;

    // Check if the user has write access on any subscription belonging to the network owner's org
    const hasAccess = subscriptions.some(
      (sub) =>
        sub.rootUserId === networkOwnerId && isSubscriptionWriteRole(sub.roleType, consumptionSubscriptionAdminRBAC)
    );

    return !hasAccess;
  }, [consumptionSubscriptionAdminRBAC, selectedRows, customNetworks, currentUser?.id, subscriptions]);

  const getModifyDeleteDisabledMessage = () => {
    if (selectedRows.length !== 1) return "Please select a customer network";
    if (isOwnershipBlocked) return "Only the user who created this network can modify or delete it";
    return "";
  };

  return (
    <>
      <div className="py-5 px-6 flex items-center justify-between gap-4 border-b border-[#EAECF0]">
        <DataGridHeaderTitle
          title="List of Customer Networks"
          desc="List of configured customer networks"
          count={count}
          units={{
            singular: "Customer Network",
            plural: "Customer Networks",
          }}
        />

        <div className="flex items-center gap-4 flex-shrink-0">
          <RefreshWithToolTip refetch={refetchCustomNetworks} disabled={isFetchingCustomNetworks} />
          <Button
            data-testid="modify-button"
            variant={"outlined"}
            disabled={selectedRows.length !== 1 || isOwnershipBlocked}
            onClick={onModifyClick}
            disabledMessage={getModifyDeleteDisabledMessage()}
          >
            Modify
          </Button>
          <Button
            data-testid="delete-button"
            variant="outlined"
            disabled={selectedRows.length !== 1 || isOwnershipBlocked}
            onClick={onDeleteClick}
            disabledMessage={getModifyDeleteDisabledMessage()}
          >
            Delete
          </Button>
          <Button
            data-testid="peering-info-button"
            variant="outlined"
            disabled={selectedRows.length !== 1}
            onClick={onPeeringInfoClick}
            disabledMessage="Please select a customer network"
          >
            Peering Info
          </Button>
          <Button
            data-testid="create-button"
            variant="contained"
            onClick={onCreateClick}
            disabled={isFetchingCustomNetworks}
          >
            Create
          </Button>
        </div>
      </div>
      <div className="px-6 py-4 border-b border-[#EAECF0]">
        <CustomNetworksFilters
          customNetworks={filterableCustomNetworks}
          setFilteredCustomNetworks={setFilteredCustomNetworks}
        />
      </div>
    </>
  );
};

export default CustomNetworksTableHeader;

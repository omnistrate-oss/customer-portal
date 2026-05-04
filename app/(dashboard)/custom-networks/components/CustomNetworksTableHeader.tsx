import { useMemo } from "react";
import { useSelector } from "react-redux";

import Button from "src/components/Button/Button";
import SearchInput from "src/components/DataGrid/SearchInput";
import DataGridHeaderTitle from "src/components/Headers/DataGridHeaderTitle";
import RefreshWithToolTip from "src/components/RefreshWithTooltip/RefreshWithToolTip";
import { selectUserrootData } from "src/slices/userDataSlice";
import { CustomNetwork } from "src/types/customNetwork";
import { Subscription } from "src/types/subscription";

const CustomNetworksTableHeader = ({
  count,
  searchText,
  setSearchText,
  refetchCustomNetworks,
  isFetchingCustomNetworks,
  onPeeringInfoClick,
  onDeleteClick,
  onCreateClick,
  onModifyClick,
  selectedRows,
  customNetworks = [],
  subscriptions = [],
}: {
  count: number;
  searchText: string;
  setSearchText: (text: string) => void;
  refetchCustomNetworks: () => void;
  isFetchingCustomNetworks: boolean;
  onPeeringInfoClick: () => void;
  onDeleteClick: () => void;
  onCreateClick: () => void;
  onModifyClick: () => void;
  selectedRows: string[];
  customNetworks?: CustomNetwork[];
  subscriptions?: Subscription[];
}) => {
  const currentUser = useSelector(selectUserrootData);

  /**
   * Determines whether the currently selected network's actions should be blocked
   * due to ownership restrictions.
   *
   * Returns `true` (blocked) when:
   * - Exactly one row is selected
   * - The selected network has an `owningUserId`
   * - The logged-in user is NOT the owner
   * - The logged-in user does NOT have an "editor" or "root" role on any subscription
   *   whose `rootUserOrgId` matches the network's `owningUserId`
   *
   * @remarks
   * ⚠️ Potential bug: `rootUserOrgId` is an Org ID while `owningUserId` is a User ID.
   * These two values represent different entity types and are unlikely to ever be equal,
   * meaning the `hasAccess` check may always evaluate to `false`.
   */
  const isOwnershipBlocked = useMemo(() => {
    if (selectedRows.length !== 1) return false;
    const selectedNetwork = customNetworks.find((n) => n.id === selectedRows[0]);
    // No owningUserId means no ownership restriction
    if (!selectedNetwork?.owningUserId) return false;

    const networkOwnerId = selectedNetwork.owningUserId;

    // If the logged-in user is the owner, allow
    if (networkOwnerId === currentUser?.id) return false;

    // Check if the user has editor or root role on any subscription belonging to the network owner's org
    const hasAccess = subscriptions.some(
      (sub) => sub.rootUserId === networkOwnerId && (sub.roleType === "editor" || sub.roleType === "root")
    );

    return !hasAccess;
  }, [selectedRows, customNetworks, currentUser?.id, subscriptions]);

  const getModifyDeleteDisabledMessage = () => {
    if (selectedRows.length !== 1) return "Please select a customer network";
    if (isOwnershipBlocked) return "Only the user who created this network can modify or delete it";
    return "";
  };

  return (
    <div className="py-5 px-6 flex items-center justify-between gap-4">
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
        <SearchInput placeholder="Search by Name" searchText={searchText} setSearchText={setSearchText} width="250px" />
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
  );
};

export default CustomNetworksTableHeader;

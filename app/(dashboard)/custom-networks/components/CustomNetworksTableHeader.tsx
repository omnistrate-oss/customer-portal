import { useMemo } from "react";
import { useSelector } from "react-redux";

import Button from "src/components/Button/Button";
import SearchInput from "src/components/DataGrid/SearchInput";
import DataGridHeaderTitle from "src/components/Headers/DataGridHeaderTitle";
import RefreshWithToolTip from "src/components/RefreshWithTooltip/RefreshWithToolTip";
import { selectUserrootData } from "src/slices/userDataSlice";
import { CustomNetwork } from "src/types/customNetwork";

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
}) => {
  const currentUser = useSelector(selectUserrootData);

  const isOwnershipBlocked = useMemo(() => {
    if (selectedRows.length !== 1) return false;
    const selectedNetwork = customNetworks.find((n) => n.id === selectedRows[0]);
    if (!selectedNetwork?.owningUserId) return false;
    return selectedNetwork.owningUserId !== currentUser?.userId;
  }, [selectedRows, customNetworks, currentUser?.userId]);

  const getModifyDeleteDisabledMessage = () => {
    if (selectedRows.length !== 1) return "Please select a customer network";
    if (isOwnershipBlocked)
      return "This network is owned by another subscription owner. Only the owner can perform this action.";
    return "";
  };

  return (
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

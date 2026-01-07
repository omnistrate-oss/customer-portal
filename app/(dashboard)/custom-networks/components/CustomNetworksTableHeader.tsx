import Button from "src/components/Button/Button";
import SearchInput from "src/components/DataGrid/SearchInput";
import DataGridHeaderTitle from "src/components/Headers/DataGridHeaderTitle";
import RefreshWithToolTip from "src/components/RefreshWithTooltip/RefreshWithToolTip";

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
}) => {
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
          disabled={selectedRows.length !== 1}
          onClick={onModifyClick}
          disabledMessage="Please select a customer network"
        >
          Modify
        </Button>
        <Button
          data-testid="delete-button"
          variant="outlined"
          disabled={selectedRows.length !== 1}
          onClick={onDeleteClick}
          disabledMessage="Please select a customer network"
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

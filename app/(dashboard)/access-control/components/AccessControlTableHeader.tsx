import SearchInput from "src/components/DataGrid/SearchInput";
import DataGridHeaderTitle from "src/components/Headers/DataGridHeaderTitle";
import RefreshWithToolTip from "src/components/RefreshWithTooltip/RefreshWithToolTip";

const AccessControlTableHeader = ({ searchText, setSearchText, refetchUsers, isFetchingUsers, count }) => {
  return (
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
        <SearchInput
          placeholder="Search by Name/Email"
          searchText={searchText}
          setSearchText={setSearchText}
          width="250px"
        />
        <RefreshWithToolTip refetch={refetchUsers} disabled={isFetchingUsers} />
      </div>
    </div>
  );
};

export default AccessControlTableHeader;

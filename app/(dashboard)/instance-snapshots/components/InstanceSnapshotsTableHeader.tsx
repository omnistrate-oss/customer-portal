import Button from "src/components/Button/Button";
import SearchInput from "src/components/DataGrid/SearchInput";
import DataGridHeaderTitle from "src/components/Headers/DataGridHeaderTitle";
import RefreshWithToolTip from "src/components/RefreshWithTooltip/RefreshWithToolTip";
import { SetState } from "src/types/common/reactGenerics";

type InstanceSnapshotsTableHeaderProps = {
  count: number;
  searchText: string;
  setSearchText: SetState<string>;
  refetchSnapshots: () => void;
  isFetchingSnapshots: boolean;
  onDeleteClick: () => void;
  deleteDisabledMessage: string;
  onRestoreClick: () => void;
  restoreDisabledMessage: string;
  isRestoreLoading: boolean;
  onCreateClick: () => void;
  createDisabledMessage: string;
  onCopyClick: () => void;
  copyDisabledMessage: string;
};

const InstanceSnapshotsTableHeader: React.FC<InstanceSnapshotsTableHeaderProps> = ({
  count,
  searchText,
  setSearchText,
  refetchSnapshots,
  isFetchingSnapshots,
  onDeleteClick,
  deleteDisabledMessage,
  onRestoreClick,
  restoreDisabledMessage,
  isRestoreLoading,
  onCreateClick,
  createDisabledMessage,
  onCopyClick,
  copyDisabledMessage,
}) => {
  return (
    <div className="py-5 px-6 flex items justify-between gap-4 border-b border-[#EAECF0]">
      <DataGridHeaderTitle
        title="List of Instance Snapshots"
        desc="View and manage all snapshots, including their creation status, progress, region, and encryption details"
        count={count}
        units={{
          singular: "Snapshot",
          plural: "Snapshots",
        }}
      />

      <div className="flex items-center gap-4 flex-shrink-0">
        <SearchInput placeholder="Search by ID" searchText={searchText} setSearchText={setSearchText} width="250px" />
        <RefreshWithToolTip refetch={refetchSnapshots} disabled={isFetchingSnapshots} />
        <Button
          data-testid="delete-button"
          variant="outlined"
          disabled={!!deleteDisabledMessage}
          onClick={onDeleteClick}
          disabledMessage={deleteDisabledMessage}
        >
          Delete
        </Button>
        <Button
          data-testid="restore-button"
          variant="outlined"
          disabled={!!restoreDisabledMessage}
          onClick={onRestoreClick}
          disabledMessage={restoreDisabledMessage}
          isLoading={isRestoreLoading}
        >
          Restore
        </Button>
        <Button
          data-testid="copy-button"
          variant="outlined"
          disabled={!!copyDisabledMessage}
          onClick={onCopyClick}
          disabledMessage={copyDisabledMessage}
        >
          Copy
        </Button>
        <Button
          data-testid="create-button"
          variant="outlined"
          onClick={onCreateClick}
          disabled={!!createDisabledMessage}
          disabledMessage={createDisabledMessage}
        >
          Create
        </Button>
      </div>
    </div>
  );
};

export default InstanceSnapshotsTableHeader;

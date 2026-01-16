import { CircularProgress } from "@mui/material";

import Button from "src/components/Button/Button";
import DataGridHeaderTitle from "src/components/Headers/DataGridHeaderTitle";
import RefreshWithToolTip from "src/components/RefreshWithTooltip/RefreshWithToolTip";
import { SetState } from "src/types/common/reactGenerics";
import { InstanceSnapshot } from "src/types/instance-snapshot";

import InstanceSnapshotsFilters from "./InstanceSnapshotsFilters";

type InstanceSnapshotsTableHeaderProps = {
  count: number;
  snapshots: InstanceSnapshot[];
  setFilteredSnapshots: SetState<InstanceSnapshot[]>;
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
  snapshots,
  setFilteredSnapshots,
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
    <div>
      <div className="py-5 px-6 flex items-center justify-between gap-4 border-b border-[#EAECF0]">
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
          <div className="flex items-center gap-2">
            {isFetchingSnapshots && <CircularProgress size={20} />}
            <RefreshWithToolTip refetch={refetchSnapshots} disabled={isFetchingSnapshots} />
          </div>
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
            variant="contained"
            onClick={onCreateClick}
            disabled={!!createDisabledMessage}
            disabledMessage={createDisabledMessage}
          >
            Create
          </Button>
        </div>
      </div>
      <div className="py-5 px-6 border-b border-[#EAECF0]">
        <InstanceSnapshotsFilters snapshots={snapshots} setFilteredSnapshots={setFilteredSnapshots} />
      </div>
    </div>
  );
};

export default InstanceSnapshotsTableHeader;

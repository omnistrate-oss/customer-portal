import { FC, useMemo } from "react";
import { Stack } from "@mui/material";
import { UseMutationResult } from "@tanstack/react-query";

import Button from "src/components/Button/Button";
import LoadingSpinnerSmall from "src/components/CircularProgress/CircularProgress";
import SearchInput from "src/components/DataGrid/SearchInput";
import { DateRange, DateTimePickerPopover } from "src/components/DateRangePicker/DateTimeRangePickerStatic";
import DataGridHeaderTitle from "src/components/Headers/DataGridHeaderTitle";
import RefreshWithToolTip from "src/components/RefreshWithTooltip/RefreshWithToolTip";
import { SetState } from "src/types/common/reactGenerics";

import { SnapshotCreationType } from "../Backup";
import { SnapshotBase } from "../hooks/useBackup";

type BackupsTableHeaderProps = {
  resourceName: string;
  count: number;
  searchText: string;
  setSearchText: SetState<string>;
  refetch: () => void;
  restoreMutation: UseMutationResult<void, Error, void, unknown>;
  isRefetching: boolean;
  selectedDateRange: DateRange;
  setSelectedDateRange: SetState<DateRange>;
  handleOpenCopySnapshotModal: (creationType: SnapshotCreationType) => void;
  copySnapshotMutation: UseMutationResult<void, Error, { targetRegion: string }, unknown>;
  selectedSnapshot: SnapshotBase | null;
  tab: "backups" | "snapshots";
  handleRestoreInstanceClick?: () => void;
  handleDeleteSnapshotDialogOpen?: () => void;
  isDeleting?: boolean;
};

const BackupsTableHeader: FC<BackupsTableHeaderProps> = ({
  count,
  refetch,
  isRefetching,
  restoreMutation,
  searchText,
  setSearchText,
  resourceName,
  selectedDateRange,
  setSelectedDateRange,
  handleOpenCopySnapshotModal,
  copySnapshotMutation,
  selectedSnapshot,
  tab,
  handleRestoreInstanceClick,
  handleDeleteSnapshotDialogOpen,
  isDeleting,
}) => {
  const copySnapshotDisabledMessage = useMemo(() => {
    if (copySnapshotMutation.isPending) {
      return "Creating snapshot...";
    }

    if (!selectedSnapshot) {
      return `Select a ${tab === "snapshots" ? "snapshot" : "backup"} to create ${tab === "snapshots" ? "another snapshot" : "a snapshot"} from it`;
    }
    if (selectedSnapshot?.status !== "COMPLETE") {
      return `Selected ${tab === "snapshots" ? "snapshot" : "backup"} must be 'Complete' to create a new snapshot from it`;
    }
    return "";
  }, [copySnapshotMutation.isPending, selectedSnapshot, tab]);

  const restoreDisabledMessage = useMemo(() => {
    if (restoreMutation.isPending) {
      return `Restoring ${tab === "snapshots" ? "snapshot" : "backup"}...`;
    }
    if (!selectedSnapshot) {
      return `Please select a ${tab === "snapshots" ? "snapshot" : "backup"} to restore`;
    }
    if (selectedSnapshot?.status !== "COMPLETE") {
      return `Selected ${tab === "snapshots" ? "snapshot" : "backup"} must be 'Complete' to restore from it`;
    }
    return "";
  }, [restoreMutation.isPending, selectedSnapshot, tab]);

  const deleteSnapshotDisabledMessage = useMemo(() => {
    if (isDeleting) {
      return `Deleting snapshot...`;
    }
    if (!selectedSnapshot) {
      return `Please select a snapshot to delete`;
    }
    if (selectedSnapshot?.status === "DEPLOYING") {
      return `Deploying snapshots cannot be deleted`;
    }

    return "";
  }, [isDeleting, selectedSnapshot]);

  return (
    <>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        p="20px"
        borderBottom="1px solid #EAECF0"
      >
        <DataGridHeaderTitle
          title={`List of  ${tab === "snapshots" ? "snapshots" : "completed backups"} ${resourceName ? `for ${resourceName}` : ""}`}
          desc={
            tab === "snapshots"
              ? "View, restore, copy, or create snapshots for this instance"
              : "View completed backups for this instance. Select a backup to restore or create a snapshot."
          }
          count={count}
          units={{
            singular: tab === "snapshots" ? "Snapshot" : "Backup",
            plural: tab === "snapshots" ? "Snapshots" : "Backups",
          }}
        />
        <Stack direction="row" alignItems="center" gap="12px" justifyContent="flex-end" flexGrow={1} flexWrap={"wrap"}>
          <SearchInput
            placeholder="Search by Name"
            searchText={searchText}
            setSearchText={setSearchText}
            width="250px"
          />
          <RefreshWithToolTip refetch={refetch} disabled={isRefetching} />
          <DateTimePickerPopover dateRange={selectedDateRange} setDateRange={setSelectedDateRange} />

          {tab === "snapshots" && (
            <Button
              variant="outlined"
              sx={{
                height: "40px !important",
                padding: "10px 14px !important",
              }}
              onClick={handleDeleteSnapshotDialogOpen}
              disabled={isRefetching || isDeleting || !selectedSnapshot || selectedSnapshot?.status === "DEPLOYING"}
              disabledMessage={deleteSnapshotDisabledMessage}
            >
              Delete
            </Button>
          )}
          <Button
            variant="outlined"
            sx={{
              height: "40px !important",
              padding: "10px 14px !important",
            }}
            disabled={
              isRefetching || restoreMutation.isPending || !selectedSnapshot || selectedSnapshot?.status !== "COMPLETE"
            }
            disabledMessage={restoreDisabledMessage}
            onClick={handleRestoreInstanceClick}
          >
            Restore
            {restoreMutation.isPending && <LoadingSpinnerSmall sx={{ color: "#7F56D9", marginLeft: "12px" }} />}
          </Button>
          <Button
            variant="outlined"
            sx={{
              height: "40px !important",
              padding: "10px 14px !important",
            }}
            onClick={() => handleOpenCopySnapshotModal("copyFromExisting")}
            disabled={
              isRefetching ||
              copySnapshotMutation.isPending ||
              !selectedSnapshot ||
              selectedSnapshot?.status !== "COMPLETE"
            }
            disabledMessage={copySnapshotDisabledMessage}
          >
            {tab === "backups" ? "Create Snapshot" : "Copy"}
          </Button>
        </Stack>
      </Stack>
    </>
  );
};

export default BackupsTableHeader;

import { FC, useMemo } from "react";
import { Stack } from "@mui/material";
import { UseMutationResult } from "@tanstack/react-query";

import Button from "src/components/Button/Button";
import LoadingSpinnerSmall from "src/components/CircularProgress/CircularProgress";
import SearchInput from "src/components/DataGrid/SearchInput";
import { DateRange, DateTimePickerPopover } from "src/components/DateRangePicker/DateTimeRangePickerStatic";
import DataGridHeaderTitle from "src/components/Headers/DataGridHeaderTitle";
import RefreshWithToolTip from "src/components/RefreshWithTooltip/RefreshWithToolTip";
import { CLOUD_PROVIDERS } from "src/constants/cloudProviders";
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
  cloudProvider: string | undefined;
  copySnapshotMutation: UseMutationResult<void, Error, { targetRegion: string }, unknown>;
  selectedSnapshot: SnapshotBase | null;
  tab: "backups" | "snapshots";
  handleRestoreInstanceClick?: () => void;
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
  cloudProvider,
  copySnapshotMutation,
  selectedSnapshot,
  tab,
  handleRestoreInstanceClick,
}) => {
  const copySnapshotDisabledMessage = useMemo(() => {
    if (copySnapshotMutation.isPending) {
      return "Creating snapshot...";
    }
    if (cloudProvider !== CLOUD_PROVIDERS.gcp) {
      return "Snapshot creation is restricted to GCP deployments";
    }
    if (!selectedSnapshot) {
      return `Select a ${tab === "snapshots" ? "snapshot" : "backup"} to create ${tab === "snapshots" ? "another snapshot" : "a snapshot"} from it`;
    }
    if (selectedSnapshot?.status !== "COMPLETE") {
      return `Selected ${tab === "snapshots" ? "snapshot" : "backup"} must be 'Complete' to create a new snapshot from it`;
    }
    return "";
  }, [cloudProvider, copySnapshotMutation.isPending, selectedSnapshot, tab]);

  // const createSnapshotDisabledMessage = useMemo(() => {
  //   if (copySnapshotMutation.isPending) {
  //     return "Creating snapshot...";
  //   }
  //   if (cloudProvider !== CLOUD_PROVIDERS.gcp) {
  //     return "Snapshot creation is restricted to GCP deployments";
  //   }
  //   return "";
  // }, [cloudProvider, copySnapshotMutation.isPending]);

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
              cloudProvider !== CLOUD_PROVIDERS.gcp ||
              !selectedSnapshot ||
              selectedSnapshot?.status !== "COMPLETE"
            }
            disabledMessage={copySnapshotDisabledMessage}
          >
            {tab === "backups" ? "Create Snapshot" : "Copy Snapshot"}
          </Button>

          {/* {tab === "snapshots" && (
            <Button
              variant="outlined"
              sx={{
                height: "40px !important",
                padding: "10px 14px !important",
              }}
              onClick={() => handleOpenCopySnapshotModal("createNew")}
              disabled={isRefetching || copySnapshotMutation.isPending || cloudProvider !== CLOUD_PROVIDERS.gcp}
              disabledMessage={createSnapshotDisabledMessage}
            >
              Create Snapshot
            </Button>
          )} */}
        </Stack>
      </Stack>
    </>
  );
};

export default BackupsTableHeader;

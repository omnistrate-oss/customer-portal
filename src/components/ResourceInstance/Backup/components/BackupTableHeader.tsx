import { Stack } from "@mui/material";

import Button from "src/components/Button/Button";
import LoadingSpinnerSmall from "src/components/CircularProgress/CircularProgress";
import SearchInput from "src/components/DataGrid/SearchInput";
import DataGridHeaderTitle from "src/components/Headers/DataGridHeaderTitle";
import RefreshWithToolTip from "src/components/RefreshWithTooltip/RefreshWithToolTip";
import RefreshIcon from "@mui/icons-material/Refresh";
import DateRangePicker from "src/components/DateRangePicker/DateRangePicker";
import { FC } from "react";
import { SetState } from "src/types/common/reactGenerics";
import { Range } from "react-date-range";
import { UseMutationResult } from "@tanstack/react-query";

type BackupsTableHeaderProps = {
  resourceName: string;
  count: number;
  searchText: string;
  setSearchText: SetState<string>;
  refetch: () => void;
  restoreMutation: UseMutationResult<void, Error, void, unknown>;
  isRefetching: boolean;
  selectedDateRange: Range;
  setSelectedDateRange: SetState<Range>;
  isRestoreDisabled: boolean;
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
  isRestoreDisabled,
}) => {
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
          title={`List of Completed backups ${resourceName ? `for ${resourceName}` : ""}`}
          desc="View and manage your backups"
          count={count}
          units={{
            singular: "Backup",
            plural: "Backups",
          }}
        />
        <Stack direction="row" alignItems="center" gap="12px">
          <SearchInput
            placeholder="Search by Name"
            searchText={searchText}
            setSearchText={setSearchText}
            width="250px"
          />
          <RefreshWithToolTip refetch={refetch} disabled={isRefetching} />
          <DateRangePicker
            dateRange={selectedDateRange}
            setDateRange={setSelectedDateRange}
          />
          <Button
            variant="outlined"
            sx={{
              height: "40px !important",
              padding: "10px 14px !important",
            }}
            startIcon={<RefreshIcon />}
            disabled={
              isRefetching || restoreMutation.isLoading || isRestoreDisabled
            }
            onClick={() => {
              restoreMutation.mutate();
            }}
          >
            Restore
            {restoreMutation.isLoading && (
              <LoadingSpinnerSmall
                sx={{ color: "#7F56D9", marginLeft: "12px" }}
              />
            )}
          </Button>
        </Stack>
      </Stack>
    </>
  );
};

export default BackupsTableHeader;

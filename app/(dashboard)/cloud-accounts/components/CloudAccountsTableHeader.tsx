import { CircularProgress } from "@mui/material";
import { FC } from "react";

import Button from "components/Button/Button";
import SearchInput from "components/DataGrid/SearchInput";
import DataGridHeaderTitle from "components/Headers/DataGridHeaderTitle";
import RefreshWithToolTip from "components/RefreshWithTooltip/RefreshWithToolTip";
import { AccountConfig } from "src/types/account-config";
import { ResourceInstance } from "src/types/resourceInstance";

type CloudAccountTableHeaderProps = {
  count: number;
  searchText: string;
  setSearchText: (text: string) => void;
  onCreateClick: () => void;
  onDeleteClick: () => void;
  selectedInstance: ResourceInstance;
  refetchInstances: () => void;
  isFetchingInstances: boolean;
  onOffboardClick?: () => void;
  accountConfig: AccountConfig;
  isSelectedInstanceReadyToOffboard: boolean;
  isFetchingAccountConfigs: boolean;
};

const CloudAccountsTableHeader: FC<CloudAccountTableHeaderProps> = ({
  count,
  searchText,
  setSearchText,
  onCreateClick,
  onDeleteClick,
  selectedInstance,
  refetchInstances,
  isFetchingInstances,
  isFetchingAccountConfigs,
  onOffboardClick,
  isSelectedInstanceReadyToOffboard,
}) => {
  const isDeleting = selectedInstance?.status === "DELETING";

  const isDeleteDisabled = !selectedInstance || isDeleting || isSelectedInstanceReadyToOffboard;

  const isOffboardDisabled = !isSelectedInstanceReadyToOffboard;

  const isDeleteDisabledMessage = !selectedInstance
    ? "Please select a cloud account"
    : isDeleting
      ? "Cloud account deletion is already in progress"
      : "";

  const offboardingDisabledMessage = !selectedInstance
    ? "Please select a cloud account"
    : isOffboardDisabled
      ? "Cloud account is not ready to offboard"
      : "";

  return (
    <div className="py-5 px-6 flex items-center justify-between gap-4">
      <DataGridHeaderTitle
        title="List of Cloud Accounts"
        desc="Details of cloud account instances"
        count={count}
        units={{
          singular: "Account",
          plural: "Accounts",
        }}
      />

      <div className="flex items-center gap-4">
        <div className="flex items-center mr-6">{isFetchingInstances && <CircularProgress size={20} />}</div>

        <SearchInput placeholder="Search by ID" searchText={searchText} setSearchText={setSearchText} />
        <RefreshWithToolTip refetch={refetchInstances} disabled={isFetchingInstances || isFetchingAccountConfigs} />

        <Button
          data-testid="delete-button"
          variant="outlined"
          disabled={isDeleteDisabled}
          onClick={onDeleteClick}
          disabledMessage={isDeleteDisabledMessage}
        >
          Delete
        </Button>
        <Button
          data-testid="offboard-button"
          variant="outlined"
          disabled={isOffboardDisabled}
          onClick={onOffboardClick}
          disabledMessage={offboardingDisabledMessage}
        >
          Offboard
        </Button>
        <Button data-testid="create-button" variant="contained" onClick={onCreateClick}>
          Create
        </Button>
      </div>
    </div>
  );
};

export default CloudAccountsTableHeader;

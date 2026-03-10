import { FC } from "react";
import { CircularProgress } from "@mui/material";

import { AccountConfig } from "src/types/account-config";
import { ResourceInstance } from "src/types/resourceInstance";
import { Subscription } from "src/types/subscription";
import Button from "components/Button/Button";
import SearchInput from "components/DataGrid/SearchInput";
import DataGridHeaderTitle from "components/Headers/DataGridHeaderTitle";
import RefreshWithToolTip from "components/RefreshWithTooltip/RefreshWithToolTip";

import { Overlay } from "../page";

import CloudAccountsActionMenu from "./CloudAccountsActionsMenu";

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
  setOverlayType: (overlay: Overlay) => void;
  setIsOverlayOpen: (isOpen: boolean) => void;
  selectedInstanceSubscription?: Subscription;
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
  setOverlayType,
  setIsOverlayOpen,
  selectedInstanceSubscription,
}) => {
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
        <Button data-testid="create-button" variant="contained" onClick={onCreateClick}>
          Create
        </Button>

        <CloudAccountsActionMenu
          setOverlayType={setOverlayType}
          setIsOverlayOpen={setIsOverlayOpen}
          disabled={!selectedInstance}
          disabledMessage="Please select an instance"
          instance={selectedInstance}
          subscription={selectedInstanceSubscription}
          onDeleteClick={onDeleteClick}
          onOffboardClick={() => onOffboardClick?.()}
          isSelectedInstanceReadyToOffboard={isSelectedInstanceReadyToOffboard}
        />
      </div>
    </div>
  );
};

export default CloudAccountsTableHeader;

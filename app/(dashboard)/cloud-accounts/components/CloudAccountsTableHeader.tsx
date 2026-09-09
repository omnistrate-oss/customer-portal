import { FC } from "react";
import { CircularProgress } from "@mui/material";

import { AccountConfig } from "src/types/account-config";
import { SetState } from "src/types/common/reactGenerics";
import { ResourceInstance } from "src/types/resourceInstance";
import { Subscription } from "src/types/subscription";
import Button from "components/Button/Button";
import DataGridHeaderTitle from "components/Headers/DataGridHeaderTitle";
import RefreshWithToolTip from "components/RefreshWithTooltip/RefreshWithToolTip";

import { Overlay } from "../page";

import CloudAccountsActionMenu from "./CloudAccountsActionsMenu";
import CloudAccountsFilters from "./CloudAccountsFilters";

type CloudAccountTableHeaderProps = {
  count: number;
  instances: ResourceInstance[];
  setFilteredInstances: SetState<ResourceInstance[]>;
  subscriptionsObj: Record<string, Subscription>;
  accountConfigsHash: Record<string, AccountConfig>;
  onCreateClick: () => void;
  onDeleteClick: () => void;
  selectedInstance?: ResourceInstance;
  refetchInstances: () => void;
  isFetchingInstances: boolean;
  onOffboardClick?: () => void;
  accountConfig?: AccountConfig;
  isSelectedInstanceReadyToOffboard: boolean;
  isFetchingAccountConfigs: boolean;
  setOverlayType: (overlay: Overlay) => void;
  setIsOverlayOpen: (isOpen: boolean) => void;
  selectedInstanceSubscription?: Subscription;
  serviceModelType: string;
  onConnectClick: () => void;
  onDisconnectClick: () => void;
};

const CloudAccountsTableHeader: FC<CloudAccountTableHeaderProps> = ({
  count,
  instances,
  setFilteredInstances,
  subscriptionsObj,
  accountConfigsHash,
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
  onConnectClick,
  onDisconnectClick,
  serviceModelType,
}) => {
  return (
    <>
      <div className="py-5 px-6 flex items-center justify-between gap-4 border-b border-[#EAECF0]">
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
            onConnectClick={onConnectClick}
            onDisconnectClick={onDisconnectClick}
            serviceModelType={serviceModelType}
            isSelectedInstanceReadyToOffboard={isSelectedInstanceReadyToOffboard}
          />
        </div>
      </div>
      <div className="px-6 py-4 border-b border-[#EAECF0]">
        <CloudAccountsFilters
          instances={instances}
          setFilteredInstances={setFilteredInstances}
          subscriptionsObj={subscriptionsObj}
          accountConfigsHash={accountConfigsHash}
        />
      </div>
    </>
  );
};

export default CloudAccountsTableHeader;

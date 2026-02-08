import { useMemo } from "react";

import ActionMenu, { ActionMenuItem } from "@/components/ActionMenu";
import useSnackbar from "src/hooks/useSnackbar";
import { SetState } from "src/types/common/reactGenerics";
import { ResourceInstance } from "src/types/resourceInstance";
import { Subscription } from "src/types/subscription";
import {
  getEnumFromUserRoleString,
  isOperationAllowedByRBAC,
  operationEnum,
  viewEnum,
} from "src/utils/isAllowedByRBAC";

import { Overlay } from "../page";

type CloudAccountsActionMenuProps = {
  instance?: ResourceInstance;
  subscription?: Subscription;
  disabled?: boolean;
  disabledMessage?: string;
  setOverlayType: SetState<Overlay>;
  setIsOverlayOpen: SetState<boolean>;
  onConnectClick: () => void;
  onDisconnectClick: () => void;
  onDeleteClick: () => void;
  onOffboardClick: () => void;
  serviceModelType?: string;
  isSelectedInstanceReadyToOffboard: boolean;
};

const CloudAccountsActionMenu: React.FC<CloudAccountsActionMenuProps> = ({
  instance,
  subscription,
  disabled = false,
  disabledMessage = "",
  setOverlayType,
  setIsOverlayOpen,
  onConnectClick,
  onDisconnectClick,
  onDeleteClick,
  onOffboardClick,
  serviceModelType,
  isSelectedInstanceReadyToOffboard,
}) => {
  const snackbar = useSnackbar();

  const actions = useMemo(() => {
    const res: (ActionMenuItem & { isLoading?: boolean })[] = [];

    const role = getEnumFromUserRoleString(subscription?.roleType);
    const isUpdateAllowedByRBAC = isOperationAllowedByRBAC(operationEnum.Update, role, viewEnum.Access_Resources);

    const isDeploying = instance?.status === "DEPLOYING";
    const isAttaching = instance?.status === "ATTACHING";
    const isConnecting = instance?.status === "CONNECTING";
    const isDisconnected = instance?.status === "DISCONNECTED";
    const isOnPremCopilot = serviceModelType === "ON_PREM_COPILOT";
    const isReady = instance?.status === "READY";
    const isDisconnecting = instance?.status === "DISCONNECTING";
    const isDetaching = instance?.status === "DETACHING";
    const isPendingDetaching = instance?.status === "PENDING_DETACHING";
    const isDeleting = instance?.status === "DELETING";

    // Connect action
    const isConnectDisabled =
      !instance || isReady || isDisconnecting || isDetaching || isPendingDetaching || isDeploying || !isOnPremCopilot;

    const isConnectDisabledMessage = !instance
      ? "Please select a cloud account"
      : isReady
        ? "Cloud account is already connected"
        : isDisconnecting || isDetaching || isPendingDetaching
          ? "Cloud account is disconnecting"
          : isDeploying
            ? "Please wait for the instance to get to Ready state"
            : !isOnPremCopilot
              ? "This feature is not supported for this plan"
              : "";

    res.push({
      dataTestId: "connect-action-button",
      label: "Connect",
      isDisabled: isConnectDisabled,
      onClick: onConnectClick,
      disabledMessage: isConnectDisabledMessage,
    });

    // Disconnect action
    const isDisconnectDisabled =
      !instance || isAttaching || isConnecting || isDisconnected || isDeploying || !isOnPremCopilot;

    const isDisconnectDisabledMessage = !instance
      ? "Please select a cloud account"
      : isAttaching || isConnecting
        ? "Cloud account is connecting"
        : isDisconnected
          ? "Cloud account is disconnected"
          : isDeploying
            ? "Please wait for the instance to get to Ready state"
            : !isOnPremCopilot
              ? "This feature is not supported for this plan"
              : "";

    res.push({
      dataTestId: "disconnect-action-button",
      label: "Disconnect",
      isDisabled: isDisconnectDisabled,
      onClick: onDisconnectClick,
      disabledMessage: isDisconnectDisabledMessage,
    });

    // Delete action
    const isDeleteDisabled = !instance || isDeleting || isDisconnected || isSelectedInstanceReadyToOffboard;

    const isDeleteDisabledMessage = !instance
      ? "Please select a cloud account"
      : isDeleting
        ? "Cloud account deletion is already in progress"
        : isDisconnected
          ? "Cloud account is disconnected"
          : "";

    res.push({
      dataTestId: "delete-action-button",
      label: "Delete",
      isDisabled: isDeleteDisabled,
      onClick: onDeleteClick,
      disabledMessage: isDeleteDisabledMessage,
    });

    // Offboard action
    const isOffboardDisabled = !isSelectedInstanceReadyToOffboard;

    const offboardingDisabledMessage = !instance
      ? "Please select a cloud account"
      : isOffboardDisabled
        ? "Cloud account is not ready to offboard"
        : "";

    res.push({
      dataTestId: "offboard-action-button",
      label: "Offboard",
      isDisabled: isOffboardDisabled,
      onClick: onOffboardClick,
      disabledMessage: offboardingDisabledMessage,
    });

    const deletionProtectionFeatureEnabled = instance?.resourceInstanceMetadata?.deletionProtection !== undefined;
    const isDeleteProtected = instance?.resourceInstanceMetadata?.deletionProtection === true;

    if (deletionProtectionFeatureEnabled) {
      res.push({
        dataTestId: "enable-deletion-protection-button",
        label: "Enable Delete Protection",
        isDisabled: isDeleteProtected || !isUpdateAllowedByRBAC,
        onClick: () => {
          if (!instance) return snackbar.showError("Please select an instance");
          setIsOverlayOpen(true);
          setOverlayType("enable-deletion-protection-dialog");
        },
        disabledMessage: !instance
          ? "Please select an instance"
          : isDeleteProtected
            ? "Delete protection is already enabled"
            : !isUpdateAllowedByRBAC
              ? "Unauthorized to enable delete protection"
              : "",
      });

      res.push({
        dataTestId: "disable-deletion-protection-button",
        label: "Disable Delete Protection",
        isDisabled: !isDeleteProtected || !isUpdateAllowedByRBAC,
        onClick: () => {
          if (!instance) return snackbar.showError("Please select an instance");
          setIsOverlayOpen(true);
          setOverlayType("disable-deletion-protection-dialog");
        },
        disabledMessage: !instance
          ? "Please select an instance"
          : !isDeleteProtected
            ? "Delete protection is already disabled"
            : !isUpdateAllowedByRBAC
              ? "Unauthorized to disable delete protection"
              : "",
      });
    }

    return res;
  }, [
    instance,
    subscription,
    serviceModelType,
    isSelectedInstanceReadyToOffboard,
    onConnectClick,
    onDisconnectClick,
    onDeleteClick,
    onOffboardClick,
    setIsOverlayOpen,
    setOverlayType,
    snackbar,
  ]);

  return <ActionMenu disabledMessage={disabledMessage} disabled={disabled} menuItems={actions} />;
};

export default CloudAccountsActionMenu;

import { useMemo } from "react";

import ActionMenu, { ActionMenuItem } from "@/components/ActionMenu";
import useSnackbar from "src/hooks/useSnackbar";
import { SetState } from "src/types/common/reactGenerics";
import { ResourceInstance } from "src/types/resourceInstance";
import { Subscription } from "src/types/subscription";
import { getResultParams } from "src/utils/instance";
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
  onDeleteClick: () => void;
  onOffboardClick: () => void;
  onModifyClick?: () => void;
  isSelectedInstanceReadyToOffboard: boolean;
  onConnectClick: () => void;
  onDisconnectClick: () => void;
  serviceModelType: string;
};

const CloudAccountsActionMenu: React.FC<CloudAccountsActionMenuProps> = ({
  instance,
  subscription,
  disabled = false,
  disabledMessage = "",
  setOverlayType,
  setIsOverlayOpen,
  onDeleteClick,
  onOffboardClick,
  onModifyClick,
  isSelectedInstanceReadyToOffboard,
  // serviceModelType,
  // onConnectClick,
  // onDisconnectClick,
}) => {
  const snackbar = useSnackbar();

  const actions = useMemo(() => {
    const res: (ActionMenuItem & { isLoading?: boolean })[] = [];

    const role = getEnumFromUserRoleString(subscription?.roleType);
    const isUpdateAllowedByRBAC = isOperationAllowedByRBAC(operationEnum.Update, role, viewEnum.Access_Resources);
    const deletionProtectionFeatureEnabled = instance?.resourceInstanceMetadata?.deletionProtection !== undefined;
    const isDeleteProtected = instance?.resourceInstanceMetadata?.deletionProtection === true;
    const isDeleting = instance?.status === "DELETING";
    const isNebius = !!getResultParams(instance)?.nebius_tenant_id;

    // const isDeploying = instance?.status === "DEPLOYING";
    // const isFailed = instance?.status === "FAILED";
    // const isAttaching = instance?.status === "ATTACHING";
    // const isConnecting = instance?.status === "CONNECTING";
    const isDisconnected = instance?.status === "DISCONNECTED";

    // const isOnPremCopilot = serviceModelType === "ON_PREM_COPILOT";
    // const isReady = instance?.status === "READY";
    // const isDisconnecting = instance?.status === "DISCONNECTING";

    // const isDetaching = instance?.status === "DETACHING";
    // const isPendingDetaching = instance?.status === "PENDING_DETACHING";

    // const isDisconnectDisabled =
    //   !instance || isFailed || isAttaching || isConnecting || isDisconnected || isDeploying || !isOnPremCopilot;

    // const isConnectDisabled =
    //   !instance ||
    //   isFailed ||
    //   isReady ||
    //   isDisconnecting ||
    //   isDetaching ||
    //   isPendingDetaching ||
    //   isDeploying ||
    //   !isOnPremCopilot;

    // const isDisconnectDisabledMessage = !instance
    //   ? "Please select a cloud account"
    //   : isFailed
    //     ? "Cloud account is not ready to disconnect"
    //     : isAttaching || isConnecting
    //       ? "Cloud account is connecting"
    //       : isDisconnected
    //         ? "Cloud account is disconnected"
    //         : isDeploying
    //           ? "Please wait for the instance to get to Ready state"
    //           : !isOnPremCopilot
    //             ? "This feature is not supported for this plan"
    //             : "";
    // const isConnectDisabledMessage = !instance
    //   ? "Please select a cloud account"
    //   : isFailed
    //     ? "Cloud account is not ready to connect"
    //     : isReady
    //       ? "Cloud account is already connected"
    //       : isDisconnecting || isDetaching || isPendingDetaching
    //         ? "Cloud account is disconnecting"
    //         : isDeploying
    //           ? "Please wait for the instance to get to Ready state"
    //           : !isOnPremCopilot
    //             ? "This feature is not supported for this plan"
    //             : "";

    // Delete action
    const isDeleteDisabled = !instance || isDeleting || isSelectedInstanceReadyToOffboard || isNebius || isDisconnected;

    const isDeleteDisabledMessage = !instance
      ? "Please select a cloud account"
      : isNebius
        ? "Delete is not supported for Nebius cloud accounts"
        : isDeleting
          ? "Cloud account deletion is already in progress"
          : isDeleteProtected && deletionProtectionFeatureEnabled
            ? "Cloud account has delete protection enabled"
            : "";

    // Modify is currently only meaningful for Nebius — its bindings can be
    // edited post-creation. Other providers' BYOA cloud accounts are
    // immutable post-creation, so the action shows disabled with a tooltip
    // for them.
    const isModifyDisabled = !instance || !isNebius || !isUpdateAllowedByRBAC || isDeleting;
    const modifyDisabledMessage = !instance
      ? "Please select a cloud account"
      : !isNebius
        ? "Modify is only supported for Nebius cloud accounts"
        : isDeleting
          ? "Cloud account is being deleted"
          : !isUpdateAllowedByRBAC
            ? "Unauthorized to modify cloud account"
            : "";

    res.push({
      dataTestId: "modify-action-button",
      label: "Modify",
      isDisabled: isModifyDisabled,
      onClick: () => {
        if (!instance) return snackbar.showError("Please select a cloud account");
        onModifyClick?.();
      },
      disabledMessage: modifyDisabledMessage,
    });

    res.push({
      dataTestId: "delete-action-button",
      label: "Delete",
      isDisabled: isDeleteDisabled || isDeleteProtected,
      onClick: onDeleteClick,
      disabledMessage: isDeleteDisabledMessage,
    });

    // Offboard action
    const isOffboardDisabled = !isSelectedInstanceReadyToOffboard || isNebius;

    const offboardingDisabledMessage = !instance
      ? "Please select a cloud account"
      : isNebius
        ? "Offboard is not supported for Nebius cloud accounts"
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

    // if (isOnPremCopilot) {
    //   res.push({
    //     dataTestId: "connect-button",
    //     label: "Connect",
    //     isDisabled: isConnectDisabled || !isUpdateAllowedByRBAC,
    //     onClick: () => {
    //       if (!instance) return snackbar.showError("Please select a cloud account");
    //       onConnectClick();
    //     },
    //     disabledMessage: !isUpdateAllowedByRBAC ? "Unauthorized to connect cloud account" : isConnectDisabledMessage,
    //   });
    //   res.push({
    //     dataTestId: "disconnect-button",
    //     label: "Disconnect",
    //     isDisabled: isDisconnectDisabled || !isUpdateAllowedByRBAC,
    //     onClick: () => {
    //       if (!instance) return snackbar.showError("Please select a cloud account");
    //       onDisconnectClick();
    //     },
    //     disabledMessage: !isUpdateAllowedByRBAC
    //       ? "Unauthorized to disconnect cloud account"
    //       : isDisconnectDisabledMessage,
    //   });
    // }

    if (deletionProtectionFeatureEnabled) {
      res.push({
        dataTestId: "enable-deletion-protection-button",
        label: "Enable Delete Protection",
        isDisabled: isDeleteProtected || !isUpdateAllowedByRBAC || isDeleting,
        onClick: () => {
          if (!instance) return snackbar.showError("Please select an instance");
          setIsOverlayOpen(true);
          setOverlayType("enable-deletion-protection-dialog");
        },
        disabledMessage: !instance
          ? "Please select an instance"
          : isDeleting
            ? "Cloud account is being deleted"
            : isDeleteProtected
              ? "Delete protection is already enabled"
              : !isUpdateAllowedByRBAC
                ? "Unauthorized to enable delete protection"
                : "",
      });

      res.push({
        dataTestId: "disable-deletion-protection-button",
        label: "Disable Delete Protection",
        isDisabled: !isDeleteProtected || !isUpdateAllowedByRBAC || isDeleting,
        onClick: () => {
          if (!instance) return snackbar.showError("Please select an instance");
          setIsOverlayOpen(true);
          setOverlayType("disable-deletion-protection-dialog");
        },
        disabledMessage: !instance
          ? "Please select an instance"
          : isDeleting
            ? "Cloud account is being deleted"
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
    isSelectedInstanceReadyToOffboard,
    onDeleteClick,
    onOffboardClick,
    onModifyClick,
    setIsOverlayOpen,
    setOverlayType,
    snackbar,
  ]);

  return <ActionMenu disabledMessage={disabledMessage} disabled={disabled} menuItems={actions} />;
};

export default CloudAccountsActionMenu;

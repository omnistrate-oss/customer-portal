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
  onDeleteClick: () => void;
  onOffboardClick: () => void;
  isSelectedInstanceReadyToOffboard: boolean;
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
  isSelectedInstanceReadyToOffboard,
}) => {
  const snackbar = useSnackbar();

  const actions = useMemo(() => {
    const res: (ActionMenuItem & { isLoading?: boolean })[] = [];

    const role = getEnumFromUserRoleString(subscription?.roleType);
    const isUpdateAllowedByRBAC = isOperationAllowedByRBAC(operationEnum.Update, role, viewEnum.Access_Resources);

    const isDeleting = instance?.status === "DELETING";

    // Delete action
    const isDeleteDisabled = !instance || isDeleting || isSelectedInstanceReadyToOffboard;

    const isDeleteDisabledMessage = !instance
      ? "Please select a cloud account"
      : isDeleting
        ? "Cloud account deletion is already in progress"
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
    setIsOverlayOpen,
    setOverlayType,
    snackbar,
  ]);

  return <ActionMenu disabledMessage={disabledMessage} disabled={disabled} menuItems={actions} />;
};

export default CloudAccountsActionMenu;

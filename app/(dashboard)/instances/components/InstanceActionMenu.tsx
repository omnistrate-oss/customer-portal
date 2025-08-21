import { useMemo } from "react";
import { Box } from "@mui/material";

import ActionMenu, { ActionMenuItem } from "@/components/ActionMenu";
import { $api } from "src/api/query";
import DeleteIcon from "src/components/Icons/Delete/Delete";
import GenerateTokenIcon from "src/components/Icons/GenerateToken/GenerateTokenIcon";
import PlayIcon from "src/components/Icons/Play/Play";
import RebootIcon from "src/components/Icons/Reboot/Reboot";
import RestoreInstanceIcon from "src/components/Icons/RestoreInstance/RestoreInstanceIcon";
import StopIcon from "src/components/Icons/Stop/Stop";
import Tooltip from "src/components/Tooltip/Tooltip";
import { CLI_MANAGED_RESOURCES } from "src/constants/resource";
import { ResourceInstance } from "src/hooks/useResourceInstance";
import useSnackbar from "src/hooks/useSnackbar";
import { SetState } from "src/types/common/reactGenerics";
import { ServiceOffering } from "src/types/serviceOffering";
import { Subscription } from "src/types/subscription";
import {
  getEnumFromUserRoleString,
  isOperationAllowedByRBAC,
  operationEnum,
  viewEnum,
} from "src/utils/isAllowedByRBAC";

import { Overlay } from "../page";
import { getMainResourceFromInstance } from "../utils";

type InstanceActionMenuProps = {
  instance?: ResourceInstance;
  serviceOffering?: ServiceOffering;
  subscription?: Subscription;
  disabled?: boolean;
  disabledMessage?: string;
  variant: "table-header" | "details-page";
  setOverlayType: SetState<Overlay>;
  setIsOverlayOpen: SetState<boolean>;
};

const InstanceActionMenu: React.FC<InstanceActionMenuProps> = ({
  instance,
  serviceOffering,
  subscription,
  disabled = false,
  disabledMessage = "",
  variant,
  setOverlayType,
  setIsOverlayOpen,
}) => {
  const snackbar = useSnackbar();

  const selectedResource = useMemo(() => {
    return getMainResourceFromInstance(instance, serviceOffering);
  }, [instance, serviceOffering]);

  const stopInstanceMutation = $api.useMutation(
    "post",
    "/2022-09-01-00/resource-instance/{serviceProviderId}/{serviceKey}/{serviceAPIVersion}/{serviceEnvironmentKey}/{serviceModelKey}/{productTierKey}/{resourceKey}/{id}/stop",
    {
      onSuccess: async () => {
        // TODO: On Success
        snackbar.showSuccess("Stopping deployment instance...");
      },
    }
  );

  const startInstanceMutation = $api.useMutation(
    "post",
    "/2022-09-01-00/resource-instance/{serviceProviderId}/{serviceKey}/{serviceAPIVersion}/{serviceEnvironmentKey}/{serviceModelKey}/{productTierKey}/{resourceKey}/{id}/start",
    {
      onSuccess: async () => {
        // TODO: On Success
        snackbar.showSuccess("Starting deployment instance...");
      },
    }
  );

  const restartInstanceMutation = $api.useMutation(
    "post",
    "/2022-09-01-00/resource-instance/{serviceProviderId}/{serviceKey}/{serviceAPIVersion}/{serviceEnvironmentKey}/{serviceModelKey}/{productTierKey}/{resourceKey}/{id}/restart",
    {
      onSuccess: async () => {
        // TODO: On Success
        snackbar.showSuccess("Restarting deployment instance...");
      },
    }
  );

  const actions = useMemo(() => {
    const res: ActionMenuItem[] = [];
    const { status } = instance || {};
    const isComplexResource = CLI_MANAGED_RESOURCES.includes(selectedResource?.resourceType as string);
    const isProxyResource = selectedResource?.resourceType === "PortsBasedProxy";

    const role = getEnumFromUserRoleString(subscription?.roleType);
    const isUpdateAllowedByRBAC = isOperationAllowedByRBAC(operationEnum.Update, role, viewEnum.Access_Resources);
    const isDeleteAllowedByRBAC = isOperationAllowedByRBAC(operationEnum.Delete, role, viewEnum.Access_Resources);

    // Allow Upgrades if the VERSION_SET_OVERRIDE Feature is Enabled for the Product Tier
    const allowUpgrades = serviceOffering?.productTierFeatures?.some(
      (feature) => feature.feature === "VERSION_SET_OVERRIDE" && feature.scope === "CUSTOMER"
    );

    const pathData = {
      serviceProviderId: serviceOffering?.serviceProviderId || "",
      serviceKey: serviceOffering?.serviceURLKey || "",
      serviceAPIVersion: serviceOffering?.serviceAPIVersion || "",
      serviceEnvironmentKey: serviceOffering?.serviceEnvironmentURLKey || "",
      serviceModelKey: serviceOffering?.serviceModelURLKey || "",
      productTierKey: serviceOffering?.productTierURLKey || "",
      resourceKey: selectedResource?.urlKey as string,
      id: instance?.id || "",
    };

    if (variant === "details-page") {
      res.push({
        dataTestId: "stop-button",
        label: "Stop",
        icon: StopIcon,
        isLoading: stopInstanceMutation.isPending,
        isDisabled: !instance || status !== "RUNNING" || isComplexResource || isProxyResource || !isUpdateAllowedByRBAC,
        onClick: () => {
          if (!instance) return snackbar.showError("Please select an instance");
          if (!serviceOffering) return snackbar.showError("Product not found");
          stopInstanceMutation.mutate({
            params: {
              path: pathData,
              query: {
                subscriptionId: subscription?.id,
              },
            },
          });
        },
        disabledMessage: !instance
          ? "Please select an instance"
          : status !== "RUNNING"
            ? "Instance must be running to stop it"
            : isComplexResource || isProxyResource
              ? "System manages instances cannot be stopped"
              : !isUpdateAllowedByRBAC
                ? "Unauthorized to stop instances"
                : "",
      });

      res.push({
        dataTestId: "start-button",
        label: "Start",
        icon: PlayIcon,
        isLoading: startInstanceMutation.isPending,
        isDisabled: !instance || status !== "STOPPED" || isComplexResource || isProxyResource || !isUpdateAllowedByRBAC,
        onClick: () => {
          if (!instance) return snackbar.showError("Please select an instance");
          if (!serviceOffering) return snackbar.showError("Product not found");
          startInstanceMutation.mutate({
            params: {
              path: pathData,
              query: {
                subscriptionId: subscription?.id,
              },
            },
          });
        },
        disabledMessage: !instance
          ? "Please select an instance"
          : status !== "STOPPED"
            ? "Instances must be stopped before starting"
            : isComplexResource || isProxyResource
              ? "System managed instances cannot be started"
              : !isUpdateAllowedByRBAC
                ? "Unauthorized to start instances"
                : "",
      });

      res.push({
        dataTestId: "delete-button",
        label: "Delete",
        icon: DeleteIcon,
        isDisabled:
          !instance || status === "DELETING" || status === "DISCONNECTED" || isProxyResource || !isDeleteAllowedByRBAC,
        onClick: () => {
          if (!instance) return snackbar.showError("Please select an instance");
          setOverlayType("delete-dialog");
          setIsOverlayOpen(true);
        },
        disabledMessage: !instance
          ? "Please select an instance"
          : status === "DELETING"
            ? "Instance deletion is already in progress"
            : status === "DISCONNECTED"
              ? "Instance is disconnected"
              : isProxyResource
                ? "System managed instances cannot be deleted"
                : !isDeleteAllowedByRBAC
                  ? "Unauthorized to delete instances"
                  : "",
      });
    }

    if (!isComplexResource && !isProxyResource) {
      res.push({
        dataTestId: "reboot-button",
        label: "Reboot",
        icon: RebootIcon,
        isLoading: restartInstanceMutation.isPending,
        isDisabled:
          !instance || (status !== "RUNNING" && status !== "FAILED" && status !== "COMPLETE") || !isUpdateAllowedByRBAC,
        onClick: () => {
          if (!instance) return snackbar.showError("Please select an instance");
          if (!serviceOffering) return snackbar.showError("Product not found");
          restartInstanceMutation.mutate({
            params: {
              path: pathData,
              query: {
                subscriptionId: subscription?.id,
              },
            },
          });
        },
        disabledMessage: !instance
          ? "Please select an instance"
          : status !== "RUNNING" && status !== "FAILED"
            ? "Instance must be running or failed to reboot"
            : !isUpdateAllowedByRBAC
              ? "Unauthorized to reboot instances"
              : "",
      });

      if (instance?.backupStatus) {
        res.push({
          dataTestId: "restore-button",
          label: "Restore",
          icon: RestoreInstanceIcon,
          isDisabled: !instance || !(instance.backupStatus as any)?.earliestRestoreTime || !isUpdateAllowedByRBAC,
          onClick: () => {
            if (!instance) return snackbar.showError("Please select an instance");
            setOverlayType("restore-dialog");
            setIsOverlayOpen(true);
          },
          disabledMessage: !instance
            ? "Please select an instance"
            : !(instance.backupStatus as any)?.earliestRestoreTime
              ? "No restore points available"
              : !isUpdateAllowedByRBAC
                ? "Unauthorized to restore instances"
                : "",
        });
      }
    }

    if (allowUpgrades) {
      res.push({
        dataTestId: "upgrade-button",
        label: "Upgrade",
        isDisabled: !instance || !["RUNNING", "STOPPED"].includes(status as string) || !isUpdateAllowedByRBAC,
        disabledMessage: !instance
          ? "Please select an instance"
          : !["RUNNING", "STOPPED"].includes(status as string)
            ? "Instance must be running or stopped to upgrade"
            : !isUpdateAllowedByRBAC
              ? "Unauthorized to upgrade instances"
              : "",
        onClick: () => {
          if (!instance) return snackbar.showError("Please select an instance");
          setOverlayType("upgrade-dialog");
          setIsOverlayOpen(true);
        },
      });
    }

    if (instance?.kubernetesDashboardEndpoint?.dashboardEndpoint) {
      res.push({
        dataTestId: "generate-token-button",
        label: "Generate Token",
        icon: GenerateTokenIcon,
        isDisabled: !instance || status === "DISCONNECTED",
        disabledMessage: !instance
          ? "Please select an instance"
          : status === "DISCONNECTED"
            ? "Cloud account is disconnected"
            : "",
        onClick: () => {
          if (!instance) return snackbar.showError("Please select an instance");
          setOverlayType("generate-token-dialog");
          setIsOverlayOpen(true);
        },
      });
    }
    return res;
  }, [variant, instance, serviceOffering, selectedResource, subscription]);

  return disabled && disabledMessage ? (
    <Tooltip title={disabledMessage} placement="top">
      <Box>
        <ActionMenu disabled={disabled} menuItems={actions} />
      </Box>
    </Tooltip>
  ) : (
    <Box>
      <ActionMenu disabled={disabled} menuItems={actions} />
    </Box>
  );
};

export default InstanceActionMenu;

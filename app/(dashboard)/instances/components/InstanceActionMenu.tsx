import { useMemo } from "react";

import ActionMenu, { ActionMenuItem } from "@/components/ActionMenu";
import { $api } from "src/api/query";
import { CLI_MANAGED_RESOURCES } from "src/constants/resource";
import useSnackbar from "src/hooks/useSnackbar";
import { SetState } from "src/types/common/reactGenerics";
import { ResourceInstance } from "src/types/resourceInstance";
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
  variant: "instances-page" | "details-page";
  setOverlayType: SetState<Overlay>;
  setIsOverlayOpen: SetState<boolean>;
  refetchData: () => void;
  setSelectedRows?: SetState<ResourceInstance[]>; // Optional
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
  refetchData,
  setSelectedRows = () => {}, // Default If Not Provided
}) => {
  const snackbar = useSnackbar();

  const selectedResource = useMemo(() => {
    return getMainResourceFromInstance(instance, serviceOffering);
  }, [instance, serviceOffering]);

  const startInstanceMutation = $api.useMutation(
    "post",
    "/2022-09-01-00/resource-instance/{serviceProviderId}/{serviceKey}/{serviceAPIVersion}/{serviceEnvironmentKey}/{serviceModelKey}/{productTierKey}/{resourceKey}/{id}/start",
    {
      onSuccess: async () => {
        refetchData();
        setSelectedRows([]);
        snackbar.showSuccess("Starting deployment instance...");
      },
    }
  );

  const actions = useMemo(() => {
    const res: (ActionMenuItem & { isLoading?: boolean })[] = [];
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

    const deletionProtectionFeatureEnabled = instance?.resourceInstanceMetadata?.deletionProtection !== undefined;
    const isDeleteProtected = instance?.resourceInstanceMetadata?.deletionProtection === true;

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
        isDisabled: !instance || status !== "RUNNING" || isComplexResource || isProxyResource || !isUpdateAllowedByRBAC,
        onClick: () => {
          if (!instance) return snackbar.showError("Please select an instance");
          setOverlayType("stop-dialog");
          setIsOverlayOpen(true);
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
        dataTestId: "modify-button",
        label: "Modify",
        isDisabled:
          !instance ||
          (status !== "RUNNING" && status !== "FAILED" && status !== "COMPLETE") ||
          isProxyResource ||
          !isUpdateAllowedByRBAC,
        onClick: () => {
          if (!instance) return snackbar.showError("Please select an instance");
          setOverlayType("modify-instance-form");
          setIsOverlayOpen(true);
        },
        disabledMessage: !instance
          ? "Please select an instance"
          : status !== "RUNNING" && status !== "FAILED"
            ? "Instance must be running or failed to modify"
            : isProxyResource
              ? "System managed instances cannot be modified"
              : !isUpdateAllowedByRBAC
                ? "Unauthorized to modify instances"
                : "",
      });

      res.push({
        dataTestId: "delete-button",
        label: "Delete",
        isDisabled:
          !instance ||
          status === "DELETING" ||
          status === "DISCONNECTED" ||
          isProxyResource ||
          !isDeleteAllowedByRBAC ||
          isDeleteProtected,
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
                : isDeleteProtected
                  ? "Instance is delete protected"
                  : !isDeleteAllowedByRBAC
                    ? "Unauthorized to delete instances"
                    : "",
      });
    }

    if (!isComplexResource && !isProxyResource) {
      res.push({
        dataTestId: "reboot-button",
        label: "Reboot",
        isDisabled:
          !instance || (status !== "RUNNING" && status !== "FAILED" && status !== "COMPLETE") || !isUpdateAllowedByRBAC,
        onClick: () => {
          if (!instance) return snackbar.showError("Please select an instance");
          setOverlayType("reboot-dialog");
          setIsOverlayOpen(true);
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
  }, [variant, instance, serviceOffering, selectedResource, subscription]);

  return (
    <ActionMenu
      // Only the Start Action is without a Confirmation Dialog. So only Show Loading for that Action
      // On the Instances Page, the Start Action is Outside the Menu, so No Loading State Needed
      isLoading={variant === "details-page" ? startInstanceMutation.isPending : false}
      disabledMessage={disabledMessage}
      disabled={disabled}
      menuItems={actions}
    />
  );
};

export default InstanceActionMenu;

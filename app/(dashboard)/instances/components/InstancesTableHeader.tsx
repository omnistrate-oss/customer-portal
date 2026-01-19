import { useMemo } from "react";
import { CircularProgress } from "@mui/material";
import useBillingStatus from "app/(dashboard)/billing/hooks/useBillingStatus";

import { $api } from "src/api/query";
import LoadingSpinnerSmall from "src/components/CircularProgress/CircularProgress";
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
import Button from "components/Button/Button";
import DataGridHeaderTitle from "components/Headers/DataGridHeaderTitle";
import RefreshWithToolTip from "components/RefreshWithTooltip/RefreshWithToolTip";

import { Overlay } from "../page";
import { getMainResourceFromInstance } from "../utils";

import InstanceActionMenu from "./InstanceActionMenu";
import InstancesFilters from "./InstancesFilters";

type Action = {
  dataTestId?: string;
  onClick: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
  actionType?: "primary" | "secondary";
  label: string;
  disabledMessage?: string;
};

type InstancesTableHeaderProps = {
  count: number;
  selectedInstance: ResourceInstance | undefined;
  setSelectedRows: SetState<ResourceInstance[]>;
  setOverlayType: SetState<Overlay>;
  setIsOverlayOpen: SetState<boolean>;
  selectedInstanceOffering: ServiceOffering;
  selectedInstanceSubscription?: Subscription;
  refetchInstances: () => void;
  isFetchingInstances: boolean;
  instances: ResourceInstance[];
  setFilteredInstances: SetState<ResourceInstance[]>;
  isLoadingInstances: boolean;
  isLoadingPaymentConfiguration: boolean;
};

const InstancesTableHeader: React.FC<InstancesTableHeaderProps> = ({
  count,
  selectedInstance,
  setSelectedRows,
  setOverlayType,
  setIsOverlayOpen,
  selectedInstanceOffering,
  selectedInstanceSubscription,
  refetchInstances,
  isFetchingInstances,
  instances,
  setFilteredInstances,
  isLoadingInstances,
  isLoadingPaymentConfiguration,
}) => {
  const snackbar = useSnackbar();
  const billingStatusQuery = useBillingStatus();

  const isBillingEnabled = Boolean(billingStatusQuery.data?.enabled);

  const stopInstanceMutation = $api.useMutation(
    "post",
    "/2022-09-01-00/resource-instance/{serviceProviderId}/{serviceKey}/{serviceAPIVersion}/{serviceEnvironmentKey}/{serviceModelKey}/{productTierKey}/{resourceKey}/{id}/stop",
    {
      onSuccess: async () => {
        refetchInstances();
        setSelectedRows([]);
        snackbar.showSuccess("Stopping deployment instance...");
      },
    }
  );

  const startInstanceMutation = $api.useMutation(
    "post",
    "/2022-09-01-00/resource-instance/{serviceProviderId}/{serviceKey}/{serviceAPIVersion}/{serviceEnvironmentKey}/{serviceModelKey}/{productTierKey}/{resourceKey}/{id}/start",
    {
      onSuccess: async () => {
        refetchInstances();
        setSelectedRows([]);
        snackbar.showSuccess("Starting deployment instance...");
      },
    }
  );

  const selectedResource = useMemo(() => {
    return getMainResourceFromInstance(selectedInstance, selectedInstanceOffering);
  }, [selectedInstance, selectedInstanceOffering]);

  const isComplexResource = CLI_MANAGED_RESOURCES.includes(selectedResource?.resourceType as string);
  const isProxyResource = selectedResource?.resourceType === "PortsBasedProxy";

  const mainActions = useMemo(() => {
    const actions: Action[] = [];
    const status = selectedInstance?.status;

    // Check if the user has permission to perform the operation - Role from Subscription
    const role = getEnumFromUserRoleString(selectedInstanceSubscription?.roleType);
    const isUpdateAllowedByRBAC = isOperationAllowedByRBAC(operationEnum.Update, role, viewEnum.Access_Resources);
    const isDeleteAllowedByRBAC = isOperationAllowedByRBAC(operationEnum.Delete, role, viewEnum.Access_Resources);

    const pathData = {
      serviceProviderId: selectedInstanceOffering?.serviceProviderId,
      serviceKey: selectedInstanceOffering?.serviceURLKey,
      serviceAPIVersion: selectedInstanceOffering?.serviceAPIVersion,
      serviceEnvironmentKey: selectedInstanceOffering?.serviceEnvironmentURLKey,
      serviceModelKey: selectedInstanceOffering?.serviceModelURLKey,
      productTierKey: selectedInstanceOffering?.productTierURLKey,
      resourceKey: selectedResource?.urlKey as string,
      id: selectedInstance?.id as string,
    };

    actions.push({
      dataTestId: "stop-button",
      label: "Stop",
      actionType: "secondary",
      isLoading: stopInstanceMutation.isPending,
      isDisabled:
        !selectedInstance || status !== "RUNNING" || isComplexResource || isProxyResource || !isUpdateAllowedByRBAC,
      onClick: () => {
        if (!selectedInstance) return snackbar.showError("Please select an instance");
        setOverlayType("stop-dialog");
        setIsOverlayOpen(true);
      },
      disabledMessage: !selectedInstance
        ? "Please select an instance"
        : status === "DISCONNECTED"
          ? "Instance is disconnected"
          : status !== "RUNNING"
            ? "Instance must be running to stop it"
            : isComplexResource || isProxyResource
              ? "System manages instances cannot be stopped"
              : !isUpdateAllowedByRBAC
                ? "Unauthorized to stop instances"
                : "",
    });

    actions.push({
      dataTestId: "start-button",
      label: "Start",
      actionType: "secondary",
      isLoading: startInstanceMutation.isPending,
      isDisabled:
        !selectedInstance || status !== "STOPPED" || isComplexResource || isProxyResource || !isUpdateAllowedByRBAC,
      onClick: () => {
        if (!selectedInstance) return snackbar.showError("Please select an instance");
        if (!selectedInstanceOffering) return snackbar.showError("Product not found");
        startInstanceMutation.mutate({
          params: {
            path: pathData,
            query: {
              subscriptionId: selectedInstance?.subscriptionId,
            },
          },
        });
      },
      disabledMessage: !selectedInstance
        ? "Please select an instance"
        : status === "DISCONNECTED"
          ? "Instance is disconnected"
          : status !== "STOPPED"
            ? "Instances must be stopped before starting"
            : isComplexResource || isProxyResource
              ? "System managed instances cannot be started"
              : !isUpdateAllowedByRBAC
                ? "Unauthorized to start instances"
                : "",
    });

    actions.push({
      dataTestId: "modify-button",
      label: "Modify",
      actionType: "secondary",
      isDisabled:
        !selectedInstance ||
        (status !== "RUNNING" && status !== "FAILED" && status !== "COMPLETE") ||
        isProxyResource ||
        !isUpdateAllowedByRBAC,
      onClick: () => {
        if (!selectedInstance) return snackbar.showError("Please select an instance");
        setOverlayType("modify-instance-form");
        setIsOverlayOpen(true);
      },
      disabledMessage: !selectedInstance
        ? "Please select an instance"
        : status === "DISCONNECTED"
          ? "Instance is disconnected"
          : status !== "RUNNING" && status !== "FAILED"
            ? "Instance must be running or failed to modify"
            : isProxyResource
              ? "System managed instances cannot be modified"
              : !isUpdateAllowedByRBAC
                ? "Unauthorized to modify instances"
                : "",
    });

    actions.push({
      dataTestId: "delete-button",
      label: "Delete",
      actionType: "secondary",
      isDisabled:
        !selectedInstance ||
        status === "DELETING" ||
        status === "DISCONNECTED" ||
        isProxyResource ||
        !isDeleteAllowedByRBAC,
      onClick: () => {
        if (!selectedInstance) return snackbar.showError("Please select an instance");
        setOverlayType("delete-dialog");
        setIsOverlayOpen(true);
      },
      disabledMessage: !selectedInstance
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

    actions.push({
      dataTestId: "create-button",
      label: "Create",
      actionType: "primary",
      isDisabled: isLoadingInstances || (isBillingEnabled && isLoadingPaymentConfiguration),
      onClick: () => {
        setSelectedRows([]); // To make selectedInstance becomes undefined. See page.tsx
        setOverlayType("create-instance-form");
        setIsOverlayOpen(true);
      },
      disabledMessage: "Please wait for the instances to load",
    });

    return actions;
  }, [
    snackbar,
    setOverlayType,
    setIsOverlayOpen,
    setSelectedRows,
    selectedInstance,
    stopInstanceMutation,
    startInstanceMutation,
    selectedInstanceOffering,
    isComplexResource,
    isProxyResource,
    selectedResource,
    selectedInstanceSubscription?.roleType,
  ]);

  return (
    <div>
      <div className="flex items-center justify-between gap-4 py-4 px-6 border-b border-[#EAECF0]">
        <DataGridHeaderTitle
          title="List of Deployments"
          desc="Details of deployments"
          count={count}
          units={{ singular: "Instance", plural: "Instances" }}
        />

        <div className="flex items-center gap-4">
          <div className="flex items-center">{isFetchingInstances && <CircularProgress size={20} />}</div>

          <RefreshWithToolTip refetch={refetchInstances} disabled={isFetchingInstances} />

          {mainActions.map((action, index) => {
            return (
              <Button
                data-testid={action.dataTestId || action.label}
                key={index}
                variant={action.actionType === "primary" ? "contained" : "outlined"}
                disabled={action.isDisabled || action.isLoading}
                onClick={action.onClick}
                disabledMessage={action.disabledMessage}
              >
                {action.label}
                {action.isLoading && <LoadingSpinnerSmall />}
              </Button>
            );
          })}

          <InstanceActionMenu
            variant="instances-page"
            disabled={!selectedInstance}
            disabledMessage="Please select an instance"
            instance={selectedInstance}
            serviceOffering={selectedInstanceOffering}
            subscription={selectedInstanceSubscription}
            setOverlayType={setOverlayType}
            setIsOverlayOpen={setIsOverlayOpen}
            refetchData={refetchInstances}
            setSelectedRows={setSelectedRows}
          />
        </div>
      </div>

      <div className="px-6 py-4 border-b-[1px]">
        <InstancesFilters instances={instances} setFilteredInstances={setFilteredInstances} />
      </div>
    </div>
  );
};

export default InstancesTableHeader;

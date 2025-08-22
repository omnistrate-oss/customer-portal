import { useMemo } from "react";
import { CircularProgress } from "@mui/material";
import useBillingStatus from "app/(dashboard)/billing/hooks/useBillingStatus";

import { $api } from "src/api/query";
import LoadingSpinnerSmall from "src/components/CircularProgress/CircularProgress";
import { CLI_MANAGED_RESOURCES } from "src/constants/resource";
import useSnackbar from "src/hooks/useSnackbar";
import {
  getEnumFromUserRoleString,
  isOperationAllowedByRBAC,
  operationEnum,
  viewEnum,
} from "src/utils/isAllowedByRBAC";
import Button from "components/Button/Button";
import DataGridHeaderTitle from "components/Headers/DataGridHeaderTitle";
import RefreshWithToolTip from "components/RefreshWithTooltip/RefreshWithToolTip";

import { icons } from "../constants";
import { getMainResourceFromInstance } from "../utils";

import AddInstanceFilters from "./AddInstanceFilters";
import EditInstanceFilters from "./EditInstanceFilters";
import InstanceActionMenu from "./InstanceActionMenu";

type Action = {
  dataTestId?: string;
  onClick: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
  actionType?: "primary" | "secondary";
  label: string;
  disabledMessage?: string;
};

const InstancesTableHeader = ({
  count,
  selectedInstance,
  setSelectedRows,
  setOverlayType,
  setIsOverlayOpen,
  selectedInstanceOffering,
  selectedInstanceSubscription,
  refetchInstances,
  isFetchingInstances,
  filterOptionsMap,
  selectedFilters,
  setSelectedFilters,

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

  const restartInstanceMutation = $api.useMutation(
    "post",
    "/2022-09-01-00/resource-instance/{serviceProviderId}/{serviceKey}/{serviceAPIVersion}/{serviceEnvironmentKey}/{serviceModelKey}/{productTierKey}/{resourceKey}/{id}/restart",
    {
      onSuccess: async () => {
        refetchInstances();
        setSelectedRows([]);
        snackbar.showSuccess("Restarting deployment instance...");
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
      id: selectedInstance?.id,
    };

    actions.push({
      dataTestId: "stop-button",
      label: "Stop",
      actionType: "secondary",
      isLoading: stopInstanceMutation.isPending,
      isDisabled:
        !selectedInstance ||
        status !== "RUNNING" ||
        status === "DISCONNECTED" ||
        isComplexResource ||
        isProxyResource ||
        !isUpdateAllowedByRBAC,
      onClick: () => {
        if (!selectedInstance) return snackbar.showError("Please select an instance");
        if (!selectedInstanceOffering) return snackbar.showError("Product not found");
        stopInstanceMutation.mutate({
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
        : status !== "RUNNING"
          ? "Instance must be running to stop it"
          : status === "DISCONNECTED"
            ? "Instance is disconnected"
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
        !selectedInstance ||
        status !== "STOPPED" ||
        status === "DISCONNECTED" ||
        isComplexResource ||
        isProxyResource ||
        !isUpdateAllowedByRBAC,
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
        : status !== "STOPPED"
          ? "Instances must be stopped before starting"
          : status === "DISCONNECTED"
            ? "Instance is disconnected"
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
        status === "DISCONNECTED" ||
        isProxyResource ||
        !isUpdateAllowedByRBAC,
      onClick: () => {
        if (!selectedInstance) return snackbar.showError("Please select an instance");
        setOverlayType("modify-instance-form");
        setIsOverlayOpen(true);
      },
      disabledMessage: !selectedInstance
        ? "Please select an instance"
        : status !== "RUNNING" && status !== "FAILED"
          ? "Instance must be running or failed to modify"
          : status === "DISCONNECTED"
            ? "Instance is disconnected"
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
    restartInstanceMutation,
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
            const Icon = icons[action.label];
            return (
              <Button
                data-testid={action.dataTestId || action.label}
                key={index}
                variant={action.actionType === "primary" ? "contained" : "outlined"}
                disabled={action.isDisabled || action.isLoading}
                onClick={action.onClick}
                startIcon={<Icon disabled={action.isDisabled || action.isLoading} />}
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
          />
        </div>
      </div>

      <div className="px-6 py-4 border-b-[1px]">
        <AddInstanceFilters
          setSelectedFilters={setSelectedFilters}
          filterOptionsMap={filterOptionsMap}
          selectedFilters={selectedFilters}
        />

        <EditInstanceFilters
          selectedFilters={selectedFilters}
          setSelectedFilters={setSelectedFilters}
          filterOptionsMap={filterOptionsMap}
        />
      </div>
    </div>
  );
};

export default InstancesTableHeader;

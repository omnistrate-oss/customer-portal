import { useMemo } from "react";
import { CircularProgress, menuClasses } from "@mui/material";
import useBillingStatus from "app/(dashboard)/billing/hooks/useBillingStatus";

import { $api } from "src/api/query";
import LoadingSpinnerSmall from "src/components/CircularProgress/CircularProgress";
import Tooltip from "src/components/Tooltip/Tooltip";
import { CLI_MANAGED_RESOURCES } from "src/constants/resource";
import useSnackbar from "src/hooks/useSnackbar";
import { colors } from "src/themeConfig";
import {
  getEnumFromUserRoleString,
  isOperationAllowedByRBAC,
  operationEnum,
  viewEnum,
} from "src/utils/isAllowedByRBAC";
import Button from "components/Button/Button";
import MenuItem from "components/FormElementsv2/MenuItem/MenuItem";
import Select from "components/FormElementsv2/Select/Select";
import DataGridHeaderTitle from "components/Headers/DataGridHeaderTitle";
import RefreshWithToolTip from "components/RefreshWithTooltip/RefreshWithToolTip";

import { icons } from "../constants";
import { getMainResourceFromInstance } from "../utils";

import AddInstanceFilters from "./AddInstanceFilters";
import EditInstanceFilters from "./EditInstanceFilters";

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
  // instancesFilterCount,
  // statusFilters,
  // setStatusFilters,
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

  const [mainActions, otherActions] = useMemo(() => {
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

    const other: Action[] = [];

    if (!isComplexResource && !isProxyResource) {
      other.push({
        dataTestId: "reboot-button",
        label: "Reboot",
        isLoading: restartInstanceMutation.isPending,
        isDisabled:
          !selectedInstance ||
          (status !== "RUNNING" && status !== "FAILED" && status !== "COMPLETE") ||
          !isUpdateAllowedByRBAC,
        onClick: () => {
          if (!selectedInstance) return snackbar.showError("Please select an instance");
          if (!selectedInstanceOffering) return snackbar.showError("Product not found");
          restartInstanceMutation.mutate({
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
          : status !== "RUNNING" && status !== "FAILED"
            ? "Instance must be running or failed to reboot"
            : !isUpdateAllowedByRBAC
              ? "Unauthorized to reboot instances"
              : "",
      });

      if (selectedInstance?.isBackupEnabled || selectedInstance?.backupStatus) {
        other.push({
          dataTestId: "restore-button",
          label: "Restore",
          isDisabled:
            !selectedInstance || !selectedInstance.backupStatus?.earliestRestoreTime || !isUpdateAllowedByRBAC,
          onClick: () => {
            if (!selectedInstance) return snackbar.showError("Please select an instance");
            setOverlayType("restore-dialog");
            setIsOverlayOpen(true);
          },
          disabledMessage: !selectedInstance
            ? "Please select an instance"
            : !selectedInstance.backupStatus?.earliestRestoreTime
              ? "No restore points available"
              : !isUpdateAllowedByRBAC
                ? "Unauthorized to restore instances"
                : "",
        });
      }
    }

    if (selectedInstance?.kubernetesDashboardEndpoint?.dashboardEndpoint) {
      other.push({
        dataTestId: "generate-token-button",
        label: "Generate Token",
        isDisabled: !selectedInstance || status === "DISCONNECTED",
        disabledMessage: !selectedInstance
          ? "Please select an instance"
          : status === "DISCONNECTED"
            ? "Cloud account is disconnected"
            : "",
        onClick: () => {
          if (!selectedInstance) return snackbar.showError("Please select an instance");
          setOverlayType("generate-token-dialog");
          setIsOverlayOpen(true);
        },
      });
    }

    return [actions, other];
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

  const select = (
    <Select
      data-testid="actions-select"
      value=""
      renderValue={(value: string) => {
        if (!value) {
          return "Actions";
        } else {
          return "";
        }
      }}
      displayEmpty
      disabled={otherActions.length === 0 || !selectedInstance}
      MenuProps={{
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
        transformOrigin: { vertical: "top", horizontal: "right" },
        sx: {
          marginTop: "8px",
          [`& .${menuClasses.list}`]: {
            padding: "4px 0px",
          },
          [`& .${menuClasses.paper}`]: {
            marginTop: "4px",
            border: `1px solid ${colors.gray200}`,
            boxShadow: "0px 2px 2px -1px #0A0D120A, 0px 4px 6px -2px #0A0D1208, 0px 12px 16px -4px #0A0D1214",
            borderRadius: "8px",
          },
        },
      }}
      sx={{
        margin: "0px",
        height: "40px",
        minWidth: "110px",
        "&.Mui-focused": {
          outline: `2px solid ${colors.success500}`,
          outlineOffset: "2px",
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          border: "1px solid #D0D5DD",
        },
      }}
    >
      {otherActions.map(({ dataTestId, label, onClick, isDisabled, disabledMessage }) => {
        const Icon = icons[label];
        const menuItem = (
          <MenuItem
            data-testid={dataTestId}
            value={label}
            key={label}
            sx={{
              gap: "10px",
              fontSize: "14px",
              color: isDisabled ? colors.gray400 : "",
              minWidth: otherActions?.length > 2 ? "220px" : "180px",
              padding: "8px 16px",
            }}
            disabled={isDisabled}
            onClick={onClick}
          >
            <Icon disabled={isDisabled} />
            {label}
          </MenuItem>
        );

        if (disabledMessage) {
          return (
            <Tooltip key={label} title={disabledMessage} placement="top">
              <span>{menuItem}</span>
            </Tooltip>
          );
        }

        return menuItem;
      })}
    </Select>
  );

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

          {otherActions.length > 0 && selectedInstance ? (
            select
          ) : (
            <Tooltip title={!selectedInstance ? "Please select an instance" : "No actions available"} placement="top">
              <span>{select}</span>
            </Tooltip>
          )}
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
      {/* <div className="flex flex-row justify-between gap-4 items-center py-4 px-6 border-b border-[#EAECF0]">
        <InstanceFilters
          filterStatus={statusFilters}
          setFilterStatus={setStatusFilters}
          filterInstanceCount={instancesFilterCount}
        />
      </div> */}
    </div>
  );
};

export default InstancesTableHeader;

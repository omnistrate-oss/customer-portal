"use client";

import { useMemo, useState } from "react";
import { Box, Stack } from "@mui/material";
import { createColumnHelper } from "@tanstack/react-table";
import { useFormik } from "formik";
import * as yup from "yup";

import { $api } from "src/api/query";
import DataGridText from "src/components/DataGrid/DataGridText";
import DataTable from "src/components/DataTable/DataTable";
import ConfirmationDialog from "src/components/Dialog/ConfirmationDialog";
import GridCellExpand from "src/components/GridCellExpand/GridCellExpand";
import SuccessIcon from "src/components/Icons/SuccessIcon/SuccessIcon";
import LinearProgress from "src/components/LinearProgress/LinearProgress";
import RegionIcon from "src/components/Region/RegionIcon";
import StatusChip from "src/components/StatusChip/StatusChip";
import TextConfirmationDialog from "src/components/TextConfirmationDialog/TextConfirmationDialog";
import Tooltip from "src/components/Tooltip/Tooltip";
import { cloudProviderLongLogoMap } from "src/constants/cloudProviders";
import useSnackbar from "src/hooks/useSnackbar";
import { useGlobalData } from "src/providers/GlobalDataProvider";
import { InstanceSnapshot } from "src/types/instance-snapshot";
import formatDateUTC from "src/utils/formatDateUTC";
import { roundNumberToTwoDecimals } from "src/utils/formatNumber";
import { getInstanceDetailsRoute, getSnapshotDetailsRoute } from "src/utils/routes";
import { isCustomNetworkEnabledOnServiceOffering } from "src/utils/serviceOffering";

import InstanceSnapshotsIcon from "../components/Icons/InstanceSnapshotsIcon";
import PageContainer from "../components/Layout/PageContainer";
import PageTitle from "../components/Layout/PageTitle";
import useCustomNetworks from "../custom-networks/hooks/useCustomNetworks";
import useInstances from "../instances/hooks/useInstances";

import CopySnapshotDialogContent from "./components/CopySnapshotDialogContent";
import CreateSnapshotDialogContent from "./components/CreateSnapshotDialogContent";
import { CopySnapshotIcon, CreateSnapshotIcon, RestoreSnapshotIcon } from "./components/Icons";
import InstanceSnapshotsTableHeader from "./components/InstanceSnapshotsTableHeader";
import RestoreSnapshotDialogContent from "./components/RestoreSnapshotDialogContent";
import RestoreSnapshotSuccessContent from "./components/RestoreSnapshotSuccessContent";
import useInstanceSnapshots from "./hooks/useInstanceSnapshots";

const columnHelper = createColumnHelper<InstanceSnapshot>();
type Overlay =
  | "delete-snapshot-dialog"
  | "restore-snapshot-dialog"
  | "restore-snapshot-success"
  | "copy-snapshot-dialog"
  | "create-snapshot-dialog";
type FormValues = {
  restoreSnapshotCustomNetworkId: string;
  copySnapshotRegion: string;
  createSnapshotInstanceId: string;
  createSnapshotRegion: string;
};

const InstanceSnapshotsPage = () => {
  const snackbar = useSnackbar();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [overlayType, setOverlayType] = useState<Overlay>("delete-snapshot-dialog");
  const [restoredInstanceId, setRestoredInstanceId] = useState<string>("");

  const { serviceOfferings, isFetchingServiceOfferings, subscriptionsObj } = useGlobalData();

  const {
    data: snapshots = [],
    isFetching: isFetchingSnapshots,
    isPending: isPendingSnapshots,
    refetch: refetchSnapshots,
  } = useInstanceSnapshots();

  const { data: instances = [], isFetching: isFetchingInstances } = useInstances({
    onlyInstances: true,
    refetchInterval: isOverlayOpen ? false : 60000,
  });

  const { data: customNetworks = [], isFetching: isFetchingCustomNetworks } = useCustomNetworks();

  const openOverlay = (type: Overlay) => {
    setOverlayType(type);
    setIsOverlayOpen(true);
  };

  const closeOverlay = () => {
    setIsOverlayOpen(false);
  };

  const dataTableColumns = useMemo(() => {
    return [
      columnHelper.accessor("snapshotId", {
        id: "snapshotId",
        header: "Snapshot ID",
        cell: (data) => {
          const snapshotId = data.row.original.snapshotId;
          return (
            <DataGridText color="primary" linkProps={{ href: snapshotId ? getSnapshotDetailsRoute(snapshotId) : "#" }}>
              {snapshotId}
            </DataGridText>
          );
        },
        meta: {
          minWidth: 200,
        },
      }),
      columnHelper.accessor("serviceName", {
        id: "serviceName",
        header: "Product Name",
        meta: {
          minWidth: 220,
        },
      }),
      columnHelper.accessor("productTierName", {
        id: "productTierName",
        header: "Subscription Plan",
        meta: {
          minWidth: 220,
        },
      }),
      columnHelper.accessor("status", {
        id: "status",
        header: "Status",
        cell: (data) => <StatusChip status={data.row.original.status} />,
        meta: {
          minWidth: 120,
        },
      }),
      columnHelper.accessor((row) => formatDateUTC(row.createdTime), {
        id: "createdTime",
        header: "Created On",
        meta: {
          minWidth: 220,
        },
      }),
      columnHelper.accessor("cloudProvider", {
        id: "cloudProvider",
        header: "Cloud Provider",
        cell: (data) => {
          const cloudProvider = data.row.original.cloudProvider;
          return cloudProvider ? cloudProviderLongLogoMap[cloudProvider] || "-" : "-";
        },
      }),
      columnHelper.accessor("region", {
        id: "region",
        header: "Region",
        cell: (data) => {
          return <GridCellExpand value={data.row.original.region || "Global"} startIcon={<RegionIcon />} />;
        },
      }),
      columnHelper.accessor("sourceInstanceId", {
        id: "sourceInstanceId",
        header: "Source Instance",
        cell: (data) => {
          const instance = instances.find((inst) => inst.id === data.row.original.sourceInstanceId);
          const instanceSubscription = subscriptionsObj[instance?.subscriptionId || ""];

          return instance?.id && instanceSubscription ? (
            <DataGridText
              color="primary"
              linkProps={{
                href: getInstanceDetailsRoute({
                  serviceId: instanceSubscription.serviceId,
                  servicePlanId: instanceSubscription.productTierId,
                  resourceId: instance.resourceID as string,
                  instanceId: instance.id,
                  subscriptionId: instance.subscriptionId as string,
                }),
              }}
            >
              {data.row.original.sourceInstanceId}
            </DataGridText>
          ) : (
            <Tooltip title="Source instance not found">
              <Box>
                <DataGridText>{data.row.original.sourceInstanceId}</DataGridText>
              </Box>
            </Tooltip>
          );
        },
      }),
      columnHelper.accessor(
        (row) =>
          row.completeTime && row.completeTime !== "0001-01-01T00:00:00Z" ? formatDateUTC(row.completeTime) : "-",
        {
          id: "completeTime",
          header: "Completion Time",
          meta: {
            minWidth: 220,
          },
        }
      ),
      columnHelper.accessor("progress", {
        id: "progress",
        header: "Progress",
        cell: (data) => {
          const progress = data.row.original.progress || 0;
          return (
            <Stack direction="row" gap="8px" alignItems="center">
              <Box width="100px">
                <LinearProgress variant="determinate" value={progress} />{" "}
              </Box>
              <Box component="span" sx={{ fontSize: 14 }}>
                {roundNumberToTwoDecimals(progress)}%
              </Box>
            </Stack>
          );
        },
      }),
      columnHelper.accessor((row) => (row.encrypted ? "ENCRYPTED" : "NOT_ENCRYPTED"), {
        id: "encrypted",
        header: "Encryption Status",
        cell: (data) => <StatusChip status={data.getValue()} />,
      }),
      columnHelper.accessor("subscriptionOwnerUserName", {
        id: "subscriptionOwnerUserName",
        header: "Subscription Owner",
      }),
    ];
  }, [instances, subscriptionsObj]);

  const selectedSnapshot = useMemo(() => {
    if (!selectedRows.length) return undefined;
    return snapshots.find((snapshot) => snapshot.snapshotId === selectedRows[0]);
  }, [selectedRows, snapshots]);

  const serviceOffering = useMemo(() => {
    if (!selectedSnapshot) return undefined;

    return serviceOfferings.find((offering) => offering.productTierID === selectedSnapshot.productTierId);
  }, [selectedSnapshot, serviceOfferings]);

  const formData = useFormik<FormValues>({
    initialValues: {
      restoreSnapshotCustomNetworkId: "",
      copySnapshotRegion: "",
      createSnapshotInstanceId: "",
      createSnapshotRegion: "",
    },
    enableReinitialize: true,
    validationSchema: yup.object({
      restoreSnapshotCustomNetworkId: yup.string().when([], {
        is: () => overlayType === "restore-snapshot-dialog",
        then: yup.string().required("Please select a custom network"),
      }),
      copySnapshotRegion: yup.string().when([], {
        is: () => overlayType === "copy-snapshot-dialog",
        then: yup.string().required("Please select a region"),
      }),
      createSnapshotInstanceId: yup.string().when([], {
        is: () => overlayType === "create-snapshot-dialog",
        then: yup.string().required("Please select an instance"),
      }),
      createSnapshotRegion: yup.string().when([], {
        is: () => overlayType === "create-snapshot-dialog",
        then: yup.string().required("Please select a region"),
      }),
    }),
    onSubmit: () => {
      // This is just to use the DynamicField component
      // Submission is handled in the Confirmation Dialog
    },
  });

  const createSnapshotMutation = $api.useMutation("post", "/2022-09-01-00/resource-instance/snapshot", {
    onSuccess: () => {
      snackbar.showSuccess("Snapshot creation initiated successfully");
      setTimeout(() => refetchSnapshots(), 2000); // Delay to allow backend to process
    },
  });

  const deleteSnapshotMutation = $api.useMutation("delete", "/2022-09-01-00/resource-instance/snapshot/{id}", {
    onSuccess: () => {
      snackbar.showSuccess("Snapshot deletion initiated successfully");
      setTimeout(() => refetchSnapshots(), 2000); // Delay to allow backend to process
      setSelectedRows([]);
    },
  });

  const restoreSnapshotMutation = $api.useMutation(
    "post",
    "/2022-09-01-00/resource-instance/snapshot/{snapshotId}/restore",
    {
      onSuccess: (data) => {
        const instanceId = data?.instanceId || "";
        setRestoredInstanceId(instanceId);
        setOverlayType("restore-snapshot-success");
        setIsOverlayOpen(true);
        setTimeout(() => refetchSnapshots(), 2000); // Delay to allow backend to process
      },
    }
  );

  const copySnapshotMutation = $api.useMutation(
    "post",
    "/2022-09-01-00/resource-instance/snapshot/{sourceSnapshotId}",
    {
      onSuccess: () => {
        snackbar.showSuccess("Snapshot copy initiated successfully");
        setTimeout(() => refetchSnapshots(), 2000); // Delay to allow backend to process
      },
    }
  );

  const operationPending =
    restoreSnapshotMutation.isPending ||
    copySnapshotMutation.isPending ||
    createSnapshotMutation.isPending ||
    deleteSnapshotMutation.isPending;

  return (
    <PageContainer>
      <PageTitle icon={InstanceSnapshotsIcon} className="mb-6">
        Instance Snapshots
      </PageTitle>

      <div>
        {/* TODO: Solve the Problem of shifting DataTable height when paginating */}
        <DataTable
          columns={dataTableColumns}
          rows={snapshots}
          noRowsText="No instance snapshots"
          HeaderComponent={InstanceSnapshotsTableHeader}
          headerProps={{
            count: snapshots.length,
            refetchSnapshots,
            isFetchingSnapshots,
            onDeleteClick: () => openOverlay("delete-snapshot-dialog"),
            deleteDisabledMessage: !selectedSnapshot
              ? "Please select a snapshot"
              : operationPending
                ? "Operation in progress, please wait"
                : "",
            onRestoreClick: () => {
              if (!serviceOffering) {
                snackbar.showError("Service offering not found for the selected snapshot");
                return;
              }

              if (!selectedSnapshot?.snapshotId) {
                snackbar.showError("Please select a snapshot");
                return;
              }

              const needsCustomNetwork = isCustomNetworkEnabledOnServiceOffering(serviceOffering);
              if (needsCustomNetwork) {
                openOverlay("restore-snapshot-dialog");
              } else {
                restoreSnapshotMutation.mutate({
                  params: {
                    path: { snapshotId: selectedSnapshot.snapshotId },
                    query: { subscriptionId: selectedSnapshot.subscriptionId },
                  },
                  body: {},
                });
              }
            },
            isRestoreLoading: restoreSnapshotMutation.isPending,
            restoreDisabledMessage: !selectedSnapshot
              ? "Please select a snapshot"
              : selectedSnapshot?.status !== "COMPLETE"
                ? "Only completed snapshots can be restored"
                : operationPending
                  ? "Operation in progress, please wait"
                  : "",
            onCreateClick: () => openOverlay("create-snapshot-dialog"),
            createDisabledMessage: operationPending ? "Operation in progress, please wait" : "",
            onCopyClick: () => openOverlay("copy-snapshot-dialog"),
            copyDisabledMessage: !selectedSnapshot
              ? "Please select a snapshot"
              : selectedSnapshot?.status !== "COMPLETE"
                ? "Only completed snapshots can be copied"
                : operationPending
                  ? "Operation in progress, please wait"
                  : "",
          }}
          selectionMode="single"
          selectedRows={selectedRows}
          onRowSelectionChange={setSelectedRows}
          isLoading={isPendingSnapshots}
          rowId="snapshotId"
        />
      </div>
      <TextConfirmationDialog
        open={isOverlayOpen && overlayType === "delete-snapshot-dialog"}
        handleClose={closeOverlay}
        onConfirm={async () => {
          if (!selectedSnapshot?.snapshotId) {
            snackbar.showError("No snapshot selected");
            return false;
          }

          await deleteSnapshotMutation.mutateAsync({
            params: {
              path: { id: selectedSnapshot.snapshotId },
              query: { subscriptionId: selectedSnapshot.subscriptionId },
            },
          });
        }}
        title="Delete Selected Snapshot?"
        subtitle={`Are you sure you want to delete ${selectedSnapshot?.snapshotId || "this snapshot"}?`}
        isLoading={deleteSnapshotMutation.isPending}
      />
      <ConfirmationDialog
        open={
          isOverlayOpen &&
          [
            "restore-snapshot-dialog",
            "restore-snapshot-success",
            "copy-snapshot-dialog",
            "create-snapshot-dialog",
          ].includes(overlayType)
        }
        onClose={closeOverlay}
        title={
          overlayType === "restore-snapshot-dialog"
            ? "Restore Snapshot"
            : overlayType === "restore-snapshot-success"
              ? "Restoration Successful"
              : overlayType === "copy-snapshot-dialog"
                ? "Copy Snapshot"
                : "Create Snapshot"
        }
        content={
          overlayType === "restore-snapshot-dialog"
            ? () => (
                <RestoreSnapshotDialogContent
                  customNetworks={customNetworks}
                  selectedSnapshot={selectedSnapshot}
                  isFetchingCustomNetworks={isFetchingCustomNetworks}
                  formData={formData}
                />
              )
            : overlayType === "restore-snapshot-success"
              ? () => <RestoreSnapshotSuccessContent restoredInstanceId={restoredInstanceId} />
              : overlayType === "copy-snapshot-dialog"
                ? () => (
                    <CopySnapshotDialogContent
                      formData={formData}
                      isFetchingServiceOfferings={isFetchingServiceOfferings}
                      serviceOffering={serviceOffering}
                      cloudProvider={selectedSnapshot?.cloudProvider}
                    />
                  )
                : () => (
                    <CreateSnapshotDialogContent
                      formData={formData}
                      instances={instances}
                      isFetchingInstances={isFetchingInstances}
                    />
                  )
        }
        icon={
          overlayType === "restore-snapshot-dialog"
            ? RestoreSnapshotIcon
            : overlayType === "restore-snapshot-success"
              ? SuccessIcon
              : overlayType === "copy-snapshot-dialog"
                ? CopySnapshotIcon
                : CreateSnapshotIcon
        }
        isLoading={
          restoreSnapshotMutation.isPending || copySnapshotMutation.isPending || createSnapshotMutation.isPending
        }
        confirmButtonLabel={
          overlayType === "restore-snapshot-dialog"
            ? "Restore"
            : overlayType === "restore-snapshot-success"
              ? "Close"
              : overlayType === "copy-snapshot-dialog"
                ? "Copy Snapshot"
                : "Create Snapshot"
        }
        hideCancelButton={overlayType === "restore-snapshot-success"}
        onConfirm={async () => {
          // Close success dialog immediately
          if (overlayType === "restore-snapshot-success") {
            return true;
          }

          const errors = await formData.validateForm();
          if (Object.keys(errors).length > 0) {
            // Mark fields with errors as touched so error messages are displayed
            const touched = Object.keys(errors).reduce((acc, key) => ({ ...acc, [key]: true }), {});
            formData.setTouched(touched);
            return false;
          }

          if (overlayType === "create-snapshot-dialog") {
            await createSnapshotMutation.mutateAsync({
              body: {
                instanceId: formData.values.createSnapshotInstanceId,
                targetRegion: formData.values.createSnapshotRegion,
              },
            });
            formData.resetForm();
            return true;
          }

          if (!selectedSnapshot?.snapshotId) {
            snackbar.showError("No snapshot selected");
            return false;
          }

          if (overlayType === "copy-snapshot-dialog") {
            await copySnapshotMutation.mutateAsync({
              params: {
                path: { sourceSnapshotId: selectedSnapshot.snapshotId },
                query: { subscriptionId: selectedSnapshot.subscriptionId },
              },
              body: {
                targetRegion: formData.values.copySnapshotRegion,
              },
            });
          } else if (overlayType === "restore-snapshot-dialog") {
            await restoreSnapshotMutation.mutateAsync({
              params: {
                path: { snapshotId: selectedSnapshot.snapshotId },
                query: { subscriptionId: selectedSnapshot.subscriptionId },
              },
              body: {
                custom_network_id: formData.values.restoreSnapshotCustomNetworkId,
              },
            });

            formData.resetForm();
            // Return false to prevent auto-close; onSuccess callback handles showing the success view
            return false;
          }

          formData.resetForm();
          return true;
        }}
      />
    </PageContainer>
  );
};

export default InstanceSnapshotsPage;

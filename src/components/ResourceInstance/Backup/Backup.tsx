import { FC, useMemo, useState } from "react";
import { Box, Stack } from "@mui/material";
import { GridSelectionModel } from "@mui/x-data-grid";
import { useMutation } from "@tanstack/react-query";
import useCustomNetworks from "app/(dashboard)/custom-networks/hooks/useCustomNetworks";
import { CurrentTab } from "app/(dashboard)/instances/[serviceId]/[servicePlanId]/[resourceId]/[instanceId]/[subscriptionId]/page";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

import { copyResourceInstanceSnapshot, postInstanceRestoreAccess } from "src/api/resourceInstance";
import DataGrid, { selectSingleItem } from "src/components/DataGrid/DataGrid";
import { DateRange, initialRangeState } from "src/components/DateRangePicker/DateTimeRangePickerStatic";
import InformationDialogTopCenter from "src/components/Dialog/InformationDialogTopCenter";
import GridCellExpand from "src/components/GridCellExpand/GridCellExpand";
import LinearProgress from "src/components/LinearProgress/LinearProgress";
import CopySnapshotModal from "src/components/RestoreInstance/CopySnapshotModal";
import CustomNetworkSelectionStep from "src/components/RestoreInstance/CustomNetworkSelectionStep";
import RestoreInstanceSuccessStep from "src/components/RestoreInstance/RestoreInstanceSuccessStep";
import StatusChip from "src/components/StatusChip/StatusChip";
import { getResourceInstanceBackupStatusStylesAndLabel } from "src/constants/statusChipStyles/resourceInstanceBackupStatus";
import { getResourceInstanceStatusStylesAndLabel } from "src/constants/statusChipStyles/resourceInstanceStatus";
import useSnackbar from "src/hooks/useSnackbar";
import { NetworkType } from "src/types/common/enums";
import { SetState } from "src/types/common/reactGenerics";
import { ServiceOffering } from "src/types/serviceOffering";
import formatDateUTC from "src/utils/formatDateUTC";
import { roundNumberToTwoDecimals } from "src/utils/formatNumber";
import RegionIcon from "components/Region/RegionIcon";

import BackupSummary from "./components/BackupSummary";
import BackupsTableHeader from "./components/BackupTableHeader";
import useBackup, { SnapshotBase } from "./hooks/useBackup";
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export type SnapshotCreationType = "copyFromExisting" | "createNew";

export type BackupStatus = {
  backupPeriodInHours: string;
  backupRetentionInDays?: string;
  earliestRestoreTime?: string;
  lastBackupTime?: string;
};

export type accessQueryParams = {
  serviceProviderId?: string;
  serviceKey?: string;
  serviceAPIVersion?: string;
  serviceEnvironmentKey?: string;
  serviceModelKey?: string;
  productTierKey?: string;
  resourceKey?: string;
  subscriptionId?: string;
};

const Backup: FC<{
  instanceId: string;
  backupStatus: BackupStatus;
  accessQueryParams?: accessQueryParams;
  resourceName?: string;
  networkType: NetworkType;
  offering: ServiceOffering;
  cloudProvider?: string;
  tab?: "backups" | "snapshots";
  setCurrentTab: SetState<CurrentTab>;
  customNetworkExists?: boolean;
}> = ({
  instanceId,
  backupStatus,
  accessQueryParams,
  resourceName,
  networkType,
  offering,
  cloudProvider,
  tab,
  setCurrentTab,
  customNetworkExists,
}) => {
  const snackbar = useSnackbar();

  const [selectionModel, setSelectionModel] = useState<GridSelectionModel>([]);
  const [searchText, setSearchText] = useState("");
  const [restoredInstanceID, setRestoredInstanceID] = useState("");

  const [copySnapshotModalOpen, setCopySnapshotModalOpen] = useState(false);
  const [snapshotCreationType, setSnapshotCreationType] = useState<SnapshotCreationType | null>(null);

  const [isRestoreInstanceModalOpen, setIsRestoreInstanceModalOpen] = useState(false);
  const [restoreInstanceModalStep, setRestoreInstanceModalStep] = useState<"custom-network" | "success" | null>(null);

  const handleOpenCopySnapshotModal = (creationType: SnapshotCreationType) => {
    setSnapshotCreationType(creationType);
    setCopySnapshotModalOpen(true);
  };

  const handleCloseCopySnapshotModal = () => {
    setCopySnapshotModalOpen(false);
    setSnapshotCreationType(null);
  };

  const handleRestoreInstanceModalOpen = (step: "custom-network" | "success" | null) => {
    setRestoreInstanceModalStep(step);
    setIsRestoreInstanceModalOpen(true);
  };

  const handleRestoreInstanceModalClose = () => {
    setIsRestoreInstanceModalOpen(false);
    setRestoreInstanceModalStep(null);
  };

  const isEnable = useMemo(() => {
    if (backupStatus?.earliestRestoreTime) {
      return true;
    }
    return false;
  }, [backupStatus?.earliestRestoreTime]);

  const restoreQuery = useBackup(
    {
      accessQueryParams,
      instanceId,
      isEnable,
    },
    {
      refetchInterval: copySnapshotModalOpen || isRestoreInstanceModalOpen ? false : 30000,
    }
  );
  const { data: restorequeryData, isRefetching, refetch } = restoreQuery;

  const { data: customNetworks = [], isFetching: isFetchingCustomNetworks } = useCustomNetworks({
    enabled: customNetworkExists, // Fetch only if custom_network_id is present
    refetchOnWindowFocus: true, // User can create a custom network and come back to this tab
  });

  const restoreData = useMemo(() => {
    if (tab === "snapshots") return restorequeryData?.filter((item) => item?.snapshotType === "ManualSnapshot") ?? [];
    else if (tab === "backups")
      return restorequeryData?.filter((item) => item?.snapshotType === "AutomatedSnapshot") ?? [];

    return restorequeryData ?? [];
  }, [restorequeryData, tab]);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>(initialRangeState);

  const selectedSnapshot = useMemo(() => {
    if (selectionModel.length > 0) {
      return restoreData.find((snapshot) => snapshot.snapshotId === selectionModel[0]);
    }
    return null;
  }, [selectionModel, restoreData]);

  const filteredsnapshots = useMemo(() => {
    let filtered = restoreData;
    if (searchText) {
      filtered = filtered.filter((snapshot) => snapshot?.snapshotId.toLowerCase().includes(searchText.toLowerCase()));
    }
    if (selectedDateRange && selectedDateRange.startDate && selectedDateRange.endDate) {
      const startDate = dayjs(selectedDateRange.startDate);
      const endDate = dayjs(selectedDateRange.endDate);

      filtered = filtered.filter((backup) => {
        const backupDate = dayjs(backup.createdTime);

        return dayjs(backupDate).isSameOrAfter(startDate) && dayjs(backupDate).isSameOrBefore(endDate);
      });
    }
    return filtered;
  }, [restoreData, searchText, selectedDateRange]);

  const restoreMutation = useMutation({
    mutationFn: async ({ customNetwork }: { customNetwork?: string }) => {
      if (selectionModel?.length > 0) {
        const snapshotId = selectionModel[0];
        const {
          serviceProviderId,
          serviceKey,
          serviceAPIVersion,
          serviceEnvironmentKey,
          serviceModelKey,
          productTierKey,
          resourceKey,
          subscriptionId,
        } = accessQueryParams ?? {};

        const payload: { network_type: NetworkType; custom_network_id?: string } = {
          network_type: networkType,
        };

        if (customNetwork) {
          payload["custom_network_id"] = customNetwork;
        }

        return await postInstanceRestoreAccess(
          serviceProviderId,
          serviceKey,
          serviceAPIVersion,
          serviceEnvironmentKey,
          serviceModelKey,
          productTierKey,
          resourceKey,
          snapshotId,
          subscriptionId,
          payload
        );
      }
    },
    onSuccess: (response) => {
      handleRestoreInstanceModalOpen("success");
      setRestoredInstanceID(response?.data?.id);
      snackbar.showSuccess(`Restore successfully`);
    },
  });

  const handleRestoreInstanceClick = () => {
    if (customNetworkExists) {
      handleRestoreInstanceModalOpen("custom-network");
    } else {
      restoreMutation.mutate({ customNetwork: "" });
    }
  };

  const copySnapshotMutation = useMutation({
    mutationFn: async ({ targetRegion }: { targetRegion: string }) => {
      const snapshotId = selectionModel[0];
      const {
        serviceProviderId,
        serviceKey,
        serviceAPIVersion,
        serviceEnvironmentKey,
        serviceModelKey,
        productTierKey,
        resourceKey,
        subscriptionId,
      } = accessQueryParams ?? {};

      const payload: { targetRegion: string; sourceSnapshotId?: string } = {
        targetRegion,
      };

      if (snapshotCreationType === "copyFromExisting") {
        payload["sourceSnapshotId"] = snapshotId as string;
      }

      return await copyResourceInstanceSnapshot(
        serviceProviderId,
        serviceKey,
        serviceAPIVersion,
        serviceEnvironmentKey,
        serviceModelKey,
        productTierKey,
        resourceKey,
        instanceId,
        payload,
        {
          subscriptionId,
        }
      );
    },
    onSuccess: () => {
      snackbar.showSuccess(
        `Snapshot ${snapshotCreationType === "copyFromExisting" && tab === "snapshots" ? "copied" : "created"} successfully`
      );
      refetch();
      setCurrentTab("Snapshots");
      setCopySnapshotModalOpen(false);
    },
  });

  const columns = useMemo(
    () => [
      {
        field: "snapshotId",
        headerName: "ID",
        flex: 1,
        minWidth: 190,
      },
      {
        field: "status",
        headerName: "Status",
        flex: 0.5,
        renderCell: (params: { row: SnapshotBase }) => {
          const status = params.row.status;
          const statusStylesAndMap = getResourceInstanceStatusStylesAndLabel(status);
          return <StatusChip status={status} {...statusStylesAndMap} />;
        },
        minWidth: 100,
      },
      {
        field: "region",
        headerName: "Region",
        flex: 0.5,
        renderCell: (params: { row: SnapshotBase }) => {
          const region = params.row.region || "Global";
          return <GridCellExpand value={region} startIcon={<RegionIcon />} />;
        },
        minWidth: 170,
      },
      {
        field: "createdTime",
        headerName: "Created On",
        flex: 1,
        minWidth: 170,
        valueGetter: (params: { row: SnapshotBase }) => formatDateUTC(params.row.createdTime),
      },
      {
        field: "completeTime",
        headerName: "Completion Time",
        flex: 1,
        minWidth: 170,
        valueGetter: (params: { row: SnapshotBase }) => formatDateUTC(params.row.completeTime),
      },
      {
        field: "progress",
        headerName: `Progress`,
        flex: 1,
        minWidth: 100,
        renderCell: (params) => {
          const progress = params.row.progress;
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
      },
      {
        field: "encrypted",
        headerName: "Encryption Status",
        flex: 0.7,
        valueGetter: (params: { row: SnapshotBase }) => (params.row.encrypted ? "Encrypted" : "Not Encrypted"),
        renderCell: (params: { row: SnapshotBase; value: "Encrypted" | "Not Encrypted" }) => {
          const statusStylesAndMap = getResourceInstanceBackupStatusStylesAndLabel(params.value);
          return <StatusChip status={params.value} {...statusStylesAndMap} />;
        },
        minWidth: 150,
      },
    ],
    []
  );

  return (
    <>
      <Box mt="32px" display={"flex"} flexDirection={"column"} gap="32px">
        {tab === "backups" ? (
          <BackupSummary
            backupPeriodInHours={backupStatus?.backupPeriodInHours}
            backupRetentionInDays={backupStatus?.backupRetentionInDays}
            earliestRestoreTime={backupStatus?.earliestRestoreTime}
            lastBackupTime={backupStatus?.lastBackupTime}
          />
        ) : null}
        <DataGrid
          checkboxSelection
          getRowId={(row: SnapshotBase) => row.snapshotId}
          disableSelectionOnClick
          columns={columns}
          rows={isRefetching ? [] : filteredsnapshots}
          components={{
            Header: BackupsTableHeader,
          }}
          componentsProps={{
            header: {
              count: filteredsnapshots?.length,
              refetch,
              isRefetching,
              restoreMutation,
              searchText,
              setSearchText,
              resourceName,
              selectedDateRange,
              setSelectedDateRange,
              handleOpenCopySnapshotModal,
              cloudProvider,
              copySnapshotMutation,
              selectedSnapshot,
              tab,
              handleRestoreInstanceClick,
            },
          }}
          getRowClassName={(params: { row: SnapshotBase }) => `${params.row.status}`}
          sx={{
            "& .node-ports": {
              color: "#101828",
              fontWeight: 500,
            },
            borderRadius: "8px",
          }}
          selectionModel={selectionModel}
          onSelectionModelChange={(newSelection: GridSelectionModel) => {
            selectSingleItem(newSelection, selectionModel, setSelectionModel);
          }}
          loading={isRefetching}
          noRowsText={`No ${tab === "snapshots" ? "snapshots" : "backups"}`}
        />
      </Box>
      <InformationDialogTopCenter
        open={isRestoreInstanceModalOpen}
        handleClose={handleRestoreInstanceModalClose}
        maxWidth={"550px"}
      >
        {restoreInstanceModalStep === "custom-network" && (
          <CustomNetworkSelectionStep
            handleClose={handleRestoreInstanceModalClose}
            restoreInstanceMutation={restoreMutation}
            cloudProvider={cloudProvider}
            region={selectedSnapshot?.region}
            customNetworks={customNetworks}
            offering={offering}
            isFetchingCustomNetworks={isFetchingCustomNetworks}
            selectedSnapshot={selectedSnapshot}
            open={isRestoreInstanceModalOpen}
          />
        )}
        {restoreInstanceModalStep === "success" && (
          <RestoreInstanceSuccessStep
            handleClose={handleRestoreInstanceModalClose}
            restoredInstanceID={restoredInstanceID}
            tab={tab}
          />
        )}
      </InformationDialogTopCenter>

      <CopySnapshotModal
        open={copySnapshotModalOpen}
        handleClose={handleCloseCopySnapshotModal}
        offering={offering}
        cloudProvider={cloudProvider}
        copySnapshotMutation={copySnapshotMutation}
        snapshotCreationType={snapshotCreationType}
        tab={tab}
      />
    </>
  );
};

export default Backup;

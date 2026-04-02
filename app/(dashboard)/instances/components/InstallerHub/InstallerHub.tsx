import { Box, IconButton, Stack } from "@mui/material";
import { createColumnHelper } from "@tanstack/react-table";
import { FC, useMemo, useState } from "react";

import LoadingSpinnerSmall from "src/components/CircularProgress/CircularProgress";
import DataTable from "src/components/DataTable/DataTable";
import DownloadCLIIcon from "src/components/Icons/SideNavbar/DownloadCLI/DownloadCLIIcon";
import Tooltip from "src/components/Tooltip/Tooltip";
import useInstallerDownload from "src/hooks/useInstallerDownload";
import { styleConfig } from "src/providerConfig";
import formatDateUTC from "src/utils/formatDateUTC";

import DataGridHeader from "./DataGridHeader";
import InstallerUpgraderInstructions from "./InstallerUpgraderInstructions";

type InstallerRow = {
  id: string;
  version: string;
  type: string;
  created_on: string;
  status: string;
  downloadURL: string;
};

type InstallerHubProps = {
  instanceDetails: Record<string, any>;
};

const columnHelper = createColumnHelper<InstallerRow>();

const InstallerHub: FC<InstallerHubProps> = ({ instanceDetails }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const { isDownloading, download } = useInstallerDownload();

  const rows: InstallerRow[] = useMemo(() => {
    return [
      {
        id: instanceDetails?.tierVersion ?? "",
        version: instanceDetails?.tierVersion ?? "",
        type: "Installer",
        created_on: formatDateUTC(instanceDetails?.created_at),
        status: instanceDetails?.status || "",
        downloadURL: instanceDetails?.onPremInstallerDetails?.downloadURL || "",
      },
    ];
  }, [instanceDetails]);

  function handleModalOpen() {
    setIsModalOpen(true);
  }

  function handleModalClose() {
    setIsModalOpen(false);
  }

  const columns = useMemo(() => {
    return [
      columnHelper.accessor("version", {
        header: "Version",
        cell: (info) => info.getValue() || "-",
        meta: {
          minWidth: 150,
        },
      }),
      columnHelper.accessor("type", {
        header: "Type",
        cell: (info) => info.getValue() || "-",
        meta: {
          minWidth: 100,
        },
      }),
      columnHelper.accessor("created_on", {
        header: "Created on",
        cell: (info) => info.getValue() || "-",
        meta: {
          minWidth: 100,
        },
      }),
      columnHelper.display({
        id: "action",
        header: "Action",
        cell: (info) => {
          const { status, downloadURL } = info.row.original;
          const isInstallerReady = status === "INSTALLER_READY" && !!downloadURL;

          return (
            <Stack direction="row" alignItems="center">
              <Tooltip title={!isInstallerReady ? "Installer is not ready for download" : "Download Installer"}>
                <span>
                  <IconButton
                    disableRipple
                    disabled={!isInstallerReady || isDownloading}
                    onClick={() => {
                      if (downloadURL) {
                        download(downloadURL, instanceDetails?.id);
                        handleModalOpen();
                      }
                    }}
                    sx={{
                      cursor: "pointer",
                      padding: 0,
                      gap: "4px",
                    }}
                  >
                    <DownloadCLIIcon
                      color={isInstallerReady && !isDownloading ? styleConfig.secondaryButtonText : "#A0A0A0"}
                    />
                    {isDownloading && <LoadingSpinnerSmall />}
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          );
        },
        meta: {
          minWidth: 100,
        },
      }),
    ];
  }, [isDownloading, download, instanceDetails?.id]);

  return (
    <Box mt="32px">
      <DataTable
        columns={columns}
        rows={rows}
        noRowsText="No Installer/Upgrader available"
        HeaderComponent={DataGridHeader}
        headerProps={{
          handleDrawerOpen: handleModalOpen,
          selectedRows,
        }}
        selectionMode="single"
        selectedRows={selectedRows}
        onRowSelectionChange={setSelectedRows}
        rowId="id"
      />
      <InstallerUpgraderInstructions
        open={isModalOpen}
        handleClose={handleModalClose}
        installerInstructions={instanceDetails?.onPremInstallerDetails?.installerInstructions}
      />
    </Box>
  );
};

export default InstallerHub;

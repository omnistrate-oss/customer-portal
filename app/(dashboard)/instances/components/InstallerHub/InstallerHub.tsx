import { Box, IconButton, Stack } from "@mui/material";
import { createColumnHelper } from "@tanstack/react-table";
import axios from "axios";
import { FC, useCallback, useMemo, useState } from "react";

import DataTable from "src/components/DataTable/DataTable";
import DownloadCLIIcon from "src/components/Icons/SideNavbar/DownloadCLI/DownloadCLIIcon";
import SideDrawerRight from "src/components/SideDrawerRight/SideDrawerRight";
import Tooltip from "src/components/Tooltip/Tooltip";
import useSnackbar from "src/hooks/useSnackbar";
import formatDateUTC from "src/utils/formatDateUTC";
import { saveBlob } from "src/utils/saveBlob";

import LoadingSpinnerSmall from "../../../../../src/components/CircularProgress/CircularProgress";

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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const snackbar = useSnackbar();

  const handleDownload = useCallback(
    async (downloadURL: string) => {
      if (!downloadURL || isDownloading) return;

      setIsDownloading(true);
      try {
        // Strip the host/domain and only pass the path to the server
        let downloadPath: string;
        try {
          const url = new URL(downloadURL);
          downloadPath = url.pathname + url.search;
        } catch {
          // If it's already a relative path, use as-is
          downloadPath = downloadURL;
        }

        const response = await axios.post(
          "/api/download-installer",
          { downloadPath },
          {
            responseType: "blob",
          }
        );

        // Extract filename from Content-Disposition or fallback
        const contentDisposition = response.headers["content-disposition"];
        let filename = "installer";
        if (contentDisposition) {
          const match = contentDisposition.match(/filename[^;=\n]*=(['"]?)([^'"\n]*)\1/);
          if (match?.[2]) {
            filename = match[2];
          }
        }

        saveBlob(response.data, filename);
        snackbar.showSuccess("Installer download successfully");
      } catch (error) {
        console.error("Failed to download installer:", error);
        snackbar.showError("Failed to download installer. Please try again.");
      } finally {
        setIsDownloading(false);
      }
    },
    [isDownloading, snackbar]
  );

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

  function handleDrawerOpen() {
    setIsDrawerOpen(true);
  }

  function handleDrawerClose() {
    setIsDrawerOpen(false);
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
            <Stack direction="row" gap="12px" width="100%">
              <Tooltip title={!isInstallerReady ? "Installer is not ready for download" : "Download Installer"}>
                <span>
                  <IconButton
                    disableRipple
                    disabled={!isInstallerReady || isDownloading}
                    onClick={() => {
                      if (downloadURL) {
                        handleDownload(downloadURL);
                      }
                    }}
                    sx={{
                      cursor: "pointer",
                      padding: 0,
                      gap: "4px",
                    }}
                  >
                    <DownloadCLIIcon color={isInstallerReady && !isDownloading ? "#6941C6" : "#A0A0A0"} />
                  </IconButton>
                  {isDownloading && <LoadingSpinnerSmall />}
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
  }, [isDownloading, handleDownload]);

  return (
    <Box>
      <DataTable
        columns={columns}
        rows={rows}
        noRowsText="No Installer/Upgrader available"
        HeaderComponent={DataGridHeader}
        headerProps={{
          handleDrawerOpen,
          selectedRows,
        }}
        selectionMode="single"
        selectedRows={selectedRows}
        onRowSelectionChange={setSelectedRows}
        rowId="id"
      />
      <SideDrawerRight
        open={isDrawerOpen}
        closeDrawer={handleDrawerClose}
        size="medium"
        RenderUI={
          <>
            <InstallerUpgraderInstructions
              installerInstructions={instanceDetails?.onPremInstallerDetails?.installerInstructions}
            />
          </>
        }
      />
    </Box>
  );
};

export default InstallerHub;

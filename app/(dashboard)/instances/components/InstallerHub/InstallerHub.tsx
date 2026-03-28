import { Box, IconButton, Stack } from "@mui/material";
import { createColumnHelper } from "@tanstack/react-table";
import { FC, useMemo, useState } from "react";

import DataTable from "src/components/DataTable/DataTable";
import DownloadCLIIcon from "src/components/Icons/SideNavbar/DownloadCLI/DownloadCLIIcon";
import SideDrawerRight from "src/components/SideDrawerRight/SideDrawerRight";
import Tooltip from "src/components/Tooltip/Tooltip";
import formatDateUTC from "src/utils/formatDateUTC";

import URLCopyIcon from "../../../../../src/components/Icons/CopyIcon/URLCopyIcon";

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
                    disabled={!isInstallerReady}
                    onClick={() => {
                      if (downloadURL) {
                        window.open(downloadURL, "_self");
                      }
                    }}
                    sx={{
                      cursor: "pointer",
                      padding: 0,
                      gap: "4px",
                    }}
                  >
                    <DownloadCLIIcon color={isInstallerReady ? "#6941C6" : "#A0A0A0"} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={!isInstallerReady ? "Installer is not ready for copy URL" : "Copy Installer URL"}>
                <span>
                  <IconButton
                    disableRipple
                    disabled={!isInstallerReady}
                    onClick={() => {
                      if (downloadURL) {
                        navigator.clipboard.writeText(downloadURL);
                      }
                    }}
                    sx={{
                      cursor: "pointer",
                      padding: 0,
                      gap: "4px",
                    }}
                  >
                    <URLCopyIcon color={isInstallerReady ? "#6941C6" : "#A0A0A0"} />
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
  }, []);

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

import { Box, Stack } from "@mui/material";
import { FC } from "react";

import Button from "components/Button/Button";
import DataGridHeaderTitle from "src/components/Headers/DataGridHeaderTitle";
import Tooltip from "src/components/Tooltip/Tooltip";
import { themeConfig } from "src/themeConfig";

import InstallerActionIcon from "./Installer/InstallerActionIcon";

type DataGridHeaderProps = {
  handleDrawerOpen: () => void;
  selectedRows: string[];
};

const DataGridHeader: FC<DataGridHeaderProps> = (props) => {
  const { handleDrawerOpen, selectedRows = [] } = props;

  const isNoneSelected = selectedRows.length === 0;

  return (
    <Box padding={"20px"} borderBottom={`1px solid ${themeConfig.colors.gray200}`}>
      <Stack direction="row" justifyContent="space-between" alignItems={"center"} gap="16px">
        <DataGridHeaderTitle
          title="List of Installers/Upgraders"
          desc={
            "Below are the installer and upgrader packages available for this instance. Select a version to download and view detailed installation instructions."
          }
        />
        <Tooltip title={isNoneSelected ? "Installer/Upgrader is not selected" : ""}>
          <span>
            <Button
              variant="outlined"
              disabled={isNoneSelected}
              startIcon={<InstallerActionIcon color={isNoneSelected ? "#D0D5DD" : ""} />}
              onClick={() => handleDrawerOpen()}
            >
              View Installer/Upgrader Instructions
            </Button>
          </span>
        </Tooltip>
      </Stack>
    </Box>
  );
};

export default DataGridHeader;

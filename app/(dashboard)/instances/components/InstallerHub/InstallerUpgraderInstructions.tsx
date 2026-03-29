import { Box } from "@mui/material";

import DataGridHeaderTitle from "src/components/Headers/DataGridHeaderTitle";

import InstallerInstructions from "./InstallerInstructions";

interface InstallerUpgraderInstructionsProps {
  installerInstructions?: string;
}

const InstallerUpgraderInstructions = ({ installerInstructions }: InstallerUpgraderInstructionsProps) => {
  return (
    <Box>
      <DataGridHeaderTitle title="View Installer/Upgrader Instructions" desc={"View Installer/Upgrader Instructions"} />
      <InstallerInstructions installerInstructions={installerInstructions ?? ""} />
    </Box>
  );
};

export default InstallerUpgraderInstructions;

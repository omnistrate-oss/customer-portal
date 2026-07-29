import { FC } from "react";
import Link from "next/link";
import { Box } from "@mui/material";

import GovernanceControlsIcon from "src/components/Icons/GovernanceControls/GovernanceControls";
import Tooltip from "src/components/Tooltip/Tooltip";

const iconWrapperSx = { display: "flex", alignItems: "center" };

type GovernanceControlsCellProps = {
  /** Route to the instance's Governance Controls tab. Omitted when the row's subscription is unresolved. */
  href?: string;
};

const GovernanceControlsCell: FC<GovernanceControlsCellProps> = ({ href }) => {
  return (
    <Tooltip
      placement="top"
      slotProps={{ tooltip: { sx: { maxWidth: "320px" } } }}
      title={
        href ? (
          <>
            To enable or disable agent debug access and infrastructure permissions,{" "}
            <Box component={Link} href={href} sx={{ color: "#D6BBFB", textDecoration: "underline" }}>
              click here
            </Box>
          </>
        ) : (
          "Enable or disable agent debug access and infrastructure permissions"
        )
      }
    >
      {href ? (
        <Box component={Link} href={href} sx={iconWrapperSx}>
          <GovernanceControlsIcon />
        </Box>
      ) : (
        <Box sx={iconWrapperSx}>
          <GovernanceControlsIcon />
        </Box>
      )}
    </Tooltip>
  );
};

export default GovernanceControlsCell;

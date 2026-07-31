import { FC } from "react";
import Link from "next/link";
import { Box } from "@mui/material";

import GovernanceControlsIcon from "src/components/Icons/GovernanceControls/GovernanceControls";
import Tooltip from "src/components/Tooltip/Tooltip";

const iconWrapperSx = { display: "flex", alignItems: "center" };

const DISABLED_ICON_COLOR = "#D5D7DA";
const UNSUPPORTED_PROVIDER_MESSAGE =
  "Agent debug access and infrastructure permission controls are available only for AWS workload cloud accounts.";

type GovernanceControlsCellProps = {
  /** Route to the instance's Governance Controls tab. Omitted when the row's subscription is unresolved. */
  href?: string;
  /** Governance controls are AWS-only; other providers get an inert, greyed-out icon. */
  disabled?: boolean;
};

const GovernanceControlsCell: FC<GovernanceControlsCellProps> = ({ href, disabled }) => {
  const linkHref = disabled ? undefined : href;

  return (
    <Tooltip
      placement="top"
      slotProps={{ tooltip: { sx: { maxWidth: "320px" } } }}
      title={
        disabled ? (
          UNSUPPORTED_PROVIDER_MESSAGE
        ) : linkHref ? (
          <>
            To enable or disable agent debug access and infrastructure permissions,{" "}
            <Box component={Link} href={linkHref} sx={{ color: "#D6BBFB", textDecoration: "underline" }}>
              click here
            </Box>
          </>
        ) : (
          "Enable or disable agent debug access and infrastructure permissions"
        )
      }
    >
      {linkHref ? (
        <Box component={Link} href={linkHref} sx={iconWrapperSx}>
          <GovernanceControlsIcon />
        </Box>
      ) : (
        <Box sx={iconWrapperSx}>
          <GovernanceControlsIcon color={disabled ? DISABLED_ICON_COLOR : undefined} />
        </Box>
      )}
    </Tooltip>
  );
};

export default GovernanceControlsCell;

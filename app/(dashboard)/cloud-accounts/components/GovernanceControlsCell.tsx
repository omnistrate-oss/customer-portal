import { FC } from "react";
import Link from "next/link";
import { Box } from "@mui/material";

import GovernanceControlsIcon from "src/components/Icons/GovernanceControls/GovernanceControls";
import Tooltip from "src/components/Tooltip/Tooltip";

const iconWrapperSx = { display: "flex", alignItems: "center" };

const DISABLED_ICON_COLOR = "#D5D7DA";
const UNSUPPORTED_PROVIDER_MESSAGE =
  "Agent debug access and infrastructure permission controls are available only for AWS cloud accounts.";

type GovernanceControlsCellProps = {
  /** Route to the instance's Governance Controls tab. Omitted when the row's subscription is unresolved. */
  href?: string;
  /** Governance controls are AWS-only; other providers get an inert, greyed-out icon. */
  disabled?: boolean;
  /** AWS governance controls are available only when Private Link is enabled. */
  privateLinkEnabled: boolean;
};

const GovernanceControlsCell: FC<GovernanceControlsCellProps> = ({ href, disabled, privateLinkEnabled }) => {
  const isPrivateLinkUnavailable = !disabled && !privateLinkEnabled;
  const iconDisabled = disabled || isPrivateLinkUnavailable;
  const linkHref = disabled || isPrivateLinkUnavailable ? undefined : href;
  const icon = (
    <Box sx={iconWrapperSx}>
      <GovernanceControlsIcon color={iconDisabled ? DISABLED_ICON_COLOR : undefined} />
    </Box>
  );

  if (isPrivateLinkUnavailable) return icon;

  return (
    <Tooltip
      placement="top"
      slotProps={{ tooltip: { sx: { maxWidth: "320px" } } }}
      title={
        disabled ? (
          UNSUPPORTED_PROVIDER_MESSAGE
        ) : linkHref ? (
          <>
            Manage account access and permissions in{" "}
            <Box component={Link} href={linkHref} sx={{ color: "#D6BBFB", textDecoration: "underline" }}>
              Governance Controls
            </Box>
          </>
        ) : (
          "Manage account access and permissions in Governance Controls"
        )
      }
    >
      {linkHref ? (
        <Box component={Link} href={linkHref} sx={iconWrapperSx}>
          <GovernanceControlsIcon />
        </Box>
      ) : (
        icon
      )}
    </Tooltip>
  );
};

export default GovernanceControlsCell;

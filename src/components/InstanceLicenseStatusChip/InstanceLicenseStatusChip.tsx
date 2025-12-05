import { FC } from "react";
import { Stack } from "@mui/material";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { getResourceInstanceLicenseStatusStylesAndLabel } from "src/constants/statusChipStyles/resourceInstanceLicenseStatus";
import { InstanceLicenseStatus } from "src/types/resourceInstance";

import StatusChip from "../StatusChip/StatusChip";
import Tooltip from "../Tooltip/Tooltip";

dayjs.extend(utc);

type LicenseStatusChipProps = {
  expirationDate: string | undefined;
  showExpirationDateTooltip?: boolean;
};

const InstanceLicenseStatusChip: FC<LicenseStatusChipProps> = ({
  expirationDate,
  showExpirationDateTooltip = false,
}) => {
  if (!expirationDate)
    return (
      <Stack direction="row" alignItems="center" gap="6px" minWidth="94px" justifyContent="space-between">
        {"-"}
      </Stack>
    );

  const numDaysBeforeExpirationWarning = 5;

  let shouldShowExpirationWarning = false;

  const numDaysToExpiry = dayjs(expirationDate).diff(dayjs(), "day", true);
  if (numDaysToExpiry <= numDaysBeforeExpirationWarning) shouldShowExpirationWarning = true;

  const isExpired = new Date(expirationDate).getTime() < new Date().getTime();
  let licenseStatus: InstanceLicenseStatus = "ACTIVE";
  if (isExpired) licenseStatus = "EXPIRED";
  else if (shouldShowExpirationWarning) licenseStatus = "EXPIRING_SOON";

  const statusSytlesAndLabel = getResourceInstanceLicenseStatusStylesAndLabel(licenseStatus);

  const formattedExpirationDate = dayjs.utc(expirationDate).format("MMM D, YYYY HH:mm:ss");

  return (
    <Stack direction="row" alignItems="center" gap="6px" minWidth="94px" justifyContent="space-between">
      <Tooltip isVisible={showExpirationDateTooltip} title={`Expires on ${formattedExpirationDate} UTC`}>
        <span>
          <StatusChip status={licenseStatus} {...statusSytlesAndLabel} />
        </span>
      </Tooltip>
    </Stack>
  );
};

export default InstanceLicenseStatusChip;

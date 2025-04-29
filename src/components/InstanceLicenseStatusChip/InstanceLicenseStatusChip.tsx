import { Stack } from "@mui/material";
import { FC } from "react";
import { InstanceLicenseStatus } from "src/types/resourceInstance";
import StatusChip from "../StatusChip/StatusChip";
import { BlackTooltip } from "../Tooltip/Tooltip";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { getResourceInstanceLicenseStatusStylesAndLabel } from "src/constants/statusChipStyles/resourceInstanceLicenseStatus";
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
      <Stack
        direction="row"
        alignItems="center"
        gap="6px"
        minWidth="94px"
        justifyContent="space-between"
      >
        {"-"}
      </Stack>
    );

  const numDaysBeforeExpirationWarning = 7;

  let shouldShowExpirationWarning = false;

  const numDaysToExpiry = dayjs(expirationDate).diff(dayjs(), "day", true);
  if (numDaysToExpiry <= numDaysBeforeExpirationWarning)
    shouldShowExpirationWarning = true;

  const isExpired = new Date(expirationDate).getTime() < new Date().getTime();
  let licenseStatus: InstanceLicenseStatus = "ACTIVE";
  if (isExpired) licenseStatus = "EXPIRED";
  else if (shouldShowExpirationWarning) licenseStatus = "EXPIRING_SOON";

  const statusSytlesAndLabel =
    getResourceInstanceLicenseStatusStylesAndLabel(licenseStatus);

  const formattedExpirationDate = dayjs
    .utc(expirationDate)
    .format("MMM d, YYYY HH:mm:ss");

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap="6px"
      minWidth="94px"
      justifyContent="space-between"
    >
      <BlackTooltip
        isVisible={showExpirationDateTooltip}
        title={`Expires on ${formattedExpirationDate}  UTC`}
        placement="top"
      >
        <span>
          <StatusChip status={licenseStatus} {...statusSytlesAndLabel} />
        </span>
      </BlackTooltip>
    </Stack>
  );
};

export default InstanceLicenseStatusChip;
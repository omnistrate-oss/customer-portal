import { FC, useMemo } from "react";

import formatDateUTC from "src/utils/formatDateUTC";

import PropertyDetails, { Row } from "../../ResourceInstanceDetails/PropertyDetails";

export type BackupStatus = {
  backupPeriodInHours: string;
  backupRetentionInDays?: string;
  earliestRestoreTime?: string;
  lastBackupTime?: string;
};

const BackupSummary: FC<BackupStatus> = (props) => {
  const { backupPeriodInHours, backupRetentionInDays, earliestRestoreTime, lastBackupTime } = props;

  const backupData: Row[] = useMemo(() => {
    const res: Row[] = [
      {
        label: "Recovery Point Objective",
        value: `${backupPeriodInHours} ${Number(backupPeriodInHours) > 1 ? " hrs" : " hr"}`,
        valueType: "text",
      },
      {
        label: "Recovery Time Objective",
        value: "Few minutes, typically <5 minutes",
        valueType: "text",
      },
      {
        label: "Retention duration",
        value: `${backupRetentionInDays} ${Number(backupRetentionInDays) > 1 ? " days" : " day"}`,
        valueType: "text",
      },
      {
        label: "Earliest Restore Time",
        value: earliestRestoreTime ? formatDateUTC(earliestRestoreTime) : "-",
        valueType: earliestRestoreTime ? "text" : "custom",
      },
      {
        label: "Last Backup Time",
        value: lastBackupTime ? formatDateUTC(lastBackupTime) : "-",
        valueType: lastBackupTime ? "text" : "custom",
      },
    ];

    return res;
  }, [backupPeriodInHours, backupRetentionInDays, earliestRestoreTime, lastBackupTime]);

  return (
    <>
      {backupPeriodInHours && (
        <PropertyDetails
          data-testid="resource-instance-details-table"
          rows={{
            title: "Backup Summary",
            desc: "",
            rows: backupData,
            flexWrap: true,
          }}
        />
      )}
    </>
  );
};

export default BackupSummary;

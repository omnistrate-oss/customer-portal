import { FC } from "react";
import { ArrowOutward } from "@mui/icons-material";

import ColumnPreferenceButton, {
  ColumnPreferenceButtonProps,
} from "src/components/ColumnPreference/ColumnPreferenceButton";
import { getEventsRoute } from "src/utils/routes";
import Button from "components/Button/Button";
import DataGridHeaderTitle from "components/Headers/DataGridHeaderTitle";

type DashboardLogsTableHeaderProps = {
  columnPreference: ColumnPreferenceButtonProps;
};

const DashboardLogsTableHeader: FC<DashboardLogsTableHeaderProps> = ({ columnPreference }) => {
  return (
    <div className="flex items-center justify-between gap-4 py-5 px-6 border-b border-[#EAECF0]">
      <DataGridHeaderTitle
        title="Recent Audit Logs"
        desc="Detail audit trail of users actions performed on deployment instances"
      />

      <div className="flex items-center gap-4 flex-shrink-0">
        <Button
          data-testid="view-all-audit-logs-button"
          variant="outlined"
          href={getEventsRoute()}
          target="_blank"
          endIcon={<ArrowOutward />}
        >
          View all audit logs
        </Button>
        <ColumnPreferenceButton {...columnPreference} />
      </div>
    </div>
  );
};

export default DashboardLogsTableHeader;

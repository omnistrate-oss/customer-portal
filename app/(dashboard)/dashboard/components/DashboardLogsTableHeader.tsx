import { ArrowOutward } from "@mui/icons-material";

import { getEventsRoute } from "src/utils/routes";
import Button from "components/Button/Button";
import DataGridHeaderTitle from "components/Headers/DataGridHeaderTitle";

const DashboardLogsTableHeader = () => {
  return (
    <div className="flex items-center justify-between gap-4 py-5 px-6 border-b border-[#EAECF0]">
      <DataGridHeaderTitle
        title="Recent Audit Logs"
        desc="Detail audit trail of users actions performed on deployment instances"
      />

      <Button
        data-testid="view-all-audit-logs-button"
        variant="outlined"
        href={getEventsRoute()}
        target="_blank"
        endIcon={<ArrowOutward />}
      >
        View all audit logs
      </Button>
    </div>
  );
};

export default DashboardLogsTableHeader;

import { CircularProgress } from "@mui/material";

import DataGridHeaderTitle from "src/components/Headers/DataGridHeaderTitle";
import RefreshWithToolTip from "src/components/RefreshWithTooltip/RefreshWithToolTip";

type NotificationsTableHeaderProps = {
  refetchNotifications: () => void;
  isFetchingNotifications: boolean;
};

const NotificationsTableHeader: React.FC<NotificationsTableHeaderProps> = ({
  refetchNotifications,
  isFetchingNotifications,
}) => {
  return (
    <div className="flex items-center justify-between gap-4 py-5 px-6 border-b border-[#EAECF0]">
      <DataGridHeaderTitle title="List of Alerts" desc="Alerts related to system activities" />

      <div className="flex justify-end items-center gap-4 flex-wrap flex-grow">
        <div className="flex items-center">{isFetchingNotifications && <CircularProgress size={20} />}</div>
        <RefreshWithToolTip refetch={refetchNotifications} disabled={isFetchingNotifications} />
      </div>
    </div>
  );
};

export default NotificationsTableHeader;

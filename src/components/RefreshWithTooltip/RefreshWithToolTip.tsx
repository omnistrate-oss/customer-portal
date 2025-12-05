import { IconButton } from "@mui/material";

import RefreshIcon from "../Icons/Refresh/Refresh";
import Tooltip from "../Tooltip/Tooltip";

interface RefreshWithToolTipProps {
  refetch: () => void;
  disabled: boolean;
  isVisible?: boolean;
}

const RefreshWithToolTip: React.FC<RefreshWithToolTipProps> = (props) => {
  const { refetch, disabled, isVisible = true } = props;

  return (
    <Tooltip title="Refresh" isVisible={isVisible}>
      <span>
        <IconButton data-testid="refresh-button" size="small" disabled={disabled} onClick={refetch}>
          <RefreshIcon disabled={disabled} />
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default RefreshWithToolTip;

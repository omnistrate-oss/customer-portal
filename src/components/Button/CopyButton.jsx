import { useState } from "react";
import { IconButton } from "@mui/material";
import clipboard from "clipboardy";

import CopyIcon from "components/Icons/CopyIcon/DataGridCopyIcon";

import Tooltip from "../Tooltip/Tooltip";

const CopyButton = ({
  text = "",
  defaultTooltipText = "Click to copy",
  tooltipProps = {},
  iconProps = {},
  iconButtonProps = {},
  iconStyle = {},
}) => {
  const [tooltipText, setTooltipText] = useState(defaultTooltipText);

  function handleClick() {
    clipboard
      .write(text)
      .then(() => setTooltipText("Copied"))
      .catch(() => setTooltipText("Unable to copy to clipboard"))
      .finally(() => setTimeout(() => setTooltipText(defaultTooltipText), 1500)); // Reset the tooltip text after copying
  }

  return (
    <Tooltip title={tooltipText} placement="top" {...tooltipProps}>
      <IconButton onClick={handleClick} sx={{ ...iconButtonProps }}>
        <CopyIcon color="#7F56D9" sx={{ width: "16px", height: "18px", ...iconStyle }} {...iconProps} />
      </IconButton>
    </Tooltip>
  );
};

export default CopyButton;

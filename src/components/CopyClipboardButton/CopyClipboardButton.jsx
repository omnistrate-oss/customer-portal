import { useState } from "react";
import { IconButton } from "@mui/material";
import clipboard from "clipboardy";

import DataGridCopyIcon from "../Icons/CopyIcon/DataGridCopyIcon";
import Tooltip from "../Tooltip/Tooltip";

const CopyToClipboardButton = (props) => {
  const { text = "", iconProps, buttonStyles = {} } = props;
  const [tooltipText, setTooltipText] = useState("Click to copy");

  function handleClick() {
    if (text) {
      clipboard
        .write(text)
        .then(() => {
          setTooltipText("Copied");
        })
        .catch(() => {
          setTooltipText("Unable to copy to clipboard");
        });
    } else {
      setTooltipText("Nothing to be copied!");
    }
  }

  return (
    <Tooltip
      title={tooltipText}
      onOpen={() => {
        setTooltipText("Click to copy");
      }}
    >
      <IconButton onClick={handleClick} sx={buttonStyles}>
        <DataGridCopyIcon color="#7F56D9" {...iconProps} />
      </IconButton>
    </Tooltip>
  );
};

export default CopyToClipboardButton;

import { Box } from "@mui/material";

import { getEventMessageStylesAndLabel } from "src/constants/statusChipStyles/eventMessage";

function EventMessageChip({ message }) {
  const messageStyles = getEventMessageStylesAndLabel(message);

  return (
    <Box sx={{ paddingY: "6px" }}>
      {/* wrapping parent box is required to fix the issues where lines after clamped are also visible  */}
      <Box
        className="clamp_four_lines"
        sx={{
          color: messageStyles.color,
          overflowY: "hidden",
          lineHeight: "20px",
        }}
      >
        {message}
      </Box>
    </Box>
  );
}

export default EventMessageChip;

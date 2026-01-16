import { Close } from "@mui/icons-material";
import { Box } from "@mui/material";

import { Text } from "src/components/Typography/Typography";

type ActiveFilterChipProps = {
  label: string;
  onRemove: () => void;
};

const ActiveFilterChip = ({ label, onRemove }: ActiveFilterChipProps) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: "2px",
      padding: "2px 2px 2px 6px",
      borderRadius: "100px",
      border: "1px solid #E9D7FE",
      bgcolor: "#F9F5FF",
    }}
  >
    <Text size="xsmall" weight="medium" ellipsis color="#6941C6">
      {label}
    </Text>
    <Box
      component="span"
      onClick={(e) => {
        e.stopPropagation();
        onRemove();
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        padding: "2px",
        borderRadius: "50%",
        "&:hover": { bgcolor: "#F4EBFF" },
      }}
    >
      <Close sx={{ fontSize: 14, color: "#9E77ED" }} />
    </Box>
  </Box>
);

export const MoreChip = ({ count }: { count: number }) => (
  <Box
    sx={{
      padding: "2px 6px",
      borderRadius: "100px",
      border: "1px solid #E9D7FE",
      bgcolor: "#F9F5FF",
    }}
  >
    <Text size="xsmall" weight="medium" ellipsis color="#6941C6">
      +{count} more
    </Text>
  </Box>
);

export default ActiveFilterChip;

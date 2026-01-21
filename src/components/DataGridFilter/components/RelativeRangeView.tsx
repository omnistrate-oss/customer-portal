import { Box, Stack } from "@mui/material";

import Radio from "src/components/FormElementsv2/Radio/Radio";

import { Text } from "../../Typography/Typography";

export const relativeRangeOptions = [
  { label: "Last 5 minutes", value: 5 * 60 * 1000 },
  { label: "Last 30 minutes", value: 30 * 60 * 1000 },
  { label: "Last 1 hour", value: 1 * 60 * 60 * 1000 },
  { label: "Last 6 hours", value: 6 * 60 * 60 * 1000 },
  { label: "Last 1 day", value: 1 * 24 * 60 * 60 * 1000 },
  { label: "Last 3 days", value: 3 * 24 * 60 * 60 * 1000 },
];

type RelativeRangeViewProps = {
  selectedValue: number | null;
  onChange: (value: number | null) => void;
  onTabChange: () => void;
};

const RelativeRangeView: React.FC<RelativeRangeViewProps> = ({ selectedValue, onChange, onTabChange }) => {
  const onClick = (value: number) => {
    if (selectedValue === value) {
      onChange(null);
    } else {
      onChange(value);
    }
  };

  return (
    <Stack gap="16px" pt="8px">
      {relativeRangeOptions.map((option, i) => (
        <Stack
          direction="row"
          sx={{
            fontSize: "14px",
            lineHeight: "20px",
            fontWeight: 500,
            color: "#181d27",
            cursor: "pointer",
          }}
          key={i}
          onClick={() => onClick(option.value)}
        >
          <Radio sx={{ padding: "0px", marginRight: "8px" }} checked={selectedValue === option.value} />
          {option.label}
        </Stack>
      ))}

      <Stack
        direction="row"
        alignItems="flex-start"
        sx={{
          fontSize: "14px",
          lineHeight: "20px",
          fontWeight: 500,
          color: "#181d27",
          cursor: "pointer",
        }}
        key="custom"
        onClick={onTabChange}
      >
        <Radio sx={{ padding: "0px", marginRight: "8px", paddingTop: "3px" }} />
        <Box>
          Custom
          <Text size="xsmall" weight="regular" color="#535862">
            Set a custom range in the past
          </Text>
        </Box>
      </Stack>
    </Stack>
  );
};

export default RelativeRangeView;

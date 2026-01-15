import { useState } from "react";
import { Box, InputAdornment, Stack } from "@mui/material";

import CustomCheckbox from "src/components/Checkbox/Checkbox";
import TextField from "src/components/FormElementsv2/TextField/TextField";
import SearchLens from "src/components/Icons/SearchLens/SearchLens";
import { Text } from "src/components/Typography/Typography";

type FilterOptionsMultiSelectProps = {
  options: { label: string; value: string }[];
  selectedValues: string[];
  onChange: (selectedValues: string[]) => void;
};

const FilterOptionsMultiSelect: React.FC<FilterOptionsMultiSelectProps> = ({ options, selectedValues, onChange }) => {
  const [searchText, setSearchText] = useState("");

  const filteredOptions = options.filter((option) => option.label.toLowerCase().includes(searchText.toLowerCase()));

  const handleToggle = (value: string) => {
    const isSelected = selectedValues.includes(value);
    if (isSelected) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  return (
    <div>
      <TextField
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" sx={{ borderLeft: "none !important", paddingRight: "0px !important" }}>
              <SearchLens />
            </InputAdornment>
          ),
        }}
        placeholder="Search"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        fullWidth
        sx={{ mb: "12px" }}
      />
      <Stack>
        {filteredOptions.map((option) => (
          <Box
            key={option.value}
            display="flex"
            alignItems="center"
            sx={{ cursor: "pointer" }}
            onClick={() => handleToggle(option.value)}
          >
            <CustomCheckbox checked={selectedValues.includes(option.value)} />
            <Text size="small" weight="medium" color="#414651" ellipsis>
              {option.label}
            </Text>
          </Box>
        ))}
        {filteredOptions.length === 0 && (
          <Text size="small" weight="medium" color="#717680">
            No options found
          </Text>
        )}
      </Stack>
    </div>
  );
};

export default FilterOptionsMultiSelect;

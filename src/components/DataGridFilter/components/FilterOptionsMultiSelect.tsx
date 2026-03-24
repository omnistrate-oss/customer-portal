import { CSSProperties, ReactElement, useCallback, useMemo, useState } from "react";
import { Box, InputAdornment } from "@mui/material";
import { List } from "react-window";

import CustomCheckbox from "src/components/Checkbox/Checkbox";
import TextField from "src/components/FormElementsv2/TextField/TextField";
import SearchLens from "src/components/Icons/SearchLens/SearchLens";
import { Text } from "src/components/Typography/Typography";

const ROW_HEIGHT = 34;

type Option = { label: string; value: string };

type RowData = {
  filteredOptions: Option[];
  selectedSet: Set<string>;
  onToggle: (value: string) => void;
};

const Row = ({
  index,
  style,
  ariaAttributes,
  filteredOptions,
  selectedSet,
  onToggle,
}: {
  index: number;
  style: CSSProperties;
  ariaAttributes: {
    "aria-posinset": number;
    "aria-setsize": number;
    role: "listitem";
  };
} & RowData): ReactElement => {
  const option = filteredOptions[index];
  return (
    <Box
      style={style}
      display="flex"
      alignItems="center"
      sx={{ cursor: "pointer" }}
      onClick={() => onToggle(option.value)}
      {...ariaAttributes}
    >
      <CustomCheckbox checked={selectedSet.has(option.value)} />
      <Text size="small" weight="medium" color="#414651" ellipsis>
        {option.label}
      </Text>
    </Box>
  );
};

type FilterOptionsMultiSelectProps = {
  options: Option[];
  selectedValues: string[];
  onChange: (selectedValues: string[]) => void;
};

const FilterOptionsMultiSelect: React.FC<FilterOptionsMultiSelectProps> = ({ options, selectedValues, onChange }) => {
  const [searchText, setSearchText] = useState("");

  const filteredOptions = useMemo(() => {
    if (!searchText) return options;
    const lower = searchText.toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(lower));
  }, [options, searchText]);

  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);

  const handleToggle = useCallback(
    (value: string) => {
      if (selectedSet.has(value)) {
        onChange(selectedValues.filter((v) => v !== value));
      } else {
        onChange([...selectedValues, value]);
      }
    },
    [selectedSet, selectedValues, onChange]
  );

  const rowProps = useMemo<RowData>(
    () => ({ filteredOptions, selectedSet, onToggle: handleToggle }),
    [filteredOptions, selectedSet, handleToggle]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
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
        sx={{ mb: "12px", flexShrink: 0 }}
      />
      {filteredOptions.length === 0 ? (
        <Text size="small" weight="medium" color="#717680">
          No options found
        </Text>
      ) : (
        <div style={{ flex: 1, minHeight: 0 }}>
          <List
            rowComponent={Row}
            rowCount={filteredOptions.length}
            rowHeight={ROW_HEIGHT}
            rowProps={rowProps}
            style={{ height: "100%" }}
            overscanCount={5}
          />
        </div>
      )}
    </div>
  );
};

export default FilterOptionsMultiSelect;

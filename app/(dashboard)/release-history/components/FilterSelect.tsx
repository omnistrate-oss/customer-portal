import { SelectChangeEvent } from "@mui/material";
import { FC } from "react";

import MenuItem from "src/components/FormElementsv2/MenuItem/MenuItem";
import Select from "src/components/FormElementsv2/Select/Select";

type FilterSelectProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: { label: string; value: string }[];
  isLoading?: boolean;
  disabled?: boolean;
  emptyMessage?: string;
};

const FilterSelect: FC<FilterSelectProps> = ({
  id,
  value,
  onChange,
  placeholder,
  options,
  isLoading = false,
  disabled = false,
  emptyMessage = "No options available",
}) => {
  const handleChange = (e: SelectChangeEvent<string>) => {
    onChange(e.target.value as string);
  };

  return (
    <Select
      id={id}
      name={id}
      value={value}
      isLoading={isLoading}
      disabled={disabled}
      renderValue={() => {
        return options?.find((option) => option.value === value)?.label ?? placeholder;
      }}
      sx={{
        minWidth: "200px",
        maxWidth: "220px",
        height: "40px !important",
        marginTop: 0,
        "& .MuiSelect-select": {
          fontSize: "14px",
          color: "#414651",
          fontWeight: "500",
        },
      }}
      fullWidth={false}
      onChange={handleChange}
      displayEmpty
      data-testid={`${id}-filter`}
      maxWidth="300px"
    >
      {options?.length > 0 ? (
        options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))
      ) : (
        <MenuItem disabled>
          <i>{emptyMessage}</i>
        </MenuItem>
      )}
    </Select>
  );
};

export default FilterSelect;

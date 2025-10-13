import { useMemo, useState } from "react";
import { ChevronLeft } from "@mui/icons-material";
import { Box, MenuItem, MenuList, Stack, styled } from "@mui/material";

import Button from "src/components/Button/Button";
import Checkbox from "src/components/Checkbox/Checkbox";
import {
  DateRange,
  DateTimeRangePickerStatic,
  initialRangeState,
} from "src/components/DateRangePicker/DateTimeRangePickerStatic";
import FilterFunnel from "src/components/Icons/Filter/FilterFunnel";
import FilterLinesIcon from "src/components/Icons/FilterLines/FilterLines";
import { PopoverDynamicHeight } from "src/components/Popover/Popover";
import { themeConfig } from "src/themeConfig";
import { SetState } from "src/types/common/reactGenerics";

import { FilterCategorySchema } from "../utils";

const StyledIconCard = styled(Box)({
  padding: "8px",
  borderRadius: "8px",
  border: `1px solid ${themeConfig.colors.green300}`,
  boxShadow: `box-shadow: 0px 1px 2px 0px #0A0D120D, 0px -2px 0px 0px #0A0D120D inset, 0px 0px 0px 1px #0A0D122E inset`,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
});

type SelectedCategoryDateTimeRangeProps = {
  selectedCategory: FilterCategorySchema;
  handleRemoveCategory: () => void;
  setSelectedFilters: SetState<Record<string, FilterCategorySchema>>;
};

export const SelectedCategoryDateTimeRange = ({
  selectedCategory,
  handleRemoveCategory,
  setSelectedFilters,
}: SelectedCategoryDateTimeRangeProps) => {
  const handleApplyDateRange = (value: DateRange) => {
    if (selectedCategory) {
      setSelectedFilters((prev) => {
        return {
          ...prev,
          [selectedCategory.name]: {
            ...selectedCategory,
            range: value,
          },
        };
      });
    }
    handleRemoveCategory();
  };

  const handleClear = () => {
    if (selectedCategory) {
      setSelectedFilters((prev) => {
        return {
          ...prev,
          [selectedCategory.name]: {
            ...selectedCategory,
            range: initialRangeState,
          },
        };
      });
    }
    // handleRemoveCategory();
  };

  return (
    <DateTimeRangePickerStatic
      dateRange={selectedCategory?.range as DateRange}
      setDateRange={handleApplyDateRange}
      handleCancel={handleRemoveCategory}
      handleClear={handleClear}
    />
  );
};

type SelectedCategoryOptionsProps = {
  initialSelection?: Set<string>;
  selectedCategory: FilterCategorySchema;
  handleRemoveCategory: () => void;
  setSelectedFilters: SetState<Record<string, FilterCategorySchema>>;
};

export const SelectedCategoryOptions = ({
  initialSelection = new Set(),
  selectedCategory,
  handleRemoveCategory,
  setSelectedFilters,
}: SelectedCategoryOptionsProps) => {
  const [selectedOptionsSet, setSelectedOptionsSet] = useState<Set<string>>(initialSelection);

  const handleOptionToggle = (value: string) => {
    setSelectedOptionsSet((prev) => {
      const setCopy = new Set(prev);
      if (setCopy.has(value)) setCopy.delete(value);
      else setCopy.add(value);
      return setCopy;
    });
  };

  const handleCancel = () => {
    handleRemoveCategory();
  };

  const handleApply = () => {
    setSelectedFilters((prev) => {
      const newOptions: any = [];
      selectedCategory.options?.forEach((option) => {
        if (selectedOptionsSet.has(option.value)) {
          newOptions.push({ ...option });
        }
      });
      return {
        ...prev,
        [selectedCategory.name]: {
          ...selectedCategory,
          options: newOptions,
        },
      };
    });
    handleRemoveCategory();
  };

  const handleClearOptions = () => {
    setSelectedFilters((prev) => {
      return {
        ...prev,
        [selectedCategory.name]: {
          ...selectedCategory,
          options: [],
        },
      };
    });
    setSelectedOptionsSet(new Set());
  };

  return (
    <>
      <Stack
        direction="row"
        padding="16px"
        justifyContent="flex-start"
        alignItems="center"
        gap="12px"
        borderBottom={`1px solid ${themeConfig.colors.gray200}`}
      >
        <StyledIconCard sx={{ cursor: "pointer" }} onClick={handleCancel}>
          <ChevronLeft
            sx={{
              color: themeConfig.colors.green600,
              fontSize: "20px",
            }}
          />
        </StyledIconCard>
        <p className="text-base font-semibold text-purple-600">Select {selectedCategory.label}</p>
      </Stack>

      <MenuList disablePadding sx={{ paddingBottom: "10px", paddingTop: "4px" }}>
        {selectedCategory?.options?.map((option, i) => (
          <MenuItem
            sx={{
              marginTop: "1px",
              padding: "8px 20px",
              fontSize: "14px",
              lineHeight: "20px",
              fontWeight: 500,
              color: themeConfig.colors.gray900,
            }}
            key={i}
            onClick={() => handleOptionToggle(option.value)}
          >
            <Checkbox
              //@ts-ignore
              sx={{ padding: "0px", marginRight: "8px" }}
              checked={!!selectedOptionsSet.has(option.value)}
            />{" "}
            {option.label}
          </MenuItem>
        ))}

        {!selectedCategory?.options?.length && (
          <Box
            sx={{
              marginY: "10px",
              padding: "9px 24px",
              fontSize: "14px",
              lineHeight: "20px",
              fontWeight: 500,
              color: themeConfig.colors.gray900,
              display: "flex",
              justifyContent: "center",
            }}
          >
            No options available
          </Box>
        )}
      </MenuList>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        borderTop={`1px solid ${themeConfig.colors.gray200}`}
        padding="16px"
      >
        <Button
          variant="text"
          fontColor={themeConfig.colors.success600}
          bgColor={"#0794550a"}
          onClick={handleClearOptions}
        >
          Clear
        </Button>

        <Stack direction="row" justifyContent="flex-end" alignItems="center" gap="12px">
          <Button variant="outlined" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleApply} disabled={!selectedCategory?.options?.length}>
            Apply
          </Button>
        </Stack>
      </Stack>
    </>
  );
};

const SelectCategory = ({ filterOptionsMap, handleSelectCategory }) => {
  return (
    <>
      <Stack
        direction="row"
        padding="16px"
        justifyContent="flex-start"
        alignItems="center"
        gap="12px"
        borderBottom={`1px solid ${themeConfig.colors.gray200}`}
      >
        <StyledIconCard>
          <FilterFunnel />
        </StyledIconCard>
        <p className="text-base font-semibold text-purple-600">Properties</p>
      </Stack>
      <MenuList disablePadding sx={{ paddingBottom: "10px", paddingTop: "4px" }}>
        {Object.keys(filterOptionsMap)?.map((category, i) => (
          <MenuItem
            sx={{
              marginTop: "1px",
              padding: "8px 20px",
              fontSize: "14px",
              lineHeight: "20px",
              fontWeight: 500,
              color: themeConfig.colors.gray900,
            }}
            key={i}
            onClick={() => handleSelectCategory(filterOptionsMap[category])}
          >
            {filterOptionsMap[category].label}
          </MenuItem>
        ))}
      </MenuList>
    </>
  );
};

type AddInstanceFiltersProps = {
  filterOptionsMap: Record<string, FilterCategorySchema>;
  setSelectedFilters: SetState<Record<string, FilterCategorySchema>>;
  selectedFilters: Record<string, FilterCategorySchema>;
};

const AddInstanceFilters = ({ setSelectedFilters, filterOptionsMap, selectedFilters }: AddInstanceFiltersProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<FilterCategorySchema | null>(null);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSelectedCategory(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "instance-filter-popover" : undefined;

  const handleSelectCategory = (category: FilterCategorySchema) => {
    setSelectedCategory(category);
  };

  const handleRemoveCategory = () => {
    setSelectedCategory(null);
  };

  const filterValues = useMemo(() => {
    const result: any[] = [];

    Object.keys(selectedFilters).forEach((category) => {
      const filter = selectedFilters[category];
      if (!filter) return;

      const type = filter.type;
      if (type === "list" && Array.isArray(filter.options) && filter.options.length > 0) {
        filter.options.forEach((option) => {
          result.push({ category, categoryLabel: filter.label, option, type });
        });
      }

      if (type === "date-range" && filter.range?.startDate) {
        result.push({
          category,
          categoryLabel: filter.label,
          range: { startDate: filter.range.startDate, endDate: filter.range.endDate ?? "" },
          type,
        });
      }
    });

    return result;
  }, [selectedFilters]);

  return (
    <>
      <div
        tabIndex={0}
        className={`px-3 py-2 rounded-xl border-2  border-solid  ${anchorEl ? "border-purple-600" : "border-gray-300"} focus:border-purple-600 outline-none  max-w-[470px] relative `}
        onClick={(e) => handleOpen(e)}
        aria-describedby={id}
      >
        {filterValues?.length > 0 && (
          <div
            className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full bg-[#F4F3FF] border-2 border-solid border-[#D9D6FE]"
            style={{
              fontSize: "12px",
              lineHeight: "18px",
              fontWeight: 500,
              color: "#5925DC",
            }}
          >
            {filterValues?.length}
          </div>
        )}
        <div className="flex justify-start items-center gap-2">
          <FilterLinesIcon color={themeConfig.colors.gray700} />
          <p className="text-base font-medium" style={{ color: themeConfig.colors.gray700 }}>
            Add Filter
          </p>
        </div>
      </div>

      <PopoverDynamicHeight
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        sx={{ marginTop: "8px" }}
      >
        <div className="min-w-[470px]">
          {selectedCategory ? (
            <>
              {selectedCategory.type === "list" && (
                <SelectedCategoryOptions
                  selectedCategory={selectedCategory}
                  handleRemoveCategory={handleRemoveCategory}
                  setSelectedFilters={setSelectedFilters}
                  initialSelection={
                    new Set(selectedFilters[selectedCategory.name]?.options?.map((option) => option.value))
                  }
                />
              )}
              {selectedCategory.type === "date-range" && (
                <SelectedCategoryDateTimeRange
                  selectedCategory={selectedFilters[selectedCategory?.name]}
                  handleRemoveCategory={handleRemoveCategory}
                  setSelectedFilters={setSelectedFilters}
                />
              )}
            </>
          ) : (
            <SelectCategory filterOptionsMap={filterOptionsMap} handleSelectCategory={handleSelectCategory} />
          )}
        </div>
      </PopoverDynamicHeight>
    </>
  );
};

export default AddInstanceFilters;

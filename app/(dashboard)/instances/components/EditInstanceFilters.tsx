import { FC, useMemo } from "react";
import { Close } from "@mui/icons-material";
import { Box } from "@mui/material";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import _ from "lodash";

import { initialRangeState } from "src/components/DateRangePicker/DateTimeRangePickerStatic";
import { themeConfig } from "src/themeConfig";
import { SetState } from "src/types/common/reactGenerics";

import { FilterCategorySchema, getIntialFiltersObject } from "../utils";

dayjs.extend(utc);

type FilterChipItemSchema = {
  category: string;
  categoryLabel: string;
  option?: { value: string; label: string };
  range?: { startDate: string; endDate: string };
  type?: "list" | "date-range";
};

type FilterChipTwoProps = {
  item: FilterChipItemSchema;
  handleRemoveItem: (item: FilterChipItemSchema) => void;
};

const FilterChipTwo: FC<FilterChipTwoProps> = ({ item, handleRemoveItem }) => {
  return (
    <Box
      sx={{
        borderRadius: "16px",
        border: `1px solid ${themeConfig.colors.purple600}`,
        padding: "2px 8px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "8px",
        background: themeConfig.colors.purple50,
        color: themeConfig.colors.purple600,
        fontSize: "12px",
        fontWeight: 500,
      }}
    >
      {item.type === "list" && (
        <p className="whitespace-pre-wrap">
          {item.categoryLabel} = {item.option?.label}
        </p>
      )}
      {item.type === "date-range" && (
        <p className="whitespace-pre-wrap">
          {item.categoryLabel} ={" "}
          {dayjs(new Date(item.range?.startDate ?? ""))
            .utc()
            .format("YYYY-MM-DD HH:mm:ss")}{" "}
          UTC to{" "}
          {dayjs(new Date(item.range?.endDate ?? ""))
            .utc()
            .format("YYYY-MM-DD HH:mm:ss")}{" "}
          UTC
        </p>
      )}
      <Close
        onClick={(e) => {
          e.stopPropagation();
          handleRemoveItem(item);
        }}
        sx={{
          cursor: "pointer",
          fontSize: "14px",
        }}
      />
    </Box>
  );
};

type EditInstanceFiltersProps = {
  filterOptionsMap: Record<string, FilterCategorySchema>;
  setSelectedFilters: SetState<Record<string, FilterCategorySchema>>;
  selectedFilters: Record<string, FilterCategorySchema>;
};

const EditInstanceFilters = ({ selectedFilters, setSelectedFilters, filterOptionsMap }: EditInstanceFiltersProps) => {
  const filterValues = useMemo(() => {
    const result: FilterChipItemSchema[] = [];

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

  const handleResetAll = () => {
    setSelectedFilters(getIntialFiltersObject());
  };

  const handleRemoveItem = (item: FilterChipItemSchema) => {
    setSelectedFilters((prev) => {
      const copy = _.clone(prev);
      if (item.type === "list") {
        copy[item.category].options = copy[item.category].options?.filter(
          (option) => option.value !== item.option?.value
        );
      } else if (item.type === "date-range") {
        copy[item.category].range = initialRangeState;
      }
      return copy;
    });
  };

  return (
    <div className="mt-2 flex justify-start items-center gap-2 flex-wrap">
      {filterValues.length > 0
        ? filterValues.map((item, i) => <FilterChipTwo key={i} item={item} handleRemoveItem={handleRemoveItem} />)
        : null}
      <Box
        onClick={handleResetAll}
        sx={{
          padding: "6px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px",
          cursor: "pointer",
          border: `1px solid ${themeConfig.colors.purple600}`,
          color: themeConfig.colors.purple600,
          borderRadius: "999px",
          fontSize: "14px",
          fontWeight: 600,
        }}
      >
        <Close
          sx={{
            fontSize: "20px",
          }}
        />
        Reset Filters
      </Box>

      {/* <PopoverDynamicHeight
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
        {categoryToEdit && (
          <div className="min-w-[470px]">
            {categoryToEdit && selectedFilters[categoryToEdit].type === "list" && (
              <SelectedCategoryOptions
                selectedCategory={filterOptionsMap[categoryToEdit]}
                setSelectedFilters={setSelectedFilters}
                handleRemoveCategory={handleClose}
                initialSelection={new Set(selectedFilters[categoryToEdit].options?.map((option) => option.value))}
              />
            )}

            {categoryToEdit && selectedFilters[categoryToEdit].type === "date-range" && (
              <SelectedCategoryDateTimeRange
                setSelectedFilters={setSelectedFilters}
                handleRemoveCategory={handleClose}
                selectedCategory={selectedFilters[categoryToEdit]}
              />
            )}
          </div>
        )}
      </PopoverDynamicHeight> */}
    </div>
  );
};

export default EditInstanceFilters;

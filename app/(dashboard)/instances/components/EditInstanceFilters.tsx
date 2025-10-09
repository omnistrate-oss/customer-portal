import { FC, useEffect, useMemo, useRef, useState } from "react";
import { Close, ExpandMore } from "@mui/icons-material";
import { Box } from "@mui/material";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import _ from "lodash";

import { initialRangeState } from "src/components/DateRangePicker/DateTimeRangePickerStatic";
import Popover from "src/components/Popover/Popover";
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
        minWidth: "fit-content",
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
  const [visibleChips, setVisibleChips] = useState<FilterChipItemSchema[]>([]);
  const [hiddenChips, setHiddenChips] = useState<FilterChipItemSchema[]>([]);
  const [moreAnchorEl, setMoreAnchorEl] = useState<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<(HTMLDivElement | null)[]>([]);
  const resetButtonRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLDivElement>(null);

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

  // Calculate which chips can fit in one line
  useEffect(() => {
    if (!containerRef.current || filterValues.length === 0) {
      setVisibleChips(filterValues);
      setHiddenChips([]);
      return;
    }

    const calculateVisibleChips = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const resetButtonWidth = resetButtonRef.current?.offsetWidth || 140;
      const moreButtonWidth = moreButtonRef.current?.offsetWidth || 100;
      const gap = 8;

      // Always reserve space for reset button at the end
      const reservedWidth = resetButtonWidth + gap;
      let usedWidth = 0;
      let visibleCount = 0;

      for (let i = 0; i < chipRefs.current.length; i++) {
        const chipElement = chipRefs.current[i];
        if (!chipElement) continue;

        const chipWidth = chipElement.offsetWidth;
        const remainingChips = filterValues.length - i - 1;

        // Calculate space needed: current width + this chip + gap + (more button if needed) + reset button
        let spaceNeeded = usedWidth + chipWidth + gap;

        if (remainingChips > 0) {
          // If there are more chips after this one, we need space for the "more" button
          spaceNeeded += moreButtonWidth + gap;
        }

        spaceNeeded += reservedWidth; // Always need space for reset button

        if (spaceNeeded <= containerWidth) {
          usedWidth += chipWidth + gap;
          visibleCount++;
        } else {
          break;
        }
      }
      setVisibleChips(filterValues.slice(0, visibleCount));
      setHiddenChips(filterValues.slice(visibleCount));
    };

    // Use setTimeout to ensure DOM elements are rendered
    const timer = setTimeout(calculateVisibleChips, 0);

    // Recalculate on window resize
    const handleResize = () => {
      calculateVisibleChips();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [filterValues]);

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

  const handleMoreClick = (event: React.MouseEvent<HTMLElement>) => {
    setMoreAnchorEl(event.currentTarget);
  };

  const handleMoreClose = () => {
    setMoreAnchorEl(null);
  };

  return (
    <div className="mt-2 flex justify-start items-center gap-2 overflow-hidden" ref={containerRef}>
      {/* Hidden div to measure chip widths */}
      <div
        style={{
          position: "absolute",
          visibility: "hidden",
          top: "-9999px",
          display: "flex",
          gap: "8px",
          flexWrap: "nowrap",
        }}
      >
        {filterValues.map((item, i) => (
          <div key={`measure-${i}`} ref={(el) => (chipRefs.current[i] = el)}>
            <FilterChipTwo item={item} handleRemoveItem={handleRemoveItem} />
          </div>
        ))}
        {/* Measure reset button */}
        <Box
          ref={resetButtonRef}
          sx={{
            padding: "6px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            border: `1px solid ${themeConfig.colors.purple600}`,
            color: themeConfig.colors.purple600,
            borderRadius: "999px",
            fontSize: "14px",
            fontWeight: 600,
            minWidth: "fit-content",
          }}
        >
          <Close sx={{ fontSize: "20px" }} />
          Reset Filters
        </Box>

        {/* Measure more button */}
        <Box
          ref={moreButtonRef}
          sx={{
            borderRadius: "16px",
            border: `1px solid ${themeConfig.colors.purple600}`,
            padding: "2px 8px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: themeConfig.colors.purple50,
            color: themeConfig.colors.purple600,
            fontSize: "12px",
            fontWeight: 500,
            minWidth: "fit-content",
          }}
        >
          +99 more
          <ExpandMore sx={{ fontSize: "14px" }} />
        </Box>
      </div>

      {/* Visible chips */}
      {visibleChips.map((item, i) => (
        <FilterChipTwo key={`visible-${i}`} item={item} handleRemoveItem={handleRemoveItem} />
      ))}

      {/* More button */}
      {hiddenChips.length > 0 && (
        <Box
          onClick={handleMoreClick}
          sx={{
            borderRadius: "16px",
            border: `1px solid ${themeConfig.colors.purple600}`,
            padding: "2px 8px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: themeConfig.colors.purple50,
            color: themeConfig.colors.purple600,
            fontSize: "12px",
            fontWeight: 500,
            cursor: "pointer",
            minWidth: "fit-content",
          }}
        >
          +{hiddenChips.length} more
          <ExpandMore sx={{ fontSize: "14px" }} />
        </Box>
      )}

      {/* Reset Filters button */}
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
          minWidth: "fit-content",
        }}
      >
        <Close sx={{ fontSize: "20px" }} />
        Reset Filters
      </Box>

      {/* Popover for hidden chips */}
      <Popover
        open={Boolean(moreAnchorEl)}
        anchorEl={moreAnchorEl}
        onClose={handleMoreClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        sx={{ marginTop: "8px" }}
      >
        <Box
          sx={{
            padding: "16px",
            minWidth: "200px",
            maxWidth: "400px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {hiddenChips.map((item, i) => (
            <FilterChipTwo
              key={`hidden-${i}`}
              item={item}
              handleRemoveItem={(item) => {
                handleRemoveItem(item);
                handleMoreClose();
              }}
              // isInPopover={true}
            />
          ))}
        </Box>
      </Popover>

      {/* {filterValues.length > 0
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
      </Box> */}

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

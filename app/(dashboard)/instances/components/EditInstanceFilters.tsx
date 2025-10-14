import { FC, useEffect, useMemo, useRef, useState } from "react";
import { Close } from "@mui/icons-material";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
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
  customTagOption?: { key: string; value: string };
  type?: "list" | "date-range" | "custom-tags";
};

type FilterChipTwoProps = {
  item: FilterChipItemSchema;
  handleRemoveItem: (item: FilterChipItemSchema) => void;
};

const FilterChipTwo: FC<FilterChipTwoProps> = ({ item, handleRemoveItem }) => {
  const [showTitle, setShowTitle] = useState<boolean>(false);
  const textRef = useRef<HTMLDivElement>(null);

  const getDisplayText = (): string => {
    if (item.type === "list") {
      return `${item.categoryLabel} = ${item.option?.label}`;
    }
    if (item.type === "date-range") {
      return `${item.categoryLabel} = ${dayjs(new Date(item.range?.startDate ?? ""))
        .utc()
        .format("YYYY-MM-DD HH:mm:ss")} UTC to ${dayjs(new Date(item.range?.endDate ?? ""))
        .utc()
        .format("YYYY-MM-DD HH:mm:ss")} UTC`;
    }

    if (item.type === "custom-tags") {
      return `${item.categoryLabel} = ${item.customTagOption?.key}:${item.customTagOption?.value}`;
    }
    return "";
  };

  useEffect(() => {
    if (textRef.current) {
      const isOverflowing = textRef.current.scrollWidth > textRef.current.clientWidth;
      setShowTitle(isOverflowing);
    }
  }, [item]);

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
      <p
        className="whitespace-pre-wrap"
        style={{ maxWidth: "320px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        ref={textRef}
        title={showTitle ? getDisplayText() : ""}
      >
        {getDisplayText()}
      </p>
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
  // filterOptionsMap: Record<string, FilterCategorySchema>;
  setSelectedFilters: SetState<Record<string, FilterCategorySchema>>;
  selectedFilters: Record<string, FilterCategorySchema>;
};

const EditInstanceFilters = ({ selectedFilters, setSelectedFilters }: EditInstanceFiltersProps) => {
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

      if (type === "custom-tags" && filter.customTagOptions?.size) {
        Array.from(filter.customTagOptions.entries()).forEach(([key, values]) => {
          values.forEach((value) => {
            result.push({
              category,
              categoryLabel: filter.label,
              customTagOption: { key, value },
              type,
            });
          });
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

      // Start with space reserved for reset button
      let availableWidth = containerWidth - resetButtonWidth - gap;
      let visibleCount = 0;

      for (let i = 0; i < chipRefs.current.length; i++) {
        const chipElement = chipRefs.current[i];
        if (!chipElement) continue;

        const chipWidth = chipElement.offsetWidth;
        const hasMoreChips = i < filterValues.length - 1;

        // Space needed for this chip + gap + (more button if there are remaining chips)
        const spaceNeeded = chipWidth + gap + (hasMoreChips ? moreButtonWidth + gap : 0);

        if (spaceNeeded <= availableWidth) {
          availableWidth -= chipWidth + gap;
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
      } else if (item.type === "custom-tags" && item.customTagOption) {
        const { key, value } = item.customTagOption;
        const existingSet = copy[item.category].customTagOptions?.get(key);
        if (existingSet) {
          existingSet.delete(value);
          if (existingSet.size === 0) {
            copy[item.category].customTagOptions?.delete(key);
          } else {
            copy[item.category].customTagOptions?.set(key, existingSet);
          }
        }
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

  // Add this useEffect after the existing useEffects
  useEffect(() => {
    // Auto-close popover when no hidden chips remain
    if (hiddenChips.length === 0 && moreAnchorEl) {
      handleMoreClose();
    }
  }, [hiddenChips.length, moreAnchorEl]);

  return (
    <div className="flex justify-start items-center gap-2 overflow-hidden" ref={containerRef}>
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
          <div
            key={`measure-${i}`}
            ref={(el) => {
              chipRefs.current[i] = el;
            }}
            style={{ minWidth: "fit-content" }}
          >
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
            cursor: "pointer",
            color: themeConfig.colors.purple600,
          }}
        >
          <KeyboardDoubleArrowRightIcon />
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
            cursor: "pointer",
            color: themeConfig.colors.purple600,
          }}
        >
          <KeyboardDoubleArrowRightIcon />
        </Box>
      )}

      {/* Reset Filters button */}
      {filterValues.length > 0 && (
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
      )}

      {/* Popover for hidden chips */}
      <Popover
        open={Boolean(moreAnchorEl)}
        anchorEl={moreAnchorEl}
        onClose={handleMoreClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        sx={{ marginTop: "8px" }}
      >
        <Box
          sx={{
            padding: "16px",
            minWidth: "200px",
            maxWidth: "500px",
            maxHeight: "400px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {hiddenChips.map((item, i) => (
            <FilterChipTwo
              key={`hidden-${i}`}
              item={item}
              handleRemoveItem={(item) => {
                handleRemoveItem(item);
              }}
            />
          ))}
        </Box>
      </Popover>
    </div>
  );
};

export default EditInstanceFilters;

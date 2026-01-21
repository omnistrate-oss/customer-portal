import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Close } from "@mui/icons-material";
import { Box, IconButton } from "@mui/material";
import { useFormik } from "formik";

import { getISOStringfromDateAndTime } from "src/components/DateRangePicker/utils";

import Button from "../Button/Button";
import FilterLinesIcon from "../Icons/FilterLines/FilterLines";
import { PopoverDynamicHeight } from "../Popover/Popover";
import { Text } from "../Typography/Typography";

import ActiveFilterChip, { MoreChip } from "./components/ActiveFilterChip";
import FilterOptionsDateRange from "./components/FilterOptionsDateRange";
import FilterOptionsKeyValue from "./components/FilterOptionsKeyValue";
import FilterOptionsMultiSelect from "./components/FilterOptionsMultiSelect";
import LeftMenu from "./components/LeftMenu";
import { timeValidationSchema } from "./constants";
import { AppliedFilters, DataGridFilterProps, DateRangeType } from "./types";
import { filterData, formatDateRangeChipLabel, getFilterCount, parseDateRangeValues } from "./utils";

type FilterChipData = {
  filterKey: string;
  filterLabel: string;
  value: string;
  valueLabel: string;
};

const DataGridFilter = <T,>({ filterConfig, data, setFilteredData }: DataGridFilterProps<T>) => {
  const [filterKeys, filterConfigArr] = useMemo(() => {
    const keys = Object.keys(filterConfig);
    const arr = Object.entries(filterConfig);
    return [keys, arr];
  }, [filterConfig]);

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({});
  const [pendingFilters, setPendingFilters] = useState<AppliedFilters>({});
  const [activeFilterView, setActiveFilterView] = useState<string>(filterKeys[0] || "");

  const [visibleChipCount, setVisibleChipCount] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const chipsContainerRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<(HTMLDivElement | null)[]>([]);
  const moreChipRef = useRef<HTMLDivElement>(null);

  const [dateRangeTab, setDateRangeTab] = useState<DateRangeType>("relative");
  const [relativeValue, setRelativeValue] = useState<number | null>(null);

  const dateRangeFormik = useFormik({
    initialValues: parseDateRangeValues(appliedFilters[activeFilterView] || []),
    enableReinitialize: true,
    validationSchema: timeValidationSchema,
    onSubmit: (values) => {
      const currentConfig = filterConfig[activeFilterView];
      if (currentConfig?.filterType !== "date-range") return;

      let dateRangeValues: string[] = [];

      if (dateRangeTab === "relative") {
        if (relativeValue !== null) {
          dateRangeValues = ["relative", String(relativeValue)];
        }
      } else {
        const { startDate, endDate, startTime, endTime } = values;

        if (startDate || endDate) {
          const startDateTime = startDate ? getISOStringfromDateAndTime(startDate, startTime) : undefined;
          const endDateTime = endDate ? getISOStringfromDateAndTime(endDate, endTime) : undefined;

          if (startDateTime || endDateTime) {
            dateRangeValues = ["absolute"];
            if (startDateTime) dateRangeValues.push(startDateTime);
            else if (endDateTime) dateRangeValues.push("");

            if (endDateTime) dateRangeValues.push(endDateTime);
          }
        }
      }

      const finalPendingFilters = {
        ...pendingFilters,
        [activeFilterView]: dateRangeValues,
      };

      setAppliedFilters(finalPendingFilters);
      setPendingFilters(finalPendingFilters);
      setAnchorEl(null);
    },
  });

  useEffect(() => {
    const filtered = filterData(data, appliedFilters, filterConfig);
    setFilteredData(filtered);
  }, [data, appliedFilters, filterConfig, setFilteredData]);

  useEffect(() => {
    const currentConfig = filterConfig[activeFilterView];
    if (currentConfig?.filterType === "date-range") {
      const parsed = parseDateRangeValues(appliedFilters[activeFilterView] || []);
      setDateRangeTab(parsed.tab);
      setRelativeValue(parsed.relativeValue);
    }
  }, [appliedFilters, activeFilterView, filterConfig]);

  const filterChips = useMemo<FilterChipData[]>(() => {
    const chips: FilterChipData[] = [];

    Object.entries(appliedFilters).forEach(([filterKey, values]) => {
      const config = filterConfig[filterKey];
      if (!config || values.length === 0) return;

      if (config.filterType === "date-range") {
        const valueLabel = formatDateRangeChipLabel(values);
        if (valueLabel) {
          chips.push({
            filterKey,
            filterLabel: config.leftMenuLabel,
            value: filterKey,
            valueLabel,
          });
        }
      } else {
        values.forEach((value) => {
          const option = config.options?.find((opt) => opt.value === value);
          chips.push({
            filterKey,
            filterLabel: config.leftMenuLabel,
            value,
            valueLabel: option?.label || value,
          });
        });
      }
    });

    return chips;
  }, [appliedFilters, filterConfig]);

  const hasFilters = filterChips.length > 0;
  const hiddenChipCount = filterChips.length - visibleChipCount;
  const filterChipsLength = filterChips.length;

  useLayoutEffect(() => {
    if (!containerRef.current || filterChipsLength === 0) {
      setVisibleChipCount(filterChipsLength);
      return;
    }

    const calculateVisibleChips = () => {
      if (!containerRef.current || !chipsContainerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const iconsWidth = 60;
      const gap = 8;
      const moreChipWidth = moreChipRef.current?.offsetWidth || 80;

      let availableWidth = containerWidth - iconsWidth - 24;
      let count = 0;

      for (let i = 0; i < chipRefs.current.length; i++) {
        const chipEl = chipRefs.current[i];
        if (!chipEl) continue;

        const chipWidth = chipEl.offsetWidth;
        const hasMoreChips = i < filterChipsLength - 1;

        const spaceNeeded = chipWidth + gap + (hasMoreChips ? moreChipWidth + gap : 0);

        if (spaceNeeded <= availableWidth) {
          availableWidth -= chipWidth + gap;
          count++;
        } else {
          break;
        }
      }

      setVisibleChipCount(count);
    };

    calculateVisibleChips();
    window.addEventListener("resize", calculateVisibleChips);
    return () => window.removeEventListener("resize", calculateVisibleChips);
  }, [filterChipsLength]);

  const leftMenuOptions = useMemo(
    () =>
      filterConfigArr.map(([key, filter]) => ({
        filterKey: key,
        label: filter.leftMenuLabel,
        count: getFilterCount(appliedFilters, key, filterConfig),
      })),
    [filterConfigArr, appliedFilters, filterConfig]
  );

  const onCancel = useCallback(() => {
    setPendingFilters(appliedFilters);
    const currentConfig = filterConfig[activeFilterView];
    if (currentConfig?.filterType === "date-range") {
      const parsed = parseDateRangeValues(appliedFilters[activeFilterView] || []);
      setDateRangeTab(parsed.tab);
      setRelativeValue(parsed.relativeValue);
      dateRangeFormik.resetForm({ values: parsed });
    }
    setAnchorEl(null);
  }, [appliedFilters, filterConfig, activeFilterView, dateRangeFormik]);

  const onApply = useCallback(() => {
    const currentConfig = filterConfig[activeFilterView];

    if (currentConfig?.filterType === "date-range") {
      dateRangeFormik.handleSubmit();
      return;
    }

    const finalPendingFilters = { ...pendingFilters };
    setAppliedFilters(finalPendingFilters);
    setPendingFilters(finalPendingFilters);
    setAnchorEl(null);
  }, [pendingFilters, filterConfig, activeFilterView, dateRangeFormik]);

  const onClearAll = useCallback(() => {
    setAppliedFilters({});
    setPendingFilters({});
  }, []);

  const handlePendingFilterChange = useCallback((filterKey: string, values: string[]) => {
    setPendingFilters((prev) => ({
      ...prev,
      [filterKey]: values,
    }));
  }, []);

  const handleRemoveChip = useCallback(
    (chip: FilterChipData) => {
      const updateFilters = (prev: AppliedFilters) => {
        const newFilters = { ...prev };
        const config = filterConfig[chip.filterKey];

        if (config?.filterType === "date-range") {
          newFilters[chip.filterKey] = [];
        } else {
          newFilters[chip.filterKey] = prev[chip.filterKey]?.filter((v) => v !== chip.value) || [];
        }

        return newFilters;
      };

      setAppliedFilters(updateFilters);
      setPendingFilters(updateFilters);
    },
    [filterConfig]
  );

  const activeConfig = filterConfig[activeFilterView];
  const visibleChips = filterChips.slice(0, visibleChipCount);

  return (
    <>
      {/* Hidden measurement container for chips */}
      <Box
        sx={{
          position: "fixed",
          visibility: "hidden",
          top: "-9999px",
          display: "flex",
          gap: "8px",
          flexWrap: "nowrap",
        }}
      >
        {filterChips.map((chip, i) => (
          <Box
            key={`measure-${i}`}
            ref={(el: HTMLDivElement | null) => {
              chipRefs.current[i] = el;
            }}
          >
            <ActiveFilterChip label={`${chip.filterLabel}: ${chip.valueLabel}`} onRemove={() => {}} />
          </Box>
        ))}
        <Box ref={moreChipRef}>
          <MoreChip count={99} />
        </Box>
      </Box>

      <Box
        ref={containerRef}
        display="flex"
        alignItems="center"
        gap="8px"
        border="1px solid #D5D7DA"
        boxShadow="0 1px 2px 0 #0A0D120D"
        width={hasFilters ? "100%" : "480px"}
        maxWidth="565px"
        borderRadius="100px"
        padding={hasFilters ? "5px 12px" : "6px 12px"}
        sx={{ cursor: "pointer" }}
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        {!hasFilters ? (
          <Text size="medium" weight="regular" color="#717680" sx={{ flex: 1 }}>
            Filter
          </Text>
        ) : (
          <Box ref={chipsContainerRef} display="flex" alignItems="center" gap="8px" flex={1} overflow="hidden">
            {visibleChips.map((chip, i) => (
              <ActiveFilterChip
                key={`${chip.filterKey}-${chip.value}-${i}`}
                label={`${chip.filterLabel}: ${chip.valueLabel}`}
                onRemove={() => handleRemoveChip(chip)}
              />
            ))}
            {hiddenChipCount > 0 && <MoreChip count={hiddenChipCount} />}
          </Box>
        )}

        <Box display="flex" alignItems="center" gap="4px" flexShrink={0}>
          <FilterLinesIcon />
          {hasFilters && (
            <IconButton
              size="small"
              sx={{ p: 0.5 }}
              onClick={(e) => {
                e.stopPropagation();
                onClearAll();
              }}
            >
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          )}
        </Box>
      </Box>

      <PopoverDynamicHeight
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        sx={{ marginTop: "8px" }}
      >
        <Box width="828px">
          <Box display="flex" height="414px">
            <Box width="360px" p="16px" overflow="auto" borderRight="2px solid #E9EAEB">
              <LeftMenu
                options={leftMenuOptions}
                activeFilterView={activeFilterView}
                setActiveFilterView={setActiveFilterView}
              />
            </Box>

            <Box flex="1" p="16px" overflow="auto">
              {activeConfig?.filterType === "multi-select" && (
                <FilterOptionsMultiSelect
                  options={activeConfig.options || []}
                  selectedValues={pendingFilters[activeFilterView] || []}
                  onChange={(newValues) => handlePendingFilterChange(activeFilterView, newValues)}
                />
              )}
              {activeConfig?.filterType === "key-value" && (
                <FilterOptionsKeyValue
                  keys={activeConfig.keys || []}
                  selectedValues={pendingFilters[activeFilterView] || []}
                  onChange={(newValues) => handlePendingFilterChange(activeFilterView, newValues)}
                />
              )}
              {activeConfig?.filterType === "date-range" && (
                <FilterOptionsDateRange
                  tab={dateRangeTab}
                  onTabChange={setDateRangeTab}
                  relativeValue={relativeValue}
                  onRelativeValueChange={setRelativeValue}
                  dateRangeFormik={dateRangeFormik}
                />
              )}
            </Box>
          </Box>

          <Box
            mx="20px"
            py="20px"
            borderTop="2px solid #E9EAEB"
            display="flex"
            justifyContent="flex-end"
            alignItems="center"
            gap="12px"
          >
            <Button variant="outlined" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="contained" onClick={onApply}>
              Apply
            </Button>
          </Box>
        </Box>
      </PopoverDynamicHeight>
    </>
  );
};

export default DataGridFilter;

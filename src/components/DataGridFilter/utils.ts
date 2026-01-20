import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { getLocalStartOfDayfromISODateString } from "src/components/DateRangePicker/utils";
import { formatDateMMM_DD_YYYY } from "src/utils/date-utils";

import { relativeRangeOptions } from "./components/RelativeRangeView";
import { AppliedFilters, DateRangeType, FilterConfig, FilterOption, PropertyAccessor } from "./types";

dayjs.extend(utc);

export const getNestedValue = <T>(obj: T, path: string): unknown =>
  path.split(".").reduce((current: unknown, key: string) => {
    if (current === null || current === undefined) return undefined;
    return (current as Record<string, unknown>)[key];
  }, obj);

export const resolveAccessor = <T>(item: T, accessor: PropertyAccessor<T>): unknown => {
  if (typeof accessor === "function") return accessor(item);
  return getNestedValue(item, accessor);
};

export const defaultMultiSelectFilter = <T>(
  item: T,
  selectedValues: string[],
  accessor: PropertyAccessor<T>
): boolean => {
  if (selectedValues.length === 0) return true;

  const valueSet = new Set(selectedValues);
  const itemValue = resolveAccessor(item, accessor);

  if (Array.isArray(itemValue)) {
    return itemValue.some((v) => valueSet.has(String(v)));
  }

  return valueSet.has(String(itemValue ?? ""));
};

const defaultDateRangeFilter = <T>(item: T, selectedValues: string[], accessor: PropertyAccessor<T>): boolean => {
  if (selectedValues.length === 0) return true;

  const rangeType = selectedValues[0] as DateRangeType;
  const itemDateValue = resolveAccessor(item, accessor);

  if (!itemDateValue) return false;

  const itemDate = new Date(String(itemDateValue));
  if (isNaN(itemDate.getTime())) return false;

  if (rangeType === "relative") {
    const milliseconds = parseInt(selectedValues[1], 10);
    if (isNaN(milliseconds)) return false;

    const now = new Date();
    const startDate = new Date(now.getTime() - milliseconds);

    return itemDate >= startDate && itemDate <= now;
  }

  if (rangeType === "absolute") {
    const startDateStr = selectedValues[1];
    const endDateStr = selectedValues[2];

    if (startDateStr && endDateStr) {
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);
      return itemDate >= startDate && itemDate <= endDate;
    }

    if (startDateStr) {
      const startDate = new Date(startDateStr);
      return itemDate >= startDate;
    }

    if (endDateStr) {
      const endDate = new Date(endDateStr);
      return itemDate <= endDate;
    }
  }

  return true;
};

export const filterData = <T>(data: T[], appliedFilters: AppliedFilters, filterConfig: FilterConfig<T>): T[] => {
  const hasActiveFilters = Object.values(appliedFilters).some((values) => values.length > 0);
  if (!hasActiveFilters) return data;

  return data.filter((item) =>
    Object.entries(appliedFilters).every(([filterKey, selectedValues]) => {
      if (selectedValues.length === 0) return true;

      const config = filterConfig[filterKey];
      if (!config) return true;

      if (config.customFilter) {
        return config.customFilter(item, selectedValues);
      }

      if (config.filterType === "multi-select") {
        if (!config.accessor) {
          console.warn(`Filter "${filterKey}" is missing accessor`);
          return true;
        }
        return defaultMultiSelectFilter(item, selectedValues, config.accessor);
      }

      if (config.filterType === "date-range") {
        if (!config.accessor) {
          console.warn(`Filter "${filterKey}" is missing accessor`);
          return true;
        }
        return defaultDateRangeFilter(item, selectedValues, config.accessor);
      }

      if (config.filterType === "key-value" && !config.customFilter) {
        console.warn(`Filter "${filterKey}" is key-value type but missing customFilter`);
      }

      return true;
    })
  );
};

export const getFilterCount = (
  appliedFilters: AppliedFilters,
  filterKey: string,
  filterConfig?: FilterConfig
): number => {
  const values = appliedFilters[filterKey];
  if (!values || values.length === 0) return 0;

  if (filterConfig && filterConfig[filterKey]?.filterType === "date-range") {
    return 1;
  }

  return values.length;
};

export const deriveOptionsFromData = <T>(
  data: T[],
  accessor: PropertyAccessor<T>,
  labelFormatter?: (value: string) => string
): FilterOption[] => {
  const uniqueValues = new Set<string>();

  data.forEach((item) => {
    const value = resolveAccessor(item, accessor);
    if (value !== null && value !== undefined && value !== "") {
      uniqueValues.add(String(value));
    }
  });

  return Array.from(uniqueValues)
    .sort()
    .map((value) => ({
      value,
      label: labelFormatter ? labelFormatter(value) : value,
    }));
};

export const parseDateRangeValues = (values: string[]) => {
  if (values.length === 0) {
    return {
      tab: "relative" as DateRangeType,
      startDate: undefined,
      endDate: undefined,
      startTime: "00:00:00",
      endTime: "23:59:59",
      relativeValue: null,
    };
  }

  const rangeType = values[0] as DateRangeType;

  if (rangeType === "relative") {
    return {
      tab: "relative" as DateRangeType,
      startDate: undefined,
      endDate: undefined,
      startTime: "00:00:00",
      endTime: "23:59:59",
      relativeValue: values[1] ? parseInt(values[1], 10) : null,
    };
  }

  if (rangeType === "absolute") {
    const startDateStr = values[1];
    const endDateStr = values[2];
    return {
      tab: "absolute" as DateRangeType,
      startDate: startDateStr ? getLocalStartOfDayfromISODateString(startDateStr) : undefined,
      endDate: endDateStr ? getLocalStartOfDayfromISODateString(endDateStr) : undefined,
      startTime: startDateStr ? dayjs(new Date(startDateStr)).utc().format("HH:mm:ss") : "00:00:00",
      endTime: endDateStr ? dayjs(new Date(endDateStr)).utc().format("HH:mm:ss") : "23:59:59",
      relativeValue: null,
    };
  }

  return {
    tab: "relative" as DateRangeType,
    startDate: undefined,
    endDate: undefined,
    startTime: "00:00:00",
    endTime: "23:59:59",
    relativeValue: null,
  };
};

export const formatDateRangeChipLabel = (values: string[]): string => {
  if (values.length === 0) return "";

  const rangeType = values[0] as DateRangeType;

  if (rangeType === "relative") {
    const milliseconds = parseInt(values[1], 10);

    const relativeLabels: Record<number, string> = relativeRangeOptions.reduce(
      (acc, option) => {
        acc[option.value] = option.label;
        return acc;
      },
      {} as Record<number, string>
    );

    return relativeLabels[milliseconds] || "Custom range";
  }

  if (rangeType === "absolute") {
    const startDate = values[1];
    const endDate = values[2];

    if (!startDate && !endDate) return "Any time";
    if (!startDate) return `Before ${formatDateMMM_DD_YYYY(endDate)}`;
    if (!endDate) return `After ${formatDateMMM_DD_YYYY(startDate)}`;

    return `${formatDateMMM_DD_YYYY(startDate)} - ${formatDateMMM_DD_YYYY(endDate)}`;
  }

  return "";
};

import { SetState } from "src/types/common/reactGenerics";

export type PropertyAccessor<T> = string | ((item: T) => unknown);

export type FilterOption = {
  label: string;
  value: string;
};

export type DateRangeType = "absolute" | "relative";

export type KeyConfig = {
  key: string;
  label: string;
  possibleValues: FilterOption[];
};

export type FilterConfigItem<T = unknown> = {
  leftMenuLabel: string;
  filterType: "multi-select" | "key-value" | "date-range";
  options?: FilterOption[];
  keys?: KeyConfig[];
  accessor?: PropertyAccessor<T>;
  customFilter?: (item: T, selectedValues: string[]) => boolean;
};

export type FilterConfig<T = unknown> = Record<string, FilterConfigItem<T>>;

export type AppliedFilters = Record<string, string[]>;

export type DataGridFilterProps<T> = {
  filterConfig: FilterConfig<T>;
  data: T[];
  setFilteredData: SetState<T[]>;
};

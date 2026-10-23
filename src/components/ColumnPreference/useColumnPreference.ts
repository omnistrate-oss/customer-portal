import { useCallback, useMemo, useSyncExternalStore } from "react";
import { GridColDef, GridColumnVisibilityModel, GridValidRowModel } from "@mui/x-data-grid";
import { ColumnDef } from "@tanstack/react-table";
import { useSelector } from "react-redux";

import { selectUserrootData } from "src/slices/userDataSlice";

import {
  ColumnKind,
  ColumnLayout,
  getColumnLayoutKey,
  parseColumnLayout,
  readStoredColumnLayout,
  resolveColumnLayout,
  subscribeToStoredColumnLayouts,
  toStoredColumnLayout,
  writeStoredColumnLayout,
} from "./columnLayout";
import type { ColumnPreferenceButtonProps, ColumnPreferenceItem } from "./ColumnPreferenceButton";
import { ColumnPreferenceTableId } from "./tableIds";

type ColumnPreferenceOptions<TColumn> = {
  tableId: ColumnPreferenceTableId;
  columns: readonly TColumn[];
  getColumnId: (column: TColumn) => string;
  getColumnLabel: (column: TColumn) => string | undefined;
  /** The column that opens the row. It keeps its slot and can't be hidden. */
  primaryColumnId?: string;
  /** Columns with links or actions. They can move but can't be hidden. */
  clickableColumnIds?: readonly string[];
};

type ColumnPreferenceResult<TColumn> = {
  orderedColumns: TColumn[];
  visibleColumns: TColumn[];
  hiddenColumnIds: string[];
  columnPreference: ColumnPreferenceButtonProps;
};

type AdapterOptions<TColumn> = Omit<ColumnPreferenceOptions<TColumn>, "getColumnId" | "getColumnLabel">;

const getColumnKind = (id: string, label: string, primaryColumnId: string | undefined, clickableIds: Set<string>) => {
  if (!label) return "utility";
  if (id === primaryColumnId) return "primary";
  return clickableIds.has(id) ? "locked" : "optional";
};

const readServerSnapshot = (): string | null => null;

/**
 * Applies the signed-in user's saved column order and visibility to `columns`. Pass `getColumnId` and
 * `getColumnLabel` as module-level functions so the results stay memoized. Columns without a label aren't listed.
 *
 * Saved `{ order: ["role", "name"], hidden: ["role"] }` for columns [id (primary), name, role]
 * → orderedColumns [id, role, name], visibleColumns [id, name], hiddenColumnIds ["role"]
 */
export const useColumnPreference = <TColumn>({
  tableId,
  columns,
  getColumnId,
  getColumnLabel,
  primaryColumnId,
  clickableColumnIds = [],
}: ColumnPreferenceOptions<TColumn>): ColumnPreferenceResult<TColumn> => {
  const userId = useSelector(selectUserrootData).id;
  const storageKey = userId ? getColumnLayoutKey(userId, tableId) : null;
  const stored = useSyncExternalStore(
    subscribeToStoredColumnLayouts,
    () => (storageKey ? readStoredColumnLayout(storageKey) : null),
    readServerSnapshot
  );
  // A string key keeps the memo stable when callers pass an inline array.
  const clickableKey = clickableColumnIds.join("\n");

  const entries = useMemo(() => {
    const clickableIds = new Set(clickableKey.split("\n"));
    return columns.map((column) => {
      const id = getColumnId(column);
      const label = getColumnLabel(column)?.trim() ?? "";
      const kind: ColumnKind = getColumnKind(id, label, primaryColumnId, clickableIds);
      return { id, label, kind, column };
    });
  }, [columns, getColumnId, getColumnLabel, primaryColumnId, clickableKey]);

  const saved = useMemo(() => parseColumnLayout(stored), [stored]);
  const { layout, orderedIds } = useMemo(() => resolveColumnLayout(entries, saved), [entries, saved]);
  const defaultLayout = useMemo(() => resolveColumnLayout(entries, null).layout, [entries]);

  const orderedColumns = useMemo(() => {
    const columnById = new Map(entries.map((entry) => [entry.id, entry.column]));
    return orderedIds.flatMap((id) => {
      const column = columnById.get(id);
      return column === undefined ? [] : [column];
    });
  }, [entries, orderedIds]);

  const visibleColumns = useMemo(() => {
    const hiddenIds = new Set(layout.hidden);
    return orderedColumns.filter((column) => !hiddenIds.has(getColumnId(column)));
  }, [orderedColumns, layout.hidden, getColumnId]);

  const items = useMemo(
    () =>
      entries.flatMap(({ id, label, kind }): ColumnPreferenceItem[] =>
        kind === "utility" ? [] : [{ id, label, kind }]
      ),
    [entries]
  );

  const onSave = useCallback(
    (next: ColumnLayout) => {
      if (storageKey) writeStoredColumnLayout(storageKey, toStoredColumnLayout(next, defaultLayout, saved));
    },
    [storageKey, defaultLayout, saved]
  );

  const columnPreference = useMemo(
    (): ColumnPreferenceButtonProps => ({ tableId, items, layout, defaultLayout, onSave, disabled: !storageKey }),
    [tableId, items, layout, defaultLayout, onSave, storageKey]
  );

  return { orderedColumns, visibleColumns, hiddenColumnIds: layout.hidden, columnPreference };
};

const getGridColumnId = (column: GridColDef): string => column.field;
const getGridColumnLabel = (column: GridColDef): string | undefined => column.headerName;

/**
 * Column Preference for the DataGrid wrapper. Pass `columns` and `columnVisibilityModel` to the grid and
 * `columnPreference` to `ColumnPreferenceButton`. Hidden columns stay in `columns`, so sorting by them keeps working.
 */
export const useGridColumnPreference = <TRow extends GridValidRowModel>(
  options: AdapterOptions<GridColDef<TRow>>
): {
  columns: GridColDef<TRow>[];
  columnVisibilityModel: GridColumnVisibilityModel;
  columnPreference: ColumnPreferenceButtonProps;
} => {
  const { orderedColumns, hiddenColumnIds, columnPreference } = useColumnPreference<GridColDef<TRow>>({
    ...options,
    getColumnId: getGridColumnId,
    getColumnLabel: getGridColumnLabel,
  });
  const columnVisibilityModel = useMemo(
    (): GridColumnVisibilityModel => Object.fromEntries(hiddenColumnIds.map((id) => [id, false])),
    [hiddenColumnIds]
  );
  return { columns: orderedColumns, columnVisibilityModel, columnPreference };
};

// The same id table-core gives a column: its id, then its accessorKey with dots replaced, then a string header.
const getTableColumnId = <TData>(column: ColumnDef<TData>): string => {
  const accessorKey = "accessorKey" in column ? String(column.accessorKey) : "";
  const headerId = typeof column.header === "string" ? column.header : "";
  return column.id ?? (accessorKey ? accessorKey.replace(/\./g, "_") : undefined) ?? headerId;
};

const getTableColumnLabel = <TData>(column: ColumnDef<TData>): string | undefined => {
  if (typeof column.header === "string") return column.header;
  const label: unknown = column.meta && "label" in column.meta ? column.meta.label : undefined;
  return typeof label === "string" ? label : undefined;
};

/**
 * Column Preference for DataTable and CursorPaginatedDataTable. Returns the visible columns in the saved order,
 * because DataTable sizes columns from its `columns` prop. A column whose header is a function needs `meta.label`.
 */
export const useTableColumnPreference = <TData>(
  options: AdapterOptions<ColumnDef<TData>>
): { columns: ColumnDef<TData>[]; columnPreference: ColumnPreferenceButtonProps } => {
  const { visibleColumns, columnPreference } = useColumnPreference<ColumnDef<TData>>({
    ...options,
    getColumnId: getTableColumnId,
    getColumnLabel: getTableColumnLabel,
  });
  return { columns: visibleColumns, columnPreference };
};

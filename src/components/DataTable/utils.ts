import { ColumnDef } from "@tanstack/react-table";

/**
 * The id table-core gives a column: its id, then its accessorKey with dots replaced, then a string header.
 *
 * getColumnId({ accessorKey: "owner.name", header: "Owner" }) → "owner_name"
 */
export const getColumnId = <TData, TValue>(column: ColumnDef<TData, TValue>): string => {
  const accessorKey = "accessorKey" in column ? String(column.accessorKey) : "";
  const headerId = typeof column.header === "string" ? column.header : "";
  return column.id ?? (accessorKey ? accessorKey.replace(/\./g, "_") : undefined) ?? headerId;
};

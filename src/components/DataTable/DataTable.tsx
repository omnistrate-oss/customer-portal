import React, { FC, ReactNode, useMemo, useState } from "react";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import { Box, CircularProgress, Stack } from "@mui/material";
import {
  ColumnDef,
  ExpandedState,
  Row,
  RowData,
  SortDirection,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  TableContainer,
  DetailViewTableRow,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "./components/styled";
import Pagination from "./components/Pagination";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CustomCheckbox from "../Checkbox/Checkbox";

const sortIcon = {
  asc: ArrowUpwardIcon,
  desc: ArrowDownwardIcon,
};

type SortIconProps = {
  sortDirection: SortDirection | false;
};

const SortIcon: React.FC<SortIconProps> = (props) => {
  const { sortDirection } = props;

  let Icon = ArrowUpwardIcon;

  if (sortDirection) {
    Icon = sortIcon[sortDirection];
  }

  //if sort direction is available, then icon needs to be shown with darker color
  return (
    <IconButton size="small">
      <Icon
        sx={{
          fontSize: "18px",
          color: sortDirection ? "rgba(0,0,0,0.54)" : "rgba(0,0,0,0.27)",
        }}
      />
    </IconButton>
  );
};

type SelectionMode = "single" | "multiple" | "none";

type DataTableProps<TData> = {
  rows: TData[];
  columns: ColumnDef<TData>[];
  renderDetailsComponent?: (props: { rowData: TData }) => ReactNode;
  noRowsText: string;
  isLoading?: boolean;
  getRowCanExpand?: (rowData: Row<TData>) => boolean;
  getSubRows?: (orginalRow: TData) => TData[];
  HeaderComponent: FC;
  headerProps: any;

  // Row Selection Props
  selectionMode?: SelectionMode;
  selectedRows?: string[];
  onRowSelectionChange?: (selectedRows: string[]) => void;
  rowId?: keyof TData; // Property to use as row identifier
};

const DEFAULT_COLUMN_MIN_WIDTH = 150;

const DataTable = <TData,>(props: DataTableProps<TData>): ReactNode => {
  const {
    columns,
    rows,
    renderDetailsComponent,
    noRowsText,
    isLoading,
    getRowCanExpand = () => true,
    HeaderComponent,
    headerProps = {},
    getSubRows,
    selectedRows = [],
    onRowSelectionChange,
    selectionMode = "none",
    rowId = "id" as keyof TData,
  } = props;

  const [expanded, setExpanded] = useState<ExpandedState>({});

  const allColumns = useMemo(() => {
    if (selectionMode === "none") return columns;

    const handleSelectionChange = (rowIdValue: string) => {
      if (!onRowSelectionChange) return;

      if (selectionMode === "single") {
        if (selectedRows.includes(rowIdValue)) {
          onRowSelectionChange([]);
        } else {
          onRowSelectionChange([rowIdValue]);
        }
      } else if (selectionMode === "multiple") {
        if (selectedRows.includes(rowIdValue)) {
          onRowSelectionChange(selectedRows.filter((id) => id !== rowIdValue));
        } else {
          onRowSelectionChange([...selectedRows, rowIdValue]);
        }
      }
    };

    const selectionColumn: ColumnDef<TData> = {
      id: "selection",
      header: "",
      cell: ({ row }) => (
        <CustomCheckbox
          // @ts-ignore
          checked={selectedRows.includes(String(row.original[rowId]))}
          onChange={() => handleSelectionChange(String(row.original[rowId]))}
        />
      ),
      meta: {
        width: 50,
      },
    };

    return [selectionColumn, ...columns];
  }, [columns, selectionMode, onRowSelectionChange, selectedRows, rowId]);

  const table = useReactTable({
    data: rows,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columns: allColumns,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
    state: {
      expanded: expanded,
    },
    onExpandedChange: setExpanded,
    getRowCanExpand: getRowCanExpand,
    defaultColumn: {
      minSize: 150,
    },
    getSubRows: getSubRows,
    paginateExpandedRows: false,
  });

  const rowData = table.getRowModel().rows;

  const numsColumns = table.getHeaderGroups().reduce((acc, curr) => {
    if (curr.headers.length > acc) {
      acc = curr.headers.length;
      return acc;
    }
  }, 0);

  //returns the flex values set on the meta in coldef.
  //if flex is not set, checks if size is set. If so returns 0 else 1
  const getColumnFlexValue = (colDef: ColumnDef<TData>): number => {
    const columnSize = colDef.meta?.width;
    const isFixedColumnSizeSet = Boolean(columnSize);
    const columnFlex = colDef.meta?.flex;

    return columnFlex ? Math.min(columnFlex, 2) : isFixedColumnSizeSet ? 0 : 1;
  };

  const flexTotal = columns.reduce((acc, curr) => {
    const flexValue = getColumnFlexValue(curr);
    acc = acc + flexValue;
    return acc;
  }, 0);

  const getColumnWidthPercentage = (colDef: ColumnDef<TData>): number => {
    const flexVal = getColumnFlexValue(colDef);
    const percentage = (flexVal / flexTotal) * 100;
    return percentage;
  };

  const getColumnWidth = (colDef: ColumnDef<TData>): string | number => {
    //if flex is set on column, it takes precedence over everything else;
    let width: string | number = 150;
    const isFlexSet = Boolean(colDef.meta?.flex);
    if (isFlexSet) {
      width = `${getColumnWidthPercentage(colDef)}%`;
    } else if (colDef.meta?.width) {
      width = colDef.meta?.width;
    } else {
      width = `${getColumnWidthPercentage(colDef)}%`;
    }
    return width;
  };

  const getColumnMinWidth = (colDef: ColumnDef<TData>): string | number => {
    let minWidth = DEFAULT_COLUMN_MIN_WIDTH;
    if (colDef.meta?.minWidth) {
      minWidth = colDef.meta?.minWidth;
    } else if (colDef.meta?.width) {
      minWidth = colDef.meta?.width;
    }
    return minWidth;
  };

  return (
    <TableContainer sx={{ borderRadius: "8px" }}>
      <HeaderComponent {...headerProps} />
      <Stack minHeight="605px" justifyContent="space-between">
        <Box sx={{ overflowX: "auto", flexGrow: 1, position: "relative" }}>
          <Table sx={{ tableLayout: "fixed", width: "100%" }}>
            {table.getHeaderGroups().map((headerGroup) => (
              <colgroup key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <col
                    key={header.id}
                    style={{
                      width: getColumnWidth(header.column.columnDef),
                      minWidth: getColumnMinWidth(header.column.columnDef),
                    }}
                  />
                ))}
              </colgroup>
            ))}
            <TableHead>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const sortDirection = header.column.getIsSorted();
                    const columnAlignment =
                      header.column.columnDef.meta?.align || "left";
                    return (
                      <TableCell
                        align={columnAlignment}
                        key={header.id}
                        onClick={
                          header.column.id === "selection"
                            ? undefined
                            : header.column.getToggleSortingHandler()
                        }
                        sx={{
                          cursor:
                            header.column.id === "selection"
                              ? "default"
                              : "pointer",
                          "& .MuiIconButton-root": {
                            display: sortDirection ? "inline-flex" : "none",
                          },
                          "&:hover": {
                            "& .MuiIconButton-root": {
                              display: "inline-flex",
                            },
                          },
                        }}
                      >
                        <Stack
                          display="inline-flex"
                          direction="row"
                          gap="8px"
                          alignItems="center"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() &&
                            header.column.id !== "selection" && (
                              <SortIcon sortDirection={sortDirection} />
                            )}
                        </Stack>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableHead>
            <TableBody>
              {!isLoading &&
                rowData.map((row) => (
                  <React.Fragment key={row.id}>
                    <TableRow>
                      {row.getVisibleCells().map((cell) => {
                        const cellValue: any = cell.getValue();
                        const columnAlignment =
                          cell.column.columnDef.meta?.align || "left";
                        const isBrowerTooltipDisabled =
                          cell.column.columnDef.meta?.disableBrowserTooltip ||
                          false;
                        let title = "";
                        if (
                          ["string", "number", "boolean"].includes(
                            typeof cellValue
                          )
                        ) {
                          title = cellValue.toString();
                        }
                        return (
                          <TableCell
                            key={cell.id}
                            align={columnAlignment}
                            title={isBrowerTooltipDisabled ? "" : title}
                            sx={{
                              fontSize: "14px",
                              fontWeight: "500",
                            }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    {row.getIsExpanded() && renderDetailsComponent && (
                      <DetailViewTableRow>
                        <TableCell
                          sx={{
                            paddingBottom: 0,
                            paddingTop: 0,
                            whiteSpace: "normal",
                          }}
                          colSpan={numsColumns}
                        >
                          <Collapse
                            in={row.getIsExpanded()}
                            timeout="auto"
                            unmountOnExit
                          >
                            {renderDetailsComponent({
                              rowData: row.original,
                            })}
                          </Collapse>
                        </TableCell>
                      </DetailViewTableRow>
                    )}
                  </React.Fragment>
                ))}
            </TableBody>
          </Table>

          {(rows.length === 0 || isLoading) && (
            <Stack
              position="sticky"
              top="50%"
              left="50%"
              fontSize="14px"
              display="inline-block"
              sx={{
                transform: "translateX(-50%) translateY(-50%)",
              }}
            >
              {isLoading ? <CircularProgress /> : noRowsText}
            </Stack>
          )}
        </Box>

        <Pagination
          isPreviousDisabled={!table.getCanPreviousPage()}
          isNextDisabled={!table.getCanNextPage()}
          handlePrevious={() => table.previousPage()}
          handleNext={() => table.nextPage()}
          pageCount={table.getPageCount()}
          pageIndex={table.getState().pagination.pageIndex}
          setPageIndex={table.setPageIndex}
        />
      </Stack>
    </TableContainer>
  );
};

export default DataTable;

interface ColumnCustomFeatures {
  flex?: number;
  width?: number;
  minWidth?: number;
  align?: "center" | "left" | "right";
  disableBrowserTooltip?: boolean;
}
declare module "@tanstack/react-table" {
  /*eslint-disable-next-line*/
  interface ColumnMeta<TData extends RowData, TValue>
    extends ColumnCustomFeatures {}
}

import React, { FC, ReactNode, useState } from "react";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import { Box, Stack } from "@mui/material";
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
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";

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

type DataTableProps<TData> = {
  rows: TData[];
  columns: ColumnDef<TData>[];
  /*eslint-disable-next-line no-unused-vars */
  renderDetailsComponent?: (props: { rowData: TData }) => ReactNode;
  noRowsText: string;
  isLoading?: boolean;
  /*eslint-disable-next-line no-unused-vars */
  getRowCanExpand?: (rowData: Row<TData>) => boolean;
  HeaderComponent: FC;
  headerProps: any;
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
  } = props;
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const table = useReactTable({
    data: rows,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columns: columns,
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
  });

  // console.log("Rows", table.getRowModel().rows);
  // console.log("Headers", table.getHeaderGroups());

  const rowData = table.getRowModel().rows;

  const numsColumns = table.getHeaderGroups().reduce((acc, curr) => {
    if (curr.headers.length > acc) {
      acc = curr.headers.length;
      return acc;
    }
  }, 0);

  // const width = 100 / columns.length;

  //returns the flex values set on the meta in coldef.
  //if flex is not set, checks if size is set. If so returns 0 else 1
  const getColumnFlexValue = (colDef: ColumnDef<TData>): number => {
    const columnSize = colDef.meta?.width;
    const isFixedColumnSizeSet = Boolean(columnSize);
    const columnFlex = colDef.meta?.flex;

    return columnFlex ? Math.min(columnFlex, 1) : isFixedColumnSizeSet ? 0 : 1;
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

  const getColumnMinWIdth = (colDef: ColumnDef<TData>): string | number => {
    let minWidth = DEFAULT_COLUMN_MIN_WIDTH;
    if (colDef.meta?.minWidth) {
      minWidth = colDef.meta?.minWidth;
    } else if (colDef.meta?.width) {
      minWidth = colDef.meta?.width;
    }
    return minWidth;
  };

  return (
    <TableContainer>
      <HeaderComponent {...headerProps} />
      <Stack minHeight="656px" justifyContent="space-between">
        <Box sx={{ overflowX: "auto" }}>
          <Table sx={{ tableLayout: "fixed", width: "100%" }}>
            {table.getHeaderGroups().map((headerGroup) => {
              return (
                <colgroup key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <col
                        key={header.id}
                        style={{
                          width: getColumnWidth(header.column.columnDef),
                          minWidth: getColumnMinWIdth(header.column.columnDef),
                        }}
                      />
                    );
                  })}
                </colgroup>
              );
            })}
            <TableHead>
              {table.getHeaderGroups().map((headerGroup) => {
                return (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const sortDirection = header.column.getIsSorted();
                      return (
                        <TableCell
                          align="center"
                          key={header.id}
                          onClick={header.column.getToggleSortingHandler()}
                          sx={{
                            cursor: "pointer",
                            "& svg": {
                              display: sortDirection ? "inline-block" : "none",
                            },
                            "&:hover": {
                              "& svg": {
                                display: "inline-block",
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
                            {header.column.getCanSort() && (
                              <SortIcon sortDirection={sortDirection} />
                            )}
                          </Stack>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableHead>
            <TableBody>
              {!isLoading &&
                rowData.map((row) => {
                  return (
                    <React.Fragment key={row.id}>
                      <TableRow>
                        {row.getVisibleCells().map((cell) => {
                          const cellValue = cell.getValue();
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
                              align="center"
                              title={title}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      {row.getIsExpanded() && (
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
                  );
                })}
            </TableBody>
          </Table>
        </Box>

        {(rows.length === 0 || isLoading) && (
          <Stack
            justifyContent="center"
            alignItems="center"
            fontSize="14px "
            flexGrow={1}
            height="520px"
          >
            {isLoading ? <LoadingSpinner /> : noRowsText}
          </Stack>
        )}
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

interface ColumnFlex {
  flex?: number;
  width?: number;
  minWidth?: number;
}
declare module "@tanstack/react-table" {
  /*eslint-disable-next-line*/
  interface ColumnMeta<TData extends RowData, TValue> extends ColumnFlex {}
}

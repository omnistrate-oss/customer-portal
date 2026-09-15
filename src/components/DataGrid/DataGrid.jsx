import { memo } from "react";
import { Stack, styled } from "@mui/material";
import { DataGrid as MuiDataGrid, GridCell, GridRow } from "@mui/x-data-grid";

import CustomCheckbox from "../Checkbox/Checkbox";

import DataGridCustomPagination from "./DataGridCustomPagination";
import NoRowsOverlayContent from "./NoRowsOverlayContent";

// Define memoized components outside of the render function
const MemoizedCell = memo(function Cell(props) {
  return <GridCell data-testid={props.field} {...props} />;
});

const MemoizedRow = memo(function Row(props) {
  return <GridRow data-testid={props.rowId} {...props} />;
});

const DataGrid = styled(
  ({ components, noRowsText = "No rows", isFilterApplied = false, entityName, ...restProps }) => (
    <MuiDataGrid
      disableVirtualization // To Allow Vitest To Query All Columns
      rowsPerPageOptions={[10]}
      pageSize={10}
      rowHeight={48}
      headerHeight={44}
      components={{
        Cell: MemoizedCell,
        Row: MemoizedRow,
        BaseCheckbox: CustomCheckbox,
        Pagination: DataGridCustomPagination,
        NoRowsOverlay: () => (
          <Stack height="100%" alignItems="center" justifyContent="center" data-testid="no-rows-overlay">
            <NoRowsOverlayContent noRowsText={noRowsText} isFilterApplied={isFilterApplied} entityName={entityName} />
          </Stack>
        ),
        ...components,
      }}
      hideFooterSelectedRowCount
      disableColumnMenu
      {...restProps}
    />
  ),
  {
    shouldForwardProp: (prop) => !["showSelectAllCheckbox"].includes(prop),
  }
)(({ enableSelectAll = false }) => ({
  borderRadius: "12px",
  background: "white",
  boxShadow: "0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)",
  border: "1px solid #EAECF0",
  "& .MuiDataGrid-main": {
    minHeight: "540px",
  },

  "& .MuiDataGrid-columnHeader": {
    // padding: "0px 24px",
    color: "#475467",
    fontSize: "12px",
    fontWeight: 500,
    lineHeight: "18px",
    background: "#F9FAFB",
    justifyContent: "flex-start", // Left-align header content
  },
  "& .MuiDataGrid-columnHeaders .MuiDataGrid-columnHeader:first-child": {
    paddingLeft: "24px !important",
  },
  "& .MuiDataGrid-columnHeaders .MuiDataGrid-columnHeader:last-child": {
    paddingRight: "24px !important",
  },
  "& .MuiDataGrid-row .MuiDataGrid-cell:first-child": {
    paddingLeft: "24px !important",
  },
  "& .MuiDataGrid-row .MuiDataGrid-cell:last-child": {
    paddingRight: "24px !important",
  },
  "& .MuiDataGrid-columnSeparator": {
    display: "none",
  },
  "& .MuiDataGrid-cell": {
    color: "#475467",
    fontSize: "14px",
    fontWeight: 500,
    lineHeight: "20px",
  },
  "& .MuiDataGrid-columnHeader:focus": {
    borderRadius: "4px",
  },
  "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
    outline: "none",
  },
  "& .MuiDataGrid-columnHeaderCheckbox": {
    paddingRight: "0px",
    "& .MuiDataGrid-columnHeaderTitleContainer": {
      display: enableSelectAll ? "flex" : "none",
      "& .MuiDataGrid-columnHeaderTitleContainerContent": {
        overflow: "visible",
      },
    },
  },
  "& .MuiTablePagination-root": {
    flex: 1,
  },
}));

// Utility method to select one particular row in the data grid
export function selectSingleItem(newSelection, selectionModel, selectionModelSetter) {
  if (newSelection.length > 0) {
    const selectionSet = new Set(selectionModel);
    const newSelectedItem = newSelection.filter((s) => !selectionSet.has(s));
    selectionModelSetter(newSelectedItem);
  } else {
    selectionModelSetter(newSelection);
  }
}

export default DataGrid;

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { List } from "@mui/material";
import Box from "@mui/material/Box";
import usePagination from "@mui/material/usePagination";
import { gridPageCountSelector, GridPagination, useGridApiContext, useGridSelector } from "@mui/x-data-grid";

import Button from "../Button/Button";

export function Pagination(props) {
  const { page, onPageChange } = props;
  const apiRef = useGridApiContext();
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);

  const { items } = usePagination({
    count: pageCount,
    page: page + 1,
    onChange: (event, newPage) => {
      onPageChange(event, newPage - 1);
    },
  });

  const prev = items?.find((item) => item.type === "previous");
  const next = items?.find((item) => item.type === "next");

  const filteredItems = items?.filter((item) => item.type !== "previous" && item.type !== "next");

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        p: "12px 24px",
      }}
    >
      <Button size="small" variant="outlined" startIcon={<ArrowBackIcon />} {...prev}>
        Previous
      </Button>
      <List sx={{ display: "flex", px: "20px", gap: "2px" }}>
        {filteredItems.map(({ page, type, selected, ...item }, index) => {
          let children = null;

          if (type === "start-ellipsis" || type === "end-ellipsis") {
            children = <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>…</Box>;
          } else if (type === "page") {
            children = (
              <Button
                {...item}
                size="small"
                variant="text"
                sx={{
                  minWidth: 0,
                  width: 40,
                  height: 40,
                  color: selected ? "#6941C6" : "#475467",
                  background: selected ? "#F2F4F7" : "transparent",
                  "&:hover": {
                    background: "#F2F4F7",
                  },
                }}
              >
                {page}
              </Button>
            );
          }

          return <li key={index}>{children}</li>;
        })}
      </List>
      <Button size="small" variant="outlined" endIcon={<ArrowForwardIcon />} {...next}>
        Next
      </Button>{" "}
    </Box>
  );
}

function DataGridCustomPagination(props) {
  return (
    <GridPagination
      ActionsComponent={Pagination}
      {...props}
      sx={{
        ".MuiTablePagination-displayedRows": {
          display: "none",
        },
        ".MuiToolbar-root": {
          padding: 0,
          ".MuiTablePagination-spacer": {
            display: "none",
          },
        },
      }}
    />
  );
}

export default DataGridCustomPagination;

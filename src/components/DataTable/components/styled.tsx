import { styled } from "@mui/material";
import MuiTable from "@mui/material/Table";
import MuiTableBody from "@mui/material/TableBody";
import MuiTableCell from "@mui/material/TableCell";
import MuiTableContainer from "@mui/material/TableContainer";
import MuiTableHead from "@mui/material/TableHead";
import MuiTableRow from "@mui/material/TableRow";

export const TableHead = styled(MuiTableHead)({
  "& .MuiTableCell-head": {
    color: "#475467",
    fontSize: "12px",
    fontWeight: 500,
    lineHeight: "18px",
    background: "#F9FAFB",
    height: "56px",
  },
});

export const TableBody = styled(MuiTableBody)({
  minHeight: "520px",
});

export const Table = styled(MuiTable)({});

export const TableContainer = styled(MuiTableContainer)({
  borderRadius: "12px",
  background: "white",
  boxShadow: "rgb(16 24 40 / 10%) 0px 1px 3px, rgb(16 24 40 / 6%) 0px 1px 2px",
  border: "1px solid rgb(234, 236, 240)",
});

export const TableRow = styled(MuiTableRow)({
  height: "52px",
  "& > *": { borderBottom: "unset" },
});

export const DetailViewTableRow = styled(MuiTableRow)({});

export const TableCell = styled(MuiTableCell, {
  shouldForwardProp: (prop) => prop !== "height",
})(() => ({
  padding: "0 12px",
  borderBottom: "1px solid #EAECF0",
  color: "rgb(71, 84, 103)",
  fontSize: "12px",
  fontWeight: 500,
  lineHeight: "18px",
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
}));

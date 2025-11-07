import { styled } from "@mui/material";
import MuiTooltip, { tooltipClasses } from "@mui/material/Tooltip";

const Tooltip = styled(({ className, ...props }) => <MuiTooltip {...props} arrow classes={{ popper: className }} />, {
  shouldForwardProp: (prop) => prop !== "isVisible",
})(({ isVisible = true }) => ({
  display: isVisible ? "block" : "none",
  [`& .${tooltipClasses.arrow}`]: {},
  [`& .${tooltipClasses.tooltip}`]: {
    padding: "6px 10px",
    fontWeight: "500",
    borderRadius: "8px",
  },
}));

export default Tooltip;

export const WhiteTooltip = styled(({ className, ...props }) => (
  <MuiTooltip placement="bottom" {...props} arrow classes={{ popper: className }} />
))(({ isVisible = true }) => ({
  display: isVisible ? "block" : "none",
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: "#FFF",
    color: "#000000",
    fontSize: "14px",
    fontWeight: "400",
    border: "1px solid #DBDBDB",
    borderRadius: "8px",
    boxShadow: "0px 3px 3px -1.5px #0A0D120A, 0px 8px 8px -4px #0A0D1208, 0px 20px 24px -4px #0A0D1214",
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: "#fff",
  },
}));

export const BlackTooltip = styled(
  ({ className, ...props }) => <MuiTooltip {...props} arrow classes={{ popper: className }} />,
  {
    shouldForwardProp: (prop) => prop !== "isVisible",
  }
)(({ isVisible = true }) => ({
  display: isVisible ? "block" : "none",
  [`& .${tooltipClasses.arrow}`]: {
    color: "#0C111D",
  },
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: "#0C111D",
    fontSize: "12px",
    lineHeight: "18px",
    fontWeight: 600,
    padding: "12px",
    borderRadius: "8px",
    color: "#FFF",
  },
}));

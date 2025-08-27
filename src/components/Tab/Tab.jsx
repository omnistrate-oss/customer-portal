import { styled } from "@mui/material";
import MuiTab, { tabClasses } from "@mui/material/Tab";
import MuiTabs, { tabsClasses } from "@mui/material/Tabs";

import { styleConfig } from "src/providerConfig";
import { colors } from "src/themeConfig";

export const Tabs = styled(MuiTabs)({
  borderBottom: "1px solid #E1E3EA",
  minHeight: "32px",
  [`& .${tabsClasses.indicator}`]: {
    backgroundColor: "transparent",
  },
});

export const Tab = styled(MuiTab)({
  textTransform: "none",
  borderBottom: "0px solid #EAECF0",
  fontSize: 14,
  padding: "12px 4px !important",
  fontWeight: 600,
  color: "#717680",
  lineHeight: "20px",
  minWidth: "auto",
  minHeight: "32px",
  marginRight: "16px",
  borderBottom: "2px solid transparent",
  "&:hover": {
    borderBottom: `2px solid ${colors.purple600}`,
    color: colors.purple600,
  },
  [`&.${tabClasses.selected}`]: {
    borderBottom: `2px solid ${styleConfig.secondaryColor}`,
    color: colors.purple800,
  },
});

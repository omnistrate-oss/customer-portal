import styled from "@emotion/styled";
import { Box } from "@mui/material";
import MuiTab, { tabClasses, TabProps } from "@mui/material/Tab";
import MuiTabs, { tabsClasses, TabsProps } from "@mui/material/Tabs";
import { Stack } from "@mui/system";

import AlertTriangle from "src/components/Icons/AlertTriangle/AlertTriangle";
import { colors } from "src/themeConfig";

type TabStatus = "failed";

type TabV2Props = TabProps & {
  status?: TabStatus;
};

const StyledTabs = styled(MuiTabs)({
  minHeight: "auto",

  [`& .${tabsClasses.indicator}`]: {
    display: "none",
  },
  [`& .${tabsClasses.scrollButtons}`]: {
    paddingBottom: 0,
  },
  [`& .${tabsClasses.flexContainer}`]: {
    gap: 0,
  },
});

type TabsExtendedProps = TabsProps & {
  centerTabs?: boolean;
  /** sx applied to the outer wrapper Box when centerTabs is true */
  wrapperSx?: TabsProps["sx"];
};

export const Tabs = ({ centerTabs, wrapperSx, sx, ...rest }: TabsExtendedProps) => {
  const normalizeSx = (value: TabsProps["sx"]) => (Array.isArray(value) ? value : value ? [value] : []);

  if (centerTabs) {
    return (
      <Box
        sx={[
          { display: "flex", justifyContent: "center", borderBottom: `1px solid ${colors.gray200}` },
          ...normalizeSx(wrapperSx),
        ]}
      >
        <StyledTabs {...rest} sx={normalizeSx(sx)} />
      </Box>
    );
  }
  return <StyledTabs {...rest} sx={[...normalizeSx(sx), { borderBottom: `1px solid ${colors.gray200}` }]} />;
};

const statusStyles = {
  failed: {
    backgroundColor: "#FFF6F5",
    borderColor: "#FEE4E2",
    color: "#D92D20",
    icon: <AlertTriangle color="#F04438" width={18} height={18} />,
  },
};

const StyledTab = styled(MuiTab, {
  shouldForwardProp: (prop) => prop !== "status",
})<TabV2Props>(({ status }) => ({
  textTransform: "none",
  padding: "0 16px",
  fontWeight: 600,
  fontSize: "14px",
  lineHeight: "20px",
  color: colors.gray500,
  minHeight: "auto",
  minWidth: "auto",
  borderRadius: 0,
  position: "relative",
  // Add padding to child content
  "& > *": {
    padding: "14px 16px",
    borderRadius: "4px 4px 0 0",
    borderBottom: "none",
    ...(status && statusStyles[status]
      ? {
          backgroundColor: statusStyles[status].backgroundColor,
          border: `1px solid ${statusStyles[status].borderColor}`,
          borderBottom: "none",
          color: statusStyles[status].color,
        }
      : {}),
  },

  // Active tab bottom indicator
  "&::before": {
    content: '""',
    position: "absolute",
    bottom: 0,
    left: "16px",
    right: "16px",
    height: "2px",
    backgroundColor: "transparent",
  },

  // Separator between tabs
  // Use right: 1px instead of right: 0 to prevent subpixel clipping
  "&::after": {
    content: '""',
    position: "absolute",
    right: "1px",
    top: "9px",
    bottom: "9px",
    width: "1px",
    backgroundColor: colors.gray200,
  },

  // Hide separator on last tab
  "&:last-of-type::after": {
    display: "none",
  },

  [`&.${tabClasses.selected}`]: {
    color: colors.purple700,
    "&::before": {
      backgroundColor: colors.purple700,
    },
  },

  "&:hover": {
    color: colors.purple700,
    "&::before": {
      backgroundColor: colors.purple700,
    },
  },

  [`&.${tabClasses.disabled}`]: {
    color: colors.gray400,
    "& > *": {
      opacity: 0.5,
    },
    "&:hover": {
      color: colors.gray400,
      "&::before": {
        backgroundColor: "transparent",
      },
    },
  },
}));

export const Tab = ({ status, label, ...rest }: TabV2Props) => {
  const statusConfig = status ? statusStyles[status] : undefined;

  const wrappedLabel = statusConfig ? (
    <Stack direction="row" alignItems="center" spacing={1}>
      {statusConfig.icon}
      {label}
    </Stack>
  ) : (
    <Box>{label}</Box>
  );

  return <StyledTab status={status} label={wrappedLabel} disableRipple {...rest} />;
};

export const disabledTabStyles = {
  [`&.${tabClasses.root}`]: {
    color: colors.gray400,
    cursor: "not-allowed",
    "& > *": {
      opacity: 0.5,
    },
    "&:hover": {
      color: colors.gray400,
      "&::before": {
        backgroundColor: "transparent",
      },
    },
  },
};

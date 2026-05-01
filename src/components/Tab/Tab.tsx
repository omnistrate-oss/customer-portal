import styled from "@emotion/styled";
import { Box } from "@mui/material";
import MuiTab, { tabClasses, TabProps } from "@mui/material/Tab";
import MuiTabs, { tabsClasses, TabsProps } from "@mui/material/Tabs";
import { Stack } from "@mui/system";

import AlertTriangle from "src/components/Icons/AlertTriangle/AlertTriangle";

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
};

export const Tabs = ({ centerTabs, ...rest }: TabsExtendedProps) => {
  if (centerTabs) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", borderBottom: "1px solid #EAECF0" }}>
        <StyledTabs {...rest} />
      </Box>
    );
  }
  return <StyledTabs {...rest} sx={{ ...rest.sx, borderBottom: "1px solid #EAECF0" }} />;
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
})<TabV2Props>(({ status, disabled }) => ({
  textTransform: "none",
  padding: "0 16px",
  fontWeight: 600,
  fontSize: "14px",
  lineHeight: "20px",
  color: "#717680",
  minHeight: "auto",
  minWidth: "auto",
  borderRadius: 0,
  position: "relative",
  // Add horizontal padding to child content
  "& > *": {
    padding: "14px 16px",
    borderRadius: "4px 4px 0 0",
    borderBottom: "none",
    opacity: disabled ? 0.5 : 1,
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
    backgroundColor: "#EAECF0",
  },

  // Hide separator on last tab
  "&:last-of-type::after": {
    display: "none",
  },

  [`&.${tabClasses.selected}`]: {
    color: "#6941C6",
    "&::before": {
      backgroundColor: "#6941C6",
    },
  },

  "&:hover": {
    color: "#6941C6",
    "&::before": {
      backgroundColor: "#6941C6",
    },
  },

  [`&.${tabClasses.disabled}`]: {
    color: "#A4A7AE",
    "&:hover": {
      color: "#A4A7AE",
      "&::before": {
        backgroundColor: "transparent",
      },
    },
  },
}));

export const Tab = ({ status, label, ...rest }: TabV2Props) => {
  const statusConfig = status ? statusStyles[status] : undefined;

  const wrappedLabel = statusConfig ? (
    <Stack direction="row" alignItems="center" gap="8px">
      {statusConfig.icon}
      {label}
    </Stack>
  ) : (
    <Box>{label}</Box>
  );

  return <StyledTab status={status} label={wrappedLabel} disableRipple {...rest} />;
};

// Use this to only apply disabled styles visually without disabling the tab
// This is useful when we want custom disabled functionality like showing a tooltip or other pointer events to work
// Reference implementation in ResourceConfig/components/ConfigurationPanelTabs.tsx
export const disabledTabStyles = {
  [`&.${tabClasses.root}`]: {
    color: "#A4A7AE",
    cursor: "not-allowed",
    "& > *": {
      opacity: 0.5,
    },
    "&:hover": {
      color: "#A4A7AE",
      "&::before": {
        backgroundColor: "transparent",
      },
    },
  },
};

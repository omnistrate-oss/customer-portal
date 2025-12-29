import { styled } from "@mui/material";
import MuiButton, { buttonClasses } from "@mui/material/Button";

import { styleConfig } from "src/providerConfig";
import { colors } from "src/themeConfig";

import LoadingSpinnerSmall from "../CircularProgress/CircularProgress";
import Tooltip from "../Tooltip/Tooltip";
import { textStyles, weights } from "../Typography/Typography";

const Button = styled(
  ({ children, isLoading, disabledMessage, ...restProps }) => {
    const button = (
      <MuiButton {...restProps}>
        {children}
        {isLoading && <LoadingSpinnerSmall />}
      </MuiButton>
    );

    if (disabledMessage && restProps.disabled) {
      return (
        <Tooltip title={disabledMessage}>
          {/* Wrapper Necessary for Tooltip */}
          <span>{button}</span>
        </Tooltip>
      );
    }

    return button;
  },
  {
    shouldForwardProp: (prop) => {
      return !["fontColor", "outlineColor", "outlineBg", "bgColor"].includes(prop);
    },
  }
)(({ theme, outlineColor, fontColor, outlineBg, bgColor, size }) => {
  let buttonStyles = {};

  if (size === "xlarge") {
    buttonStyles = {
      padding: "12px 20px",
      fontSize: "16px",
      lineHeight: "24px",
      fontWeight: 600,
    };
  }
  if (size === "xxlarge") {
    buttonStyles = {
      padding: "12px 20px",
      fontSize: "20px",
      lineHeight: "30px",
      fontWeight: 600,
    };
  }

  if (size === "xsmall") {
    buttonStyles = {
      padding: "6px 10px",
      ...textStyles.small,
      fontWeight: weights.medium,
    };
  }
  if (size === "common") {
    buttonStyles = {
      padding: "10px 18px",
      ...textStyles.small,
      fontWeight: weights.medium,
    };
  }
  if (size === "create") {
    buttonStyles = {
      padding: "12px 20px",
      ...textStyles.semibold,
      fontWeight: weights.semibold,
    };
  }

  return {
    ...buttonStyles,
    borderRadius: "8px",
    textTransform: "none",
    minWidth: "auto",
    [`&.${buttonClasses.contained}`]: {
      color: "#FFF",
      background: bgColor ? bgColor : colors.success600,
      color: fontColor ? fontColor : styleConfig.primaryTextColor,
      boxShadow: "none",
      "&:hover": {
        background: bgColor ? bgColor : colors.success600,
      },
    },
    [`&.${buttonClasses.contained}.Mui-disabled`]: {
      borderWidth: "1px",
      borderStyle: "solid",
      boxShadow: "0px 1px 2px 0px #0A0D120D, 0px -2px 0px 0px #0A0D120D inset",
      background: "white",
      borderColor: "#EAECF0",
      color: colors.gray400,
    },
    [`&.${buttonClasses.outlined}`]: {
      color: fontColor ? fontColor : colors.gray700,
      background: outlineBg ? outlineBg : "white",
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: outlineColor ? outlineColor : colors.gray300,
      boxShadow: "0px 1px 2px 0px #0A0D120D, 0px -2px 0px 0px #0A0D120D inset",
    },
    [`&.${buttonClasses.outlined}.Mui-disabled`]: {
      background: "white",
      borderColor: "#EAECF0",
      color: colors.gray400,
    },

    [`${buttonClasses.outlinedPrimary}`]: {
      background: theme.palette.primary.main,
      fontColor: "white",
    },
    [`&.${buttonClasses.sizeLarge}`]: {
      padding: "10px 18px",
      fontSize: 16,
      fontWeight: 600,
      lineHeight: "24px",
      borderRadius: 8,
    },
    [`&.${buttonClasses.sizeMedium}`]: {
      padding: "10px 16px",
      fontSize: 16,
      fontWeight: 600,
      ...textStyles.small,
    },
    [`&.${buttonClasses.sizeSmall}`]: {
      padding: "8px 14px",
      fontSize: 14,
      fontWeight: 600,
      lineHeight: "20px",
      "& svg": {
        fontSize: 20,
      },
    },
    "&:disabled": {
      // opacity: 0.38,
    },
    [`&.${buttonClasses.text}`]: {
      color: fontColor ? fontColor : styleConfig.secondaryButtonText,

      "&:hover": {
        background: "none",
        color: "#087443",
      },
    },
    [`&.${buttonClasses.text}:disabled`]: {
      opacity: 0.38,
    },
  };
});

// export default function (props) {
//   return <Button variant="contained" {...props} />;
// }

export default Button;

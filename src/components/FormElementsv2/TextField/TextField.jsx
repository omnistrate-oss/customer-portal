import React from "react";
import { InputAdornment, styled } from "@mui/material";
import MuiTextField from "@mui/material/TextField";

import CopyButton from "src/components/Button/CopyButton";
import { colors } from "src/themeConfig";

export const StyledTextField = styled(MuiTextField, {
  shouldForwardProp: (prop) => {
    return prop !== "marginTop";
  },
})(({ theme, marginTop }) => {
  return {
    marginTop: marginTop,

    [`.MuiOutlinedInput-root`]: {
      padding: 0,
      color: colors.gray900,
      fontSize: "16px",
      fontWeight: 400,
      [`& .MuiOutlinedInput-input`]: {
        padding: "10px 14px",
        background: "#FFF",
        "&::placeholder": {
          color: theme.palette?.gray?.["500"],
        },
      },

      [`& .MuiOutlinedInput-notchedOutline`]: {
        borderRadius: "8px",
        boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
        border: `1px solid  ${theme.palette?.gray?.["300"]}`,
      },
    },
    ".MuiOutlinedInput-root.Mui-focused": {
      [`& .MuiOutlinedInput-notchedOutline`]: {
        border: `2px solid ${colors.success500}`,
      },
    },
    ".MuiOutlinedInput-root.Mui-error": {
      [`& .MuiOutlinedInput-notchedOutline`]: {
        border: `1px solid  ${theme.palette?.error?.["300"]}`,
      },
    },
    ".MuiOutlinedInput-root.Mui-error.Mui-focused": {
      [`& .MuiOutlinedInput-notchedOutline`]: {
        boxShadow: "0px 0px 0px 4px #FEE4E2, 0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
      },
    },
    ".MuiOutlinedInput-root.Mui-disabled": {
      [`& .MuiOutlinedInput-notchedOutline`]: {
        border: `1px solid  ${theme.palette?.gray?.["300"]}`,
      },
      [`& .MuiOutlinedInput-input`]: {
        WebkitTextFillColor: colors.gray500,
        background: theme.palette.gray?.["50"],
      },
    },
    "& .MuiInputAdornment-root": {
      height: "auto",
      maxHeight: "initial",
      alignSelf: "stretch",
      padding: "0px 12px",
      margin: 0,
      borderLeft: `1px solid ${theme.palette?.gray?.["300"]}`,
      background: "white",
      "& .MuiTypography-root": {
        color: "#475467",
      },
    },
  };
});

const TextField = (props) => {
  const { marginTop = "6px", copyButton, ...restProps } = props;
  const value = restProps.value || "";
  const InputProps = restProps.InputProps || {};

  if (copyButton) {
    InputProps.endAdornment = (
      <InputAdornment position="start" sx={{ padding: "0px 10px !important" }}>
        <CopyButton text={value} />
      </InputAdornment>
    );
  }

  return <StyledTextField fullWidth marginTop={marginTop} {...restProps} InputProps={InputProps} />;
};

export default TextField;

import React from "react";
import CloseIcon from "@mui/icons-material/Close";
import DoneIcon from "@mui/icons-material/Done";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { Chip, styled, TextField } from "@mui/material";
import MuiAutocomplete from "@mui/material/Autocomplete";

const StyledAutoComplete = styled(MuiAutocomplete, {
  shouldForwardProp: (prop) => {
    return prop !== "marginTop";
  },
})(({ theme, marginTop, disabled }) => ({
  marginTop: marginTop,
  ...(disabled
    ? {
        WebkitTextFillColor: theme.palette.gray["500"],
        background: theme.palette.gray["50"],
      }
    : {
        background: "#FFF !important",
      }),
  [`.MuiOutlinedInput-root`]: {
    padding: "10px 14px ",
    gap: "6px",
    color: theme.palette.gray["900"],
    fontSize: "16px",
    fontWeight: 400,
    [`& .MuiOutlinedInput-input`]: {
      padding: "0",
      marginLeft: "2px",
    },

    [`& .MuiOutlinedInput-notchedOutline`]: {
      borderRadius: "8px",
      boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
      border: `1px solid  ${theme.palette.gray["300"]}`,
    },
  },
  ".MuiOutlinedInput-root.Mui-focused": {
    [`& .MuiOutlinedInput-notchedOutline`]: {
      border: `2px solid  ${theme.palette.primary["main"]}`,
      // boxShadow:
      //   "0px 0px 0px 4px #F4EBFF, 0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
    },
  },
  ".MuiOutlinedInput-root.Mui-error": {
    [`& .MuiOutlinedInput-notchedOutline`]: {
      border: `1px solid  ${theme.palette.error["300"]}`,
    },
  },
  ".MuiOutlinedInput-root.Mui-error.Mui-focused": {
    [`& .MuiOutlinedInput-notchedOutline`]: {
      boxShadow: "0px 0px 0px 4px #FEE4E2, 0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
    },
  },
  ".MuiOutlinedInput-root.Mui-disabled": {
    [`& .MuiOutlinedInput-notchedOutline`]: {
      border: `1px solid  ${theme.palette.gray["300"]}`,
    },
    [`& .MuiTextField-root`]: {
      WebkitTextFillColor: theme.palette.gray["500"],
      background: theme.palette.gray["50"],
    },
  },
}));

export const StyledTextField = styled(TextField)(({ theme }) => ({
  ".MuiAutocomplete-input": {
    color: theme.palette.gray["900"],
    fontSize: "16px",
    fontWeight: 400,
  },
}));

const StyledTag = styled(Chip)(({ theme }) => ({
  height: "24px",
  borderRadius: "6px",
  border: `1px solid ${theme.palette.gray["300"]}`,
  padding: "0px",
  margin: "0px !important",
  gap: "3px",
  ".MuiChip-label": {
    color: theme.palette.gray["700"],
    fontSize: "14px",
    fontWeight: 500,
    lineHeight: "20px",
    paddingRight: "8px",
    paddingLeft: "8px",
  },
  "& .MuiChip-deleteIcon": {
    fontSize: "16px",
    path: {
      stroke: "#98A2B3",
      fill: "#98A2B3",
      strokeWidth: "1",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
  },
}));

const StyledListOption = styled("li")(() => ({
  marginBottom: "2px",
  justifyContent: "space-between !important",
  width: "100%",
  '&.MuiAutocomplete-option[aria-selected="true"]': {
    backgroundColor: "rgba(3, 152, 85, 0.08)",
  },
  '&.MuiAutocomplete-option[aria-selected="true"].Mui-focused': {
    backgroundColor: "rgba(3, 152, 85, 0.12)",
  },
}));

const StyledListOptionText = styled("p")(({ theme }) => ({
  color: theme.palette.gray["900"],
  fontSize: "16px",
}));

const StyledDoneIcon = styled(DoneIcon)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

//getOptionLabel prop should be passed if option is an object
// Example: if option is of format {label:"string", value:"string"}, then to display label in options and tags getOptionLabel = (option)=>option.label;

function Autocomplete(props) {
  const { marginTop = "6px", placeholder, getOptionLabel = (option) => option, disabled, error, ...restProps } = props;
  return (
    <StyledAutoComplete
      marginTop={marginTop}
      getOptionLabel={getOptionLabel}
      disabled={disabled}
      renderInput={(params) => <StyledTextField {...params} placeholder={placeholder} error={error} />}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <StyledTag
            key={index}
            variant="outlined"
            label={getOptionLabel(option)}
            deleteIcon={<CloseIcon />}
            {...getTagProps({ index })}
          />
        ))
      }
      popupIcon={<KeyboardArrowDownIcon style={{ color: "black" }} />}
      renderOption={(props, option) => {
        return (
          <StyledListOption {...props}>
            <StyledListOptionText>{getOptionLabel(option)}</StyledListOptionText>
            {props["aria-selected"] && <StyledDoneIcon />}
          </StyledListOption>
        );
      }}
      ListboxProps={{
        sx: {
          "&.MuiAutocomplete-listbox": {
            marginTop: "4px",
            border: "1px solid #EAECF0",
            boxShadow: "0px 4px 6px -2px rgba(16, 24, 40, 0.03), 0px 12px 16px -4px rgba(16, 24, 40, 0.08)",
            borderRadius: "8px",
            padding: "4px",
          },
        },
      }}
      componentsProps={{
        paper: {
          sx: {
            border: "none",
            boxShadow: "none",
            "& .MuiAutocomplete-noOptions": {
              marginTop: "4px",
              border: "1px solid #EAECF0",
              borderRadius: "8px",
              boxShadow: "0px 4px 6px -2px rgba(16, 24, 40, 0.03), 0px 12px 16px -4px rgba(16, 24, 40, 0.08)",
            },
          },
        },
      }}
      {...restProps}
    />
  );
}

export default Autocomplete;

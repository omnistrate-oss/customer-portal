import { forwardRef } from "react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { Box, styled } from "@mui/material";
import MuiTextField from "@mui/material/TextField";

const StyledTextField = styled(MuiTextField, {
  shouldForwardProp: (prop) => {
    return prop !== "readonly";
  },
})(({ readonly }) => ({
  boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)",
  borderRadius: 8,
  flexGrow: 1,
  [`& .MuiOutlinedInput-input`]: {
    padding: "10px 12px",
    //border: "1px solid #D1D5DB",
    borderRadius: 8,
    caretColor: readonly ? "transparent" : "auto",
  },
  [`& .MuiOutlinedInput-input:disabled`]: {
    background: "#F9FAFB",
    color: "#667085",
    // color: "#4a505d",
    WebkitTextFillColor: "#667085",
  },
  [`& .MuiOutlinedInput-root`]: {
    borderRadius: 8,
  },
  [`& .MuiOutlinedInput-notchedOutline`]: {
    borderColor: "#D0D5DD",
  },
  // [`& .Mui-focused .MuiOutlinedInput-notchedOutline`]: {
  //   borderColor: "rgba(254, 228, 226, 1)",
  // },
  [`& .MuiSelect-icon`]: {
    color: "black",
  },
}));

const TextField = forwardRef(function StyledTextFieldRef(props, ref) {
  const { SelectProps, ...restProps } = props;

  return (
    <Box display="flex">
      <StyledTextField
        fullWidth
        InputProps={{
          inputRef: ref,
        }}
        SelectProps={{
          IconComponent: KeyboardArrowDownIcon,
          ...SelectProps,
        }}
        {...restProps}
      />
    </Box>
  );
});

export default TextField;

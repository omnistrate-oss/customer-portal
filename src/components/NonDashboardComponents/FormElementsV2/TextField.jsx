import { TextField as MuiTextField } from "@mui/material";

const TextField = ({ type, endAdornment, ...restProps }) => {
  return (
    <MuiTextField
      fullWidth
      autoComplete="off"
      type={type || "text"}
      {...restProps}
      sx={{
        ".MuiOutlinedInput-root": {
          borderRadius: "6px",
          fontSize: "14px",
          color: "#111827",
          fontWeight: "500",
          boxShadow: "0px 1px 2px 0px #1018280D",
          "& .MuiOutlinedInput-input": {
            padding: "10px 12px",
            backgroundColor: "#FFF",
            "&::placeholder": {
              fontSize: "14px",
              color: "#9CA3AF",
            },
          },
        },
        [`& .MuiOutlinedInput-input:disabled`]: {
          background: "#F9FAFB",
          color: "#667085",
          WebkitTextFillColor: "#667085",
        },
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "#D1D5DB",
        },
        ...restProps.sx,
      }}
      InputProps={{
        endAdornment: endAdornment || null,
        ...restProps.InputProps,
      }}
      FormHelperTextProps={{
        sx: {
          position: "absolute",
          left: "0px",
          bottom: -24,
        },
        ...restProps.FormHelperTextProps,
      }}
    />
  );
};

export default TextField;

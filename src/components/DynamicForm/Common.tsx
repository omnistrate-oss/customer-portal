"use client";

import { useRef, useState } from "react";
import { Box, InputAdornment, Stack } from "@mui/material";
import Generator from "generate-password";

import MenuItem from "components/FormElementsv2/MenuItem/MenuItem";
import Select from "components/FormElementsv2/Select/Select";
import TextField from "components/FormElementsv2/TextField/TextField";
import KeyIcon from "components/Icons/Key/KeyIcon";
import { Text } from "components/Typography/Typography";

import LoadingSpinnerSmall from "../CircularProgress/CircularProgress";
import Autocomplete from "../FormElementsv2/AutoComplete/AutoComplete";
import FormControlLabel from "../FormElementsv2/FormControlLabel/FormControlLabel";
import Radio, { RadioGroup } from "../FormElementsv2/Radio/Radio";
import Tooltip from "../Tooltip/Tooltip";

import { Field } from "./types";

const insertTextAtCursor = (text, start, end, currentValue) => {
  return currentValue.substring(0, start) + text + currentValue.substring(end);
};

const updateCursorPosition = (element, position) => {
  requestAnimationFrame(() => {
    element?.setSelectionRange(position, position);
  });
};

export const MultilinePasswordInput = ({ field, formData }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const textAreaRef = useRef();
  const compositionRef = useRef(false);

  const currentValue = field.value ?? formData.values[field.name] ?? "";
  const displayValue = isPasswordVisible ? currentValue : currentValue.replace(/[^\n]/g, "•");

  // Create synthetic event helper
  const createChangeEvent = (newValue) => ({
    target: {
      name: field.name,
      value: newValue,
    },
  });

  // Handle composition events (for IME input)
  const handleCompositionStart = () => {
    compositionRef.current = true;
  };

  const handleCompositionEnd = () => {
    compositionRef.current = false;
  };

  // Capture the actual input before it's displayed
  const handleBeforeInput = (event) => {
    if (event.data && !compositionRef.current) {
      event.preventDefault();

      const input: HTMLTextAreaElement = textAreaRef.current!;
      if (!input) return;
      const start = input.selectionStart;
      const end = input.selectionEnd;

      const newValue = insertTextAtCursor(event.data, start, end, currentValue);
      const syntheticEvent = createChangeEvent(newValue);
      field.onChange?.(syntheticEvent);
      formData.handleChange(syntheticEvent);

      updateCursorPosition(input, start + event.data.length);
    }
  };

  // Handle keyboard events for delete/backspace/enter
  const handleKeyDown = (event) => {
    if (compositionRef.current) return;

    const input: HTMLTextAreaElement = textAreaRef.current!;
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    let newValue = currentValue;
    let newCursorPos = start;
    let shouldPrevent = false;

    switch (event.key) {
      case "Backspace":
        shouldPrevent = true;
        if (start === end && start > 0) {
          newValue = currentValue.substring(0, start - 1) + currentValue.substring(start);
          newCursorPos = start - 1;
        } else if (start !== end) {
          newValue = insertTextAtCursor("", start, end, currentValue);
        }
        break;

      case "Delete":
        shouldPrevent = true;
        if (start === end && start < currentValue.length) {
          newValue = currentValue.substring(0, start) + currentValue.substring(start + 1);
        } else if (start !== end) {
          newValue = insertTextAtCursor("", start, end, currentValue);
        }
        break;

      case "Enter":
        shouldPrevent = true;
        newValue = insertTextAtCursor("\n", start, end, currentValue);
        newCursorPos = start + 1;
        break;
    }

    if (shouldPrevent) {
      event.preventDefault();
      const syntheticEvent = createChangeEvent(newValue);
      field.onChange?.(syntheticEvent);
      formData.handleChange(syntheticEvent);
      updateCursorPosition(input, newCursorPos);
    }
  };

  // Handle paste
  const handlePaste = (event) => {
    event.preventDefault();
    const pastedText = event.clipboardData.getData("text");
    const input: HTMLTextAreaElement = textAreaRef.current!;
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;

    const newValue = insertTextAtCursor(pastedText, start, end, currentValue);
    const syntheticEvent = createChangeEvent(newValue);
    field.onChange?.(syntheticEvent);
    formData.handleChange(syntheticEvent);
    updateCursorPosition(input, start + pastedText.length);
  };

  // Prevent copy/cut when hidden
  const preventDefaultHandler = (event) => {
    event.preventDefault();
  };

  // Regular onChange for when password is visible
  const handleChange = (event) => {
    field.onChange?.(event);
    formData.handleChange(event);
  };

  // Conditionally apply masked input handlers
  const maskedInputHandlers = !isPasswordVisible
    ? {
        onCopy: preventDefaultHandler,
        onCut: preventDefaultHandler,
        onPaste: handlePaste,
        onBeforeInput: handleBeforeInput,
        onKeyDown: handleKeyDown,
        onCompositionStart: handleCompositionStart,
        onCompositionEnd: handleCompositionEnd,
      }
    : {};

  const toggleVisibility = () => {
    if (!field.disabled) {
      setIsPasswordVisible(!isPasswordVisible);
    }
  };

  return (
    <TextField
      autoComplete="new-password"
      multiline
      minRows={1}
      maxRows={3}
      id={field.name}
      name={field.name}
      inputRef={textAreaRef}
      value={displayValue}
      disabled={field.disabled}
      onChange={isPasswordVisible ? handleChange : undefined}
      sx={{
        "& .MuiInputAdornment-root": {
          border: "none",
          paddingRight: 0,
        },
        mt: 0,
      }}
      inputProps={{
        "data-testid": field.dataTestId || "multi-line-password-field",
        ...maskedInputHandlers,
      }}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <Text
              as="span"
              size="xsmall"
              weight="medium"
              style={{
                color: "#7F56D9",
                cursor: field.disabled ? "not-allowed" : "pointer",
                userSelect: "none",
                paddingRight: "14px",
                width: "46px",
                textAlign: "center",
                opacity: field.disabled ? 0.6 : 1,
              }}
              onClick={toggleVisibility}
              tabIndex={field.disabled ? -1 : 0}
            >
              {isPasswordVisible ? "Hide" : "Show"}
            </Text>
            {field.showPasswordGenerator && !field.disabled && (
              <Tooltip title="Password Generator" placement="top-end" arrow>
                <Box
                  sx={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    px: "15px",
                    backgroundColor: "#F9F5FF",
                    height: "100%",
                    borderRadius: "0 8px 8px 0",
                    borderLeft: "1px solid #D0D5DD",
                  }}
                  onClick={() => {
                    if (field.disabled) return;

                    const password = Generator.generate({
                      length: 12,
                      numbers: true,
                    });

                    const syntheticEvent = {
                      target: {
                        name: field.name,
                        value: password,
                      },
                    };

                    formData.setFieldValue(field.name, password);
                    field.onChange?.(syntheticEvent);
                    formData.handleChange(syntheticEvent);
                  }}
                >
                  <KeyIcon />
                </Box>
              </Tooltip>
            )}
          </InputAdornment>
        ),
      }}
    />
  );
};

export const TextInput = ({ field, formData }: { field: Field; formData: any }) => {
  const { values, touched, errors, handleChange, handleBlur } = formData;
  return (
    <TextField
      inputProps={{
        "data-testid": field.dataTestId ?? "",
      }}
      type={field.type === "number" ? "number" : "text"}
      id={field.name}
      name={field.name}
      value={field.value ?? values[field.name] ?? ""}
      onChange={(e) => {
        field.onChange?.(e);
        handleChange(e);
      }}
      error={Boolean(touched[field.name] && errors[field.name])}
      onBlur={(e) => {
        field.onBlur?.(e);
        handleBlur(e);
      }}
      disabled={field.disabled}
      {...(field.type === "description" && {
        multiline: true,
        minRows: 3,
        maxRows: 6,
      })}
      {...(field.type === "text-multiline" && {
        multiline: true,
        minRows: 1,
        maxRows: 3,
      })}
      placeholder={field.placeholder ?? ""}
      sx={{ mt: 0 }}
    />
  );
};

const SelectLoadingUI = () => {
  return (
    <Stack alignItems="center" padding={1}>
      <LoadingSpinnerSmall />
    </Stack>
  );
};

export const SelectField = ({ field, formData }) => {
  const { values, touched, errors, handleChange, handleBlur } = formData;
  return (
    <Select
      data-testid={field.dataTestId ?? ""}
      isLoading={field.isLoading}
      id={field.name}
      name={field.name}
      value={field.value ?? values[field.name] ?? ""}
      onBlur={(e) => {
        field.onBlur?.(e);
        handleBlur(e);
      }}
      onChange={(e) => {
        field.onChange?.(e);
        handleChange(e);
      }}
      error={Boolean(touched[field.name] && errors[field.name])}
      disabled={field.disabled}
      sx={{ mt: 0 }}
      maxWidth="590px"
    >
      {field.isLoading ? (
        <SelectLoadingUI />
      ) : field.menuItems?.length > 0 ? (
        field.menuItems.map((option) => {
          const menuItem = (
            <MenuItem key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </MenuItem>
          );

          if (option.disabled && option.disabledMessage) {
            return (
              <Tooltip title={option.disabledMessage} key={option.value} placement="top">
                <span>{menuItem}</span>
              </Tooltip>
            );
          }

          return menuItem;
        })
      ) : (
        <MenuItem value="" disabled>
          <i>{field.emptyMenuText || "No Options"}</i>
        </MenuItem>
      )}
    </Select>
  );
};

export const RadioField = ({ field, formData }) => {
  const { values, handleChange } = formData;
  return (
    <RadioGroup
      row
      name={field.name}
      value={field.value !== undefined ? field.value : values[field.name]} // For the case when value might be 'false'
      onChange={(e) => {
        field.onChange?.(e);
        handleChange(e);
      }}
    >
      {field.options.map((option) => (
        <FormControlLabel
          data-testid={option.dataTestId ?? ""}
          control={<Radio />}
          key={option.value}
          value={option.value}
          label={
            <Stack direction={"row"} alignItems={"center"} justifyContent={"flex-start"} gap="2px">
              {option.label}
              {option.labelChips?.map((item) => item)}
            </Stack>
          }
          disabled={option.disabled}
        />
      ))}
    </RadioGroup>
  );
};

export const SingleSelectAutocomplete = ({ field, formData }) => {
  return (
    <Autocomplete
      data-testid={field.dataTestId ?? ""}
      options={field.menuItems || []}
      name={field.name}
      value={field.value ?? ""}
      onChange={(e, newValue) => {
        field.onChange?.(e);
        formData.setFieldValue(field.name, newValue);
      }}
      onBlur={(e) => {
        field.onBlur?.(e);
        formData.setFieldTouched(field.name, true);
      }}
      disabled={field.disabled}
      getOptionLabel={(option) => option}
      error={Boolean(formData.touched[field.name] && formData.errors[field.name])}
    />
  );
};

export const MultiSelectAutocomplete = ({ field, formData }) => {
  return (
    <Autocomplete
      data-testid={field.dataTestId}
      multiple
      options={field.menuItems || []}
      name={field.name}
      value={field.value ?? field.values[field.name] ?? ""}
      onChange={(e, newValue) => {
        field.onChange?.(e);
        formData.setFieldValue(field.name, newValue);
      }}
      onBlur={() => {
        formData.setFieldTouched(field.name, true);
      }}
      disabled={field.disabled}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, value) => option.value === value.value}
      error={Boolean(formData.touched[field.name] && formData.errors[field.name])}
    />
  );
};

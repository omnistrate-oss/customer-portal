import { FC, Fragment } from "react";
import AddIcon from "@mui/icons-material/Add";
import { Box, buttonClasses } from "@mui/material";
import { FieldArray, FormikProps, FormikProvider } from "formik";

import Button from "src/components/Button/Button";
import FieldError from "src/components/FormElementsv2/FieldError/FieldError";
import TextField from "src/components/FormElementsv2/TextField/TextField";
import IconButtonSquare from "src/components/IconButtonSquare/IconButtonSquare";
import DeleteIcon from "src/components/Icons/Delete/Delete";
import { colors } from "src/themeConfig";

import { customTagsInitializer } from "../constants";

type CustomTagsFieldProps = {
  formData: FormikProps<any>;
  disabled?: boolean;
};

const CustomTagsField: FC<CustomTagsFieldProps> = ({ formData, disabled }) => {
  const values = formData.values?.customTags;
  const errors = formData.errors?.customTags;
  const touched = formData.touched?.customTags;
  return (
    <FormikProvider value={formData}>
      <FieldArray
        name="customTags"
        render={({ remove, push }) => (
          <>
            {values?.map((tag, index) => (
              <Fragment key={index}>
                <Box display="flex" alignItems={"flex-start"} gap={"16px"} sx={{ mt: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      value={tag?.key}
                      placeholder="Name"
                      onChange={formData.handleChange}
                      name={`customTags.${index}.key`}
                      onBlur={formData.handleBlur}
                      sx={{ flexGrow: 1 }}
                      disabled={disabled}
                      error={touched?.[index]?.key && Boolean(errors?.[index]?.key)}
                    />
                    <FieldError>{touched?.[index]?.key && errors?.[index]?.key}</FieldError>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      value={tag?.value}
                      placeholder="Value"
                      onChange={formData.handleChange}
                      name={`customTags.${index}.value`}
                      onBlur={formData.handleBlur}
                      sx={{ flexGrow: 1 }}
                      disabled={disabled}
                      error={touched?.[index]?.value && Boolean(errors?.[index]?.value)}
                    />
                    <FieldError>{touched?.[index]?.value && errors?.[index]?.value}</FieldError>
                  </Box>

                  <IconButtonSquare
                    sx={{
                      minWidth: 45,
                      marginTop: "6px",
                      [`&.${buttonClasses.outlined}`]: { border: `1px solid ${colors.error300}` },
                    }}
                    onClick={() => remove(index)}
                    disabled={disabled}
                  >
                    <DeleteIcon color={colors.error700} />
                  </IconButtonSquare>
                </Box>
              </Fragment>
            ))}
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              outlineColor="#D6BBFB"
              fontColor="#6941C6"
              sx={{
                mt: "16px",
              }}
              onClick={() => push({ ...customTagsInitializer })}
              disabled={disabled}
            >
              Add Tag
            </Button>
          </>
        )}
      />
    </FormikProvider>
  );
};

export default CustomTagsField;

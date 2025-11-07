import FieldLabel from "../FormElements/FieldLabel/FieldLabel";
import FieldDescription from "../FormElementsv2/FieldDescription/FieldDescription";
import FieldError from "../FormElementsv2/FieldError/FieldError";

import {
  MultilinePasswordInput,
  MultiSelectAutocomplete,
  RadioField,
  SelectField,
  SingleSelectAutocomplete,
  TextInput,
} from "./Common";
import { Field } from "./types";

type GridDynamicFieldProps = {
  field: Field;
  formData: any;
};

const GridDynamicField: React.FC<GridDynamicFieldProps> = ({ field, formData }) => {
  const { type, isHidden, customComponent } = field;

  if (isHidden) {
    return null;
  }

  // Use Formik's getFieldMeta helper to get error and touched state
  const fieldMeta = formData.getFieldMeta(field.name);
  const { error: fieldError, touched: fieldTouched } = fieldMeta;

  let Field: null | React.ReactNode = null;

  if (customComponent) {
    Field = customComponent;
  } else if (type === "text" || type === "text-multiline" || type === "description" || type === "number") {
    Field = <TextInput field={field} formData={formData} />;
  } else if (type === "password") {
    Field = <MultilinePasswordInput field={field} formData={formData} />;
  } else if (type === "select") {
    Field = <SelectField field={field} formData={formData} />;
  } else if (type === "radio") {
    Field = <RadioField field={field} formData={formData} />;
  } else if (type === "single-select-autocomplete") {
    Field = <SingleSelectAutocomplete field={field} formData={formData} />;
  } else if (type === "multi-select-autocomplete") {
    Field = <MultiSelectAutocomplete field={field} formData={formData} />;
  }

  return (
    <div className="grid grid-cols-6" style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}>
      <div className="col-span-2" style={{ paddingRight: "32px" }}>
        <FieldLabel required={field.required} sx={{ color: "#414651", fontWeight: "600" }}>
          {field.label}
        </FieldLabel>
        <FieldDescription sx={{ mt: 0, color: "#535862" }}>{field.subLabel}</FieldDescription>
      </div>

      <div className="col-span-4">
        {Field}
        {field.description && field.description}
        {typeof fieldError === "string" && fieldTouched && <FieldError marginTop="4px">{fieldError}</FieldError>}
      </div>
    </div>
  );
};

export default GridDynamicField;

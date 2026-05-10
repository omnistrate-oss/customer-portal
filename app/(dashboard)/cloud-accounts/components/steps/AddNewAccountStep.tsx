"use client";

import { FormikProps } from "formik";

import CardWithTitle from "src/components/Card/CardWithTitle";

import { FormConfiguration } from "components/DynamicForm/types";
import GridDynamicField from "components/DynamicForm/GridDynamicField";

type AddNewAccountStepProps = {
  // FormikProps<any> is intentional here – the form values shape is dynamic
  // based on the selected cloud provider, same pattern as GridDynamicForm.
  formData: FormikProps<any>;
  formConfiguration: FormConfiguration;
  formMode: "create" | "view";
};

const AddNewAccountStep: React.FC<AddNewAccountStepProps> = ({ formData, formConfiguration }) => {
  const sections = formConfiguration.sections || [];

  return (
    <div className="space-y-6">
      {sections.map((section, sIdx) => (
        <CardWithTitle key={sIdx} title={section.title}>
          <div className="space-y-6">
            {section.fields.map((field, fIdx) => (
              <GridDynamicField key={fIdx} field={field} formData={formData} />
            ))}
          </div>
        </CardWithTitle>
      ))}
    </div>
  );
};

export default AddNewAccountStep;

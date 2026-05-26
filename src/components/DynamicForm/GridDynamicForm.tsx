import React from "react";

import { colors } from "src/themeConfig";
import { FormMode } from "src/types/common/enums";

import Button from "../Button/Button";
import CardWithTitle from "../Card/CardWithTitle";
import LoadingSpinnerSmall from "../CircularProgress/CircularProgress";
import Form from "../FormElementsv2/Form/Form";
import { Text } from "../Typography/Typography";

import GridDynamicField from "./GridDynamicField";
import PreviewCard from "./PreviewCard";
import { FormConfiguration } from "./types";

type GridDynamicFormProps = {
  formData: any;
  formConfiguration: FormConfiguration;
  formMode: FormMode;
  isFormSubmitting?: boolean;
  onClose: () => void;
  disableSubmit?: boolean;
  previewCardTitle?: string;
};

const GridDynamicForm: React.FC<GridDynamicFormProps> = ({
  formConfiguration,
  formData,
  formMode,
  isFormSubmitting,
  onClose,
  disableSubmit,
  previewCardTitle,
}) => {
  const sections = formConfiguration.sections || [];
  const footer = formConfiguration.footer;

  return (
    // @ts-ignore
    <Form
      data-testid={formConfiguration.dataTestId || "dynamic-form"}
      className="grid grid-cols-7 items-start gap-8"
      onSubmit={formData.handleSubmit}
    >
      <div className="col-span-5">
        {sections.map((section, index) => {
          return (
            <CardWithTitle key={index} title={section.title}>
              <div className="space-y-6">
                {section.fields.map((field, index) => {
                  return <GridDynamicField key={index} field={field} formData={formData} />;
                })}
              </div>
            </CardWithTitle>
          );
        })}
      </div>

      <div className="col-span-2">
        <div
          style={{
            position: "sticky",
            top: "104px",
            minHeight: "660px",
            border: `1px solid ${colors.gray300}`,
            boxShadow: "0px 2px 2px -1px #0A0D120A, 0px 4px 6px -2px #0A0D1208",
          }}
          className=" bg-white rounded-xl flex flex-col"
        >
          <div className="py-4 px-6 border-b border-gray-200">
            <Text size="large" weight="semibold" color={colors.purple600}>
              {previewCardTitle || "Preview"}
            </Text>
          </div>

          <PreviewCard sections={sections} formData={formData} />

          <div
            style={{
              margin: "0px 16px 20px",
              paddingTop: "20px",
              borderTop: "1px solid #E9EAEB",
            }}
            className="flex items-center gap-3"
          >
            {onClose && (
              <Button
                data-testid="cancel-button"
                variant="outlined"
                onClick={onClose}
                disabled={isFormSubmitting}
                sx={{ marginLeft: "auto" }} // Pushes the 2 buttons to the end
              >
                Cancel
              </Button>
            )}
            {footer.submitButton[formMode] && (
              <Button
                data-testid="submit-button"
                variant="contained"
                disabled={isFormSubmitting || disableSubmit}
                type="submit"
              >
                {formConfiguration.footer.submitButton[formMode] || "Submit"}
                {isFormSubmitting && <LoadingSpinnerSmall />}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Form>
  );
};

export default GridDynamicForm;

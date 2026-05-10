"use client";

import { ChangeEvent } from "react";
import { FormikProps } from "formik";
import { Box, Stack } from "@mui/material";

import CardWithTitle from "src/components/Card/CardWithTitle";
import Switch from "src/components/Switch/Switch";
import { Text } from "src/components/Typography/Typography";

import { FormConfiguration } from "components/DynamicForm/types";
import GridDynamicField from "components/DynamicForm/GridDynamicField";

type AddNewAccountStepProps = {
  // FormikProps<Record<string, unknown>> preserves type-safety for the dynamic
  // form values structure (varies by cloud provider) without using plain `any`.
  formData: FormikProps<Record<string, unknown>>;
  formConfiguration: FormConfiguration;
  formMode: "create" | "view";
  enablePrivateConnectivity: boolean;
  onTogglePrivateConnectivity: (value: boolean) => void;
};

const AddNewAccountStep: React.FC<AddNewAccountStepProps> = ({
  formData,
  formConfiguration,
  enablePrivateConnectivity,
  onTogglePrivateConnectivity,
}) => {
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
      <CardWithTitle title="Network Access">
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Text size="small" weight="semibold" color="#101828">
              Enable Private Connectivity
            </Text>
            <Text size="xsmall" weight="regular" color="#535862">
              Enable private connectivity configuration for this cloud account.
            </Text>
          </Box>
          <Switch
            checked={enablePrivateConnectivity}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onTogglePrivateConnectivity(event.target.checked)
            }
            inputProps={{ "aria-label": "Enable Private Connectivity toggle" }}
          />
        </Stack>
      </CardWithTitle>
    </div>
  );
};

export default AddNewAccountStep;

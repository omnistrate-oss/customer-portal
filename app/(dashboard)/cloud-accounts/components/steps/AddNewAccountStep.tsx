"use client";

import { ChangeEvent } from "react";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { Box, Stack } from "@mui/material";
import { FormikProps } from "formik";

import CardWithTitle from "src/components/Card/CardWithTitle";
import AlertTriangle from "src/components/Icons/AlertTriangle/AlertTriangle";
import Switch from "src/components/Switch/Switch";
import { Text } from "src/components/Typography/Typography";
import GridDynamicField from "components/DynamicForm/GridDynamicField";
import { FormConfiguration } from "components/DynamicForm/types";

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
  const cloudProvider =
    typeof formData.values.cloudProvider === "string" ? formData.values.cloudProvider : undefined;

  const privateConnectivityType =
    cloudProvider === "aws"
      ? "AWS PrivateLink"
      : cloudProvider === "gcp"
        ? "Google Cloud Private Service Connect"
        : cloudProvider === "azure"
          ? "Azure Private Link"
          : cloudProvider === "oci"
            ? "OCI private connectivity"
            : "provider-native private connectivity";

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
        <Stack gap="14px">
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap="16px">
            <Text size="small" weight="semibold" color="#101828">
              Enable Private Connectivity
            </Text>
            <Switch
              checked={enablePrivateConnectivity}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onTogglePrivateConnectivity(event.target.checked)
              }
              inputProps={{ "aria-label": "Enable Private Connectivity toggle" }}
            />
          </Stack>

          <Stack gap="10px">
            <Text size="small" weight="regular" color="#535862">
              Route all control-plane and app-plane communication over provider-native private
              connectivity ({privateConnectivityType}).
            </Text>

            <Stack direction="row" alignItems="flex-start" gap="6px">
              <KeyboardArrowRightIcon sx={{ color: "#101828", fontSize: 22, mt: "-2px" }} />
              <Text size="small" weight="regular" color="#344054">
                No traffic traverses the public internet
              </Text>
            </Stack>

            <Stack direction="row" alignItems="flex-start" gap="8px">
              <Box sx={{ mt: "2px" }}>
                <AlertTriangle color="#F79009" />
              </Box>
              <Text size="small" weight="regular" color="#344054">
                Additional charges apply per endpoint-hour and GB processed
              </Text>
            </Stack>
          </Stack>
        </Stack>
      </CardWithTitle>
    </div>
  );
};

export default AddNewAccountStep;

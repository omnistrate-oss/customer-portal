"use client";

import { useMemo } from "react";
import CloudProviderRadio from "app/(dashboard)/components/CloudProviderRadio/CloudProviderRadio";
import { useFormik } from "formik";
import * as yup from "yup";

import { $api } from "src/api/query";
import useSnackbar from "src/hooks/useSnackbar";
import { colors } from "src/themeConfig";
import { SetState } from "src/types/common/reactGenerics";
import { ResourceInstance } from "src/types/resourceInstance";
import { ServiceOffering } from "src/types/serviceOffering";
import { Subscription } from "src/types/subscription";
import Button from "components/Button/Button";
import CardWithTitle from "components/Card/CardWithTitle";
import LoadingSpinnerSmall from "components/CircularProgress/CircularProgress";
import GridDynamicField from "components/DynamicForm/GridDynamicField";
import PreviewCard from "components/DynamicForm/PreviewCard";
import { Field } from "components/DynamicForm/types";
import Form from "components/FormElementsv2/Form/Form";
import { Text } from "components/Typography/Typography";

import {
  getCustomWorkflowInitialRequestParams,
  InputParameterEntity,
  normalizeCustomWorkflowRequestParams,
  ResourceInstanceSupportedOperation,
} from "../customWorkflow";
import { filterSchemaByCloudProvider } from "../utils";

import { getDeploymentConfigurationFields } from "./InstanceFormFields";

const hasFieldValue = (value: unknown) => {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim() !== "";
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
};

const buildRequestParamsValidationSchema = (apiParameters: InputParameterEntity[] = []) => {
  const requestParamsValidation: Record<string, yup.AnySchema> = {};

  apiParameters.forEach((param) => {
    const key = param.key;
    const type = (param.type || "").toLowerCase();
    let fieldValidation = yup.mixed();

    if (param.required) {
      fieldValidation = fieldValidation.test("required", `${param.displayName || key} is required`, (value) =>
        hasFieldValue(value)
      );
    }

    if (["number", "float64"].includes(type)) {
      fieldValidation = fieldValidation.test("number", `Invalid data in ${param.displayName || key}`, (value) => {
        if (!hasFieldValue(value)) {
          return true;
        }

        return !Number.isNaN(Number(value));
      });
    }

    if (["any", "json"].includes(type)) {
      fieldValidation = fieldValidation.test("json", `Invalid JSON in ${param.displayName || key}`, (value) => {
        if (!hasFieldValue(value) || typeof value !== "string") {
          return true;
        }

        try {
          JSON.parse(value);
          return true;
        } catch {
          return false;
        }
      });
    }

    if (param.regex && ["string", "password", "secret"].includes(type)) {
      fieldValidation = fieldValidation.test(
        "regex",
        `Value does not match the required pattern: ${param.regex}`,
        (value) => {
          if (!hasFieldValue(value)) {
            return true;
          }

          try {
            const regex = new RegExp(param.regex as string);
            return Array.isArray(value)
              ? value.every((item) => !hasFieldValue(item) || regex.test(String(item)))
              : regex.test(String(value));
          } catch {
            return true;
          }
        }
      );
    }

    requestParamsValidation[key] = fieldValidation;
  });

  return yup.object({
    requestParams: yup.object().shape(requestParamsValidation),
  });
};

const getInstanceCloudProvider = (instance?: ResourceInstance) => {
  return (
    instance?.cloud_provider ||
    (instance as any)?.cloudProvider ||
    (instance as any)?.resultParameters?.cloud_provider ||
    ""
  );
};

type CustomWorkflowFormProps = {
  instance?: ResourceInstance;
  serviceOffering?: ServiceOffering;
  selectedResource?: any;
  subscription?: Subscription;
  workflowOperation?: ResourceInstanceSupportedOperation;
  refetchInstances: () => void;
  setIsOverlayOpen: SetState<boolean>;
  setSelectedRows: SetState<string[]>;
};

const CustomWorkflowForm: React.FC<CustomWorkflowFormProps> = ({
  instance,
  serviceOffering,
  selectedResource,
  subscription,
  workflowOperation,
  refetchInstances,
  setIsOverlayOpen,
  setSelectedRows,
}) => {
  const snackbar = useSnackbar();
  const instanceCloudProvider = useMemo(() => getInstanceCloudProvider(instance), [instance]);
  const apiParameters = useMemo(() => workflowOperation?.apiParameters || [], [workflowOperation?.apiParameters]);
  const visibleApiParameters = useMemo(
    () => filterSchemaByCloudProvider(apiParameters as any, instanceCloudProvider) as InputParameterEntity[],
    [apiParameters, instanceCloudProvider]
  );
  const workflowTitle = workflowOperation?.name || "Custom Workflow";

  const initialValues = useMemo(
    () => ({
      id: instance?.id || "",
      cloudProvider: instanceCloudProvider,
      region: instance?.region || "",
      requestParams: getCustomWorkflowInitialRequestParams(visibleApiParameters),
    }),
    [visibleApiParameters, instance, instanceCloudProvider]
  );

  const customWorkflowMutation = $api.useMutation(
    "post",
    "/2022-09-01-00/resource-instance/{serviceProviderId}/{serviceKey}/{serviceAPIVersion}/{serviceEnvironmentKey}/{serviceModelKey}/{productTierKey}/{resourceKey}/{id}/custom-workflow/{workflowId}/execute",
    {
      onSuccess: async () => {
        refetchInstances();
        setSelectedRows([]);
        snackbar.showSuccess(`${workflowTitle} requested`);
        setIsOverlayOpen(false);
      },
    }
  );

  const formData = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema: buildRequestParamsValidationSchema(visibleApiParameters),
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: (values) => {
      if (!instance) {
        return snackbar.showError("No instance selected");
      }

      if (!instance.id) {
        return snackbar.showError("No instance selected");
      }

      if (!serviceOffering) {
        return snackbar.showError("Product not found");
      }

      if (!selectedResource) {
        return snackbar.showError("Resource not found");
      }

      if (!workflowOperation?.id) {
        return snackbar.showError(`${workflowTitle} workflow not found`);
      }

      let requestParams: Record<string, unknown>;
      try {
        requestParams = normalizeCustomWorkflowRequestParams(values.requestParams, visibleApiParameters);
      } catch (error) {
        return snackbar.showError(error instanceof Error ? error.message : "Invalid request parameters");
      }

      customWorkflowMutation.mutate({
        params: {
          path: {
            serviceProviderId: serviceOffering.serviceProviderId,
            serviceKey: serviceOffering.serviceURLKey,
            serviceAPIVersion: serviceOffering.serviceAPIVersion,
            serviceEnvironmentKey: serviceOffering.serviceEnvironmentURLKey,
            serviceModelKey: serviceOffering.serviceModelURLKey,
            productTierKey: serviceOffering.productTierURLKey,
            resourceKey: selectedResource.urlKey,
            id: instance.id,
            workflowId: workflowOperation.id,
          },
          query: {
            subscriptionId: subscription?.id,
          },
        },
        body: {
          requestParams,
        },
      });
    },
  });

  const standardInformationFields: Field[] = [
    {
      dataTestId: "switch-primary-instance-id-input",
      label: "ID",
      subLabel: "Unique id of deployment instance",
      name: "id",
      value: formData.values.id,
      type: "text",
      disabled: true,
    },
    {
      label: "Cloud Provider",
      subLabel: "Select the cloud provider",
      name: "cloudProvider",
      customComponent: (
        <CloudProviderRadio
          cloudProviders={formData.values.cloudProvider ? [formData.values.cloudProvider] : []}
          name="cloudProvider"
          formData={formData}
          disabled
        />
      ),
    },
    {
      dataTestId: "switch-primary-region-input",
      label: "Region",
      subLabel: "Cloud provider region hosting this instance",
      name: "region",
      value: formData.values.region,
      type: "text",
      disabled: true,
    },
  ];

  const requestParameterFields = useMemo(
    () =>
      getDeploymentConfigurationFields(
        "create",
        formData.values,
        { inputParameters: visibleApiParameters } as any,
        {},
        false,
        {
          filteredParameterKeys: [],
          includeCloudProviderAccountConfig: true,
          renderJsonAsCodeEditor: true,
        }
      ),
    [visibleApiParameters, formData.values]
  );

  const sections = [
    {
      title: "Standard Information",
      fields: standardInformationFields,
    },
    {
      title: "Request Parameters",
      fields: requestParameterFields,
    },
  ];

  return (
    // @ts-ignore
    <Form className="grid grid-cols-7 gap-8" onSubmit={formData.handleSubmit}>
      <div className="col-span-5 space-y-6">
        <CardWithTitle title="Standard Information">
          <div className="space-y-6">
            {standardInformationFields.map((field, index) => (
              <GridDynamicField key={index} field={field} formData={formData} />
            ))}
          </div>
        </CardWithTitle>

        <CardWithTitle title="Request Parameters">
          {requestParameterFields.length ? (
            <div className="space-y-6">
              {requestParameterFields.map((field, index) => (
                <GridDynamicField key={index} field={field} formData={formData} />
              ))}
            </div>
          ) : (
            <Text size="small" weight="regular" color={colors.gray500}>
              No request parameters required.
            </Text>
          )}
        </CardWithTitle>
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
          className="flex flex-col rounded-xl bg-white"
        >
          <div className="border-b border-gray-200 px-6 py-4">
            <Text size="large" weight="semibold" color={colors.purple600}>
              Deployment Instance Summary
            </Text>
          </div>

          <PreviewCard formData={formData} sections={sections} />

          <div
            style={{
              margin: "0px 16px 20px",
              paddingTop: "20px",
              borderTop: "1px solid #E9EAEB",
            }}
            className="flex items-center gap-3"
          >
            <Button
              data-testid="cancel-button"
              variant="outlined"
              onClick={() => setIsOverlayOpen(false)}
              disabled={customWorkflowMutation.isPending}
              sx={{ marginLeft: "auto" }}
            >
              Cancel
            </Button>

            <Button
              data-testid="submit-button"
              variant="contained"
              type="submit"
              disabled={customWorkflowMutation.isPending}
            >
              {workflowTitle}
              {customWorkflowMutation.isPending && <LoadingSpinnerSmall />}
            </Button>
          </div>
        </div>
      </div>
    </Form>
  );
};

export default CustomWorkflowForm;

"use client";

import React, { useEffect, useMemo, useState } from "react";
import useCustomNetworks from "app/(dashboard)/custom-networks/hooks/useCustomNetworks";
import { useFormik } from "formik";
import { cloneDeep } from "lodash";
import * as yup from "yup";

import { $api } from "src/api/query";
import { productTierTypes } from "src/constants/servicePlan";
import useAvailabilityZone from "src/hooks/query/useAvailabilityZone";
import useResourcesInstanceIds from "src/hooks/useResourcesInstanceIds";
import useSnackbar from "src/hooks/useSnackbar";
import { useGlobalData } from "src/providers/GlobalDataProvider";
import { colors } from "src/themeConfig";
import { CloudProvider } from "src/types/common/enums";
import { APIEntity } from "src/types/serviceOffering";
import { isCloudAccountInstance } from "src/utils/access/byoaResource";
import Button from "components/Button/Button";
import CardWithTitle from "components/Card/CardWithTitle";
import LoadingSpinnerSmall from "components/CircularProgress/CircularProgress";
import GridDynamicField from "components/DynamicForm/GridDynamicField";
import PreviewCard from "components/DynamicForm/PreviewCard";
import Form from "components/FormElementsv2/Form/Form";
import LoadingSpinner from "components/LoadingSpinner/LoadingSpinner";
import { Text } from "components/Typography/Typography";
import * as Yup from "yup";
import useResourceSchema from "../hooks/useResourceSchema";
import { getInitialValues } from "../utils";

import {
  getDeploymentConfigurationFields,
  getNetworkConfigurationFields,
  getStandardInformationFields,
} from "./InstanceFormFields";

const InstanceForm = ({
  formMode,
  instances,
  selectedInstance,
  refetchInstances,
  setOverlayType,
  setIsOverlayOpen,
  setCreateInstanceModalData,
}) => {
  const snackbar = useSnackbar();

  // State for validation schema
  const [validationSchema, setValidationSchema] = useState(() =>
    yup.object({
      serviceId: yup.string().required("Product is required"),
      servicePlanId: yup.string().required("A plan with a valid subscription is required"),
      subscriptionId: yup.string().required("Subscription is required"),
      resourceId: yup.string().required("Resource is required"),
      // requestParams validation will be added dynamically
    })
  );

  const {
    subscriptions,
    serviceOfferings,
    serviceOfferingsObj,
    servicesObj,
    isFetchingServiceOfferings,
    subscriptionsObj,
    isFetchingSubscriptions,
  } = useGlobalData();

  const nonCloudAccountInstances = useMemo(() => {
    return instances.filter((instance) => !isCloudAccountInstance(instance));
  }, [instances]);

  const createInstanceMutation = $api.useMutation(
    "post",
    "/2022-09-01-00/resource-instance/{serviceProviderId}/{serviceKey}/{serviceAPIVersion}/{serviceEnvironmentKey}/{serviceModelKey}/{productTierKey}/{resourceKey}",
    {
      onSuccess: (response) => {
        // Show the Create Instance Dialog
        setIsOverlayOpen(true);
        setOverlayType("create-instance-dialog");
        setCreateInstanceModalData({
          isCustomDNS: formData.values.requestParams?.custom_dns_configuration,
          instanceId: response?.id,
        });

        snackbar.showSuccess("Instance created successfully");
        refetchInstances();
        formData.resetForm();
      },
    }
  );

  const updateInstanceMutation = $api.useMutation(
    "patch",
    "/2022-09-01-00/resource-instance/{serviceProviderId}/{serviceKey}/{serviceAPIVersion}/{serviceEnvironmentKey}/{serviceModelKey}/{productTierKey}/{resourceKey}/{id}",
    {
      onSuccess: () => {
        refetchInstances();
        formData.resetForm();
        snackbar.showSuccess("Updated Deployment Instance");
        setIsOverlayOpen(false);
      },
    }
  );

  const formData = useFormik({
    initialValues: getInitialValues(
      selectedInstance,
      subscriptions,
      serviceOfferingsObj,
      serviceOfferings,
      nonCloudAccountInstances
    ),
    enableReinitialize: true,
    validationSchema: validationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values) => {
      const offering = serviceOfferingsObj[values.serviceId]?.[values.servicePlanId];
      const selectedResource = offering?.resourceParameters.find(
        (resource) => resource.resourceId === values.resourceId
      );

      const data: any = {
        ...cloneDeep(values),
      };

      const createSchema =
        // eslint-disable-next-line no-use-before-define
        resourceSchemaData?.apis?.find((api) => api.verb === "CREATE")?.inputParameters || [];

      const updateSchema =
        // eslint-disable-next-line no-use-before-define
        resourceSchemaData?.apis?.find((api) => api.verb === "UPDATE")?.inputParameters || [];

      const schema = formMode === "create" ? createSchema : updateSchema;
      const inputParametersObj = schema.reduce((acc: any, param: any) => {
        acc[param.key] = param;
        return acc;
      }, {});

      if (formMode === "create") {
        let isTypeError = false;
        Object.keys(data.requestParams).forEach((key) => {
          const result = schema.find((schemaParam) => {
            return schemaParam.key === key;
          });

          switch (result?.type?.toLowerCase()) {
            case "number":
              if (data.requestParams[key] === "") break;
              data.requestParams[key] = Number(data.requestParams[key]);
              break;
            case "float64":
              if (data.requestParams[key] === "") break;
              const output = Number(data.requestParams[key]);
              if (!Number.isNaN(output)) {
                data.requestParams[key] = Number(data.requestParams[key]);
              } else {
                snackbar.showError(`Invalid data in ${key}`);
                isTypeError = true;
              }
              break;
            case "boolean":
              if (data.requestParams[key] === "true") data.requestParams[key] = true;
              else data.requestParams[key] = false;
              break;
          }
        });

        for (const key in data.requestParams) {
          const value = data.requestParams[key];

          if (value === undefined || (typeof value === "string" && !value.trim())) {
            delete data.requestParams[key];
          }
        }

        // Remove cloud_provider_native_network_id if cloudProvider is gcp or azure
        if (data.cloudProvider === "gcp" || data.cloudProvider === "azure") {
          delete data.requestParams.cloud_provider_native_network_id;
        }

        // Check for Required Fields
        const requiredFields = schema
          .filter((field) => !["cloud_provider", "region"].includes(field.key))
          .filter((schemaParam) => schemaParam.required);

        data.cloud_provider = data.cloudProvider;
        data.custom_network_id = data.requestParams.custom_network_id;

        const networkTypeFieldExists =
          inputParametersObj["cloud_provider"] &&
          offering?.productTierType !== productTierTypes.OMNISTRATE_MULTI_TENANCY &&
          offering?.supportsPublicNetwork;

        if (!data.network_type) {
          delete data.network_type;
        }

        if (!data.cloudProvider && inputParametersObj["cloud_provider"]) {
          return snackbar.showError("Cloud Provider is required");
        } else if (!data.region && inputParametersObj["region"]) {
          return snackbar.showError("Region is required");
        } else if (!data.network_type && networkTypeFieldExists) {
          return snackbar.showError("Network Type is required");
        }

        if (inputParametersObj["custom_dns_configuration"] && data.requestParams["custom_dns_configuration"]) {
          data.requestParams.custom_dns_configuration = {
            [selectedResource?.urlKey || ""]: data.requestParams.custom_dns_configuration,
          };
        }

        for (const field of requiredFields) {
          if (data.requestParams[field.key] === undefined) {
            snackbar.showError(`${field.displayName || field.key} is required`);
            return;
          }
        }

        if (!isTypeError) {
          createInstanceMutation.mutate({
            params: {
              path: {
                serviceProviderId: offering?.serviceProviderId,
                serviceKey: offering?.serviceURLKey,
                serviceAPIVersion: offering?.serviceAPIVersion,
                serviceEnvironmentKey: offering?.serviceEnvironmentURLKey,
                serviceModelKey: offering?.serviceModelURLKey,
                productTierKey: offering?.productTierURLKey,
                resourceKey: selectedResource?.urlKey || "",
              },
              query: {
                subscriptionId: values.subscriptionId,
              },
            },

            body: data,
          });
        }
      } else {
        // Only send the fields that have changed
        const requestParams = {},
          oldResultParams = selectedInstance?.result_params;

        for (const key in data.requestParams) {
          const value = data.requestParams[key];
          if (oldResultParams[key] !== value) {
            requestParams[key] = value;
          }
        }

        data.requestParams = requestParams;
        delete data.requestParams.network_type;
        delete data.requestParams.custom_network_id;
        delete data.requestParams.custom_availability_zone;

        if (!Object.keys(requestParams).length && data.network_type === selectedInstance?.network_type) {
          return snackbar.showError("Please update at least one field before submitting");
        }

        let isTypeError = false;
        Object.keys(data.requestParams).forEach((key) => {
          const result = schema.find((schemaParam) => {
            return schemaParam.key === key;
          });

          switch (result?.type?.toLowerCase()) {
            case "number":
              if (data.requestParams[key] === "") break;
              data.requestParams[key] = Number(data.requestParams[key]);
              break;
            case "float64":
              if (data.requestParams[key] === "") break;
              const output = Number(data.requestParams[key]);
              if (!Number.isNaN(output)) {
                data.requestParams[key] = Number(data.requestParams[key]);
              } else {
                snackbar.showError(`Invalid data in ${key}`);
                isTypeError = true;
              }
              break;
            case "boolean":
              if (data.requestParams[key] === "true") data.requestParams[key] = true;
              else data.requestParams[key] = false;
              break;
          }
        });

        // Remove Empty Fields from data.requestParams
        for (const key in data.requestParams) {
          const value = data.requestParams[key];

          if (value === undefined || (typeof value === "string" && !value.trim())) {
            delete data.requestParams[key];
          }
        }

        if (!isTypeError) {
          updateInstanceMutation.mutate({
            params: {
              path: {
                serviceProviderId: offering?.serviceProviderId,
                serviceKey: offering?.serviceURLKey,
                serviceAPIVersion: offering?.serviceAPIVersion,
                serviceEnvironmentKey: offering?.serviceEnvironmentURLKey,
                serviceModelKey: offering?.serviceModelURLKey,
                productTierKey: offering?.productTierURLKey,
                resourceKey: selectedResource?.urlKey || "",
                id: selectedInstance?.id,
              },
              query: {
                subscriptionId: values.subscriptionId,
              },
            },
            body: data,
          });
        }
      }
    },
  });

  const { values } = formData;

  const offering = serviceOfferingsObj[values.serviceId]?.[values.servicePlanId];

  const { data: customNetworks = [], isFetching: isFetchingCustomNetworks } = useCustomNetworks({
    enabled: values.requestParams?.custom_network_id !== undefined, // Fetch only if custom_network_id is present
    refetchOnWindowFocus: true, // User can create a custom network and come back to this tab
  });

  const { data: resourceSchemaData, isFetching: isFetchingResourceSchema } = useResourceSchema({
    serviceId: values.serviceId,
    resourceId: selectedInstance?.resourceID || values.resourceId,
    instanceId: selectedInstance?.id,
  });

  const resourceCreateSchema = resourceSchemaData?.apis?.find((api) => api.verb === "CREATE") as APIEntity;
  const resourceModifySchema = resourceSchemaData?.apis?.find((api) => api.verb === "UPDATE") as APIEntity;

  const requestParamsCreateValidationSchema = useMemo(() => {
    const inputParams = resourceCreateSchema?.inputParameters || [];

    // Create validation rules for requestParams
    const requestParamsValidation: Record<string, any> = {};

    inputParams.forEach((param) => {
      if (param.custom === true && ["STRING", "PASSWORD", "SECRET"].includes(param.type?.toUpperCase())) {
        // Only add regex validation if regex is defined and not empty
        // @ts-ignore - regex property exists but not in type definition
        if (param.regex && param.regex.trim()) {
          // Test if the regex pattern is valid before adding validation
          let isValidRegex = false;
          try {
            // @ts-ignore - regex property exists but not in type definition
            new RegExp(param.regex);
            isValidRegex = true;
          } catch (error) {
            // @ts-ignore - regex property exists but not in type definition
            console.warn(`Invalid regex pattern for parameter '${param.key}':`, param.regex, error);
            isValidRegex = false;
          }

          if (isValidRegex) {
            const fieldValidation = Yup.string().test(
              "regex-validation",
              // @ts-ignore - regex property exists but not in type definition
              `Value does not match the required pattern: ${param.regex}`,
              function (value) {
                if (!value) return true; // Empty values handled by required validation

                // @ts-ignore - regex property exists but not in type definition
                const regex = new RegExp(param.regex);

                // Handle array values (for multi-select fields)
                if (Array.isArray(value)) {
                  if (value.length === 0) return true;
                  return value.every((item) => !item || regex.test(item));
                }

                // Handle single values
                return regex.test(value);
              }
            );

            requestParamsValidation[param.key] = fieldValidation;
          }
        }
      }
    });

    return Yup.object().shape(requestParamsValidation);
  }, [resourceSchemaData]);

  const requestParamsModifyValidationSchema = useMemo(() => {
    const inputParams = resourceModifySchema?.inputParameters || [];

    // Create validation rules for requestParams
    const requestParamsValidation: Record<string, any> = {};

    inputParams.forEach((param) => {
      if (
        param.custom === true &&
        param.modifiable === true &&
        ["STRING", "PASSWORD", "SECRET"].includes(param.type?.toUpperCase())
      ) {
        // Only add regex validation if regex is defined and not empty
        // @ts-ignore - regex property exists but not in type definition
        if (param.regex && param.regex.trim()) {
          // Test if the regex pattern is valid before adding validation
          let isValidRegex = false;
          try {
            // @ts-ignore - regex property exists but not in type definition
            new RegExp(param.regex);
            isValidRegex = true;
          } catch (error) {
            // @ts-ignore - regex property exists but not in type definition
            console.warn(`Invalid regex pattern for parameter '${param.key}':`, param.regex, error);
            isValidRegex = false;
          }

          if (isValidRegex) {
            const fieldValidation = Yup.string().test(
              "regex-validation",
              // @ts-ignore - regex property exists but not in type definition
              `Value does not match the required pattern: ${param.regex}`,
              function (value) {
                if (!value) return true; // Empty values handled by required validation

                // @ts-ignore - regex property exists but not in type definition
                const regex = new RegExp(param.regex);

                // Handle array values (for multi-select fields)
                if (Array.isArray(value)) {
                  if (value.length === 0) return true;
                  return value.every((item) => !item || regex.test(item));
                }

                // Handle single values
                return regex.test(value);
              }
            );

            requestParamsValidation[param.key] = fieldValidation;
          }
        }
      }
    });

    return Yup.object().shape(requestParamsValidation);
  }, [resourceSchemaData]);

  // Update validation schema when requestParams validation changes
  useEffect(() => {
    if (formMode === "modify" && selectedInstance) {
      const newValidationSchema = yup.object({
        serviceId: yup.string().required("Product is required"),
        servicePlanId: yup.string().required("A plan with a valid subscription is required"),
        subscriptionId: yup.string().required("Subscription is required"),
        resourceId: yup.string().required("Resource is required"),
        requestParams: requestParamsModifyValidationSchema,
      });
      setValidationSchema(newValidationSchema);
    } else {
      const newValidationSchema = yup.object({
        serviceId: yup.string().required("Product is required"),
        servicePlanId: yup.string().required("A plan with a valid subscription is required"),
        subscriptionId: yup.string().required("Subscription is required"),
        resourceId: yup.string().required("Resource is required"),
        requestParams: requestParamsCreateValidationSchema,
      });
      setValidationSchema(newValidationSchema);
    }
  }, [requestParamsCreateValidationSchema, requestParamsModifyValidationSchema, formMode, selectedInstance]);

  const { data: customAvailabilityZoneData, isLoading: isFetchingCustomAvailabilityZones } = useAvailabilityZone({
    regionCode: values.region,
    cloudProviderName: values.cloudProvider as CloudProvider,
    hasCustomAvailabilityZoneField: values.requestParams?.custom_availability_zone !== undefined,
  });

  const { isFetching: isFetchingResourceInstanceIds, data: resourceIdInstancesHashMap = {} } = useResourcesInstanceIds(
    offering?.serviceProviderId,
    offering?.serviceURLKey,
    offering?.serviceAPIVersion,
    offering?.serviceEnvironmentURLKey,
    offering?.serviceModelURLKey,
    offering?.productTierURLKey,
    offering?.resourceParameters,
    subscriptionsObj[values.subscriptionId]?.productTierId === values.servicePlanId && values.subscriptionId
  );

  // Sets the Default Values for the Request Parameters
  useEffect(() => {
    const inputParameters = resourceCreateSchema?.inputParameters || [];

    const defaultValues = inputParameters.reduce((acc: any, param: any) => {
      acc[param.key] = param.defaultValue || "";
      return acc;
    }, {});

    if (inputParameters.length && formMode === "create") {
      formData.setValues((prev) => ({
        ...prev,
        requestParams: defaultValues,
      }));

      const isMultiTenancy = offering?.productTierType === productTierTypes.OMNISTRATE_MULTI_TENANCY;

      const networkTypeFieldExists =
        inputParameters.find((param) => param.key === "cloud_provider") &&
        !isMultiTenancy &&
        offering?.supportsPublicNetwork;

      if (networkTypeFieldExists) {
        formData.setFieldValue("network_type", "PUBLIC");
      } else {
        formData.setFieldValue("network_type", "");
      }
    }
  }, [resourceCreateSchema, formMode, offering]);

  const customAvailabilityZones = useMemo(() => {
    // @ts-expect-error TODO: Ask someone on the backend to fix the docs
    const availabilityZones = customAvailabilityZoneData?.availabilityZones || [];
    return availabilityZones.sort(function (a, b) {
      if (a.code < b.code) return -1;
      else if (a.code > b.code) {
        return 1;
      }
      return -1;
    });
    // @ts-expect-error TODO: Ask someone on the backend to fix the docs
  }, [customAvailabilityZoneData?.availabilityZones]);

  const cloudAccountInstances = useMemo(
    () =>
      instances
        .filter((instance) => isCloudAccountInstance(instance))
        .filter((instance) => {
          if (instance.result_params?.gcp_project_id) {
            return values.cloudProvider === "gcp";
          } else if (instance.result_params?.aws_account_id) {
            return values.cloudProvider === "aws";
          } else if (instance.result_params?.azure_subscription_id) {
            return values.cloudProvider === "azure";
          }
        })
        .filter((instance) => ["READY", "RUNNING"].includes(instance.status))
        .map((instance) => ({
          ...instance,
          label: instance.result_params?.gcp_project_id
            ? `${instance.id} (Project ID - ${instance.result_params?.gcp_project_id})`
            : instance.result_params?.aws_account_id
              ? `${instance.id} (Account ID - ${instance.result_params?.aws_account_id})`
              : `${instance.id} (Subscription ID - ${instance.result_params?.azure_subscription_id})`,
        })),
    [instances, values.cloudProvider]
  );

  const standardInformationFields = useMemo(() => {
    return getStandardInformationFields(
      servicesObj,
      serviceOfferings,
      serviceOfferingsObj,
      isFetchingServiceOfferings,
      subscriptions,
      subscriptionsObj,
      isFetchingSubscriptions,
      formData,
      resourceCreateSchema,
      formMode,
      customAvailabilityZones,
      isFetchingCustomAvailabilityZones,
      nonCloudAccountInstances
    );
  }, [
    formMode,
    formData.values,
    resourceCreateSchema,
    customAvailabilityZones,
    subscriptions,
    nonCloudAccountInstances,
  ]);

  const networkConfigurationFields = useMemo(() => {
    return getNetworkConfigurationFields(
      formMode,
      formData.values,
      resourceCreateSchema,
      serviceOfferingsObj,
      customNetworks,
      isFetchingCustomNetworks
    );
  }, [formMode, formData.values, resourceCreateSchema, serviceOfferingsObj, customNetworks, isFetchingCustomNetworks]);

  const deploymentConfigurationFields = useMemo(() => {
    return getDeploymentConfigurationFields(
      formMode,
      formData.values,
      resourceCreateSchema,
      resourceIdInstancesHashMap,
      isFetchingResourceInstanceIds,
      cloudAccountInstances
    );
  }, [
    formMode,
    formData.values,
    resourceCreateSchema,
    resourceIdInstancesHashMap,
    isFetchingResourceInstanceIds,
    cloudAccountInstances,
  ]);

  const sections = useMemo(
    () => [
      {
        title: "Standard Information",
        fields: standardInformationFields,
      },
      {
        title: "Network Configuration",
        fields: networkConfigurationFields,
      },
      {
        title: "Deployment Configuration",
        fields: deploymentConfigurationFields,
      },
    ],
    [standardInformationFields, networkConfigurationFields, deploymentConfigurationFields]
  );

  if (isFetchingServiceOfferings) {
    return <LoadingSpinner />;
  }

  return (
    // @ts-ignore
    <Form className="grid grid-cols-7 gap-8" onSubmit={formData.handleSubmit}>
      <div className="space-y-6 col-span-5">
        <CardWithTitle title="Standard Information">
          <div className="space-y-6">
            {standardInformationFields.map((field, index) => {
              return <GridDynamicField key={index} field={field} formData={formData} />;
            })}
          </div>
        </CardWithTitle>

        {isFetchingResourceSchema || !networkConfigurationFields.length ? null : (
          <CardWithTitle title="Network Configuration">
            <div className="space-y-6">
              {networkConfigurationFields.map((field, index) => {
                return <GridDynamicField key={index} field={field} formData={formData} />;
              })}
            </div>
          </CardWithTitle>
        )}
        {isFetchingResourceSchema ? (
          <LoadingSpinner />
        ) : !deploymentConfigurationFields.length ? null : (
          <CardWithTitle title="Deployment Configuration">
            <div className="space-y-6">
              {deploymentConfigurationFields.map((field, index) => {
                return <GridDynamicField key={index} field={field} formData={formData} />;
              })}
            </div>
          </CardWithTitle>
        )}
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
          className="bg-white rounded-xl flex flex-col"
        >
          <div className="py-4 px-6 border-b border-gray-200">
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
              disabled={createInstanceMutation.isPending || updateInstanceMutation.isPending}
              sx={{ marginLeft: "auto" }} // Pushes the 2 buttons to the end
            >
              Cancel
            </Button>

            <span>
              <Button
                data-testid="submit-button"
                variant="contained"
                disabled={createInstanceMutation.isPending || updateInstanceMutation.isPending}
                type="submit"
              >
                {formMode === "create" ? "Create" : "Update"}
                {(createInstanceMutation.isPending || updateInstanceMutation.isPending) && <LoadingSpinnerSmall />}
              </Button>
            </span>
          </div>
        </div>
      </div>
    </Form>
  );
};

export default InstanceForm;

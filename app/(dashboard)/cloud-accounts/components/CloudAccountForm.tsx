"use client";

import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import CloudProviderRadio from "app/(dashboard)/components/CloudProviderRadio/CloudProviderRadio";
import SubscriptionMenu from "app/(dashboard)/components/SubscriptionMenu/SubscriptionMenu";
import SubscriptionPlanRadio from "app/(dashboard)/components/SubscriptionPlanRadio/SubscriptionPlanRadio";
import { getServiceMenuItems } from "app/(dashboard)/instances/utils";
import { useFormik } from "formik";
import { useSelector } from "react-redux";

import { $api } from "src/api/query";
import { getResourceInstanceDetails } from "src/api/resourceInstance";
import { CLOUD_PROVIDERS, cloudProviderLongLogoMap } from "src/constants/cloudProviders";
import useEnvironmentType from "src/hooks/useEnvironmentType";
import useSnackbar from "src/hooks/useSnackbar";
import { useGlobalData } from "src/providers/GlobalDataProvider";
import { selectUserrootData } from "src/slices/userDataSlice";
import { ResourceInstance } from "src/types/resourceInstance";
import { ServiceOffering } from "src/types/serviceOffering";
import { getAwsBootstrapArn, getGcpServiceEmail } from "src/utils/accountConfig/accountConfig";
import {
  ACCOUNT_CREATION_METHOD_LABELS,
  CLOUD_ACCOUNT_CREATION_METHOD_OPTIONS,
  CLOUD_PROVIDER_DEFAULT_CREATION_METHOD,
} from "src/utils/constants/accountConfig";
import GridDynamicForm from "components/DynamicForm/GridDynamicForm";
import { FormConfiguration } from "components/DynamicForm/types";
import LoadingSpinner from "components/LoadingSpinner/LoadingSpinner";

import { CloudAccountValidationSchema } from "../constants";
import { getInitialValues, getValidSubscriptionForInstanceCreation } from "../utils";

import CustomLabelDescription from "./CustomLabelDescription";

const CloudAccountForm = ({
  initialFormValues, // These are from URL Params
  onClose,
  formMode,
  selectedInstance,
  setIsAccountCreation,
  setOverlayType,
  setClickedInstance,
  instances,
}) => {
  const environmentType = useEnvironmentType();
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();
  const selectUser = useSelector(selectUserrootData);
  const {
    serviceOfferings,
    isFetchingServiceOfferings,
    servicesObj,
    serviceOfferingsObj,
    subscriptions,
    subscriptionsObj,
    isSubscriptionsPending,
  } = useGlobalData();

  const allInstances: ResourceInstance[] = instances;
  //subscriptionID -> key, number of instances -> value
  const subscriptionInstanceCountHash: Record<string, number> = {};
  allInstances.forEach((instance) => {
    if (subscriptionInstanceCountHash[instance?.subscriptionId as string]) {
      subscriptionInstanceCountHash[instance.subscriptionId as string] =
        subscriptionInstanceCountHash[instance.subscriptionId as string] + 1;
    } else {
      subscriptionInstanceCountHash[instance.subscriptionId as string] = 1;
    }
  });

  const byoaServiceOfferings = useMemo(() => {
    return serviceOfferings.filter(
      (offering) => offering.serviceModelType === "BYOA" || offering.serviceModelType === "ON_PREM_COPILOT"
    );
  }, [serviceOfferings]);

  const byoaServiceOfferingsObj: Record<string, Record<string, ServiceOffering>> = useMemo(() => {
    return byoaServiceOfferings.reduce((acc, offering) => {
      acc[offering.serviceId] = acc[offering.serviceId] || {};
      acc[offering.serviceId][offering.productTierID] = offering;
      return acc;
    }, {});
  }, [byoaServiceOfferings]);

  // Find Subscriptions for BYOA Service Offerings
  const byoaSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => byoaServiceOfferingsObj[sub.serviceId]?.[sub.productTierId]);
  }, [subscriptions, byoaServiceOfferingsObj]);

  const createCloudAccountMutation = $api.useMutation(
    "post",
    "/2022-09-01-00/resource-instance/{serviceProviderId}/{serviceKey}/{serviceAPIVersion}/{serviceEnvironmentKey}/{serviceModelKey}/{productTierKey}/{resourceKey}",
    {
      onSuccess: async (response) => {
        const values = formData.values;
        const instanceId = response.id;
        const { serviceId, servicePlanId } = values;
        const offering = byoaServiceOfferingsObj[serviceId]?.[servicePlanId];
        const selectedResource = offering?.resourceParameters.find((resource) =>
          resource.resourceId.startsWith("r-injectedaccountconfig")
        );

        const resourceInstanceResponse = await getResourceInstanceDetails(
          offering?.serviceProviderId,
          offering?.serviceURLKey,
          offering?.serviceAPIVersion,
          offering?.serviceEnvironmentURLKey,
          offering?.serviceModelURLKey,
          offering?.productTierURLKey,
          selectedResource?.urlKey,
          instanceId,
          values.subscriptionId
        );

        const resourceInstance = resourceInstanceResponse.data;

        // Sometimes, we don't get the result_params in the response
        // So, we need to update the query data manually
        queryClient.setQueryData(
          [
            "get",
            "/2022-09-01-00/resource-instance",
            {
              params: {
                query: {
                  environmentType,
                },
              },
            },
          ],
          (oldData: any) => {
            const result_params = {
              // @ts-ignore
              ...resourceInstance.result_params,
              cloud_provider: values.cloudProvider,
              account_configuration_method: values.accountConfigurationMethod,
            };

            if (values.cloudProvider === "aws") {
              result_params.aws_account_id = values.awsAccountId;
              result_params.aws_bootstrap_role_arn = getAwsBootstrapArn(values.awsAccountId);
            } else if (values.cloudProvider === "gcp") {
              result_params.gcp_project_id = values.gcpProjectId;
              result_params.gcp_project_number = values.gcpProjectNumber;
              result_params.gcp_service_account_email = getGcpServiceEmail(
                values.gcpProjectId,
                selectUser?.orgId.toLowerCase()
              );
            } else if (values.cloudProvider === "azure") {
              result_params.azure_subscription_id = values.azureSubscriptionId;
              result_params.azure_tenant_id = values.azureTenantId;
            }

            return {
              resourceInstances: [
                ...(oldData?.resourceInstances || []),
                {
                  ...(resourceInstance || {}),
                  result_params: result_params,
                },
              ],
            };
          }
        );

        setIsAccountCreation(true);
        setClickedInstance({
          ...resourceInstance,
          result_params: {
            ...(resourceInstance.result_params || {}),
            account_configuration_method: values.accountConfigurationMethod,
            cloud_provider: values.cloudProvider,
            ...(values.cloudProvider === CLOUD_PROVIDERS.aws
              ? {
                  aws_account_id: values.awsAccountId,
                }
              : values.cloudProvider === CLOUD_PROVIDERS.gcp
                ? {
                    gcp_project_id: values.gcpProjectId,
                    gcp_project_number: values.gcpProjectNumber,
                  }
                : {
                    azure_subscription_id: values.azureSubscriptionId,
                    azure_tenant_id: values.azureTenantId,
                  }),
          },
        });
        setOverlayType("view-instructions-dialog");
        snackbar.showSuccess("Cloud Account created successfully");
      },
    }
  );

  const formData = useFormik({
    initialValues: getInitialValues(
      initialFormValues,
      selectedInstance,
      byoaSubscriptions,
      byoaServiceOfferingsObj,
      byoaServiceOfferings,
      allInstances
    ),
    enableReinitialize: true,
    validationSchema: CloudAccountValidationSchema,
    onSubmit: (values) => {
      const { serviceId, servicePlanId } = values;
      const offering = byoaServiceOfferingsObj[serviceId]?.[servicePlanId];

      let requestParams: Record<string, any>;
      if (values.cloudProvider === "aws") {
        requestParams = {
          cloud_provider: values.cloudProvider,
          aws_account_id: values.awsAccountId,
          account_configuration_method: values.accountConfigurationMethod,
          aws_bootstrap_role_arn: getAwsBootstrapArn(values.awsAccountId),
        };
      } else if (values.cloudProvider === "gcp") {
        requestParams = {
          cloud_provider: values.cloudProvider,
          gcp_project_id: values.gcpProjectId,
          gcp_project_number: values.gcpProjectNumber,
          account_configuration_method: values.accountConfigurationMethod,
          gcp_service_account_email: getGcpServiceEmail(values.gcpProjectId, selectUser?.orgId.toLowerCase()),
        };
      } else {
        requestParams = {
          cloud_provider: values.cloudProvider,
          azure_subscription_id: values.azureSubscriptionId,
          azure_tenant_id: values.azureTenantId,
          account_configuration_method: values.accountConfigurationMethod,
        };
      }

      const resource = offering?.resourceParameters.find((resource) =>
        resource.resourceId.startsWith("r-injectedaccountconfig")
      );

      if (!resource) {
        return snackbar.showError("BYOA Resource not found");
      }

      createCloudAccountMutation.mutate({
        params: {
          path: {
            serviceProviderId: offering.serviceProviderId,
            serviceKey: offering.serviceURLKey,
            serviceAPIVersion: offering.serviceAPIVersion,
            serviceEnvironmentKey: offering.serviceEnvironmentURLKey,
            serviceModelKey: offering.serviceModelURLKey,
            productTierKey: offering.productTierURLKey,
            resourceKey: resource.urlKey,
          },
          query: {
            subscriptionId: values.subscriptionId,
          },
        },

        body: {
          cloud_provider: values.cloudProvider,
          requestParams: requestParams,
        },
      });
    },
  });

  const { values, setFieldValue } = formData;

  const formConfiguration: FormConfiguration = useMemo(() => {
    const { serviceId, servicePlanId, cloudProvider } = values;

    const serviceMenuItems = getServiceMenuItems(byoaServiceOfferings);
    const subscriptionMenuItems = byoaSubscriptions.filter((sub) => sub.productTierId === servicePlanId);

    const accountConfigurationMethods = CLOUD_ACCOUNT_CREATION_METHOD_OPTIONS[values.cloudProvider] ?? [];
    return {
      footer: {
        submitButton: {
          create: "Create",
        },
      },
      sections: [
        {
          title: "Standard Information",
          fields: [
            {
              dataTestId: "service-name-select",
              label: "Product Name",
              subLabel: "Select the Product you want to deploy in this cloud account",
              name: "serviceId",
              type: "select",
              required: true,
              emptyMenuText: "No Products available",
              isLoading: isFetchingServiceOfferings,
              menuItems: serviceMenuItems,
              disabled: formMode !== "create",
              onChange: (e) => {
                // When Service ID Changes
                // Find the First Service Plan for which we have a Subscription and Select It
                // Otherwise, Reset the Service Plan and Subscription

                const serviceId = e.target.value;

                const subscription = getValidSubscriptionForInstanceCreation(
                  byoaServiceOfferingsObj,
                  byoaSubscriptions,
                  allInstances,
                  serviceId
                );

                const servicePlanId = subscription?.productTierId || "";
                const subscriptionId = subscription?.id || "";

                const offering = byoaServiceOfferingsObj[serviceId]?.[servicePlanId];
                const cloudProvider = offering?.cloudProviders?.[0] || "";

                setFieldValue("servicePlanId", servicePlanId);
                setFieldValue("subscriptionId", subscriptionId);
                setFieldValue("cloudProvider", cloudProvider);
                setFieldValue("accountConfigurationMethod", cloudProvider === "aws" ? "CloudFormation" : "Terraform");

                // Set Field Touched to False
                formData.setFieldTouched("servicePlanId", false);
                formData.setFieldTouched("subscriptionId", false);
                formData.setFieldTouched("cloudProvider", false);
              },
              previewValue: servicesObj[values.serviceId]?.serviceName,
            },
            {
              label: "Subscription Plan",
              subLabel: "Select the subscription plan",
              name: "servicePlanId",
              required: true,
              customComponent: (
                <SubscriptionPlanRadio
                  disabled={formMode !== "create"}
                  servicePlans={Object.values(byoaServiceOfferingsObj[serviceId] || {}).sort((a, b) =>
                    a.productTierName.localeCompare(b.productTierName)
                  )}
                  name="servicePlanId"
                  formData={formData}
                  // @ts-ignore
                  onChange={(
                    servicePlanId: string,
                    subscriptionId?: string // This is very specific to when we subscribe to the plan for the first time
                  ) => {
                    const offering = byoaServiceOfferingsObj[serviceId]?.[servicePlanId];

                    const cloudProvider = offering?.cloudProviders?.[0] || "";

                    setFieldValue("cloudProvider", cloudProvider);
                    setFieldValue("accountConfigurationMethod", CLOUD_PROVIDER_DEFAULT_CREATION_METHOD[cloudProvider]);

                    const subscription = getValidSubscriptionForInstanceCreation(
                      byoaServiceOfferingsObj,
                      byoaSubscriptions,
                      allInstances,
                      serviceId,
                      servicePlanId
                    );

                    setFieldValue("subscriptionId", subscriptionId || subscription?.id || "");

                    // Set Field Touched to False
                    formData.setFieldTouched("subscriptionId", false);
                    formData.setFieldTouched("cloudProvider", false);
                  }}
                  subscriptionInstancesNumHash={subscriptionInstanceCountHash}
                />
              ),
              previewValue: serviceOfferingsObj[values.serviceId]?.[values.servicePlanId]?.productTierName,
            },
            {
              dataTestId: "subscription-select",
              label: "Subscription",
              subLabel: "Select the subscription",
              name: "subscriptionId",
              required: true,
              isHidden: subscriptionMenuItems.length === 0,
              customComponent: (
                <SubscriptionMenu
                  field={{
                    name: "subscriptionId",
                    value: values.subscriptionId,
                    isLoading: isSubscriptionsPending,
                    disabled: formMode !== "create",
                    emptyMenuText: !serviceId
                      ? "Select a Product"
                      : !servicePlanId
                        ? "Select a subscription plan"
                        : "No subscriptions available",
                  }}
                  formData={formData}
                  subscriptions={subscriptionMenuItems}
                  subscriptionInstanceCountHash={subscriptionInstanceCountHash}
                />
              ),
              previewValue: subscriptionsObj[values.subscriptionId]?.id,
            },
            {
              label: "Cloud Provider",
              subLabel: "Select the cloud provider",
              name: "cloudProvider",
              required: true,
              isHidden: !serviceId || !servicePlanId,
              customComponent: (
                <CloudProviderRadio
                  cloudProviders={serviceOfferingsObj[serviceId]?.[servicePlanId]?.cloudProviders || []}
                  name="cloudProvider"
                  formData={formData}
                  // @ts-ignore
                  onChange={(cloudProvider: string) => {
                    setFieldValue("accountConfigurationMethod", CLOUD_PROVIDER_DEFAULT_CREATION_METHOD[cloudProvider]);
                  }}
                  disabled={formMode !== "create"}
                />
              ),
              previewValue: !cloudProvider
                ? null
                : () => {
                    const cloudProvider = values.cloudProvider;
                    return cloudProviderLongLogoMap[cloudProvider];
                  },
            },
            {
              dataTestId: "account-configuration-method-select",
              label: "Account Configuration Method",
              subLabel: "Choose a method from among the options to configure your cloud provider account",
              name: "accountConfigurationMethod",
              type: "select",
              required: true,
              disabled: formMode !== "create",
              isHidden: !cloudProvider,
              menuItems: accountConfigurationMethods.map((option) => ({
                value: option,
                label: ACCOUNT_CREATION_METHOD_LABELS[option],
              })),
              previewValue: ACCOUNT_CREATION_METHOD_LABELS[values.accountConfigurationMethod],
            },
            {
              dataTestId: "aws-account-id-input",
              label: "AWS Account ID",
              subLabel: "AWS Account ID to use for the account",
              description: <CustomLabelDescription variant="aws" />,
              name: "awsAccountId",
              type: "text",
              required: true,
              disabled: formMode !== "create",
              isHidden: values.cloudProvider !== "aws",
              previewValue: cloudProvider === "aws" ? values.awsAccountId : null,
            },
            {
              dataTestId: "gcp-project-id-input",
              label: "GCP Project ID",
              subLabel: "GCP Project ID to use for the account",
              description: <CustomLabelDescription variant="gcpProjectId" />,
              name: "gcpProjectId",
              type: "text",
              required: true,
              disabled: formMode !== "create",
              isHidden: values.cloudProvider !== "gcp",
              previewValue: cloudProvider === "gcp" ? values.gcpProjectId : null,
            },
            {
              dataTestId: "gcp-project-number-input",
              label: "GCP Project Number",
              subLabel: "GCP Project Number to use for the account",
              description: <CustomLabelDescription variant="gcpProjectNumber" />,
              name: "gcpProjectNumber",
              type: "text",
              required: true,
              disabled: formMode !== "create",
              isHidden: values.cloudProvider !== "gcp",
              previewValue: cloudProvider === "gcp" ? values.gcpProjectNumber : null,
            },

            {
              dataTestId: "azure-subscription-id-input",
              label: "Azure Subscription ID",
              subLabel: "Azure Subscription ID to use for the account",
              description: <CustomLabelDescription variant="azureSubscriptionId" />,
              name: "azureSubscriptionId",
              type: "text",
              required: true,
              disabled: formMode !== "create",
              isHidden: values.cloudProvider !== "azure",
              previewValue: cloudProvider === "azure" ? values.azureSubscriptionId : null,
            },
            {
              dataTestId: "azure-tenant-id-input",
              label: "Azure Tenant ID",
              subLabel: "Azure Tenant ID to use for the account",
              description: <CustomLabelDescription variant="azureTenantId" />,
              name: "azureTenantId",
              type: "text",
              required: true,
              disabled: formMode !== "create",
              isHidden: values.cloudProvider !== "azure",
              previewValue: cloudProvider === "azure" ? values.azureTenantId : null,
            },
          ],
        },
      ],
    };
  }, [formMode, subscriptions, byoaServiceOfferings, values]);

  if (isFetchingServiceOfferings) {
    return <LoadingSpinner />;
  }

  return (
    <GridDynamicForm
      formConfiguration={formConfiguration}
      formData={formData}
      formMode="create"
      onClose={onClose}
      isFormSubmitting={createCloudAccountMutation.isPending}
      previewCardTitle="Cloud Account Summary"
    />
  );
};

export default CloudAccountForm;

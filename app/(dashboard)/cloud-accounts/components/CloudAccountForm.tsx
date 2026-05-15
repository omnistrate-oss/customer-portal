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
import { cloudProviderLongLogoMap, sortCloudProviders } from "src/constants/cloudProviders";
import useEnvironmentType from "src/hooks/useEnvironmentType";
import useSnackbar from "src/hooks/useSnackbar";
import { useGlobalData } from "src/providers/GlobalDataProvider";
import { selectUserrootData } from "src/slices/userDataSlice";
import { ResourceInstance } from "src/types/resourceInstance";
import { ServiceOffering } from "src/types/serviceOffering";
import { getAwsBootstrapArn, getGcpServiceEmail } from "src/utils/accountConfig/accountConfig";
import { CLOUD_PROVIDER_DEFAULT_CREATION_METHOD } from "src/utils/constants/accountConfig";
import { getResultParams } from "src/utils/instance";
import GridDynamicForm from "components/DynamicForm/GridDynamicForm";
import { FormConfiguration } from "components/DynamicForm/types";
import LoadingSpinner from "components/LoadingSpinner/LoadingSpinner";

import { CloudAccountValidationSchema } from "../constants";
import { getInitialValues, getValidSubscriptionForInstanceCreation } from "../utils";

import CustomLabelDescription from "./CustomLabelDescription";
import {
  AddBindingButton,
  EMPTY_NEBIUS_BINDING,
  formatKeyExpiry,
  isExistingBinding,
  NebiusBindingFormValue,
  RemoveBindingButton,
} from "./NebiusBindingsInput";

// Per-provider account-id field definitions for the form (only one provider's
// fields are visible at a time, gated by isHidden).
const PROVIDER_ID_FIELDS: Array<{
  provider: "aws" | "gcp" | "azure" | "oci" | "nebius";
  dataTestId: string;
  label: string;
  subLabel: string;
  name: "awsAccountId" | "gcpProjectId" | "gcpProjectNumber" | "azureSubscriptionId" | "azureTenantId" | "ociTenancyId" | "ociDomainId" | "nebiusTenantId";
  descriptionVariant?:
    | "aws"
    | "gcpProjectId"
    | "gcpProjectNumber"
    | "azureSubscriptionId"
    | "azureTenantId"
    | "ociTenancyId"
    | "ociDomainId";
}> = [
  { provider: "aws", dataTestId: "aws-account-id-input", label: "AWS Account ID", subLabel: "AWS Account ID to use for the account", name: "awsAccountId", descriptionVariant: "aws" },
  { provider: "gcp", dataTestId: "gcp-project-id-input", label: "GCP Project ID", subLabel: "GCP Project ID to use for the account", name: "gcpProjectId", descriptionVariant: "gcpProjectId" },
  { provider: "gcp", dataTestId: "gcp-project-number-input", label: "GCP Project Number", subLabel: "GCP Project Number to use for the account", name: "gcpProjectNumber", descriptionVariant: "gcpProjectNumber" },
  { provider: "azure", dataTestId: "azure-subscription-id-input", label: "Azure Subscription ID", subLabel: "Azure Subscription ID to use for the account", name: "azureSubscriptionId", descriptionVariant: "azureSubscriptionId" },
  { provider: "azure", dataTestId: "azure-tenant-id-input", label: "Azure Tenant ID", subLabel: "Azure Tenant ID to use for the account", name: "azureTenantId", descriptionVariant: "azureTenantId" },
  { provider: "oci", dataTestId: "oci-tenancy-id-input", label: "Tenancy OCID", subLabel: "OCI Tenancy OCID to use for the account", name: "ociTenancyId", descriptionVariant: "ociTenancyId" },
  { provider: "oci", dataTestId: "oci-domain-id-input", label: "Domain OCID", subLabel: "OCI Domain OCID to use for the account", name: "ociDomainId", descriptionVariant: "ociDomainId" },
  { provider: "nebius", dataTestId: "nebius-tenant-id-input", label: "Nebius Tenant ID", subLabel: "Nebius Tenant ID to use for the account", name: "nebiusTenantId" },
];

// Maps form values to the provider-specific snake_case fields used by the API.
const buildProviderResultParams = (values: any, orgId?: string): Record<string, any> => {
  switch (values.cloudProvider) {
    case "aws":
      return {
        aws_account_id: values.awsAccountId,
        aws_bootstrap_role_arn: getAwsBootstrapArn(values.awsAccountId),
      };
    case "gcp":
      return {
        gcp_project_id: values.gcpProjectId,
        gcp_project_number: values.gcpProjectNumber,
        gcp_service_account_email: getGcpServiceEmail(values.gcpProjectId, orgId),
      };
    case "azure":
      return {
        azure_subscription_id: values.azureSubscriptionId,
        azure_tenant_id: values.azureTenantId,
      };
    case "oci":
      return {
        oci_tenancy_id: values.ociTenancyId,
        oci_domain_id: values.ociDomainId,
      };
    case "nebius":
      return { nebius_tenant_id: values.nebiusTenantId };
    default:
      return {};
  }
};

const CloudAccountForm = ({
  initialFormValues, // These are from URL Params
  onClose,
  formMode,
  selectedInstance,
  selectedAccountConfig,
  setIsAccountCreation,
  setOverlayType,
  setClickedInstance,
  instances,
  refetchInstances,
  refetchAccountConfigs,
}) => {
  const queryClient = useQueryClient();
  const environmentType = useEnvironmentType();
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
            const resultParams: Record<string, any> = {
              ...getResultParams(resourceInstance),
              cloud_provider: values.cloudProvider,
              account_configuration_method: values.accountConfigurationMethod,
              ...buildProviderResultParams(values, selectUser?.orgId?.toLowerCase()),
            };

            return {
              resourceInstances: [
                // Filter out existing entry with same ID to prevent duplicates
                ...(oldData?.resourceInstances || []).filter((inst: any) => inst.id !== resourceInstance?.id),
                {
                  ...(resourceInstance || {}),
                  result_params: resultParams,
                },
              ],
            };
          }
        );

        setClickedInstance({
          ...resourceInstance,
          result_params: {
            ...getResultParams(resourceInstance),
            account_configuration_method: values.accountConfigurationMethod,
            cloud_provider: values.cloudProvider,
            ...buildProviderResultParams(values, selectUser?.orgId?.toLowerCase()),
          },
        });

        // Nebius has no post-create instructions to display.
        if (values.cloudProvider === "nebius") {
          onClose();
        } else {
          setIsAccountCreation(true);
          setOverlayType("view-instructions-dialog");
        }
        snackbar.showSuccess("Cloud Account created successfully");
      },
    }
  );

  // Strip read-only metadata before sending to create/update.
  const sanitizeNebiusBindings = (bindings: NebiusBindingFormValue[]) =>
    bindings.map((b) => ({
      projectID: b.projectID,
      serviceAccountID: b.serviceAccountID,
      publicKeyID: b.publicKeyID,
      privateKeyPEM: b.privateKeyPEM,
    }));

  // Bindings live on the AccountConfig — modify via PUT /accountconfig/{id}.
  const updateAccountConfigMutation = $api.useMutation("put", "/2022-09-01-00/accountconfig/{id}", {
    onSuccess: () => {
      snackbar.showSuccess("Cloud Account updated successfully");
      refetchInstances?.();
      refetchAccountConfigs?.();
      onClose();
    },
  });

  const formData = useFormik({
    initialValues: getInitialValues(
      initialFormValues,
      selectedInstance,
      byoaSubscriptions,
      byoaServiceOfferingsObj,
      byoaServiceOfferings,
      allInstances,
      selectedAccountConfig
    ),
    enableReinitialize: true,
    validationSchema: CloudAccountValidationSchema,
    onSubmit: (values) => {
      const { serviceId, servicePlanId } = values;
      const offering = byoaServiceOfferingsObj[serviceId]?.[servicePlanId];

      const resource = offering?.resourceParameters.find((resource) =>
        resource.resourceId.startsWith("r-injectedaccountconfig")
      );

      if (!resource) {
        return snackbar.showError("BYOA Resource not found");
      }

      // Modify is Nebius-only; bindings live on the AccountConfig.
      if (formMode === "modify") {
        if (values.cloudProvider !== "nebius") return;
        if (!selectedAccountConfig?.id) {
          return snackbar.showError("Cloud account is still loading. Try again in a moment.");
        }
        updateAccountConfigMutation.mutate({
          params: { path: { id: selectedAccountConfig.id } },
          body: { nebiusBindings: sanitizeNebiusBindings(values.nebiusBindings ?? []) } as any,
        });
        return;
      }

      const requestParams: Record<string, any> = {
        cloud_provider: values.cloudProvider,
        ...buildProviderResultParams(values, selectUser?.orgId?.toLowerCase()),
      };
      if (values.cloudProvider === "nebius") {
        requestParams.nebius_bindings = sanitizeNebiusBindings(values.nebiusBindings ?? []);
      } else {
        requestParams.account_configuration_method = values.accountConfigurationMethod;
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

    // const accountConfigurationMethods = CLOUD_ACCOUNT_CREATION_METHOD_OPTIONS[values.cloudProvider] ?? [];
    return {
      footer: {
        submitButton: {
          create: "Create",
          modify: "Save",
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
              isHidden: serviceMenuItems.length === 1,
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
                  cloudProviders={sortCloudProviders(
                    byoaServiceOfferingsObj[serviceId]?.[servicePlanId]?.cloudProviders || []
                  )}
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
            ...PROVIDER_ID_FIELDS.map((def) => ({
              dataTestId: def.dataTestId,
              label: def.label,
              subLabel: def.subLabel,
              description: def.descriptionVariant ? <CustomLabelDescription variant={def.descriptionVariant} /> : undefined,
              name: def.name,
              type: "text" as const,
              required: true,
              // Identity fields are locked once the account is created.
              disabled: formMode !== "create",
              isHidden: values.cloudProvider !== def.provider,
              previewValue: cloudProvider === def.provider ? values[def.name] : null,
            })),
          ],
        },
        // One section per Nebius binding.
        ...(values.cloudProvider === "nebius"
          ? ((values.nebiusBindings ?? []) as NebiusBindingFormValue[]).map((binding, index) => {
              const path = `nebiusBindings[${index}]`;
              const existing = isExistingBinding(binding);
              const isFormDisabled = formMode === "view";

              return {
                title: `Binding ${index + 1}`,
                actionButton: (
                  <RemoveBindingButton
                    index={index}
                    disabled={isFormDisabled}
                    onRemove={() => {
                      const current = (values.nebiusBindings ?? []) as NebiusBindingFormValue[];
                      setFieldValue(
                        "nebiusBindings",
                        current.filter((_, i) => i !== index)
                      );
                    }}
                  />
                ),
                fields: [
                  {
                    label: "Project ID",
                    subLabel: "The Nebius project that will be used for this binding",
                    name: `${path}.projectID`,
                    type: "text",
                    // Project ID is the binding's identity — locked once created.
                    required: !existing,
                    disabled: existing || isFormDisabled,
                    value: binding.projectID,
                    previewValue: binding.projectID || null,
                  },
                  // Region is server-derived; show read-only once the binding exists.
                  ...(existing
                    ? [
                        {
                          label: "Region",
                          subLabel: "The Nebius deployment region enabled by this binding",
                          name: `${path}._region`,
                          type: "text",
                          disabled: true,
                          value: binding.region ?? "",
                          previewValue: null,
                        },
                      ]
                    : []),
                  {
                    label: "Service Account ID",
                    subLabel:
                      "Service account with project-level permissions to create and manage required infrastructure",
                    name: `${path}.serviceAccountID`,
                    type: "text",
                    required: true,
                    disabled: isFormDisabled,
                    value: binding.serviceAccountID,
                    previewValue: binding.serviceAccountID || null,
                  },
                  {
                    label: "Public Key ID",
                    subLabel: "The ID of the authorized public key associated with this service account",
                    name: `${path}.publicKeyID`,
                    type: "text",
                    required: true,
                    disabled: isFormDisabled,
                    value: binding.publicKeyID,
                    previewValue: binding.publicKeyID || null,
                  },
                  {
                    label: "Private Key PEM",
                    subLabel: "The private key PEM that matches this binding's Public Key ID",
                    name: `${path}.privateKeyPEM`,
                    type: "password",
                    required: true,
                    disabled: isFormDisabled,
                    value: binding.privateKeyPEM,
                    previewValue: binding.privateKeyPEM ? "********" : null,
                  },
                  ...(existing
                    ? [
                        {
                          label: "Private Key Expiry",
                          subLabel:
                            "The expiration date of the private key or authorized key used for this binding",
                          name: `${path}._keyExpiresAt`,
                          type: "text",
                          disabled: true,
                          value: formatKeyExpiry(binding.keyExpiresAt),
                          previewValue: null,
                        },
                      ]
                    : []),
                ],
              };
            })
          : []),
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
      formMode={formMode}
      onClose={onClose}
      isFormSubmitting={createCloudAccountMutation.isPending || updateAccountConfigMutation.isPending}
      previewCardTitle="Cloud Account Summary"
      afterSections={
        values.cloudProvider === "nebius" && formMode !== "view" ? (
          <AddBindingButton
            disabled={createCloudAccountMutation.isPending || updateAccountConfigMutation.isPending}
            onAdd={() => {
              const current = (values.nebiusBindings ?? []) as NebiusBindingFormValue[];
              setFieldValue("nebiusBindings", [...current, { ...EMPTY_NEBIUS_BINDING }]);
            }}
          />
        ) : null
      }
    />
  );
};

export default CloudAccountForm;

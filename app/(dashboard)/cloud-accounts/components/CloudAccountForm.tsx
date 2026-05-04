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
import { CLOUD_PROVIDERS, cloudProviderLongLogoMap, sortCloudProviders } from "src/constants/cloudProviders";
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
            const instanceResultParams = getResultParams(resourceInstance);
            const resultParams: Record<string, any> = {
              ...instanceResultParams,
              cloud_provider: values.cloudProvider,
              account_configuration_method: values.accountConfigurationMethod,
            };

            if (values.cloudProvider === "aws") {
              resultParams.aws_account_id = values.awsAccountId;
              resultParams.aws_bootstrap_role_arn = getAwsBootstrapArn(values.awsAccountId);
            } else if (values.cloudProvider === "gcp") {
              resultParams.gcp_project_id = values.gcpProjectId;
              resultParams.gcp_project_number = values.gcpProjectNumber;
              resultParams.gcp_service_account_email = getGcpServiceEmail(
                values.gcpProjectId,
                selectUser?.orgId.toLowerCase()
              );
            } else if (values.cloudProvider === "azure") {
              resultParams.azure_subscription_id = values.azureSubscriptionId;
              resultParams.azure_tenant_id = values.azureTenantId;
            } else if (values.cloudProvider === "oci") {
              resultParams.oci_tenancy_id = values.ociTenancyId;
              resultParams.oci_domain_id = values.ociDomainId;
            }

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
            ...(values.cloudProvider === CLOUD_PROVIDERS.aws
              ? {
                  aws_account_id: values.awsAccountId,
                }
              : values.cloudProvider === CLOUD_PROVIDERS.gcp
                ? {
                    gcp_project_id: values.gcpProjectId,
                    gcp_project_number: values.gcpProjectNumber,
                  }
                : values.cloudProvider === CLOUD_PROVIDERS.azure
                  ? {
                      azure_subscription_id: values.azureSubscriptionId,
                      azure_tenant_id: values.azureTenantId,
                    }
                  : values.cloudProvider === CLOUD_PROVIDERS.oci
                    ? {
                        oci_tenancy_id: values.ociTenancyId,
                        oci_domain_id: values.ociDomainId,
                      }
                    : values.cloudProvider === CLOUD_PROVIDERS.nebius
                      ? {
                          nebius_tenant_id: values.nebiusTenantId,
                        }
                      : {}),
          },
        });

        // Nebius is verified up-front via Public/Private key bindings —
        // there are no post-create shell-script instructions to display.
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

  // The API only accepts the four input fields per binding; strip the
  // read-only metadata (status, region, fingerprints, …) before send.
  const sanitizeNebiusBindings = (bindings: NebiusBindingFormValue[]) =>
    bindings.map((b) => ({
      projectID: b.projectID,
      serviceAccountID: b.serviceAccountID,
      publicKeyID: b.publicKeyID,
      privateKeyPEM: b.privateKeyPEM,
    }));

  const updateCloudAccountMutation = $api.useMutation(
    "patch",
    "/2022-09-01-00/resource-instance/{serviceProviderId}/{serviceKey}/{serviceAPIVersion}/{serviceEnvironmentKey}/{serviceModelKey}/{productTierKey}/{resourceKey}/{id}",
    {
      onSuccess: () => {
        snackbar.showSuccess("Cloud Account updated successfully");
        refetchInstances?.();
        refetchAccountConfigs?.();
        onClose();
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

      // Modify is currently only meaningful for Nebius — its bindings can be
      // edited post-creation. Other providers have an immutable account
      // surface so the action menu doesn't surface a Modify option for them.
      if (formMode === "modify") {
        if (values.cloudProvider !== "nebius" || !selectedInstance) return;
        updateCloudAccountMutation.mutate({
          params: {
            path: {
              serviceProviderId: offering.serviceProviderId,
              serviceKey: offering.serviceURLKey,
              serviceAPIVersion: offering.serviceAPIVersion,
              serviceEnvironmentKey: offering.serviceEnvironmentURLKey,
              serviceModelKey: offering.serviceModelURLKey,
              productTierKey: offering.productTierURLKey,
              resourceKey: resource.urlKey,
              id: selectedInstance.id as string,
            },
            query: { subscriptionId: values.subscriptionId },
          },
          body: {
            requestParams: {
              nebius_bindings: sanitizeNebiusBindings(values.nebiusBindings ?? []),
            },
          },
        });
        return;
      }

      let requestParams: Record<string, any> = {};
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
      } else if (values.cloudProvider === "azure") {
        requestParams = {
          cloud_provider: values.cloudProvider,
          azure_subscription_id: values.azureSubscriptionId,
          azure_tenant_id: values.azureTenantId,
          account_configuration_method: values.accountConfigurationMethod,
        };
      } else if (values.cloudProvider === "oci") {
        requestParams = {
          cloud_provider: values.cloudProvider,
          oci_tenancy_id: values.ociTenancyId,
          oci_domain_id: values.ociDomainId,
          account_configuration_method: values.accountConfigurationMethod,
        };
      } else if (values.cloudProvider === "nebius") {
        requestParams = {
          cloud_provider: values.cloudProvider,
          nebius_tenant_id: values.nebiusTenantId,
          nebius_bindings: sanitizeNebiusBindings(values.nebiusBindings ?? []),
        };
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
            {
              dataTestId: "oci-tenancy-id-input",
              label: "Tenancy OCID",
              subLabel: "OCI Tenancy OCID to use for the account",
              description: <CustomLabelDescription variant="ociTenancyId" />,
              name: "ociTenancyId",
              type: "text",
              required: true,
              disabled: formMode !== "create",
              isHidden: values.cloudProvider !== "oci",
              previewValue: cloudProvider === "oci" ? values.ociTenancyId : null,
            },
            {
              dataTestId: "nebius-tenant-id-input",
              label: "Nebius Tenant ID",
              subLabel: "Nebius Tenant ID to use for the account",
              name: "nebiusTenantId",
              type: "text",
              required: true,
              // Tenant ID is the account's identity — locked once created.
              disabled: formMode !== "create",
              isHidden: values.cloudProvider !== "nebius",
              previewValue: cloudProvider === "nebius" ? values.nebiusTenantId : null,
            },
            {
              dataTestId: "oci-domain-id-input",
              label: "Domain OCID",
              subLabel: "OCI Domain OCID to use for the account",
              description: <CustomLabelDescription variant="ociDomainId" />,
              name: "ociDomainId",
              type: "text",
              required: true,
              disabled: formMode !== "create",
              isHidden: values.cloudProvider !== "oci",
              previewValue: cloudProvider === "oci" ? values.ociDomainId : null,
            },
          ],
        },
        // Each Nebius binding gets its own top-level section to match the
        // visual hierarchy of "Standard Information". Bindings are scoped
        // to nebius — for other providers the array is empty.
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
                    // Project ID is the binding's identity — locked once
                    // it has been created on the server.
                    required: !existing,
                    disabled: existing || isFormDisabled,
                    value: binding.projectID,
                    previewValue: binding.projectID || null,
                  },
                  // Region is server-derived from the project + service
                  // account. Show it for context but never as a writable
                  // field; only relevant once the binding exists.
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
      isFormSubmitting={createCloudAccountMutation.isPending || updateCloudAccountMutation.isPending}
      previewCardTitle="Cloud Account Summary"
      afterSections={
        values.cloudProvider === "nebius" && formMode !== "view" ? (
          <AddBindingButton
            disabled={createCloudAccountMutation.isPending || updateCloudAccountMutation.isPending}
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

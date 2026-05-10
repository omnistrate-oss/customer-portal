"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Box } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";
import { useSelector } from "react-redux";

import { $api } from "src/api/query";
import { getResourceInstanceDetails } from "src/api/resourceInstance";
import CloudProviderRadio from "app/(dashboard)/components/CloudProviderRadio/CloudProviderRadio";
import SubscriptionMenu from "app/(dashboard)/components/SubscriptionMenu/SubscriptionMenu";
import SubscriptionPlanRadio from "app/(dashboard)/components/SubscriptionPlanRadio/SubscriptionPlanRadio";
import { getServiceMenuItems } from "app/(dashboard)/instances/utils";
import { cloudProviderLongLogoMap } from "src/constants/cloudProviders";
import useEnvironmentType from "src/hooks/useEnvironmentType";
import useSnackbar from "src/hooks/useSnackbar";
import { useGlobalData } from "src/providers/GlobalDataProvider";
import { selectUserrootData } from "src/slices/userDataSlice";
import { ResourceInstance } from "src/types/resourceInstance";
import { ServiceOffering } from "src/types/serviceOffering";
import {
  getAwsBootstrapArn,
  getGcpBootstrapShellCommand,
  getAzureBootstrapShellCommand,
  getGcpServiceEmail,
} from "src/utils/accountConfig/accountConfig";
import { CLOUD_PROVIDER_DEFAULT_CREATION_METHOD } from "src/utils/constants/accountConfig";
import { getResultParams } from "src/utils/instance";
import { FormConfiguration } from "components/DynamicForm/types";
import Chip from "components/Chip/Chip";
import LoadingSpinner from "components/LoadingSpinner/LoadingSpinner";

import { CloudAccountValidationSchema } from "../constants";
import { getInitialValues, getValidSubscriptionForInstanceCreation } from "../utils";

import CloudAccountSummaryCard, { SummarySection } from "./CloudAccountSummaryCard";
import CustomLabelDescription from "./CustomLabelDescription";
import AddNewAccountStep from "./steps/AddNewAccountStep";
import ConfigureVPCsStep, { ConfigureVPCsFormValues, VpcRecord } from "./steps/ConfigureVPCsStep";
import GrantAccessStep from "./steps/GrantAccessStep";
import WizardStepper, { WizardStep } from "./WizardStepper";

type CloudAccountWizardProps = {
  initialFormValues?: any;
  selectedInstance?: ResourceInstance;
  onClose: () => void;
  instances: ResourceInstance[];
};

const CloudAccountWizard: React.FC<CloudAccountWizardProps> = ({
  initialFormValues,
  selectedInstance,
  onClose,
  instances,
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

  // ─── Step state ──────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<WizardStep>(0);
  const [clickedInstance, setClickedInstance] = useState<ResourceInstance | undefined>();
  const [enablePrivateConnectivity, setEnablePrivateConnectivity] = useState(false);

  // ─── VPC step state ───────────────────────────────────────────────────────
  const [vpcValues, setVpcValues] = useState<ConfigureVPCsFormValues>({
    enableNewVpcs: true,
    bringOwnVpcs: false,
    selectedRegions: [],
    selectedVpcIds: [],
  });
  // ─── Service/plan/subscription data ──────────────────────────────────────
  const allInstances: ResourceInstance[] = instances;
  const subscriptionInstanceCountHash: Record<string, number> = {};
  allInstances.forEach((instance) => {
    const subId = instance.subscriptionId as string;
    subscriptionInstanceCountHash[subId] = (subscriptionInstanceCountHash[subId] || 0) + 1;
  });

  const byoaServiceOfferings = useMemo(
    () =>
      serviceOfferings
        .filter((o) => o.serviceModelType === "BYOA" || o.serviceModelType === "ON_PREM_COPILOT")
        .map((o) => ({
          ...o,
          cloudProviders: o.cloudProviders?.filter((p) => p !== "nebius"),
        })),
    [serviceOfferings]
  );

  const byoaServiceOfferingsObj: Record<string, Record<string, ServiceOffering>> = useMemo(
    () =>
      byoaServiceOfferings.reduce((acc, o) => {
        acc[o.serviceId] = acc[o.serviceId] || {};
        acc[o.serviceId][o.productTierID] = o;
        return acc;
      }, {} as Record<string, Record<string, ServiceOffering>>),
    [byoaServiceOfferings]
  );

  const byoaSubscriptions = useMemo(
    () => subscriptions.filter((sub) => byoaServiceOfferingsObj[sub.serviceId]?.[sub.productTierId]),
    [subscriptions, byoaServiceOfferingsObj]
  );

  // ─── Create cloud account mutation ─────────────────────────────────────────
  const createCloudAccountMutation = $api.useMutation(
    "post",
    "/2022-09-01-00/resource-instance/{serviceProviderId}/{serviceKey}/{serviceAPIVersion}/{serviceEnvironmentKey}/{serviceModelKey}/{productTierKey}/{resourceKey}",
    {
      onSuccess: async (response) => {
        const values = formData.values;
        const instanceId = response.id;
        const { serviceId, servicePlanId } = values;
        const offering = byoaServiceOfferingsObj[serviceId]?.[servicePlanId];
        const selectedResource = offering?.resourceParameters.find((r) =>
          r.resourceId.startsWith("r-injectedaccountconfig")
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

        // Build result params to populate locally before polling updates them
        const instanceResultParams = getResultParams(resourceInstance);
        const resultParams: Record<string, any> = {
          ...instanceResultParams,
          cloud_provider: values.cloudProvider,
          account_configuration_method: values.accountConfigurationMethod,
          enable_private_connectivity: enablePrivateConnectivity,
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

        // Update query cache
        queryClient.setQueryData(
          ["get", "/2022-09-01-00/resource-instance", { params: { query: { environmentType } } }],
          (oldData: any) => ({
            resourceInstances: [
              ...(oldData?.resourceInstances || []).filter((inst: any) => inst.id !== resourceInstance?.id),
              { ...(resourceInstance || {}), result_params: resultParams },
            ],
          })
        );

        const instanceWithParams: ResourceInstance = {
          ...resourceInstance,
          result_params: resultParams,
        } as ResourceInstance;

        setClickedInstance(instanceWithParams);
        setCurrentStep(1); // Move to Grant Access step
        snackbar.showSuccess("Cloud Account created successfully");
      },
    }
  );

  // ─── Form ─────────────────────────────────────────────────────────────────
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

      let requestParams: Record<string, any> = {};
      if (values.cloudProvider === "aws") {
        requestParams = {
          cloud_provider: values.cloudProvider,
          aws_account_id: values.awsAccountId,
          account_configuration_method: values.accountConfigurationMethod,
          aws_bootstrap_role_arn: getAwsBootstrapArn(values.awsAccountId),
          enable_private_connectivity: enablePrivateConnectivity,
        };
      } else if (values.cloudProvider === "gcp") {
        requestParams = {
          cloud_provider: values.cloudProvider,
          gcp_project_id: values.gcpProjectId,
          gcp_project_number: values.gcpProjectNumber,
          account_configuration_method: values.accountConfigurationMethod,
          gcp_service_account_email: getGcpServiceEmail(
            values.gcpProjectId,
            selectUser?.orgId.toLowerCase()
          ),
          enable_private_connectivity: enablePrivateConnectivity,
        };
      } else if (values.cloudProvider === "azure") {
        requestParams = {
          cloud_provider: values.cloudProvider,
          azure_subscription_id: values.azureSubscriptionId,
          azure_tenant_id: values.azureTenantId,
          account_configuration_method: values.accountConfigurationMethod,
          enable_private_connectivity: enablePrivateConnectivity,
        };
      } else if (values.cloudProvider === "oci") {
        requestParams = {
          cloud_provider: values.cloudProvider,
          oci_tenancy_id: values.ociTenancyId,
          oci_domain_id: values.ociDomainId,
          account_configuration_method: values.accountConfigurationMethod,
          enable_private_connectivity: enablePrivateConnectivity,
        };
      }

      const resource = offering?.resourceParameters.find((r) =>
        r.resourceId.startsWith("r-injectedaccountconfig")
      );
      if (!resource) return snackbar.showError("BYOA Resource not found");

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
          query: { subscriptionId: values.subscriptionId },
        },
        body: {
          cloud_provider: values.cloudProvider,
          requestParams,
        },
      });
    },
  });

  const { values, setFieldValue } = formData;

  const accountConfigId = useMemo(() => {
    const rp = getResultParams(clickedInstance || selectedInstance);
    return typeof rp?.cloud_provider_account_config_id === "string"
      ? rp.cloud_provider_account_config_id
      : undefined;
  }, [clickedInstance, selectedInstance]);

  const cloudNativeNetworksQuery = $api.useQuery(
    "get",
    "/2022-09-01-00/accountconfig/{id}/cloud-native-networks",
    {
      params: {
        path: {
          id: accountConfigId || "",
        },
      },
      headers: {
        "x-ignore-global-error": true,
      },
    },
    {
      enabled: Boolean(currentStep === 2 && vpcValues.bringOwnVpcs && accountConfigId),
      retry: false,
    }
  );

  const syncCloudNativeNetworksMutation = $api.useMutation(
    "post",
    "/2022-09-01-00/accountconfig/{id}/cloud-native-networks/sync",
    {
      onSuccess: () => {
        cloudNativeNetworksQuery.refetch();
      },
      onError: () => {
        snackbar.showError("Failed to sync networks. Please try again.");
      },
    }
  );

  const allCloudNativeNetworks = cloudNativeNetworksQuery.data?.cloudNativeNetworks || [];

  const availableRegions = useMemo(() => {
    const regions = allCloudNativeNetworks
      .map((network) => network.region)
      .filter((region): region is string => Boolean(region));
    return Array.from(new Set(regions)).sort((a, b) => a.localeCompare(b));
  }, [allCloudNativeNetworks]);

  const availableVpcs = useMemo<VpcRecord[]>(() => {
    const filteredNetworks =
      vpcValues.selectedRegions.length > 0
        ? allCloudNativeNetworks.filter((network) => vpcValues.selectedRegions.includes(network.region))
        : allCloudNativeNetworks;

    return filteredNetworks.map((network) => {
      const normalizedStatus =
        network.status === "AVAILABLE" || network.status === "READY"
          ? "Available"
          : network.status === "FAILED"
            ? "Unavailable"
            : "Unknown";

      return {
        id: network.cloudNativeNetworkId || network.id,
        name: network.name || network.cloudNativeNetworkId || network.id,
        status: normalizedStatus,
        statusMessage: network.statusMessage,
        networkId: network.cloudNativeNetworkId,
      };
    });
  }, [allCloudNativeNetworks, vpcValues.selectedRegions]);

  const lastSyncedAt = useMemo(() => {
    if (!allCloudNativeNetworks.length) return undefined;
    const latest = allCloudNativeNetworks.reduce<string | undefined>((maxDate, network) => {
      if (!network.updatedAt) return maxDate;
      if (!maxDate) return network.updatedAt;
      return new Date(network.updatedAt) > new Date(maxDate) ? network.updatedAt : maxDate;
    }, undefined);

    return latest ? new Date(latest).toLocaleString() : undefined;
  }, [allCloudNativeNetworks]);

  const isLoadingVpcs = cloudNativeNetworksQuery.isFetching || syncCloudNativeNetworksMutation.isPending;

  const handleResyncVpcs = () => {
    if (!accountConfigId) return;

    syncCloudNativeNetworksMutation.mutate({
      params: {
        path: {
          id: accountConfigId,
        },
      },
      body: {
        regions: vpcValues.selectedRegions.length > 0 ? vpcValues.selectedRegions : undefined,
      },
    });
  };

  // ─── Grant Access derived data ─────────────────────────────────────────────
  const cloudFormationTemplateUrl = useMemo(() => {
    const rp = getResultParams(clickedInstance);
    return rp?.cloudformation_url;
  }, [clickedInstance]);

  const gcpBootstrapShellCommand = useMemo(() => {
    const rp = getResultParams(clickedInstance);
    return rp?.gcp_bootstrap_shell_script || (rp?.cloud_provider_account_config_id
      ? getGcpBootstrapShellCommand(rp.cloud_provider_account_config_id)
      : undefined);
  }, [clickedInstance]);

  const azureBootstrapShellCommand = useMemo(() => {
    const rp = getResultParams(clickedInstance);
    return rp?.azure_bootstrap_shell_script || (rp?.cloud_provider_account_config_id
      ? getAzureBootstrapShellCommand(rp.cloud_provider_account_config_id)
      : undefined);
  }, [clickedInstance]);

  const accountInstructionDetails = useMemo(() => {
    const rp = getResultParams(clickedInstance);
    if (rp?.aws_account_id) return { awsAccountID: rp.aws_account_id };
    if (rp?.gcp_project_id)
      return { gcpProjectID: rp.gcp_project_id, gcpProjectNumber: rp.gcp_project_number };
    if (rp?.azure_subscription_id)
      return { azureSubscriptionID: rp.azure_subscription_id, azureTenantID: rp.azure_tenant_id };
    if (rp?.oci_tenancy_id)
      return {
        ociTenancyID: rp.oci_tenancy_id,
        ociDomainID: rp.oci_domain_id,
        ociBootstrapShellCommand: rp.oci_bootstrap_shell_script,
      };
    return {};
  }, [clickedInstance]);

  const fetchClickedInstanceDetails = useCallback(async () => {
    const instance = clickedInstance || selectedInstance;
    const rp = getResultParams(instance);
    if (!instance || !rp) return;
    const subscription = subscriptionsObj[instance.subscriptionId as string];
    const offering = serviceOfferingsObj[subscription?.serviceId]?.[subscription?.productTierId];
    const resource = offering?.resourceParameters?.find((r) =>
      r.resourceId.startsWith("r-injectedaccountconfig")
    );
    return getResourceInstanceDetails(
      offering?.serviceProviderId,
      offering?.serviceURLKey,
      offering?.serviceAPIVersion,
      offering?.serviceEnvironmentURLKey,
      offering?.serviceModelURLKey,
      offering?.productTierURLKey,
      resource?.urlKey,
      instance.id,
      instance.subscriptionId
    );
  }, [clickedInstance, selectedInstance, serviceOfferingsObj, subscriptionsObj]);

  useEffect(() => {
    if (currentStep !== 2 || !vpcValues.bringOwnVpcs || accountConfigId || !clickedInstance) return;

    let cancelled = false;
    const refreshAccountConfigId = async () => {
      try {
        const response = await fetchClickedInstanceDetails();
        const refreshedParams = getResultParams(response?.data);
        if (!cancelled && refreshedParams?.cloud_provider_account_config_id) {
          setClickedInstance((prev) =>
            prev
              ? {
                  ...prev,
                  result_params: { ...getResultParams(prev), ...refreshedParams },
                }
              : prev
          );
        }
      } catch {
        // Best-effort refresh in Step 3; errors are intentionally ignored here.
      }
    };

    void refreshAccountConfigId();
    return () => {
      cancelled = true;
    };
  }, [accountConfigId, clickedInstance, currentStep, fetchClickedInstanceDetails, vpcValues.bringOwnVpcs]);

  // ─── Form configuration for Step 1 ────────────────────────────────────────
  const { serviceId, servicePlanId, cloudProvider } = values;

  const serviceMenuItems = useMemo(
    () => getServiceMenuItems(byoaServiceOfferings),
    [byoaServiceOfferings]
  );
  const subscriptionMenuItems = useMemo(
    () => byoaSubscriptions.filter((sub) => sub.productTierId === servicePlanId),
    [byoaSubscriptions, servicePlanId]
  );

  const formConfiguration: FormConfiguration = useMemo(
    () => ({
      footer: { submitButton: { create: "Create" } },
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
              disabled: false,
              onChange: (e: any) => {
                const sid = e.target.value;
                const subscription = getValidSubscriptionForInstanceCreation(
                  byoaServiceOfferingsObj,
                  byoaSubscriptions,
                  allInstances,
                  sid
                );
                const planId = subscription?.productTierId || "";
                const subId = subscription?.id || "";
                const offering = byoaServiceOfferingsObj[sid]?.[planId];
                const cp = offering?.cloudProviders?.[0] || "";
                setFieldValue("servicePlanId", planId);
                setFieldValue("subscriptionId", subId);
                setFieldValue("cloudProvider", cp);
                setFieldValue(
                  "accountConfigurationMethod",
                  cp === "aws" ? "CloudFormation" : "Terraform"
                );
                formData.setFieldTouched("servicePlanId", false);
                formData.setFieldTouched("subscriptionId", false);
                formData.setFieldTouched("cloudProvider", false);
              },
              previewValue: servicesObj[values.serviceId]?.serviceName,
            },
            {
              label: "Subscription Plan",
              subLabel: "Select the subscription plan plans",
              name: "servicePlanId",
              required: true,
              customComponent: (
                <SubscriptionPlanRadio
                  disabled={false}
                  servicePlans={Object.values(byoaServiceOfferingsObj[serviceId] || {}).sort((a, b) =>
                    a.productTierName.localeCompare(b.productTierName)
                  )}
                  name="servicePlanId"
                  formData={formData}
                  // @ts-ignore – SubscriptionPlanRadio onChange signature is broader than the typed prop
                  onChange={(planId: string, subId?: string) => {
                    const offering = byoaServiceOfferingsObj[serviceId]?.[planId];
                    const cp = offering?.cloudProviders?.[0] || "";
                    setFieldValue("cloudProvider", cp);
                    setFieldValue(
                      "accountConfigurationMethod",
                      CLOUD_PROVIDER_DEFAULT_CREATION_METHOD[cp]
                    );
                    const subscription = getValidSubscriptionForInstanceCreation(
                      byoaServiceOfferingsObj,
                      byoaSubscriptions,
                      allInstances,
                      serviceId,
                      planId
                    );
                    setFieldValue("subscriptionId", subId || subscription?.id || "");
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
              subLabel: "Select subscription",
              name: "subscriptionId",
              required: true,
              isHidden: subscriptionMenuItems.length === 0,
              customComponent: (
                <SubscriptionMenu
                  field={{
                    name: "subscriptionId",
                    value: values.subscriptionId,
                    isLoading: isSubscriptionsPending,
                    disabled: false,
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
                  cloudProviders={
                    byoaServiceOfferingsObj[serviceId]?.[servicePlanId]?.cloudProviders || []
                  }
                  name="cloudProvider"
                  formData={formData}
                  // @ts-ignore – CloudProviderRadio onChange signature is broader than the typed prop
                  onChange={(cp: string) => {
                    setFieldValue(
                      "accountConfigurationMethod",
                      CLOUD_PROVIDER_DEFAULT_CREATION_METHOD[cp]
                    );
                  }}
                  disabled={false}
                />
              ),
              previewValue: !cloudProvider
                ? null
                : () => cloudProviderLongLogoMap[values.cloudProvider as keyof typeof cloudProviderLongLogoMap],
            },
            {
              dataTestId: "aws-account-id-input",
              label: "AWS Account ID",
              subLabel: "AWS Account ID to use for the account",
              description: <CustomLabelDescription variant="aws" />,
              name: "awsAccountId",
              type: "text",
              required: true,
              disabled: false,
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
              disabled: false,
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
              disabled: false,
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
              disabled: false,
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
              disabled: false,
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
              disabled: false,
              isHidden: values.cloudProvider !== "oci",
              previewValue: cloudProvider === "oci" ? values.ociTenancyId : null,
            },
            {
              dataTestId: "oci-domain-id-input",
              label: "Domain OCID",
              subLabel: "OCI Domain OCID to use for the account",
              description: <CustomLabelDescription variant="ociDomainId" />,
              name: "ociDomainId",
              type: "text",
              required: true,
              disabled: false,
              isHidden: values.cloudProvider !== "oci",
              previewValue: cloudProvider === "oci" ? values.ociDomainId : null,
            },
          ],
        },
      ],
    }),
    // All visible form fields depend on `values` (changes trigger full recomputation).
    // Other listed deps (isFetchingServiceOfferings, subscriptions, byoaServiceOfferings)
    // change infrequently and cover the remaining data dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isFetchingServiceOfferings, subscriptions, byoaServiceOfferings, values]
  );

  // ─── Summary card sections ─────────────────────────────────────────────────
  const summarySections = useMemo((): SummarySection[] => {
    const rp = getResultParams(clickedInstance);
    const selectedProvider = rp?.cloud_provider || values.cloudProvider;
    const privateConnectivityFlag = getResultParams(clickedInstance)?.enable_private_connectivity;
    const privateConnectivityEnabled =
      typeof privateConnectivityFlag === "boolean"
        ? privateConnectivityFlag
        : enablePrivateConnectivity;
    const accountIdentityItems =
      selectedProvider === "gcp"
        ? [
            {
              label: "GCP Project ID",
              value: rp?.gcp_project_id || values.gcpProjectId || undefined,
            },
            {
              label: "GCP Project Number",
              value: rp?.gcp_project_number || values.gcpProjectNumber || undefined,
            },
          ]
        : selectedProvider === "azure"
          ? [
              {
                label: "Azure Subscription ID",
                value: rp?.azure_subscription_id || values.azureSubscriptionId || undefined,
              },
              {
                label: "Azure Tenant ID",
                value: rp?.azure_tenant_id || values.azureTenantId || undefined,
              },
            ]
          : selectedProvider === "oci"
            ? [
                {
                  label: "Tenancy OCID",
                  value: rp?.oci_tenancy_id || values.ociTenancyId || undefined,
                },
                {
                  label: "Domain OCID",
                  value: rp?.oci_domain_id || values.ociDomainId || undefined,
                },
              ]
            : [
                {
                  label: "AWS Account ID",
                  value: rp?.aws_account_id || values.awsAccountId || undefined,
                },
              ];

    const standardItems = [
      {
        label: "Product Name",
        value: servicesObj[values.serviceId]?.serviceName || undefined,
      },
      {
        label: "Subscription Plan",
        value:
          serviceOfferingsObj[values.serviceId]?.[values.servicePlanId]?.productTierName || undefined,
      },
      {
        label: "Subscription",
        value: subscriptionsObj[values.subscriptionId]?.id || undefined,
      },
      {
        label: "Cloud Provider",
        value: values.cloudProvider
          ? cloudProviderLongLogoMap[values.cloudProvider as keyof typeof cloudProviderLongLogoMap]
          : undefined,
      },
      ...accountIdentityItems,
      {
        label: "Private Connectivity",
        value: privateConnectivityEnabled ? (
          <Chip
            label="Enabled"
            fontColor="#067647"
            bgColor="#ECFDF3"
            borderColor="#ABEFC6"
          />
        ) : (
          <Chip
            label="Disabled"
            fontColor="#B54708"
            bgColor="#FFFAEB"
            borderColor="#FEDF89"
          />
        ),
      },
    ];

    const sections: SummarySection[] = [{ title: "Standard Information", items: standardItems }];

    // Add VPC configuration section on step 3
    if (currentStep === 2) {
      const vpcItems = [
        {
          label: "Creating new VPCs",
          value: vpcValues.enableNewVpcs ? (
            <Chip
              label="Enabled"
              fontColor="#067647"
              bgColor="#ECFDF3"
              borderColor="#ABEFC6"
            />
          ) : undefined,
        },
        {
          label: "Enable existing VPCs",
          value: vpcValues.bringOwnVpcs ? (
            <Chip
              label="Enabled"
              fontColor="#067647"
              bgColor="#ECFDF3"
              borderColor="#ABEFC6"
            />
          ) : undefined,
        },
        {
          label: "Regions",
          value:
            vpcValues.selectedRegions.length > 0
              ? `${vpcValues.selectedRegions.length} selected`
              : undefined,
        },
        {
          label: "Networks",
          value:
            vpcValues.selectedVpcIds.length > 0
              ? `${vpcValues.selectedVpcIds.length} selected`
              : undefined,
        },
      ];
      sections.push({ title: "VPC Configuration", items: vpcItems });
    }

    return sections;
  }, [
    currentStep,
    values,
    clickedInstance,
    enablePrivateConnectivity,
    servicesObj,
    serviceOfferingsObj,
    subscriptionsObj,
    vpcValues,
  ]);

  // ─── Navigation ────────────────────────────────────────────────────────────
  const handleNext = () => {
    if (currentStep === 0) {
      // Submit form to create account
      formData.handleSubmit();
    } else if (currentStep === 1) {
      setCurrentStep(2);
    } else {
      // Step 3 – "Configure" button
      onClose();
    }
  };

  const nextLabel =
    currentStep === 0 ? "Next" : currentStep === 1 ? "Next" : "Configure";
  const isNextLoading = currentStep === 0 && createCloudAccountMutation.isPending;

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (isFetchingServiceOfferings) {
    return <LoadingSpinner />;
  }

  return (
    <div data-testid="cloud-account-wizard">
      {/* Stepper */}
      <Box sx={{ mb: "32px" }}>
        <WizardStepper currentStep={currentStep} />
      </Box>

      {/* Content grid: 5 cols left + 2 cols right */}
      <div className="grid grid-cols-7 items-start gap-8">
        {/* Left – step content */}
        <div className="col-span-5">
          {currentStep === 0 && (
            <form onSubmit={formData.handleSubmit} data-testid="add-new-account-form">
              <AddNewAccountStep
                formData={formData}
                formConfiguration={formConfiguration}
                formMode="create"
                enablePrivateConnectivity={enablePrivateConnectivity}
                onTogglePrivateConnectivity={setEnablePrivateConnectivity}
              />
            </form>
          )}

          {currentStep === 1 && (
            <GrantAccessStep
              selectedAccountConfig={clickedInstance}
              cloudFormationTemplateUrl={cloudFormationTemplateUrl}
              gcpBootstrapShellCommand={gcpBootstrapShellCommand}
              azureBootstrapShellCommand={azureBootstrapShellCommand}
              accountInstructionDetails={accountInstructionDetails}
              isAccessPage={true}
              fetchClickedInstanceDetails={fetchClickedInstanceDetails}
              setClickedInstance={(updater) =>
                setClickedInstance((prev) => updater(prev) as ResourceInstance | undefined)
              }
            />
          )}

          {currentStep === 2 && (
            <ConfigureVPCsStep
              values={vpcValues}
              onChange={(patch) => setVpcValues((prev) => ({ ...prev, ...patch }))}
              availableRegions={availableRegions.length > 0 ? availableRegions : undefined}
              availableVpcs={availableVpcs}
              isLoadingVpcs={isLoadingVpcs}
              onResync={handleResyncVpcs}
              lastSyncedAt={lastSyncedAt}
              cloudProvider={values.cloudProvider}
            />
          )}
        </div>

        {/* Right – summary card */}
        <div className="col-span-2">
          <CloudAccountSummaryCard
            sections={summarySections}
            onDoItLater={onClose}
            onNext={handleNext}
            nextLabel={nextLabel}
            isNextLoading={isNextLoading}
            isNextDisabled={false}
          />
        </div>
      </div>
    </div>
  );
};

export default CloudAccountWizard;

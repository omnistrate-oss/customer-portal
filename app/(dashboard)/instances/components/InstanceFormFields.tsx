import SubscriptionMenu from "app/(dashboard)/components/SubscriptionMenu/SubscriptionMenu";

import { Field } from "src/components/DynamicForm/types";
import StatusChip from "src/components/StatusChip/StatusChip";
import { cloudProviderLongLogoMap } from "src/constants/cloudProviders";
import { productTierTypes } from "src/constants/servicePlan";
import { getVersionSetStatusStylesAndLabel } from "src/constants/statusChipStyles/versionSet";
import { AvailabilityZone } from "src/types/availabilityZone";
import { CloudProvider, FormMode } from "src/types/common/enums";
import { CustomNetwork } from "src/types/customNetwork";
import { ResourceInstance } from "src/types/resourceInstance";
import { APIEntity, ServiceOffering } from "src/types/serviceOffering";
import { Subscription } from "src/types/subscription";
import { TierVersionSet } from "src/types/tier-version-set";
import { getResultParams } from "src/utils/instance";

import { Link } from "../../../../src/components/NonDashboardComponents/FormElements/FormElements";
import CloudProviderRadio from "../../components/CloudProviderRadio/CloudProviderRadio";
import KubernetesDistributionsMultiSelect from "../../components/KubernetesDistributionsMultiSelect/KubernetesDistributionsMultiSelect";
import SubscriptionPlanRadio from "../../components/SubscriptionPlanRadio/SubscriptionPlanRadio";
import { REQUEST_PARAMS_FIELDS_TO_FILTER } from "../constants";
import { ResourceSummary } from "../hooks/useResources";
import {
  cloudProviderToPlatformMap,
  filterSchemaByCloudProvider,
  getCustomNetworksMenuItems,
  getJsonValue,
  getRegionMenuItems,
  getResourceMenuItems,
  getServiceMenuItems,
  getValidSubscriptionForInstanceCreation,
  getVersionSetResourceMenuItems,
  normalizeCustomDnsValue,
  platformToCloudProviderMap,
} from "../utils";

import AccountConfigDescription from "./AccountConfigDescription";
import CustomNetworkDescription from "./CustomNetworkDescription";
import CustomTagsField from "./CustomTagsField";

export const getStandardInformationFields = (
  servicesObj,
  serviceOfferings: ServiceOffering[],
  serviceOfferingsObj: Record<string, Record<string, ServiceOffering>>,
  isFetchingServiceOfferings: boolean,
  subscriptions: Subscription[],
  subscriptionsObj: Record<string, Subscription>,
  isFetchingSubscriptions: boolean,
  formData: any,
  resourceSchema: APIEntity,
  formMode: FormMode,
  customAvailabilityZones: AvailabilityZone[],
  isFetchingCustomAvailabilityZones: boolean,
  instances: ResourceInstance[],
  versionSets: TierVersionSet[],
  isFetchingVersionSets: boolean,
  cloudAccountInstances: any[],
  isFetchingResourceInstanceIds: boolean,
  cloudNativeNetworks: any[],
  isFetchingCloudNativeNetworks: boolean
) => {
  if (isFetchingServiceOfferings) return [];

  //subscriptionID -> key, number of instances -> value
  const subscriptionInstanceCountHash: Record<string, number> = {};
  instances.forEach((instance) => {
    if (subscriptionInstanceCountHash[instance?.subscriptionId as string]) {
      subscriptionInstanceCountHash[instance.subscriptionId as string] =
        subscriptionInstanceCountHash[instance.subscriptionId as string] + 1;
    } else {
      subscriptionInstanceCountHash[instance.subscriptionId as string] = 1;
    }
  });

  const { values, setFieldValue, setFieldTouched } = formData;
  const { serviceId, servicePlanId, resourceId, cloudProvider, region, requestParams } = values;

  const serviceMenuItems = getServiceMenuItems(serviceOfferings);
  const offering = serviceOfferingsObj[serviceId]?.[servicePlanId];

  // Check for VERSION_SET_OVERRIDE feature with CUSTOMER scope in productTierFeatures
  const allowCustomerVersionOverride =
    offering?.productTierFeatures?.some(
      (feature) => feature.feature === "VERSION_SET_OVERRIDE" && feature.scope === "CUSTOMER"
    ) || false;

  const subscriptionMenuItems = subscriptions.filter((sub) => sub.productTierId === servicePlanId);

  const serviceOfferingResourceMenuItems = getResourceMenuItems(serviceOfferingsObj[serviceId]?.[servicePlanId]);

  const selectedVersionSet = versionSets?.find((versionSet) => versionSet.version === values.productTierVersion);

  const tierVersionSetResourceMenuItems = getVersionSetResourceMenuItems(selectedVersionSet);

  //if allowCustomerVersionOverride is true, use resources from version set else use service offering resources
  const resourceMenuItems = allowCustomerVersionOverride
    ? tierVersionSetResourceMenuItems
    : serviceOfferingResourceMenuItems;

  const inputParametersObj = (resourceSchema?.inputParameters || []).reduce((acc: any, param: any) => {
    acc[param.key] = param;
    return acc;
  }, {});

  const cloudProviderFieldExists = inputParametersObj["cloud_provider"];
  const regionFieldExists = inputParametersObj["region"];
  const customAvailabilityZoneFieldExists = inputParametersObj["custom_availability_zone"];

  const isOnPrem =
    offering?.serviceModelType === "ON_PREM" &&
    resourceSchema?.inputParameters.find((field) => field.key === "onprem_platform");

  const cloudProviderOptions: string[] = (() => {
    const options: string[] = [];
    if (isOnPrem) {
      const onPremPlatforms = offering?.onPremPlatforms || [];
      if (onPremPlatforms.includes("EKS")) {
        options.push("aws");
      }
      if (onPremPlatforms.includes("GKE")) {
        options.push("gcp");
      }
      if (onPremPlatforms.includes("AKS")) {
        options.push("azure");
      }
      if (onPremPlatforms.includes("OKE")) {
        options.push("oci");
      }
      if (onPremPlatforms.includes("Generic")) {
        options.push("private");
      }
    }
    return options;
  })();

  const onPremPlatformOptions: string[] = (() => {
    const options: string[] = [];
    const currentCloudProvider = formData.values.cloudProvider;
    const mappedPlatform = cloudProviderToPlatformMap[currentCloudProvider];
    if (mappedPlatform) {
      options.push(mappedPlatform);
    }
    if (!options.includes("Generic")) {
      options.push("Generic");
    }
    return options;
  })();
  const isBYOCOnprem = cloudProvider === "byoc-onprem";

  const fields: Field[] = [
    {
      dataTestId: "service-name-select",
      label: "Product Name",
      subLabel: "Select the Product you want to deploy",
      name: "serviceId",
      type: "select",
      required: true,
      disabled: formMode !== "create",
      emptyMenuText: "No Products available",
      menuItems: serviceMenuItems,
      isHidden: serviceMenuItems.length === 1,
      onChange: (e) => {
        const serviceId = e.target.value;

        const subscription = getValidSubscriptionForInstanceCreation(
          serviceOfferingsObj,
          subscriptions,
          instances,
          serviceId
        );

        const servicePlanId = subscription?.productTierId || "";
        const subscriptionId = subscription?.id || "";
        setFieldValue("servicePlanId", servicePlanId);
        setFieldValue("subscriptionId", subscriptionId);

        const offering = serviceOfferingsObj[serviceId]?.[servicePlanId];
        const isOfferingOnPrem = offering?.serviceModelType === "ON_PREM";
        const cloudProvider = isOfferingOnPrem
          ? platformToCloudProviderMap[offering?.onPremPlatforms?.[0] || ""] || ""
          : offering?.cloudProviders?.[0] || "";

        setFieldValue("cloudProvider", cloudProvider);
        if (cloudProvider === "aws") {
          setFieldValue("region", offering.awsRegions?.[0] || "");
        } else if (cloudProvider === "gcp") {
          setFieldValue("region", offering.gcpRegions?.[0] || "");
        } else if (cloudProvider === "azure") {
          setFieldValue("region", offering.azureRegions?.[0] || "");
        } else if (cloudProvider === "oci") {
          setFieldValue("region", offering.ociRegions?.[0] || "");
        } else if (cloudProvider === "nebius") {
          setFieldValue("region", offering.nebiusRegions?.[0] || "");
        } else if (cloudProvider === "byoc-onprem") {
          setFieldValue("byocOnpremRegions", offering?.byocOnpremRegions?.[0] || "on-prem");
        }

        // Set default onprem_platform for on-prem offerings
        if (isOfferingOnPrem) {
          setFieldValue("onprem_platform", cloudProviderToPlatformMap[cloudProvider] || "");
        } else {
          setFieldValue("onprem_platform", "");
        }

        const resources = getResourceMenuItems(offering);
        setFieldValue("productTierVersion", "");
        setFieldValue("resourceId", resources[0]?.value || "");
        setFieldValue("requestParams", {});

        setFieldTouched("servicePlanId", false);
        setFieldTouched("subscriptionId", false);
        setFieldTouched("resourceId", false);
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
          servicePlans={Object.values(serviceOfferingsObj[serviceId] || {}).sort((a: any, b: any) =>
            a.productTierName.localeCompare(b.productTierName)
          )}
          name="servicePlanId"
          formData={formData}
          disabled={formMode !== "create"}
          // @ts-ignore
          onChange={(
            servicePlanId: string,
            subscriptionId?: string // This is very specific to when we subscribe to the plan for the first time
          ) => {
            const isPlanChanging = servicePlanId !== values.servicePlanId;
            const offering = serviceOfferingsObj[serviceId]?.[servicePlanId];
            const isOfferingOnPrem = offering?.serviceModelType === "ON_PREM";
            const cloudProvider = isOfferingOnPrem
              ? platformToCloudProviderMap[offering?.onPremPlatforms?.[0] || ""] || ""
              : offering?.cloudProviders?.[0] || "";

            setFieldValue("cloudProvider", cloudProvider);
            if (cloudProvider === "aws") {
              setFieldValue("region", offering.awsRegions?.[0] || "");
            } else if (cloudProvider === "gcp") {
              setFieldValue("region", offering.gcpRegions?.[0] || "");
            } else if (cloudProvider === "azure") {
              setFieldValue("region", offering.azureRegions?.[0] || "");
            } else if (cloudProvider === "oci") {
              setFieldValue("region", offering.ociRegions?.[0] || "");
            } else if (cloudProvider === "nebius") {
              setFieldValue("region", offering.nebiusRegions?.[0] || "");
            } else if (cloudProvider === "byoc-onprem") {
              setFieldValue("byocOnpremRegions", offering?.byocOnpremRegions?.[0] || "on-prem");
            }

            // Set default onprem_platform for on-prem offerings
            if (isOfferingOnPrem) {
              setFieldValue("onprem_platform", cloudProviderToPlatformMap[cloudProvider] || "");
            } else {
              setFieldValue("onprem_platform", "");
            }

            const resources = getResourceMenuItems(offering);
            // Only reset requestParams, productTierVersion, and resourceId when the plan actually changes.
            // When the user subscribes to the already-selected plan, the plan ID doesn't
            // change, so we should preserve existing selections and default parameter values.
            if (isPlanChanging) {
              setFieldValue("resourceId", resources[0]?.value || "");
              setFieldValue("requestParams", {});
              setFieldValue("productTierVersion", "");
            } else {
              // If the current resourceId is not in the new resource list, reset it
              // and clear requestParams since the resource context changed
              const currentResourceId = values.resourceId;
              const resourceIds = resources.map((r) => r.value);
              if (!currentResourceId || !resourceIds.includes(currentResourceId)) {
                setFieldValue("resourceId", resources[0]?.value || "");
                setFieldValue("requestParams", {});
              }
            }

            const subscription = getValidSubscriptionForInstanceCreation(
              serviceOfferingsObj,
              subscriptions,
              instances,
              serviceId,
              servicePlanId
            );

            setFieldValue("subscriptionId", subscriptionId || subscription?.id || "");

            setFieldTouched("subscriptionId", false);
            setFieldTouched("resourceId", false);
          }}
          subscriptionInstancesNumHash={subscriptionInstanceCountHash}
        />
      ),
      previewValue: offering?.productTierName,
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
            isLoading: isFetchingSubscriptions,
            disabled: formMode !== "create",
            emptyMenuText: !serviceId
              ? "Select a Product"
              : !servicePlanId
                ? "Select a subscription plan"
                : "No subscriptions available",
            onChange: () => {
              // We filter the cloud accounts based on the selected subscription
              // So we need to reset the selected cloud account
              if (values.requestParams?.cloud_provider_account_config_id) {
                setFieldValue("requestParams.cloud_provider_account_config_id", "");
              }
            },
          }}
          formData={formData}
          subscriptions={subscriptionMenuItems}
          subscriptionInstanceCountHash={subscriptionInstanceCountHash}
        />
      ),
      previewValue: subscriptionsObj[values.subscriptionId]?.id,
    },
  ];

  // Add Product Tier Version field if feature is enabled and version sets are available
  if (allowCustomerVersionOverride && versionSets?.length > 0) {
    // Create menu items from customerVersionSets with status chips for preferred versions
    const versionMenuItems = versionSets.map((versionSet) => {
      const isPreferred = versionSet.status === "Preferred";

      return {
        label: isPreferred ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>{versionSet.version}</span>
            <StatusChip {...getVersionSetStatusStylesAndLabel("Preferred")} />
          </div>
        ) : (
          versionSet.version
        ),
        value: versionSet.version,
      };
    });

    // Find the default value (version set with status 'Preferred')
    const preferredVersionSet = versionSets.find((versionSet) => versionSet.status === "Preferred");
    const defaultValue = preferredVersionSet?.version || versionSets[0]?.version || "";

    fields.push({
      dataTestId: "product-tier-version-select",
      label: "Service Plan Version",
      subLabel: "Select the service plan version",
      name: "productTierVersion",
      type: "select",
      required: true,
      emptyMenuText: "No plan versions available",
      menuItems: versionMenuItems,
      previewValue: values.productTierVersion,
      disabled: formMode !== "create",
      onChange: (e) => {
        const selectedVersion = e.target.value;
        const selectedVersionSet = versionSets.find((versionSet) => versionSet.version === selectedVersion);
        if (!selectedVersionSet) return;
        const resourceMenuItems = getVersionSetResourceMenuItems(selectedVersionSet);
        const firstResource = resourceMenuItems[0];
        if (firstResource) {
          setFieldValue("resourceId", firstResource.value);
        } else {
          setFieldValue("resourceId", "");
        }
        setFieldValue("productTierVersion", selectedVersion);
        // Reset requestParams when version changes
        setFieldValue("requestParams", {});
      },
      isLoading: isFetchingVersionSets,
    });

    // Set default value if not already set (only in create mode)
    if (!values.productTierVersion && defaultValue && formMode === "create") {
      setFieldValue("productTierVersion", defaultValue);
    }
  }

  fields.push({
    dataTestId: "resource-type-select",
    label: "Resource Name",
    subLabel: "Select the resource",
    name: "resourceId",
    type: "select",
    required: true,
    emptyMenuText: !serviceId
      ? "Select a Product"
      : !servicePlanId
        ? "Select a subscription plan"
        : "No resources available",
    menuItems: resourceMenuItems,
    previewValue: resourceMenuItems.find((item) => item.value === values.resourceId)?.label,
    disabled: formMode !== "create",
    onChange: () => {
      setFieldValue("requestParams", {});
    },
    isHidden: resourceMenuItems.length <= 1,
  });

  if (cloudProviderFieldExists) {
    fields.push({
      label: "Cloud Provider",
      subLabel: "Select the cloud provider",
      name: "cloudProvider",
      required: true,
      customComponent: (
        <CloudProviderRadio
          cloudProviders={offering?.cloudProviders || []}
          name="cloudProvider"
          formData={formData}
          // @ts-ignore
          onChange={(newCloudProvider: CloudProvider) => {
            if (newCloudProvider === "aws") {
              setFieldValue("region", offering.awsRegions?.[0] || "");
            } else if (newCloudProvider === "gcp") {
              setFieldValue("region", offering.gcpRegions?.[0] || "");
            } else if (newCloudProvider === "azure") {
              setFieldValue("region", offering.azureRegions?.[0] || "");
            } else if (newCloudProvider === "oci") {
              setFieldValue("region", offering.ociRegions?.[0] || "");
            } else if (newCloudProvider === "nebius") {
              setFieldValue("region", offering.nebiusRegions?.[0] || "");
            } else if (newCloudProvider === "byoc-onprem") {
              setFieldValue("byocOnpremRegions", offering?.byocOnpremRegions?.[0] || "on-prem");
            }
          }}
          disabled={formMode !== "create"}
        />
      ),
      previewValue: values.cloudProvider
        ? () => {
            const cloudProvider = values.cloudProvider;
            return cloudProviderLongLogoMap[cloudProvider];
          }
        : null,
    });
  }

  // Cluster Name dropdown – shown only for byoc-onprem cloud provider
  const clusterNameParam = (resourceSchema?.inputParameters || []).find((p) => p.key === "cluster_name");
  if (isBYOCOnprem && clusterNameParam) {
    const byocOnpremAccounts = cloudAccountInstances
      ?.filter((el) => el.subscriptionId === values.subscriptionId)
      .filter((el) => {
        const rp = getResultParams(el);
        return rp?.cluster_name;
      });

    fields.push({
      dataTestId: "cluster-name-select",
      label: "Cluster Name",
      subLabel: "Cluster identifier for the private Kubernetes target",
      name: `requestParams.cluster_name`,
      value: requestParams["cluster_name"] || "",
      type: "select",
      menuItems: byocOnpremAccounts.map((account) => {
        const rp = getResultParams(account);
        return {
          label: rp?.cluster_name ? `${rp.cluster_name} (${account.id})` : account.id,
          value: account.id,
        };
      }),
      required: true,
      disabled: formMode !== "create",
      isLoading: isFetchingResourceInstanceIds,
      emptyMenuText: "No private clusters available",
      previewValue: (() => {
        const selected = byocOnpremAccounts.find((a) => a.id === requestParams["cluster_name"]);
        const rp = selected ? getResultParams(selected) : null;
        return rp?.cluster_name || requestParams["cluster_name"];
      })(),
    });
  }

  // Cloud Provider Account Config ID – moved here from Deployment Configuration
  const accountConfigParam = (resourceSchema?.inputParameters || []).find(
    (p) => p.key === "cloud_provider_account_config_id"
  );
  if (accountConfigParam && !isBYOCOnprem) {
    fields.push({
      dataTestId: `${accountConfigParam.key}-select`,
      label: accountConfigParam.displayName || accountConfigParam.key,
      subLabel: accountConfigParam.description,
      name: `requestParams.${accountConfigParam.key}`,
      description: (
        <AccountConfigDescription
          serviceId={values.serviceId}
          servicePlanId={values.servicePlanId}
          subscriptionId={values.subscriptionId}
        />
      ),
      value: requestParams[accountConfigParam.key] || "",
      type: "select",
      menuItems: cloudAccountInstances
        ?.filter((el) => el.subscriptionId === values.subscriptionId)
        .map((config) => ({
          label: config.label,
          value: config.id,
        })),
      required: accountConfigParam.required,
      disabled: formMode !== "create",
      previewValue: cloudAccountInstances.find((config) => config.id === requestParams[accountConfigParam.key])?.label,
      emptyMenuText: "No cloud accounts available",
      isLoading: isFetchingResourceInstanceIds,
    });
  }

  if (regionFieldExists && !isBYOCOnprem) {
    fields.push({
      dataTestId: "region-select",
      label: "Region",
      subLabel: "Select the region",
      name: "region",
      required: true,
      type: "select",
      emptyMenuText: !resourceId
        ? "Select a resource"
        : !cloudProvider
          ? "Select a cloud provider"
          : "No regions available",
      menuItems: getRegionMenuItems(serviceOfferingsObj[serviceId]?.[servicePlanId], cloudProvider),
      disabled: formMode !== "create",
    });
  }

  if (accountConfigParam && regionFieldExists && cloudProviderFieldExists && !isBYOCOnprem) {
    const isExistingVpcSupported = cloudProvider === "aws" || cloudProvider === "gcp";
    const vpcType = requestParams._vpcType || "create_new";

    fields.push({
      label: "VPCs",
      subLabel: "",
      name: "requestParams._vpcType",
      value: vpcType,
      type: "radio",
      required: true,
      options: [
        {
          dataTestId: "create-new-vpc-radio",
          label: "Create new VPC",
          value: "create_new",
        },
        {
          dataTestId: "choose-existing-vpc-radio",
          label: isExistingVpcSupported
            ? "Choose from Existing VPCs"
            : "Choose from Existing VPCs (available for AWS / GCP)",
          value: "choose_existing",
          disabled: !isExistingVpcSupported,
        },
      ],
      previewValue: vpcType === "choose_existing" ? "Existing VPC" : "New VPC",
    });

    if (vpcType === "choose_existing" && isExistingVpcSupported) {
      const filteredNetworks = cloudNativeNetworks.filter((n) => !region || n.region === region);
      fields.push({
        dataTestId: "existing-vpc-select",
        label: "Select VPC",
        subLabel: "Choose an existing VPC from your cloud account",
        name: `requestParams.vpc_id`,
        value: requestParams["vpc_id"] || "",
        type: "select",
        menuItems: filteredNetworks.map((n) => ({
          label: n.name || n.cloudNativeNetworkId || n.id,
          value: n.cloudNativeNetworkId || n.id,
        })),
        required: true,
        disabled: formMode !== "create",
        isLoading: isFetchingCloudNativeNetworks,
        emptyMenuText: region ? "No VPCs found in this region" : "Select a region first",
        previewValue: (() => {
          const selected = filteredNetworks.find((n) => (n.cloudNativeNetworkId || n.id) === requestParams["vpc_id"]);
          return selected?.name || requestParams["vpc_id"];
        })(),
      });
    }
  }

  if (isOnPrem) {
    fields.push({
      label: "Kubernetes Platform",
      subLabel: "Select the Kubernetes platform",
      name: "kubernetesPlatform",
      required: true,
      customComponent: (
        <CloudProviderRadio
          cloudProviders={cloudProviderOptions.length > 0 ? cloudProviderOptions : offering?.cloudProviders || []}
          name="cloudProvider"
          formData={formData}
          // @ts-ignore
          onChange={(newCloudProvider: CloudProvider) => {
            const platform = cloudProviderToPlatformMap[newCloudProvider] || "Generic";
            setFieldValue("onprem_platform", platform);
            setFieldValue("cloudProvider", newCloudProvider);
          }}
          disabled={formMode !== "create"}
        />
      ),
      previewValue: values.cloudProvider
        ? () => {
            const cloudProvider = values.cloudProvider;
            return cloudProviderLongLogoMap[cloudProvider];
          }
        : null,
    });
  }

  if (isOnPrem) {
    fields.push({
      label: "Kubernetes Distribution",
      subLabel: "Choose the Kubernetes distribution supported by the selected platform",
      name: "kubernetesDistribution",
      required: true,
      customComponent: (
        <KubernetesDistributionsMultiSelect
          onPremPlatforms={formData.values.onprem_platform}
          setFieldValue={formData.setFieldValue}
          onPremPlatformOptions={onPremPlatformOptions as ("EKS" | "GKE" | "AKS" | "Generic")[]}
          disabled={formMode !== "create"}
        />
      ),
      previewValue: values.onprem_platform || null,
    });
  }

  if (customAvailabilityZoneFieldExists) {
    fields.push({
      dataTestId: "custom-availability-zone-select",
      label: "Custom Availability Zone",
      subLabel: "Select a specific availability zone for deploying your instance",
      name: "requestParams.custom_availability_zone",
      value: requestParams.custom_availability_zone || "",
      type: "select",
      menuItems: customAvailabilityZones.map((zone) => ({
        label: `${zone.cloudProviderName} - ${zone.code}`,
        value: zone.code,
      })),
      isLoading: isFetchingCustomAvailabilityZones,
      required: true,
      emptyMenuText: region ? "No availability zones" : "Please select a region first",
      disabled: formMode !== "create",
      previewValue: requestParams.custom_availability_zone,
    });
  }
  if (!isBYOCOnprem) {
    fields.push({
      dataTestId: "instance-custom-tags",
      label: "Tags",
      subLabel: "Add tags to your instance",
      name: "customTags",
      customComponent: <CustomTagsField formData={formData} />,
      previewValue: formData?.values.customTags?.filter((tag) => tag.key && tag.value)?.length
        ? formData.values.customTags
            ?.filter((tag) => tag.key && tag.value)
            ?.map((tag) => `${tag.key}:${tag.value}`)
            .join(", ")
        : null,
    });
  }

  return fields;
};

export const getNetworkConfigurationFields = (
  formMode: FormMode,
  formData,
  values,
  resourceSchema: APIEntity,
  serviceOfferingsObj: Record<string, Record<string, ServiceOffering>>,
  resources: ResourceSummary[],
  customNetworks: CustomNetwork[],
  isFetchingCustomNetworks: boolean
) => {
  const fields: Field[] = [];
  const { serviceId, servicePlanId } = values;
  const offering = serviceOfferingsObj[serviceId]?.[servicePlanId];
  const isMultiTenancy = offering?.productTierType === productTierTypes.OMNISTRATE_MULTI_TENANCY;

  const isBYOCOnprem = values.cloudProvider === "byoc-onprem";

  const inputParametersObj = (resourceSchema?.inputParameters || []).reduce((acc, param) => {
    acc[param.key] = param;
    return acc;
  }, {});

  const cloudProviderFieldExists = inputParametersObj["cloud_provider"];
  const customNetworkFieldExists = inputParametersObj["custom_network_id"];
  const cloudProviderNativeNetworkIdFieldExists = inputParametersObj["cloud_provider_native_network_id"];
  const customDNSFieldExists = inputParametersObj["custom_dns_configuration"];

  const getCustomDnsInputValue = (resourceKey: string): string => {
    const customDnsConfiguration = values?.requestParams?.custom_dns_configuration;

    if (!resourceKey) {
      return "";
    }

    if (
      customDnsConfiguration &&
      typeof customDnsConfiguration === "object" &&
      !Array.isArray(customDnsConfiguration)
    ) {
      const configuredValue = customDnsConfiguration[resourceKey];

      if (typeof configuredValue !== "string") {
        return "";
      }

      try {
        const parsedValue = JSON.parse(configuredValue);
        return parsedValue?.[resourceKey] ?? configuredValue;
      } catch {
        return configuredValue;
      }
    }

    if (typeof customDnsConfiguration === "string") {
      return normalizeCustomDnsValue(resourceKey, customDnsConfiguration);
    }

    return "";
  };

  const networkTypeFieldExists =
    cloudProviderFieldExists && !isMultiTenancy && offering?.supportsPublicNetwork && !isBYOCOnprem;

  if (networkTypeFieldExists) {
    fields.push({
      label: "Network Type",
      subLabel: "Type of Network",
      name: "network_type",
      value: values.network_type || "",
      type: "radio",
      required: true,
      options: [
        {
          dataTestId: "public-radio",
          label: "Public",
          value: "PUBLIC",
        },
        {
          dataTestId: "private-radio",
          label: "Private",
          value: "INTERNAL",
        },
      ],
      previewValue: values.network_type,
    });
  }

  if (customNetworkFieldExists && !isBYOCOnprem) {
    fields.push({
      dataTestId: "custom-network-id-select",
      label: "Customer Network ID",
      subLabel: "Select the customer network ID",
      description: <CustomNetworkDescription overlay="create" />,
      name: "requestParams.custom_network_id",
      value: values.requestParams.custom_network_id || "",
      type: "select",
      required: true,
      disabled: formMode !== "create",
      menuItems: getCustomNetworksMenuItems(
        customNetworks,
        values.cloudProvider,
        values.cloudProvider === "aws"
          ? offering.awsRegions || []
          : values.cloudProvider === "gcp"
            ? offering.gcpRegions || []
            : values.cloudProvider === "azure"
              ? offering.azureRegions || []
              : values.cloudProvider === "nebius"
                ? offering.nebiusRegions || []
                : offering.ociRegions || [],
        values.region
      ),
      emptyMenuText: "No customer networks available",
      isLoading: isFetchingCustomNetworks,
      previewValue: customNetworks.find((network) => network.id === values.requestParams.custom_network_id)?.name,
    });
  }

  if (
    cloudProviderNativeNetworkIdFieldExists &&
    cloudProviderFieldExists &&
    values.cloudProvider !== "gcp" &&
    values.cloudProvider !== "azure" &&
    !isBYOCOnprem
  ) {
    const param = inputParametersObj["cloud_provider_native_network_id"];
    fields.push({
      dataTestId: `${param.key}-input`,
      label: param.displayName || param.key,
      subLabel: (
        <>
          {param.description && <br />}
          If you&apos;d like to deploy within your VPC, enter its ID. Please ensure your VPC meets the{" "}
          <Link
            style={{
              textDecoration: "underline",
              color: "blue",
            }}
            href="https://docs.omnistrate.com/usecases/byoc/?#bring-your-own-vpc-byo-vpc"
            target="_blank"
            rel="noopener noreferrer"
          >
            prerequisites
          </Link>
          .
        </>
      ),
      disabled: formMode !== "create",
      name: `requestParams.${param.key}`,
      value: values.requestParams[param.key] || "",
      type: "text-multiline",
      required: formMode !== "modify" && param.required,
      previewValue: values.requestParams[param.key],
    });
  }

  if (customDNSFieldExists) {
    const param = inputParametersObj["custom_dns_configuration"];
    const customDnsResources = (resources || []).filter((resource) => resource?.customDNS === true);

    if (customDnsResources.length) {
      customDnsResources.forEach((resource) => {
        const resourceKey = resource?.key || resource?.id;
        if (!resourceKey) {
          return;
        }

        fields.push({
          dataTestId: `${param.key}.${resourceKey}`,
          label: `${resource?.name || resourceKey} Custom DNS`,
          subLabel: `Enter custom DNS value for ${resource?.name || resourceKey}`,
          disabled: formMode !== "create",
          name: `requestParams.${param.key}.${resourceKey}`,
          value: getCustomDnsInputValue(resourceKey),
          type: "text-multiline",
          required: formMode !== "modify" && param.required,
          previewValue: getCustomDnsInputValue(resourceKey),
          skipFormikHandleChange: true,
          onChange: (event) => {
            const currentConfig = values?.requestParams?.custom_dns_configuration;
            const normalizedConfig =
              currentConfig && typeof currentConfig === "object" && !Array.isArray(currentConfig) ? currentConfig : {};

            formData.setFieldValue("requestParams.custom_dns_configuration", {
              ...normalizedConfig,
              [resourceKey]: event.target.value,
            });
          },
        });
      });
    }
  }

  return fields;
};

export const getDeploymentConfigurationFields = (
  formMode: FormMode,
  values: any,
  resourceSchema: APIEntity,
  resourceIdInstancesHashMap,
  isFetchingResourceInstanceIds: boolean,
  cloudAccountInstances
) => {
  const fields: Field[] = [];
  if (!resourceSchema?.inputParameters) return fields;

  const filteredSchema = filterSchemaByCloudProvider(resourceSchema?.inputParameters || [], values.cloudProvider)
    .filter((param) => !REQUEST_PARAMS_FIELDS_TO_FILTER.includes(param.key))
    .filter((param) => param.key !== "cloud_provider_account_config_id")
    .sort((a, b) => {
      if (a.tabIndex === undefined || b.tabIndex === undefined) {
        return 0;
      }
      return a.tabIndex - b.tabIndex;
    });

  filteredSchema.forEach((param) => {
    if (param.type?.toLowerCase() === "password") {
      fields.push({
        dataTestId: `${param.key}-input`,
        label: param.displayName || param.key,
        subLabel: param.description,
        name: `requestParams.${param.key}`,
        value: values.requestParams[param.key] || "",
        type: "password",
        required: param.required,
        showPasswordGenerator: true,
        previewValue: values.requestParams[param.key] ? "********" : "",
        disabled: formMode !== "create" && param.custom && !param.modifiable,
      });
    } else if (param.dependentResourceID && param.key !== "cloud_provider_account_config_id") {
      const dependentResourceId = param.dependentResourceID;
      const options = resourceIdInstancesHashMap[dependentResourceId]
        ? resourceIdInstancesHashMap[dependentResourceId]
        : [];

      fields.push({
        dataTestId: `${param.key}-select`,
        label: param.displayName || param.key,
        subLabel: param.description,
        name: `requestParams.${param.key}`,
        value: values.requestParams[param.key],
        type: "select",
        menuItems: options.map((option) => ({
          label: option,
          value: option,
        })),
        required: param.required,
        isLoading: isFetchingResourceInstanceIds,
        emptyMenuText: "No dependent instances available",
        previewValue: values.requestParams[param.key],
        disabled: formMode !== "create" && param.custom && !param.modifiable,
      });
    } else if (param.type?.toLowerCase() === "boolean") {
      fields.push({
        label: param.displayName || param.key,
        subLabel: param.description,
        name: `requestParams.${param.key}`,
        value: values.requestParams[param.key] || "",
        type: "radio",
        options: [
          {
            dataTestId: `${param.key}-true-radio`,
            label: "True",
            value: "true",
            disabled: formMode !== "create" && param.custom && !param.modifiable,
          },
          {
            dataTestId: `${param.key}-false-radio`,
            label: "False",
            value: "false",
            disabled: formMode !== "create" && param.custom && !param.modifiable,
          },
        ],
        required: param.required,
        previewValue: values.requestParams[param.key] === "true" ? "true" : "false",
        disabled: formMode !== "create" && param.custom && !param.modifiable,
      });
    } else if (param.options !== undefined && param.isList === true) {
      fields.push({
        dataTestId: `${param.key}-select`,
        label: param.displayName || param.key,
        subLabel: param.description,
        name: `requestParams.${param.key}`,
        value: values.requestParams[param.key] || "",
        type: "multi-select-autocomplete",
        menuItems: [...param.options].sort().map((option) => ({
          label: option,
          value: option,
        })),
        required: param.required,
        previewValue: values.requestParams[param.key]?.join(", "),
        disabled: formMode !== "create" && param.custom && !param.modifiable,
      });
    } else if (param.options !== undefined && param.isList === false) {
      fields.push({
        dataTestId: `${param.key}-select`,
        label: param.displayName || param.key,
        subLabel: param.description,
        name: `requestParams.${param.key}`,
        value: values.requestParams[param.key] || "",
        type: "single-select-autocomplete",
        menuItems: param.options.map((option) => option),
        required: param.required,
        previewValue: values.requestParams[param.key],
        disabled: formMode !== "create" && param.custom && !param.modifiable,
      });
    } else if (param.key === "cloud_provider_account_config_id") {
      fields.push({
        dataTestId: `${param.key}-select`,
        label: param.displayName || param.key,
        subLabel: param.description,
        name: `requestParams.${param.key}`,
        description: (
          <AccountConfigDescription
            serviceId={values.serviceId}
            servicePlanId={values.servicePlanId}
            subscriptionId={values.subscriptionId}
          />
        ),
        value: values.requestParams[param.key] || "",
        type: "select",
        menuItems: cloudAccountInstances
          // Filter cloud accounts based on the selected subscription
          ?.filter((el) => el.subscriptionId === values.subscriptionId)
          .map((config) => ({
            label: config.label,
            value: config.id,
          })),
        required: param.required,
        disabled: formMode !== "create",
        previewValue: cloudAccountInstances.find((config) => config.id === values.requestParams[param.key])?.label,
        emptyMenuText: "No cloud accounts available",
      });
    } else if (param.type?.toUpperCase() === "ANY") {
      // Handle JSON type fields
      fields.push({
        dataTestId: `${param.key}-input`,
        label: param.displayName || param.key,
        subLabel: param.description,
        disabled: formMode !== "create" && param.custom && !param.modifiable,
        name: `requestParams.${param.key}`,
        value: getJsonValue(values.requestParams[param.key]),
        type: "code-editor",
        language: "json",
        required: param.required,
        previewValue: getJsonValue(values.requestParams[param.key]),
      });
    } else {
      if (param.key === "cloud_provider_account_config_id") {
        return;
      }

      if (param.type?.toLowerCase() === "float64" || param.type?.toLowerCase() === "number") {
        fields.push({
          dataTestId: `${param.key}-input`,
          label: param.displayName || param.key,
          subLabel: param.description,
          name: `requestParams.${param.key}`,
          value: values.requestParams[param.key],
          type: "number",
          required: param.required,
          previewValue: values.requestParams[param.key],
        });
      } else {
        fields.push({
          dataTestId: `${param.key}-input`,
          label: param.displayName || param.key,
          subLabel: param.description,
          disabled: formMode !== "create" && param.custom && !param.modifiable,
          name: `requestParams.${param.key}`,
          value: values.requestParams[param.key] || "",
          type: "text-multiline",
          required: param.required,
          previewValue: values.requestParams[param.key],
        });
      }
    }
  });

  return fields;
};

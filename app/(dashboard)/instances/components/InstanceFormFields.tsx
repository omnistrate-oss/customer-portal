import Link from "next/link";
import SubscriptionMenu from "app/(dashboard)/components/SubscriptionMenu/SubscriptionMenu";

import { Field } from "src/components/DynamicForm/types";
import { cloudProviderLongLogoMap } from "src/constants/cloudProviders";
import { productTierTypes } from "src/constants/servicePlan";
import { AvailabilityZone } from "src/types/availabilityZone";
import { CloudProvider, FormMode } from "src/types/common/enums";
import { CustomNetwork } from "src/types/customNetwork";
import { ResourceInstance } from "src/types/resourceInstance";
import { APIEntity, ServiceOffering } from "src/types/serviceOffering";
import { Subscription } from "src/types/subscription";

import CloudProviderRadio from "../../components/CloudProviderRadio/CloudProviderRadio";
import SubscriptionPlanRadio from "../../components/SubscriptionPlanRadio/SubscriptionPlanRadio";
import {
  getCustomNetworksMenuItems,
  getRegionMenuItems,
  getResourceMenuItems,
  getServiceMenuItems,
  getValidSubscriptionForInstanceCreation,
} from "../utils";

import AccountConfigDescription from "./AccountConfigDescription";
import CustomNetworkDescription from "./CustomNetworkDescription";

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
  instances: ResourceInstance[]
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

  const subscriptionMenuItems = subscriptions.filter((sub) => sub.productTierId === servicePlanId);

  const resourceMenuItems = getResourceMenuItems(serviceOfferingsObj[serviceId]?.[servicePlanId]);

  const inputParametersObj = (resourceSchema?.inputParameters || []).reduce((acc: any, param: any) => {
    acc[param.key] = param;
    return acc;
  }, {});

  const cloudProviderFieldExists = inputParametersObj["cloud_provider"];
  const regionFieldExists = inputParametersObj["region"];
  const customAvailabilityZoneFieldExists = inputParametersObj["custom_availability_zone"];

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
        const cloudProvider = offering?.cloudProviders?.[0] || "";
        setFieldValue("cloudProvider", cloudProvider);
        if (cloudProvider === "aws") {
          setFieldValue("region", offering.awsRegions?.[0] || "");
        } else if (cloudProvider === "gcp") {
          setFieldValue("region", offering.gcpRegions?.[0] || "");
        } else if (cloudProvider === "azure") {
          // @ts-ignore
          setFieldValue("region", offering.azureRegions?.[0] || "");
        }

        const resources = getResourceMenuItems(offering);
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
            const offering = serviceOfferingsObj[serviceId]?.[servicePlanId];
            const cloudProvider = offering?.cloudProviders?.[0] || "";

            setFieldValue("cloudProvider", cloudProvider);
            if (cloudProvider === "aws") {
              setFieldValue("region", offering.awsRegions?.[0] || "");
            } else if (cloudProvider === "gcp") {
              setFieldValue("region", offering.gcpRegions?.[0] || "");
            } else if (cloudProvider === "azure") {
              // @ts-ignore
              setFieldValue("region", offering.azureRegions?.[0] || "");
            }

            const resources = getResourceMenuItems(offering);
            setFieldValue("resourceId", resources[0]?.value || "");
            setFieldValue("requestParams", {});

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
    {
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
    },
  ];

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
              // @ts-ignore
              setFieldValue("region", offering.azureRegions?.[0] || "");
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

  if (regionFieldExists) {
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

  return fields;
};

export const getNetworkConfigurationFields = (
  formMode: FormMode,
  values,
  resourceSchema: APIEntity,
  serviceOfferingsObj: Record<string, Record<string, ServiceOffering>>,
  customNetworks: CustomNetwork[],
  isFetchingCustomNetworks: boolean
) => {
  const fields: Field[] = [];
  const { serviceId, servicePlanId } = values;
  const offering = serviceOfferingsObj[serviceId]?.[servicePlanId];
  const isMultiTenancy = offering?.productTierType === productTierTypes.OMNISTRATE_MULTI_TENANCY;

  const inputParametersObj = (resourceSchema?.inputParameters || []).reduce((acc, param) => {
    acc[param.key] = param;
    return acc;
  }, {});

  const cloudProviderFieldExists = inputParametersObj["cloud_provider"];
  const customNetworkFieldExists = inputParametersObj["custom_network_id"];
  const cloudProviderNativeNetworkIdFieldExists = inputParametersObj["cloud_provider_native_network_id"];
  const customDNSFieldExists = inputParametersObj["custom_dns_configuration"];

  const networkTypeFieldExists = cloudProviderFieldExists && !isMultiTenancy && offering?.supportsPublicNetwork;

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

  if (customNetworkFieldExists) {
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
            : offering.azureRegions || [],
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
    values.cloudProvider !== "azure"
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
            href="https://docs.omnistrate.com/usecases/byoa/?#bring-your-own-vpc-byo-vpc"
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
    fields.push({
      dataTestId: `${param.key}-input`,
      label: param.displayName || param.key,
      subLabel: param.description,
      disabled: formMode !== "create",
      name: `requestParams.${param.key}`,
      value: values.requestParams[param.key] || "",
      type: "text-multiline",
      required: formMode !== "modify" && param.required,
      previewValue: values.requestParams[param.key],
    });
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

  const filteredSchema = resourceSchema?.inputParameters
    .filter(
      (param) =>
        param.key !== "cloud_provider" &&
        param.key !== "region" &&
        param.key !== "custom_network_id" &&
        param.key !== "custom_availability_zone" &&
        param.key !== "subscriptionId" &&
        param.key !== "cloud_provider_native_network_id" &&
        param.key !== "custom_dns_configuration"
    )
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
        required: formMode !== "modify" && param.required,
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
        required: formMode !== "modify" && param.required,
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
        required: formMode !== "modify" && param.required,
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
        menuItems: param.options.map((option) => ({
          label: option,
          value: option,
        })),
        required: formMode !== "modify" && param.required,
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
        required: formMode !== "modify" && param.required,
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
        required: formMode !== "modify" && param.required,
        disabled: formMode !== "create",
        previewValue: cloudAccountInstances.find((config) => config.id === values.requestParams[param.key])?.label,
        emptyMenuText: "No cloud accounts available",
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
          required: formMode !== "modify" && param.required,
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
          required: formMode !== "modify" && param.required,
          previewValue: values.requestParams[param.key],
        });
      }
    }
  });

  return fields;
};

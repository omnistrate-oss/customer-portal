import { CloudProvider } from "src/types/common/enums";
import { ResourceInstance } from "src/types/resourceInstance";
import { ServiceOffering } from "src/types/serviceOffering";
import { Subscription } from "src/types/subscription";
import { CLOUD_PROVIDER_DEFAULT_CREATION_METHOD } from "src/utils/constants/accountConfig";
import {
  getHighestPermissionSubscription,
  isManageableSubscriptionRole,
  isSubscriptionWriteRole,
} from "src/utils/consumptionSubscriptionAdminRBAC";
import { getResultParams, isPrivateLinkEnabled } from "src/utils/instance";

export type CloudAccountFormValues = {
  serviceId: string;
  servicePlanId: string;
  subscriptionId: string;
  cloudProvider: string;
  accountConfigurationMethod: string;
  awsAccountId: string;
  gcpProjectId: string;
  gcpProjectNumber: string;
  azureSubscriptionId: string;
  azureTenantId: string;
  ociTenancyId: string;
  ociDomainId: string;
  nebiusTenantId: string;
  clusterName: string;
  clusterDescription: string;
  enablePrivateConnectivity: boolean;
};

export const BRING_OWN_VPCS_SUPPORTED_CLOUD_PROVIDERS = ["aws", "gcp", "azure"] as const;

export type CloudNativeNetworkState = {
  id?: string;
  cloudNativeNetworkId?: string;
  region?: string;
  status?: string;
  imported?: boolean;
  inUse?: boolean;
};

const isFailedCloudNativeNetwork = (network: CloudNativeNetworkState): boolean =>
  network.status?.toUpperCase() === "FAILED";

export const getCloudNativeNetworkId = (network: CloudNativeNetworkState): string | undefined =>
  network.cloudNativeNetworkId || network.id;

export const canImportCloudNativeNetwork = (network: CloudNativeNetworkState): boolean =>
  network.imported === false && network.inUse === false && !isFailedCloudNativeNetwork(network);

export const canUnimportCloudNativeNetwork = (network: CloudNativeNetworkState): boolean =>
  network.imported === true && network.inUse === false && !isFailedCloudNativeNetwork(network);

export const getCloudNativeNetworkDisabledReason = (network: CloudNativeNetworkState): string | undefined => {
  if (isFailedCloudNativeNetwork(network)) return "This VPC failed discovery and cannot be selected.";
  if (network.inUse && network.imported) return "This VPC is already imported and in use, so it cannot be changed.";
  if (network.inUse) return "This VPC is already in use, so it cannot be changed.";
  return undefined;
};

export const getCloudNativeNetworkRegions = (networks: CloudNativeNetworkState[]): string[] =>
  Array.from(
    new Set(networks.map((network) => network.region).filter((region): region is string => Boolean(region)))
  ).sort((a, b) => a.localeCompare(b));

export const getDefaultSelectedRegions = (regions: string[]): string[] =>
  Array.from(new Set(regions)).sort((a, b) => a.localeCompare(b));

export const getSelectableCloudNativeNetworkIds = (networks: CloudNativeNetworkState[]): Set<string> =>
  new Set(
    networks
      .filter((network) => canImportCloudNativeNetwork(network) || canUnimportCloudNativeNetwork(network))
      .map(getCloudNativeNetworkId)
      .filter((id): id is string => Boolean(id))
  );

export const isBringOwnVpcsSupported = (cloudProvider?: string): boolean =>
  BRING_OWN_VPCS_SUPPORTED_CLOUD_PROVIDERS.includes(
    cloudProvider as (typeof BRING_OWN_VPCS_SUPPORTED_CLOUD_PROVIDERS)[number]
  );

export const getValidSubscriptionForInstanceCreation = (
  serviceOfferingsObj: Record<string, Record<string, ServiceOffering>>,
  subscriptions: Subscription[],
  instances: ResourceInstance[],
  serviceId?: string,
  servicePlanId?: string,
  consumptionSubscriptionAdminRBAC = false
): Subscription | undefined => {
  // Build subscription instance count hash
  const subscriptionInstancesNumHash: Record<string, number> = {};
  instances.forEach((instance) => {
    const subId = instance.subscriptionId as string;
    subscriptionInstancesNumHash[subId] = (subscriptionInstancesNumHash[subId] || 0) + 1;
  });

  // Filter subscriptions to write-capable roles and valid service offerings
  let filteredSubscriptions = subscriptions.filter(
    (sub) =>
      serviceOfferingsObj[sub.serviceId]?.[sub.productTierId] &&
      isSubscriptionWriteRole(sub.roleType, consumptionSubscriptionAdminRBAC)
  );

  // Filter by serviceID if provided
  if (serviceId) {
    filteredSubscriptions = filteredSubscriptions.filter((subscription) => subscription.serviceId === serviceId);
  }
  if (servicePlanId) {
    filteredSubscriptions = filteredSubscriptions.filter(
      (subscription) => subscription.productTierId === servicePlanId
    );
  }

  // Sort by service name
  const sortedSubscriptions = filteredSubscriptions.sort((a, b) => a.serviceName.localeCompare(b.serviceName));

  // Helper function to check if subscription is valid for creation
  const isSubscriptionValid = (subscription: Subscription, checkQuota: boolean = true): boolean => {
    const serviceOffering = serviceOfferingsObj[subscription.serviceId]?.[subscription.productTierId] || {};

    // Check instance limit (only if checkQuota is true)
    if (checkQuota) {
      const limit = subscription.maxNumberOfInstances ?? serviceOffering.maxNumberOfInstances ?? Infinity;
      const instanceCount = subscriptionInstancesNumHash[subscription.id] || 0;
      const isLessThanLimit = limit === 0 ? false : instanceCount < limit;
      if (!isLessThanLimit) return false;
    }

    // Check payment configuration
    const hasValidPayment =
      subscription.paymentMethodConfigured ||
      (subscription.allowCreatesWhenPaymentNotConfigured ?? serviceOffering.allowCreatesWhenPaymentNotConfigured);

    return !!hasValidPayment;
  };

  const validSubscriptions = sortedSubscriptions.filter((sub) => isSubscriptionValid(sub, true));

  return getHighestPermissionSubscription(validSubscriptions, consumptionSubscriptionAdminRBAC);
};

export const getInitialValues = (
  initialFormValues: {
    serviceId: string;
    servicePlanId: string;
    subscriptionId: string;
  },
  selectedInstance: ResourceInstance | undefined,
  byoaSubscriptions: Subscription[],
  byoaServiceOfferingsObj: Record<string, Record<string, ServiceOffering>>,
  byoaServiceOfferings: ServiceOffering[],
  instances: ResourceInstance[],
  consumptionSubscriptionAdminRBAC = false
): CloudAccountFormValues => {
  if (selectedInstance) {
    const subscription = byoaSubscriptions.find((sub) => sub.id === selectedInstance.subscriptionId);
    const resultParams = getResultParams(selectedInstance);
    return {
      serviceId: subscription?.serviceId || "",
      servicePlanId: subscription?.productTierId || "",
      subscriptionId: subscription?.id || "",

      cloudProvider: resultParams?.gcp_project_id
        ? "gcp"
        : resultParams?.azure_subscription_id
          ? "azure"
          : resultParams?.aws_account_id
            ? "aws"
            : resultParams?.oci_tenancy_id
              ? "oci"
              : resultParams?.nebius_tenant_id
                ? "nebius"
                : resultParams?.cluster_name
                  ? "byoc-onprem"
                  : "",
      accountConfigurationMethod: resultParams?.account_configuration_method,
      awsAccountId: resultParams?.aws_account_id,
      gcpProjectId: resultParams?.gcp_project_id,
      gcpProjectNumber: resultParams?.gcp_project_number,
      azureSubscriptionId: resultParams?.azure_subscription_id,
      azureTenantId: resultParams?.azure_tenant_id,
      ociTenancyId: resultParams?.oci_tenancy_id,
      ociDomainId: resultParams?.oci_domain_id,
      nebiusTenantId: resultParams?.nebius_tenant_id || "",
      clusterName: resultParams?.cluster_name || "",
      clusterDescription: resultParams?.cluster_description || "",
      enablePrivateConnectivity: isPrivateLinkEnabled(resultParams),
    };
  }

  const isValidFormValues = Boolean(
    byoaSubscriptions.find(
      (sub) =>
        sub.serviceId === initialFormValues?.serviceId &&
        sub.productTierId === initialFormValues?.servicePlanId &&
        sub.id === initialFormValues?.subscriptionId &&
        isManageableSubscriptionRole(sub.roleType, consumptionSubscriptionAdminRBAC)
    )
  );

  if (isValidFormValues) {
    const cloudProvider =
      byoaServiceOfferingsObj[initialFormValues?.serviceId]?.[initialFormValues?.servicePlanId]?.cloudProviders?.[0] ||
      "";

    return {
      ...initialFormValues,
      cloudProvider,
      accountConfigurationMethod: CLOUD_PROVIDER_DEFAULT_CREATION_METHOD[cloudProvider],
      awsAccountId: "",
      gcpProjectId: "",
      gcpProjectNumber: "",
      azureSubscriptionId: "",
      azureTenantId: "",
      ociTenancyId: "",
      ociDomainId: "",
      nebiusTenantId: "",
      clusterName: "",
      clusterDescription: "",
      enablePrivateConnectivity: false,
    };
  }

  const filteredSubscriptions = byoaSubscriptions.filter(
    (sub) => byoaServiceOfferingsObj[sub.serviceId]?.[sub.productTierId]
  );

  const selectedSubscription: Subscription | undefined = getValidSubscriptionForInstanceCreation(
    byoaServiceOfferingsObj,
    byoaSubscriptions,
    instances,
    "",
    "",
    consumptionSubscriptionAdminRBAC
  );

  const serviceId =
    selectedSubscription?.serviceId || filteredSubscriptions[0]?.serviceId || byoaServiceOfferings[0]?.serviceId || "";

  const servicePlanId = selectedSubscription?.productTierId || "";

  const cloudProvider = byoaServiceOfferingsObj[serviceId]?.[servicePlanId]?.cloudProviders?.[0] || "";

  return {
    serviceId,
    servicePlanId,
    subscriptionId: selectedSubscription?.id || "",
    cloudProvider,
    accountConfigurationMethod: CLOUD_PROVIDER_DEFAULT_CREATION_METHOD[cloudProvider],
    awsAccountId: "",
    gcpProjectId: "",
    gcpProjectNumber: "",
    azureSubscriptionId: "",
    azureTenantId: "",
    ociTenancyId: "",
    ociDomainId: "",
    nebiusTenantId: "",
    clusterName: "",
    clusterDescription: "",
    enablePrivateConnectivity: false,
  };
};

export const getOffboardReadiness = (cloudAccountInstanceStatus?: string, accountConfigInstanceStatus?: string) => {
  if (
    (cloudAccountInstanceStatus === "DELETING" || cloudAccountInstanceStatus === "FAILED") &&
    accountConfigInstanceStatus === "READY_TO_OFFBOARD"
  )
    return true;
  else return false;
};

export const getExistingVpcCount = (instance: {
  result_params?: Record<string, any> | unknown;
  launch_input_params?: Record<string, any> | unknown;
}): number | undefined => {
  const resultParams = getResultParams(instance);
  if (Array.isArray(resultParams?.cloudNativeNetworks)) {
    return resultParams.cloudNativeNetworks.length;
  }

  const count = resultParams?.num_cloud_native_networks;
  if (typeof count === "number") {
    return count;
  }

  return undefined;
};

export const hasCloudNativeVpcConfiguration = (params?: Record<string, any>): boolean => {
  if (!params) return false;
  if (Array.isArray(params.cloudNativeNetworks) && params.cloudNativeNetworks.length > 0) return true;
  if (Array.isArray(params.cloud_native_networks) && params.cloud_native_networks.length > 0) return true;
  if (typeof params.cloudNativeNetworkId === "string" && params.cloudNativeNetworkId.length > 0) return true;
  if (typeof params.cloud_native_network_id === "string" && params.cloud_native_network_id.length > 0) return true;
  return Number(params.num_cloud_native_networks) > 0;
};

/** Infers the cloud provider of a cloud account instance from its result params. */
export const getCloudAccountProvider = (resultParams: Record<string, any>): CloudProvider | undefined => {
  if (resultParams?.aws_account_id) return "aws";
  if (resultParams?.gcp_project_id) return "gcp";
  if (resultParams?.azure_subscription_id) return "azure";
  if (resultParams?.oci_tenancy_id) return "oci";
  if (resultParams?.nebius_tenant_id) return "nebius";
  if (resultParams?.cluster_name) return "byoc-onprem";
  return undefined;
};

const CLOUDFORMATION_QUICKCREATE_PATH = "#/stacks/quickcreate";
const CLOUDFORMATION_UPDATE_PATH = "#/stacks/update";

/**
 * Points a cloud account's CloudFormation URL at the existing stack's update form and sets
 * one account-control parameter. The onboarding URL uses `quickcreate`, which would create a
 * duplicate stack instead of changing the live one.
 */
export const getAccountControlUrl = (cloudFormationUrl: string, parameter: string, value: boolean): string => {
  const updateUrl = cloudFormationUrl.replace(CLOUDFORMATION_QUICKCREATE_PATH, CLOUDFORMATION_UPDATE_PATH);
  const existingParam = new RegExp(`([?&]${parameter}=)[^&]*`);

  if (existingParam.test(updateUrl)) return updateUrl.replace(existingParam, `$1${value}`);

  const fragment = updateUrl.slice(updateUrl.indexOf("#") + 1);
  return `${updateUrl}${fragment.includes("?") ? "&" : "?"}${parameter}=${value}`;
};

/**
 * The account identifier shown to users for a cloud account instance. Providers are
 * mutually exclusive, so the first match wins. Returns "" when none is present —
 * callers decide their own empty-state text.
 */
export const getCloudAccountId = (resultParams: Record<string, any>): string =>
  resultParams?.gcp_project_id ||
  resultParams?.aws_account_id ||
  resultParams?.azure_subscription_id ||
  resultParams?.oci_tenancy_id ||
  resultParams?.nebius_tenant_id ||
  resultParams?.cluster_name ||
  "";

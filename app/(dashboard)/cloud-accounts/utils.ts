import { ResourceInstance } from "src/types/resourceInstance";
import { ServiceOffering } from "src/types/serviceOffering";
import { Subscription } from "src/types/subscription";
import { CLOUD_PROVIDER_DEFAULT_CREATION_METHOD } from "src/utils/constants/accountConfig";
import { getResultParams } from "src/utils/instance";

export const getValidSubscriptionForInstanceCreation = (
  serviceOfferingsObj: Record<string, Record<string, ServiceOffering>>,
  subscriptions: Subscription[],
  instances: ResourceInstance[],
  serviceId?: string,
  servicePlanId?: string
): Subscription | undefined => {
  // Build subscription instance count hash
  const subscriptionInstancesNumHash: Record<string, number> = {};
  instances.forEach((instance) => {
    const subId = instance.subscriptionId as string;
    subscriptionInstancesNumHash[subId] = (subscriptionInstancesNumHash[subId] || 0) + 1;
  });

  // Filter subscriptions to editor/root roles and valid service offerings
  let filteredSubscriptions = subscriptions.filter(
    (sub) => serviceOfferingsObj[sub.serviceId]?.[sub.productTierId] && ["root", "editor"].includes(sub.roleType)
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

  // First try to find a valid root subscription
  const rootSubscriptions = sortedSubscriptions.filter((sub) => sub.roleType === "root");
  const validRootSubscription = rootSubscriptions.find((sub) => isSubscriptionValid(sub));

  if (validRootSubscription) {
    return validRootSubscription;
  }

  // If no valid root subscription, try editor subscriptions
  // Note: Editor subscriptions always check quota
  const editorSubscriptions = sortedSubscriptions.filter((sub) => sub.roleType === "editor");
  return editorSubscriptions.find((sub) => isSubscriptionValid(sub, true));
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
  instances: ResourceInstance[]
) => {
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
                : "",
      accountConfigurationMethod:
        resultParams?.account_configuration_method,
      awsAccountId: resultParams?.aws_account_id,
      gcpProjectId: resultParams?.gcp_project_id,
      gcpProjectNumber: resultParams?.gcp_project_number,
      azureSubscriptionId:
        resultParams?.azure_subscription_id,
      azureTenantId: resultParams?.azure_tenant_id,
      ociTenancyId:
        resultParams?.oci_tenancy_id,
      ociDomainId: resultParams?.oci_domain_id,
    };
  }

  const isValidFormValues = Boolean(
    byoaSubscriptions.find(
      (sub) =>
        sub.serviceId === initialFormValues?.serviceId &&
        sub.productTierId === initialFormValues?.servicePlanId &&
        sub.id === initialFormValues?.subscriptionId &&
        sub.roleType === "root"
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
    ""
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
    ociTenancyId: "",
    ociDomainId: "",
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

import { CurrentTab } from "app/(dashboard)/instances/[serviceId]/[servicePlanId]/[resourceId]/[instanceId]/[subscriptionId]/page";

export const getDashboardRoute = () => {
  return "/dashboard";
};

export const getInstancesRoute = () => {
  return "/instances";
};

export const getInstanceSnapshotsRoute = () => {
  return "/instance-snapshots";
};

export const getSnapshotDetailsRoute = (snapshotId: string): string => {
  return `/instance-snapshots/${snapshotId}`;
};

type InstanceDetailsRouteParams = {
  serviceId: string;
  servicePlanId: string;
  resourceId: string;
  instanceId: string;
  subscriptionId: string;
  viewType?: CurrentTab;
};

export const getInstanceDetailsRoute = ({
  serviceId,
  servicePlanId,
  resourceId,
  instanceId,
  subscriptionId,
  viewType,
}: InstanceDetailsRouteParams): string => {
  let url = `/instances/${serviceId}/${servicePlanId}/${resourceId}/${instanceId}/${subscriptionId}`;
  if (viewType) {
    url = url + `?view=${viewType}`;
  }
  return url;
};

export const getCustomNetworksRoute = ({ overlay }: { overlay?: string }) => {
  if (overlay) {
    return `/custom-networks?overlay=${overlay}`;
  }

  return "/custom-networks";
};

export const getCloudAccountsRoute = ({
  serviceId,
  servicePlanId,
  subscriptionId,
}: {
  serviceId?: string;
  servicePlanId?: string;
  subscriptionId?: string;
}) => {
  if (serviceId && servicePlanId && subscriptionId) {
    return `/cloud-accounts?serviceId=${serviceId}&servicePlanId=${servicePlanId}&subscriptionId=${subscriptionId}`;
  }
  return "/cloud-accounts";
};

export const getAccessControlRoute = (userId?: string) => {
  if (userId) {
    return `/access-control?userId=${userId}`;
  }
  return "/access-control";
};

export const getEventsRoute = () => {
  return "/audit-logs";
};

export const getNotificationsRoute = () => {
  return "/alerts";
};

export const getBillingRoute = () => {
  return "/billing";
};

export const getCostExplorerRoute = () => {
  return "/cost-explorer";
};

export const getSettingsRoute = () => {
  return "/settings";
};

export const getSubscriptionsRoute = ({
  subscriptionId,
  serviceId,
  servicePlanId,
}: {
  subscriptionId?: string;
  serviceId?: string;
  servicePlanId?: string;
}) => {
  if (subscriptionId) {
    return `/subscriptions?subscriptionId=${subscriptionId}`;
  }
  if (serviceId && servicePlanId) {
    return `/subscriptions?serviceId=${serviceId}&servicePlanId=${servicePlanId}`;
  }
  return "/subscriptions";
};

export const getSigninRoute = () => {
  return "/signin";
};

export const getSignupRoute = () => {
  return "/signup";
};

export const getResetPasswordRoute = () => {
  return "/reset-password";
};

export const getTermsOfUseRoute = () => {
  return "/terms-of-use";
};

export const getPrivacyPolicyRoute = () => {
  return "/privacy-policy";
};

export const getCookiePolicyRoute = () => {
  return "/cookie-policy";
};

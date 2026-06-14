import type { Subscription } from "src/types/subscription";

const subscriptionUserInviteRoleOptions = ["Editor", "Reader"];
const subscriptionUserInviteRoleOptionsWithAdmin = ["Admin", "Editor", "Reader"];

export const getSubscriptionUserInviteRoleOptions = (consumptionSubscriptionAdminRBAC = false) =>
  consumptionSubscriptionAdminRBAC ? subscriptionUserInviteRoleOptionsWithAdmin : subscriptionUserInviteRoleOptions;

export const toSubscriptionUserRoleType = (roleLabel: string) => roleLabel.toLowerCase();

export const isManageableSubscriptionRole = (roleType?: string, consumptionSubscriptionAdminRBAC = false) => {
  return roleType === "root" || (consumptionSubscriptionAdminRBAC && roleType === "admin");
};

export const isSubscriptionWriteRole = (roleType?: string, consumptionSubscriptionAdminRBAC = false) => {
  return roleType === "root" || roleType === "editor" || (consumptionSubscriptionAdminRBAC && roleType === "admin");
};

export const getSubscriptionRolePriority = (roleType?: string, consumptionSubscriptionAdminRBAC = false) => {
  switch (roleType) {
    case "root":
      return 4;
    case "admin":
      return consumptionSubscriptionAdminRBAC ? 3 : 0;
    case "editor":
      return 2;
    case "reader":
      return 1;
    default:
      return 0;
  }
};

export const getHighestPermissionSubscription = <T extends Pick<Subscription, "roleType" | "serviceName">>(
  subscriptions: T[],
  consumptionSubscriptionAdminRBAC = false
): T | undefined => {
  if (!subscriptions.length) {
    return undefined;
  }

  return [...subscriptions].sort((a, b) => {
    const priorityDiff =
      getSubscriptionRolePriority(b.roleType, consumptionSubscriptionAdminRBAC) -
      getSubscriptionRolePriority(a.roleType, consumptionSubscriptionAdminRBAC);
    if (priorityDiff !== 0) return priorityDiff;

    return (a.serviceName || "").localeCompare(b.serviceName || "");
  })[0];
};

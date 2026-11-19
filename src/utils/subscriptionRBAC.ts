import type { Subscription } from "src/types/subscription";

const subscriptionUserInviteRoleOptions = ["Admin", "Editor", "Reader"];

export const getSubscriptionUserInviteRoleOptions = () => subscriptionUserInviteRoleOptions;

export const toSubscriptionUserRoleType = (roleLabel: string) => roleLabel.toLowerCase();

export const isManageableSubscriptionRole = (roleType?: string) => {
  return roleType === "root" || roleType === "admin";
};

export const isSubscriptionWriteRole = (roleType?: string) => {
  return roleType === "root" || roleType === "admin" || roleType === "editor";
};

const getSubscriptionRolePriority = (roleType?: string) => {
  switch (roleType) {
    case "root":
      return 4;
    case "admin":
      return 3;
    case "editor":
      return 2;
    case "reader":
      return 1;
    default:
      return 0;
  }
};

export const getHighestPermissionSubscription = <T extends Pick<Subscription, "roleType" | "serviceName">>(
  subscriptions: T[]
): T | undefined => {
  if (!subscriptions.length) {
    return undefined;
  }

  return [...subscriptions].sort((a, b) => {
    const priorityDiff = getSubscriptionRolePriority(b.roleType) - getSubscriptionRolePriority(a.roleType);
    if (priorityDiff !== 0) return priorityDiff;

    return (a.serviceName || "").localeCompare(b.serviceName || "");
  })[0];
};

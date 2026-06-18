const ROLE_TYPES = {
  ROOT: "root",
  ADMIN: "admin",
  EDITOR: "editor",
  READER: "reader",
};

// If a user has multiple subscriptions this function finds the subscription by priority.
// Priority order is default subscription, root, admin when admin RBAC is enabled, editor, then reader.

export const findSubscriptionByPriority = (
  subscriptions,
  serviceId,
  productTierId,
  consumptionSubscriptionAdminRBAC = false
) => {
  if (!subscriptions || !subscriptions?.length) {
    return null;
  }

  const filteredList = subscriptions?.filter(
    (item) => item?.serviceId === serviceId && item?.productTierId === productTierId
  );

  if (!filteredList?.length) {
    return null;
  }

  const defaultSubscription = filteredList?.find((item) => item?.defaultSubscription);
  if (defaultSubscription) {
    return defaultSubscription;
  }

  const rootSubscription = filteredList?.find((item) => item?.roleType === ROLE_TYPES.ROOT);
  if (rootSubscription) {
    return rootSubscription;
  }

  if (consumptionSubscriptionAdminRBAC) {
    const adminSubscription = filteredList?.find((item) => item?.roleType === ROLE_TYPES.ADMIN);
    if (adminSubscription) {
      return adminSubscription;
    }
  }

  const editorSubscription = filteredList?.find((item) => item?.roleType === ROLE_TYPES.EDITOR);
  if (editorSubscription) {
    return editorSubscription;
  }

  const readerSubscription = filteredList?.find((item) => item?.roleType === ROLE_TYPES.READER);
  if (readerSubscription) {
    return readerSubscription;
  }
};

export const checkSubscriptionIsForProductTier = (subscription, serviceId, productTierId) => {
  return subscription?.serviceId === serviceId && subscription?.productTierId === productTierId;
};

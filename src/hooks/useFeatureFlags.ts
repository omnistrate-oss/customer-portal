import { useProviderOrgDetails } from "src/providers/ProviderOrgDetailsProvider";

const featureFlagNames = {
  autoEnabledByocPrivateLink: "AUTO_ENABLED_BYOC_PRIVATE_LINK",
  consumptionSubscriptionAdminRBAC: "CONSUMPTION_SUBSCRIPTION_ADMIN_RBAC",
} as const;

const useFeatureFlags = () => {
  const { featureFlags } = useProviderOrgDetails();

  return {
    autoEnabledByocPrivateLink: Boolean(featureFlags?.[featureFlagNames.autoEnabledByocPrivateLink]),
    consumptionSubscriptionAdminRBAC: Boolean(featureFlags?.[featureFlagNames.consumptionSubscriptionAdminRBAC]),
  };
};

export default useFeatureFlags;

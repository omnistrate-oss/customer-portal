import { useProviderOrgDetails } from "src/providers/ProviderOrgDetailsProvider";

const featureFlagNames = {
  consumptionSubscriptionAdminRBAC: "CONSUMPTION_SUBSCRIPTION_ADMIN_RBAC",
} as const;

const useFeatureFlags = () => {
  const { featureFlags } = useProviderOrgDetails();

  return {
    consumptionSubscriptionAdminRBAC: Boolean(featureFlags?.[featureFlagNames.consumptionSubscriptionAdminRBAC]),
  };
};

export default useFeatureFlags;

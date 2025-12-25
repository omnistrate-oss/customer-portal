import { ServiceOffering } from "src/types/serviceOffering";

export const isCustomNetworkEnabledOnServiceOffering = (offering: ServiceOffering) => {
  return !!offering.serviceModelFeatures?.find((featureConfig) => {
    return featureConfig.feature === "CUSTOM_NETWORKS";
  });
};

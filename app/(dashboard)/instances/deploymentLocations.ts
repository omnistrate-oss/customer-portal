import type { ServiceOffering } from "src/types/serviceOffering";
import type { Subscription } from "src/types/subscription";

export const getSubscriptionDeploymentOffering = (
  offering: ServiceOffering | undefined,
  subscription: Subscription | undefined
): ServiceOffering | undefined => {
  const locations = subscription?.allowedDeploymentLocations;
  if (!offering || !locations?.length) return offering;

  const allowedProviders = (offering.cloudProviders || []).filter((provider) =>
    locations.some((location) => location.cloudProvider === provider || location.cloudProvider === "all")
  );
  const regionsFor = (provider: string, regions: string[] | undefined): string[] => {
    const matches = locations.filter(
      (location) => location.cloudProvider === provider || location.cloudProvider === "all"
    );
    return (regions || []).filter((region) =>
      matches.some((location) => !location.regions?.length || location.regions.includes(region))
    );
  };

  return {
    ...offering,
    cloudProviders: allowedProviders,
    awsRegions: regionsFor("aws", offering.awsRegions),
    gcpRegions: regionsFor("gcp", offering.gcpRegions),
    azureRegions: regionsFor("azure", offering.azureRegions),
    ociRegions: regionsFor("oci", offering.ociRegions),
    nebiusRegions: regionsFor("nebius", offering.nebiusRegions),
    byocOnpremRegions: regionsFor("byoc-onprem", offering.byocOnpremRegions),
  };
};

export const getSubscriptionDeploymentValues = <T extends { cloudProvider: string; region: string | undefined }>(
  values: T,
  offering: ServiceOffering | undefined
): T => {
  if (!offering) return values;
  const cloudProvider = offering.cloudProviders?.includes(values.cloudProvider)
    ? values.cloudProvider
    : offering.cloudProviders?.[0] || "";
  const providerRegions: Record<string, string[] | undefined> = {
    aws: offering.awsRegions,
    gcp: offering.gcpRegions,
    azure: offering.azureRegions,
    oci: offering.ociRegions,
    nebius: offering.nebiusRegions,
    "byoc-onprem": offering.byocOnpremRegions,
  };
  const regions = (providerRegions[cloudProvider] || []).map((region) => ({ value: region }));
  const region = regions.some((item) => item.value === values.region) ? values.region : regions[0]?.value || "";
  return { ...values, cloudProvider, region };
};

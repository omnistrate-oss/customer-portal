const axios = require("../axios");
const ProviderAuthError = require("../utils/ProviderAuthError");
const withProviderTokenExpirationHanding = require("../utils/withProviderTokenExpirationHandling");

const OBSERVABILITY_RESOURCE_ID = "r-obsrv";
const INJECTED_ACCOUNT_CONFIG_RESOURCE_ID = "r-injectedaccountconfig";

function shouldIncludeResource(resource, shouldFilterInjectedAccountConfig) {
  const resourceId = resource?.id;
  const isObservabilityResource = resourceId?.includes(OBSERVABILITY_RESOURCE_ID);
  const isInjectedAccountConfigResource =
    shouldFilterInjectedAccountConfig && resourceId?.includes(INJECTED_ACCOUNT_CONFIG_RESOURCE_ID);

  return !(isObservabilityResource || isInjectedAccountConfigResource);
}

function mapResourceSummary(resource) {
  const hasCustomDNS = (resource?.capabilities || []).some((capability) => capability?.capability === "CUSTOM_DNS");

  return {
    customDNS: hasCustomDNS,
    id: resource?.id,
    key: resource?.key,
    name: resource?.name,
  };
}

function getResources(params = {}) {
  const { serviceId, productTierId, productTierVersion, isInjectedAccountConfig = false } = params;

  return axios
    .get(
      `/service/${serviceId}/producttier/${productTierId}/resource`,
      productTierVersion
        ? {
            params: {
              ProductTierVersion: productTierVersion,
            },
          }
        : undefined
    )
    .then((response) => {
      const data = response?.data || {};
      const resources = data.resources || [];

      const shouldFilterInjectedAccountConfig = !isInjectedAccountConfig;

      return resources
        .filter((resource) => shouldIncludeResource(resource, shouldFilterInjectedAccountConfig))
        .map((resource) => mapResourceSummary(resource));
    })
    .catch((error) => {
      console.error("getResources error", error);
      if (error.response && error.response.status === 401) {
        throw new ProviderAuthError();
      } else {
        throw error;
      }
    });
}

module.exports = {
  getResources: withProviderTokenExpirationHanding(getResources),
};

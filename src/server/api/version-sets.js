const axios = require("../axios");
const ProviderAuthError = require("../utils/ProviderAuthError");
const withProviderTokenExpirationHanding = require("../utils/withProviderTokenExpirationHandling");

function getVersionSets(params = {}) {
  const { serviceId, productTierId } = params;

  return axios
    .get(`/service/${serviceId}/productTier/${productTierId}/version-set`)
    .then((response) => {
      const data = response?.data || {};
      return data.tierVersionSets || [];
    })
    .catch((error) => {
      console.error("getVersionSets error", error?.response?.data || error.message);
      if (error.response && error.response.status === 401) {
        throw new ProviderAuthError();
      } else {
        throw error;
      }
    });
}

module.exports = {
  getVersionSets: withProviderTokenExpirationHanding(getVersionSets),
};

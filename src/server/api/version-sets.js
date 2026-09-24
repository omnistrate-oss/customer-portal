const axios = require("../axios");
const ProviderAuthError = require("../utils/ProviderAuthError");
const withProviderTokenExpirationHanding = require("../utils/withProviderTokenExpirationHandling");

function getVersionSets(params = {}) {
  const { serviceId, productTierId } = params;

  return axios
    .get(`/service/${encodeURIComponent(serviceId)}/productTier/${encodeURIComponent(productTierId)}/version-set`)
    .then((response) => {
      const data = response?.data || {};
      const versionSets = data.tierVersionSets || [];
      // Only the fields Release History shows.
      return versionSets
        .sort((a, b) => {
          const getTime = (item) => new Date(item.releasedAt || item.createdAt || 0).getTime() || 0;
          return getTime(b) - getTime(a);
        })
        .map(({ version, name, releasedAt, releaseNotes }) => ({ version, name, releasedAt, releaseNotes }));
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

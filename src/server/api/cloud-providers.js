const axios = require("../axios");
const ProviderAuthError = require("../utils/ProviderAuthError");
const withProviderTokenExpirationHanding = require("../utils/withProviderTokenExpirationHandling");

async function getCloudProviders() {
  try {
    const response = await axios.get("/cloud-provider");
    const cloudProviderIds = response.data.ids;

    const cloudProvidersResponse = [];
    await Promise.all(
      cloudProviderIds.map((providerId) => {
        return axios.get(`/cloud-provider/${providerId}`).then((res) => {
          const { data } = res;
          cloudProvidersResponse.push(data);
        });
      })
    );

    return cloudProvidersResponse;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      throw new ProviderAuthError();
    } else {
      throw error;
    }
  }
}

module.exports = {
  getCloudProviders: withProviderTokenExpirationHanding(getCloudProviders),
};

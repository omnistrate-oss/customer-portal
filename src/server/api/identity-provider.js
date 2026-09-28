const axios = require("../axios");
const ProviderAuthError = require("../utils/ProviderAuthError");
const withProviderTokenExpirationHanding = require("../utils/withProviderTokenExpirationHandling");
const { errorSummary } = require("../utils/errorSummary");

function getRenderIdentityProvidersList(queryParams) {
  return axios
    .get("/identity-provider-render", {
      params: queryParams,
    })
    .catch((error) => {
      console.log("list identity provider error", errorSummary(error));
      if (error.response && error.response.status === 401) {
        throw new ProviderAuthError();
      } else {
        throw error;
      }
    });
}

module.exports = {
  getRenderIdentityProvidersList: withProviderTokenExpirationHanding(getRenderIdentityProvidersList),
};

const axios = require("../axios");
const ProviderAuthError = require("../utils/ProviderAuthError");
const withProviderTokenExpirationHanding = require("../utils/withProviderTokenExpirationHandling");

//These apis are supposed to be used on the nextjs server
//The customer user apis require provider's jwt token to be present in the headers for auth
//the withProviderTokenExpirationHanding HOF makes sure that a valid JWT token is available before the requests
//If the server still returns a 401(invalid JWT token), throw a provider auth error which can be used to send appropriate response to the client
function customerUserSignUp(payload, ipHeaders = {}) {
  return axios
    .post("/customer-user-signup", payload, {
      headers: ipHeaders,
    })
    .catch((error) => {
      if (error.response && error.response.status === 401) {
        throw new ProviderAuthError();
      } else {
        throw error;
      }
    });
}

function customerUserSignIn(payload, ipHeaders = {}) {
  return axios
    .post("/customer-user-signin", payload, {
      headers: ipHeaders,
    })
    .catch((error) => {
      if (error.response && error.response.status === 401) {
        throw new ProviderAuthError();
      } else {
        throw error;
      }
    });
}

function customerSignInWithIdentityProvider(payload, ipHeaders = {}) {
  return axios
    .post("/customer-login-with-identity-provider", payload, {
      headers: ipHeaders,
    })
    .catch((error) => {
      if (error.response && error.response.status === 401) {
        throw new ProviderAuthError();
      } else {
        throw error;
      }
    });
}

function customerUserResetPassword(payload, ipHeaders = {}) {
  return axios
    .post("/customer-reset-password", payload, {
      headers: ipHeaders,
    })
    .catch((error) => {
      console.log("Reset password error", error);
      if (error.response && error.response.status === 401) {
        throw new ProviderAuthError();
      } else {
        throw error;
      }
    });
}

function getProviderOrgDetails() {
  return axios.get("/user").catch((error) => {
    console.log("getProviderOrgDetails error");
    if (error.response && error.response.status === 401) {
      throw new ProviderAuthError();
    } else {
      throw error;
    }
  });
}

module.exports = {
  customerUserSignUp: withProviderTokenExpirationHanding(customerUserSignUp),
  customerUserSignIn: withProviderTokenExpirationHanding(customerUserSignIn),
  customerUserResetPassword: withProviderTokenExpirationHanding(customerUserResetPassword),
  getProviderOrgDetails: withProviderTokenExpirationHanding(getProviderOrgDetails),
  customerSignInWithIdentityProvider: withProviderTokenExpirationHanding(customerSignInWithIdentityProvider),
};

const axios = require("../axios");
const ProviderAuthError = require("../utils/ProviderAuthError");
const withProviderTokenExpirationHanding = require("../utils/withProviderTokenExpirationHandling");

//These apis are supposed to be used on the nextjs server
//The customer user apis require provider's jwt token to be present in the headers for auth
//the withProviderTokenExpirationHanding HOF makes sure that a valid JWT token is available before the requests
//If the server still returns a 401(invalid JWT token), throw a provider auth error which can be used to send appropriate response to the client
function customerUserSignUp(payload) {
  return axios.post("/customer-user-signup", payload).catch((error) => {
    console.log("Sign up error");
    if (error.response && error.response.status === 401) {
      throw new ProviderAuthError();
    } else {
      throw error;
    }
  });
}

function customerUserSignIn(payload) {
  return axios.post("/customer-user-signin", payload).catch((error) => {
    console.log("Sign in error");
    if (error.response && error.response.status === 401) {
      throw new ProviderAuthError();
    } else {
      throw error;
    }
  });
}

function customerUserResetPassword(payload) {
  return axios.post("/customer-reset-password", payload).catch((error) => {
    if (error.response && error.response.status === 401) {
      console.log("Reset password error");
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
  customerUserResetPassword: withProviderTokenExpirationHanding(
    customerUserResetPassword
  ),
  getProviderOrgDetails: withProviderTokenExpirationHanding(
    getProviderOrgDetails
  ),
};

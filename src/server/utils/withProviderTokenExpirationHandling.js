const axios = require("../axios");
const { getProviderToken, setProviderToken } = require("../providerToken");
const { fetchProviderAuthToken } = require("./fetchProviderAuthToken");

//HOF for api calls from server to omnistrate backend
//to be used with api calls which require service provider's jwt token
//this hof will fetch/refresh the provider auth token  and makes sure that a valid JWT token is available before the requests
function withProviderTokenExpirationHanding(callbackFn) {
  return async (...args) => {
    let response = null;

    const providerAuthToken = getProviderToken();

    if (!providerAuthToken) {
      console.log("Auth token not present");
      const authTokenResponse = await fetchProviderAuthToken();
      const token = authTokenResponse.data.jwtToken;
      setProviderToken(token);
      axios.defaults.headers.Authorization = "Bearer " + token;
      //call the callback fn again
      response = await callbackFn(...args);
    } else {
      console.log("Auth token present");
      try {
        response = await callbackFn(...args);
      } catch (error) {
        console.log("Callback api error");
        //if callback fails because of a 401 error, refetch the provider JWT token update it in the app memory and update the axios config. Then retry the callback
        //if callback fails due to some other reason, or if the refetch JWT token fails, throw error
        if (error.name === "ProviderAuthError") {
          console.log("Callback api failed with 401, refetching token");
          //Provider JWT token is expired. Refetch JWT and set in memory and axios
          //If this api fails, en error should be thrown automatically
          const authTokenResponse = await fetchProviderAuthToken();
          const token = authTokenResponse.data.jwtToken;
          setProviderToken(token);
          axios.defaults.headers.Authorization = "Bearer " + token;
          //call the callback fn again
          response = await callbackFn(...args);
        } else {
          throw error;
        }
      }
    }
    return response;
  };
}

module.exports = withProviderTokenExpirationHanding;

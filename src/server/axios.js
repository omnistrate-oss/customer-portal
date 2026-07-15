const Axios = require("axios");
//get backend base url
const { baseURL } = require("../axios");
const { getProviderToken } = require("./providerToken");

//The server uses a separate axios instance
//This instance will use service provider's JWT token for auth
const axios = Axios.create({
  baseURL,
});

axios.interceptors.request.use((config) => {
  //A provider API key, when configured, is sent as the X-API-Key header and
  //replaces the email/password bearer JWT flow. It is a static, long-lived
  //credential, so there is no /signin exchange or token refresh.
  if (process.env.PROVIDER_API_KEY) {
    config.headers["X-API-Key"] = process.env.PROVIDER_API_KEY;
    return config;
  }

  const providerAuthToken = getProviderToken();
  if (providerAuthToken) {
    config.headers.Authorization = `Bearer ${providerAuthToken}`;
  }
  return config;
});

module.exports = axios;

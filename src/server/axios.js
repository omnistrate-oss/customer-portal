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
  const providerAuthToken = getProviderToken();
  if (providerAuthToken) {
    config.headers.Authorization = `Bearer ${providerAuthToken}`;
  }
  return config;
});

module.exports = axios;

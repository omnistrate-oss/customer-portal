const axios = require("../axios");
const ProviderAuthError = require("./ProviderAuthError");

function fetchProviderAuthToken() {
  //If a provider API key is configured, use it directly as the bearer credential.
  //The API key takes precedence over PROVIDER_EMAIL/PROVIDER_PASSWORD and needs no
  ///signin exchange, so return it in the same shape the callers expect.
  if (process.env.PROVIDER_API_KEY) {
    return Promise.resolve({ data: { jwtToken: process.env.PROVIDER_API_KEY } });
  }

  const signInPayload = {
    email: process.env.PROVIDER_EMAIL,
    password: "",
  };

  //Sign in using PROVIDER_PASSWORD. If not available, sign in using PROVIDER_HASHED_PASS
  //PROVIDER_HASHED_PASS will be deprecated
  if (process.env.PROVIDER_PASSWORD !== undefined) {
    signInPayload["password"] = process.env.PROVIDER_PASSWORD;
  } else if (process.env.PROVIDER_HASHED_PASS !== undefined) {
    delete signInPayload.password;
    signInPayload["hashedPassword"] = process.env.PROVIDER_HASHED_PASS;
  }

  return axios.post("/signin", signInPayload).catch((error) => {
    console.error("Provider sign in failure", error);
    throw new ProviderAuthError();
  });
}

module.exports = {
  fetchProviderAuthToken,
};

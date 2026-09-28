const axios = require("../axios");
const ProviderAuthError = require("./ProviderAuthError");
const { errorSummary } = require("./errorSummary");

function fetchProviderAuthToken() {
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
    console.error("Provider sign in failure", errorSummary(error));
    throw new ProviderAuthError();
  });
}

module.exports = {
  fetchProviderAuthToken,
};

const { getNodeMailerConfig } = require("../mail-service/mail-config");
const { setProviderToken } = require("../providerToken");
const { fetchProviderAuthToken } = require("./fetchProviderAuthToken");
const nodemailer = require("nodemailer");

//Checks if all environment variables are configured
//Verifies provider auth credentials by attempting a signin
//Verfied mail credentials by attempting a signin
//Returns an array of objects where each object contains 1) env variable name 2) env variable status

const environmentVariableStatuses = {
  NotDefined: "Not Defined",
  Unverified: "Unverified",
  Verified: "Verified",
  Invalid: "Invalid",
};

async function verifyEnvrionmentVariables() {
  let areProviderCredentialsVerified = false;
  let areMailCredentialsVerified = false;
  /*Sign in to to provider account can be done using 
    a)omnistrate account password
    b)omnistrate account hashed password (to be deprecated soon)
    isUsingHashedPassword indicates which method is being used
  */
  let isUsingHashedPassword = false;

  const envVariablesStatus = {
    PROVIDER_EMAIL: environmentVariableStatuses.NotDefined,
    PROVIDER_PASSWORD: environmentVariableStatuses.NotDefined,
    YOUR_SAAS_DOMAIN_URL: environmentVariableStatuses.NotDefined,
    MAIL_USER_EMAIL: environmentVariableStatuses.NotDefined,
    MAIL_USER_PASSWORD: environmentVariableStatuses.NotDefined,
  };

  const requiredEnvironmentVariables = Object.keys(envVariablesStatus);

  const undefinedEnvironmentVariables = requiredEnvironmentVariables.filter((envVariableName) => {
    if (process.env[envVariableName] === undefined) {
      return true;
    } else {
      envVariablesStatus[envVariableName] = environmentVariableStatuses.Unverified;
      return false;
    }
  });

  if (undefinedEnvironmentVariables.includes("PROVIDER_PASSWORD")) {
    //Check if PROVIDER_HASHED_PASS is available instead
    //If available, replace PROVIDER_PASSWORD with PROVIDER_HASHED_PASS
    if (process.env.PROVIDER_HASHED_PASS !== undefined) {
      delete envVariablesStatus.PROVIDER_PASSWORD;
      envVariablesStatus["PROVIDER_HASHED_PASS"] = environmentVariableStatuses.Unverified;
      const providerPasswordIndex = undefinedEnvironmentVariables.findIndex(
        (envVarName) => envVarName === "PROVIDER_PASSWORD"
      );
      undefinedEnvironmentVariables.splice(providerPasswordIndex, 1);
      isUsingHashedPassword = true;
    }
  }

  if (undefinedEnvironmentVariables.length === 0) {
    console.log("All environment variables are available");
  } else {
    console.log("Undefined environment variables", undefinedEnvironmentVariables);
  }

  const providerEmail = process.env.PROVIDER_EMAIL;
  const providerPassword = isUsingHashedPassword ? process.env.PROVIDER_HASHED_PASS : process.env.PROVIDER_PASSWORD;
  // const saasURL = process.env.YOUR_SAAS_DOMAIN_URL;
  const mailUserEmail = process.env.MAIL_USER_EMAIL;
  const mailUserPassword = process.env.MAIL_USER_PASSWORD;

  if (providerEmail && providerPassword) {
    try {
      const authTokenResponse = await fetchProviderAuthToken();
      const token = authTokenResponse.data.jwtToken;
      setProviderToken(token);
      areProviderCredentialsVerified = true;

      envVariablesStatus["PROVIDER_EMAIL"] = environmentVariableStatuses.Verified;

      envVariablesStatus[isUsingHashedPassword ? "PROVIDER_HASHED_PASS" : "PROVIDER_PASSWORD"] =
        environmentVariableStatuses.Verified;

      console.log("Provider credentials verification success");
    } catch {
      envVariablesStatus["PROVIDER_EMAIL"] = environmentVariableStatuses.Invalid;
      envVariablesStatus[isUsingHashedPassword ? "PROVIDER_HASHED_PASS" : "PROVIDER_PASSWORD"] =
        environmentVariableStatuses.Invalid;

      console.log("Provider credentials verification failure");
    }
  }

  if (mailUserEmail && mailUserPassword) {
    try {
      const mailTransporter = nodemailer.createTransport(getNodeMailerConfig());
      await mailTransporter.verify();
      areMailCredentialsVerified = true;
      mailTransporter.close();
      envVariablesStatus["MAIL_USER_EMAIL"] = environmentVariableStatuses.Verified;
      envVariablesStatus["MAIL_USER_PASSWORD"] = environmentVariableStatuses.Verified;

      console.log("Mail credentials verification success");
    } catch {
      envVariablesStatus["MAIL_USER_EMAIL"] = environmentVariableStatuses.Invalid;
      envVariablesStatus["MAIL_USER_PASSWORD"] = environmentVariableStatuses.Invalid;

      console.log("Mail credentials verification failure");
    }
  }

  envVariablesStatus["YOUR_SAAS_DOMAIN_URL"] = environmentVariableStatuses.Verified;

  return {
    isVerified: areMailCredentialsVerified && areProviderCredentialsVerified,
    envVariablesStatus: Object.entries(envVariablesStatus)
      .map(([envVarName, envVarStatus]) => ({
        name: envVarName,
        status: envVarStatus,
      }))
      .sort((envVarOne, envVarTwo) => (envVarOne.name <= envVarTwo.name ? -1 : 1)),
  };
}

module.exports = verifyEnvrionmentVariables;

import { baseURL } from "src/axios";

export const AWS_BOOTSTRAP_ROLE_ARN = "arn:aws:iam::<ACCOUNT_ID>:role/omnistrate-bootstrap-role";

export const GCP_SERVICE_ACCOUNT_EMAIL = "bootstrap-<ORG_ID>@<PROJECT_ID>.iam.gserviceaccount.com";

export const getAwsBootstrapArn = (awsAccountId) => {
  return AWS_BOOTSTRAP_ROLE_ARN.replace("<ACCOUNT_ID>", awsAccountId);
};

export const getGcpServiceEmail = (gcpProjectID, orgId) => {
  return GCP_SERVICE_ACCOUNT_EMAIL.replace("<PROJECT_ID>", gcpProjectID).replace("<ORG_ID>", orgId);
};

export const GCP_BOOTSTRAP_SHELL_COMMAND = `bash -c "$(curl -fsSL '<BASE_URL>/account-setup/gcp-bootstrap.sh?account_config_id=<ACCOUNT_CONFIG_ID>')"`;

export const getGcpBootstrapShellCommand = (accountId) => {
  return GCP_BOOTSTRAP_SHELL_COMMAND.replace("<BASE_URL>", baseURL).replace("<ACCOUNT_CONFIG_ID>", accountId);
};

export const GCP_SHELL_SCRIPT_OFFBOARD_COMMAND = `bash -c "$(curl -fsSL '<BASE_URL>/account-setup/gcp-offboard.sh?account_config_id=<ACCOUNT_CONFIG_ID>')"`;

export const getGcpShellScriptOffboardCommand = (accountId) => {
  return GCP_SHELL_SCRIPT_OFFBOARD_COMMAND.replace("<BASE_URL>", baseURL).replace("<ACCOUNT_CONFIG_ID>", accountId);
};

//azure utilities
export const AZURE_BOOTSTRAP_SHELL_COMMAND = `bash -c "$(curl -fsSL '<BASE_URL>/account-setup/azure-bootstrap.sh?account_config_id=<ACCOUNT_CONFIG_ID>')"`;

export const getAzureBootstrapShellCommand = (accountId) => {
  return AZURE_BOOTSTRAP_SHELL_COMMAND.replace("<BASE_URL>", baseURL).replace("<ACCOUNT_CONFIG_ID>", accountId);
};

export const AZURE_SHELL_SCRIPT_OFFBOARD_COMMAND = `bash -c "$(curl -fsSL '<BASE_URL>/account-setup/azure-offboard.sh?account_config_id=<ACCOUNT_CONFIG_ID>')"`;

export const getAzureShellScriptOffboardCommand = (accountId) => {
  return AZURE_SHELL_SCRIPT_OFFBOARD_COMMAND.replace("<BASE_URL>", baseURL).replace("<ACCOUNT_CONFIG_ID>", accountId);
};

export const addQuotesToShellCommand = (command) => {
  if (!command) return command;

  // Replace https with 'https
  if (!command.includes("'https")) {
    command = command.replace("https", "'https");
  }

  // Replace ) with ')
  if (!command.includes(`')"`)) {
    command = command.replace(`)"`, `')"`);
  }

  return command;
};

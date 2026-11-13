import { accountSetupUrlsWithProxy, getAccountSetupProxyUrl } from "src/utils/accountConfig/accountSetupProxy";

export const AWS_BOOTSTRAP_ROLE_ARN = "arn:aws:iam::<ACCOUNT_ID>:role/omnistrate-bootstrap-role";

export const GCP_SERVICE_ACCOUNT_EMAIL = "bootstrap-<ORG_ID>@<PROJECT_ID>.iam.gserviceaccount.com";

export const getAwsBootstrapArn = (awsAccountId) => {
  return AWS_BOOTSTRAP_ROLE_ARN.replace("<ACCOUNT_ID>", awsAccountId);
};

export const getGcpServiceEmail = (gcpProjectID, orgId) => {
  return GCP_SERVICE_ACCOUNT_EMAIL.replace("<PROJECT_ID>", gcpProjectID).replace("<ORG_ID>", orgId);
};

export const GCP_BOOTSTRAP_SHELL_COMMAND = `bash -c "$(curl -fsSL '<SCRIPT_URL>')"`;

const getAccountSetupShellCommand = (scriptName: string, accountId: string, template: string): string => {
  const endpoint = `/account-setup/${scriptName}?account_config_id=${encodeURIComponent(accountId)}`;
  return template.replace("<SCRIPT_URL>", getAccountSetupProxyUrl(endpoint, true));
};

export const getGcpBootstrapShellCommand = (accountId: string): string => {
  return getAccountSetupShellCommand("gcp-bootstrap.sh", accountId, GCP_BOOTSTRAP_SHELL_COMMAND);
};

export const GCP_SHELL_SCRIPT_OFFBOARD_COMMAND = `bash -c "$(curl -fsSL '<SCRIPT_URL>')"`;

export const getGcpShellScriptOffboardCommand = (accountId: string): string => {
  return getAccountSetupShellCommand("gcp-offboard.sh", accountId, GCP_SHELL_SCRIPT_OFFBOARD_COMMAND);
};

//azure utilities
export const AZURE_BOOTSTRAP_SHELL_COMMAND = `bash -c "$(curl -fsSL '<SCRIPT_URL>')"`;

export const getAzureBootstrapShellCommand = (accountId: string): string => {
  return getAccountSetupShellCommand("azure-bootstrap.sh", accountId, AZURE_BOOTSTRAP_SHELL_COMMAND);
};

export const AZURE_SHELL_SCRIPT_OFFBOARD_COMMAND = `bash -c "$(curl -fsSL '<SCRIPT_URL>')"`;

export const getAzureShellScriptOffboardCommand = (accountId: string): string => {
  return getAccountSetupShellCommand("azure-offboard.sh", accountId, AZURE_SHELL_SCRIPT_OFFBOARD_COMMAND);
};

//oci utilities
export const OCI_SHELL_SCRIPT_OFFBOARD_COMMAND = `bash -c "$(curl -fsSL '<SCRIPT_URL>')"`;

export const getOciShellScriptOffboardCommand = (accountId: string): string => {
  return getAccountSetupShellCommand("oci-offboard.sh", accountId, OCI_SHELL_SCRIPT_OFFBOARD_COMMAND);
};

export const addQuotesToShellCommand = (command: string): string => {
  if (!command) return command;

  command = accountSetupUrlsWithProxy(command, true);

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

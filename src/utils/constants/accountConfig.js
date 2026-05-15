export const CLOUD_PROVIDER_DEFAULT_CREATION_METHOD = {
  aws: "CloudFormation",
  gcp: "GCPScript",
  azure: "AzureScript",
  oci: "OCIScript",
};

export const getAccountConfigStatusBasedHeader = (status, cloud_provider_account_config_id = "") => {
  if (cloud_provider_account_config_id && status === "FAILED") {
    return "The account configuration verification failed. Please review the instructions below to retry the setup and resolve any issues:";
  }
  if (status === "VERIFYING" || status === "PENDING") {
    return "To complete the account configuration setup:";
  }

  if (status === "FAILED") {
    return "The account configuration verification failed.";
  }
  if (status === "READY") {
    return "This account has already been configured successfully. However if you need to reconfigure for any reason, the instructions are provided below:";
  }
  return "To complete the account configuration setup:";
};

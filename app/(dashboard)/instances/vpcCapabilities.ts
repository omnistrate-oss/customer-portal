export const isExistingVpcSupported = (cloudProvider?: string): boolean =>
  cloudProvider === "aws" || cloudProvider === "gcp" || cloudProvider === "azure";

import OCIIcon from "app/(dashboard)/components/CloudProviderRadio/OCIIcon";
import PrivateLogo from "app/(dashboard)/components/CloudProviderRadio/PrivateIcon";

import AWSIcon from "src/components/Icons/CloudProviders/AWSLogo";
import AzureIcon from "src/components/Icons/CloudProviders/AzureLogo";
import GCPIcon from "src/components/Icons/CloudProviders/GCPLogo";
import AwsLogo from "src/components/Logos/AwsLogo";
import AzureLogo from "src/components/Logos/AzureLogo";
import GcpLogo from "src/components/Logos/GcpLogo";
import OciLogo from "src/components/Logos/OciLogo";

export const cloudProviderLabels = {
  gcp: "Google Cloud Platform",
  aws: "Amazon Web Services",
  azure: "Microsoft Azure",
  oci: "Oracle Cloud Infrastructure",
  private: "Private",
};

//short logos map
export const cloudProviderLogoMap = {
  aws: <AWSIcon />,
  gcp: <GCPIcon />,
  azure: <AzureIcon />,
  oci: <OCIIcon />,
};

//long logos map
export const cloudProviderLongLogoMap = {
  aws: <AwsLogo />,
  gcp: <GcpLogo />,
  azure: <AzureLogo />,
  oci: <OciLogo />,
  private: <PrivateLogo />,
};

export const cloudProviderLabelsShort = {
  aws: "AWS",
  gcp: "GCP",
  azure: "Azure",
  oci: "OCI",
};

export const CLOUD_PROVIDERS = {
  aws: "aws",
  gcp: "gcp",
  azure: "azure",
  oci: "oci",
};

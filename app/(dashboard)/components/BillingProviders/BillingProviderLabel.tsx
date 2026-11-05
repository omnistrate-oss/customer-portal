import Image from "next/image";
import { Stack } from "@mui/material";

import AWSLogo from "src/components/Icons/CloudProviders/AWSLogo";
import AzureLogo from "src/components/Icons/CloudProviders/AzureLogo";
import GCPLogo from "src/components/Icons/CloudProviders/GCPLogo";
import { Text } from "src/components/Typography/Typography";
import type { CustomerBillingProvider } from "src/types/consumption";
import getSafeExternalURL from "src/utils/getSafeExternalURL";

import { StripeIcon } from "../../billing/components/Icons";

export const MARKETPLACE_CUSTOMER_PORTALS: Partial<
  Record<string, { url: string; label: string; description: string }>
> = {
  AWS_MARKETPLACE: {
    url: "https://console.aws.amazon.com/costmanagement/",
    label: "Open AWS billing",
    description: "Open Payments in AWS billing to review balances and invoices.",
  },
  GCP_MARKETPLACE: {
    url: "https://console.cloud.google.com/billing",
    label: "Open Google Cloud billing",
    description: "Select your billing account, then open Invoices or Payment status.",
  },
  AZURE_MARKETPLACE: {
    url: "https://portal.azure.com/#view/Microsoft_Azure_GTM/ModernBillingMenuBlade",
    label: "Open Azure billing",
    description:
      "Select your billing scope, then open Invoices. Availability depends on your billing agreement, permissions, and reseller relationships.",
  },
};

export const isMarketplaceBillingProvider = (providerType?: CustomerBillingProvider["type"]): boolean =>
  providerType === "MARKETPLACE" ||
  providerType === "AWS_MARKETPLACE" ||
  providerType === "GCP_MARKETPLACE" ||
  providerType === "AZURE_MARKETPLACE";

export const getBillingProviderLabel = (provider: CustomerBillingProvider): string => {
  switch (provider.type) {
    case "AWS_MARKETPLACE":
      return "AWS Marketplace";
    case "GCP_MARKETPLACE":
      return "Google Cloud Marketplace";
    case "AZURE_MARKETPLACE":
      return "Azure Marketplace";
    case "MARKETPLACE":
      return "Marketplace";
    case "STRIPE":
      return "Stripe";
    default:
      return provider.name || provider.type || "Billing Provider";
  }
};

export const getSelectedBillingProvider = (
  providers: CustomerBillingProvider[] | undefined,
  userSelection: CustomerBillingProvider["type"] | undefined
): CustomerBillingProvider | undefined =>
  providers?.find((provider) => provider.type === userSelection) || providers?.[0];

const BillingProviderLabel = ({ provider }: { provider: CustomerBillingProvider }) => {
  const label = getBillingProviderLabel(provider);
  const safeLogoURL = getSafeExternalURL(provider.logoURL);
  const icon =
    provider.type === "AWS_MARKETPLACE" ? (
      <AWSLogo width={24} height={24} aria-hidden />
    ) : provider.type === "GCP_MARKETPLACE" ? (
      <GCPLogo width={24} height={24} aria-hidden />
    ) : provider.type === "AZURE_MARKETPLACE" ? (
      <AzureLogo width={24} height={24} aria-hidden />
    ) : provider.type === "STRIPE" ? (
      <StripeIcon width={24} height={24} aria-hidden />
    ) : safeLogoURL ? (
      <Image src={safeLogoURL} width={24} height={24} alt={`${label} logo`} unoptimized />
    ) : null;

  return (
    <Stack direction="row" alignItems="center" gap="8px">
      {icon}
      <Text component="span" size="small" weight="semibold" color="inherit">
        {label}
      </Text>
    </Stack>
  );
};

export default BillingProviderLabel;

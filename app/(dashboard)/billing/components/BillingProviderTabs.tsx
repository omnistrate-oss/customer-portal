"use client";

import { Stack, tabClasses } from "@mui/material";

import { Tab, Tabs } from "src/components/Tab/Tab";
import { colors } from "src/themeConfig";
import type { DescribeConsumptionBillingDetailsSuccessResponse } from "src/types/consumption";

import { StripeIcon } from "./Icons";

type BillingProvider = NonNullable<DescribeConsumptionBillingDetailsSuccessResponse["billingProviders"]>[number];

type BillingProviderTabsProps = {
  billingProviders?: BillingProvider[];
  selectedBillingProvider: string;
  onBillingProviderChange: (providerType: string) => void;
  className?: string;
};

const billingProviderTabStyles = {
  "&:hover": {
    color: colors.purple700,
    "& > *": {
      backgroundColor: colors.gray50,
    },
  },
  [`&.${tabClasses.selected}`]: {
    color: colors.purple700,
    "& > *": {
      backgroundColor: colors.purple50,
    },
  },
  [`&.${tabClasses.selected}:hover > *`]: {
    backgroundColor: colors.purple50,
  },
};

const BillingProviderTabs = ({
  billingProviders,
  selectedBillingProvider,
  onBillingProviderChange,
  className,
}: BillingProviderTabsProps) => {
  if (!selectedBillingProvider || !billingProviders?.length) {
    return null;
  }

  return (
    <Tabs value={selectedBillingProvider} className={className}>
      {billingProviders.map((provider) => {
        return (
          <Tab
            key={provider.type}
            label={
              provider.type === "STRIPE" ? (
                <Stack direction="row" alignItems="center" gap="8px">
                  <StripeIcon
                    style={{
                      width: "24px",
                      height: "24px",
                    }}
                  />
                  <div>OmniBilling (Stripe)</div>
                </Stack>
              ) : (
                <Stack direction="row" alignItems="center" gap="8px">
                  <div className="w-6 h-6 flex items-center justify-center rounded-sm overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={provider.logoURL || ""}
                      width="24"
                      height="24"
                      alt={provider.name ? `${provider.name} logo` : "Billing provider logo"}
                      className="object-cover"
                    />
                  </div>
                  <div>{provider.name || "Billing Provider"}</div>
                </Stack>
              )
            }
            value={provider.type}
            onClick={() => onBillingProviderChange(provider.type)}
            sx={billingProviderTabStyles}
          />
        );
      })}
    </Tabs>
  );
};

export default BillingProviderTabs;

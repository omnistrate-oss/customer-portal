"use client";

import { alpha, tabClasses } from "@mui/material";

import { Tab, Tabs } from "src/components/Tab/Tab";
import { colors } from "src/themeConfig";
import type { CustomerBillingProvider } from "src/types/consumption";

import BillingProviderLabel from "../../components/BillingProviders/BillingProviderLabel";

type BillingProviderTabsProps = {
  billingProviders?: CustomerBillingProvider[];
  selectedBillingProvider: CustomerBillingProvider["type"];
  onBillingProviderChange: (providerType: CustomerBillingProvider["type"]) => void;
  className?: string;
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
            label={<BillingProviderLabel provider={provider} />}
            value={provider.type}
            onClick={() => onBillingProviderChange(provider.type)}
            sx={(theme) => ({
              "&:hover": {
                color: theme.palette.primary.main,
                backgroundColor: colors.gray50,
                "&::before": { backgroundColor: theme.palette.primary.main },
              },
              [`&.${tabClasses.selected}`]: {
                color: theme.palette.primary.main,
                "& > *": { backgroundColor: alpha(theme.palette.primary.main, 0.08) },
                "&::before": { backgroundColor: theme.palette.primary.main },
              },
              [`&.${tabClasses.selected}:hover > *`]: {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
              },
            })}
          />
        );
      })}
    </Tabs>
  );
};

export default BillingProviderTabs;

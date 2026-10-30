"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Stack } from "@mui/material";
import { useSelector } from "react-redux";

import { listConsumptionPaymentMethods, setDefaultConsumptionPaymentMethod } from "src/api/consumption";
import StatusChip from "src/components/StatusChip/StatusChip";
import useSnackbar from "src/hooks/useSnackbar";
import { useGlobalData } from "src/providers/GlobalDataProvider";
import { selectUserrootData } from "src/slices/userDataSlice";
import { colors } from "src/themeConfig";
import type { CustomerBillingProvider } from "src/types/consumption";
import { getPaymentSettingsRoute } from "src/utils/routes";
import Card from "components/Card/Card";
import LoadingSpinner from "components/LoadingSpinner/LoadingSpinner";
import { DisplayText, Text } from "components/Typography/Typography";

import BillingProviderTabs from "../billing/components/BillingProviderTabs";
import useBillingDetails from "../billing/hooks/useBillingDetails";
import useBillingStatus from "../billing/hooks/useBillingStatus";
import getBillingDetailsErrorMessage from "../billing/utils/getBillingDetailsErrorMessage";
import AccountManagementHeader from "../components/AccountManagement/AccountManagementHeader";
import BillingProviderLabel, {
  getBillingProviderLabel,
  getSelectedBillingProvider,
} from "../components/BillingProviders/BillingProviderLabel";
import SlidersIcon from "../components/Icons/Sliders";
import PageContainer from "../components/Layout/PageContainer";
import PageTitle from "../components/Layout/PageTitle";

import StripePaymentMethodsSection from "./components/StripePaymentMethodsSection";

const ProviderManagedPaymentMethodPanel = ({ provider }: { provider: CustomerBillingProvider }) => {
  return (
    <Card
      sx={{
        mt: "12px",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        gap="16px"
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        marginBottom="14px"
      >
        <Box>
          <BillingProviderLabel provider={provider} />
          <Text size="medium" weight="semibold" color={colors.gray900}>
            Payment Method
          </Text>
          <Text size="small" weight="regular" color={colors.gray600} sx={{ mt: "2px" }}>
            {getBillingProviderLabel(provider)} manages payment configuration for this account
          </Text>
        </Box>

        <Stack direction="row" gap="12px" alignItems="center" flexWrap="wrap">
          <StatusChip label="Managed externally" category="unknown" />
        </Stack>
      </Stack>
    </Card>
  );
};

const PaymentMethodsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const snackbar = useSnackbar();
  const { refetchSubscriptions } = useGlobalData();
  const selectUser = useSelector(selectUserrootData);
  const [userSelectedProvider, setUserSelectedProvider] = useState<CustomerBillingProvider["type"]>();
  const handledSetupCompleteRef = useRef(false);

  const billingStatusQuery = useBillingStatus();
  const isBillingEnabled = Boolean(billingStatusQuery.data?.enabled);
  const {
    isPending: isBillingDetailsPending,
    data: billingDetails,
    error: billingDetailsError,
    refetch: refetchBillingDetails,
  } = useBillingDetails(isBillingEnabled);

  const selectedProvider = getSelectedBillingProvider(billingDetails?.billingProviders, userSelectedProvider);
  const selectedBillingProvider = selectedProvider?.type || "";
  const isLoading = billingStatusQuery.isPending || (isBillingEnabled && isBillingDetailsPending);
  const hasBillingProviders = Boolean(billingDetails?.billingProviders?.length);
  const isStripe = isBillingEnabled && selectedProvider?.type === "STRIPE";
  const isCustomPaymentPortalEnabled = isStripe && Boolean(billingDetails?.customPaymentPortalEnabled);

  useEffect(() => {
    if (
      handledSetupCompleteRef.current ||
      !isCustomPaymentPortalEnabled ||
      searchParams?.get("setup_complete") !== "true"
    ) {
      return;
    }

    handledSetupCompleteRef.current = true;

    const reconcileSetupRedirect = async () => {
      try {
        const paymentMethodsResponse = await listConsumptionPaymentMethods();
        const paymentMethods = paymentMethodsResponse.data.paymentMethods || [];
        const hasDefaultPaymentMethod = paymentMethods.some((method) => method.isDefault);

        if (!hasDefaultPaymentMethod && paymentMethods[0]?.id) {
          await setDefaultConsumptionPaymentMethod(paymentMethods[0].id);
        }

        await refetchBillingDetails();
        refetchSubscriptions();
        snackbar.showSuccess("Payment method added successfully");
      } catch {
        snackbar.showError("Payment method setup completed, but billing details could not refresh.");
      } finally {
        router.replace(getPaymentSettingsRoute(), { scroll: false });
      }
    };

    void reconcileSetupRedirect();
  }, [isCustomPaymentPortalEnabled, refetchBillingDetails, refetchSubscriptions, router, searchParams, snackbar]);

  const error = billingDetailsError || billingStatusQuery.error;

  return (
    <div>
      <AccountManagementHeader userName={selectUser?.name} userEmail={selectUser?.email} />
      <PageContainer>
        <PageTitle icon={SlidersIcon} className="mb-6">
          Payment Settings
        </PageTitle>

        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <Stack p={3} pt="200px" alignItems="center" justifyContent="center">
            <DisplayText
              // @ts-ignore
              size="xsmall"
              sx={{
                wordBreak: "break-word",
                textAlign: "center",
                maxWidth: 900,
              }}
            >
              {getBillingDetailsErrorMessage(error)}
            </DisplayText>
          </Stack>
        ) : !hasBillingProviders ? (
          <Stack p={3} pt="200px" alignItems="center" justifyContent="center">
            <DisplayText
              // @ts-ignore
              size="xsmall"
              sx={{
                textAlign: "center",
              }}
            >
              No billing providers are available.
            </DisplayText>
          </Stack>
        ) : (
          <>
            <BillingProviderTabs
              billingProviders={billingDetails?.billingProviders}
              selectedBillingProvider={selectedBillingProvider}
              onBillingProviderChange={setUserSelectedProvider}
            />

            {isStripe ? (
              <StripePaymentMethodsSection
                enabled={isCustomPaymentPortalEnabled}
                isCustomPaymentPortalEnabled={Boolean(billingDetails?.customPaymentPortalEnabled)}
                paymentConfigured={billingDetails?.paymentConfigured}
                paymentInfoPortalURL={billingDetails?.paymentInfoPortalURL}
                onPaymentMethodsChanged={async () => {
                  await refetchBillingDetails();
                }}
              />
            ) : (
              !!selectedProvider && <ProviderManagedPaymentMethodPanel provider={selectedProvider} />
            )}
          </>
        )}
      </PageContainer>
    </div>
  );
};

export default PaymentMethodsPage;

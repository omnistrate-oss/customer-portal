"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import { Box, Stack } from "@mui/material";
import { useSelector } from "react-redux";

import { listConsumptionPaymentMethods, setDefaultConsumptionPaymentMethod } from "src/api/consumption";
import StatusChip from "src/components/StatusChip/StatusChip";
import useSnackbar from "src/hooks/useSnackbar";
import { useGlobalData } from "src/providers/GlobalDataProvider";
import { selectUserrootData } from "src/slices/userDataSlice";
import type { DescribeConsumptionBillingDetailsSuccessResponse } from "src/types/consumption";
import Button from "components/Button/Button";
import Card from "components/Card/Card";
import LoadingSpinner from "components/LoadingSpinner/LoadingSpinner";
import { DisplayText, Text } from "components/Typography/Typography";

import BillingProviderTabs from "../billing/components/BillingProviderTabs";
import useBillingDetails from "../billing/hooks/useBillingDetails";
import useBillingStatus from "../billing/hooks/useBillingStatus";
import AccountManagementHeader from "../components/AccountManagement/AccountManagementHeader";
import SlidersIcon from "../components/Icons/Sliders";
import PageContainer from "../components/Layout/PageContainer";
import PageTitle from "../components/Layout/PageTitle";

import StripePaymentMethodsSection from "./components/StripePaymentMethodsSection";

const getBillingDetailsErrorMessage = (error: unknown) => {
  const errorDisplayText =
    "Something went wrong. Try refreshing the page. If the issue persists please contact support for assistance";

  // @ts-ignore
  const errorMessage = error?.response?.data?.message;

  if (!errorMessage) {
    return errorDisplayText;
  }

  if (
    errorMessage === "Your provider has not enabled billing for the user." ||
    errorMessage === "Your provider has not enabled billing for the services."
  ) {
    return "Billing has not been configured. Please contact support for assistance";
  }

  if (errorMessage === "You have not been subscribed to a service yet.") {
    return "Please subscribe to a Product to start using billing";
  }

  if (errorMessage === "You have not been enrolled in a service plan with a billing plan yet.") {
    return "You have not been enrolled in a plan with a billing plan. Please contact support for assistance";
  }

  return errorMessage;
};

type BillingProvider = NonNullable<DescribeConsumptionBillingDetailsSuccessResponse["billingProviders"]>[number];

const ProviderManagedPaymentMethodPanel = ({ provider }: { provider: BillingProvider }) => {
  return (
    <Card
      sx={{
        mt: "12px",
        boxShadow: "0px 1px 2px 0px #0A0D120D",
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
          <Text size="medium" weight="semibold" color="#181D27">
            Payment Method
          </Text>
          <Text size="small" weight="regular" color="#535862" sx={{ mt: "2px" }}>
            {provider.name || "Billing Provider"} manages payment configuration for this account
          </Text>
        </Box>

        <Stack direction="row" gap="12px" alignItems="center" flexWrap="wrap">
          <StatusChip label="Non Configurable" category="failed" />
          <Button
            variant="contained"
            size="small"
            endIcon={
              <ArrowOutwardIcon
                sx={{
                  fontSize: "18px",
                }}
              />
            }
            disabled
          >
            Configure
          </Button>
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
  const [selectedBillingProvider, setSelectedBillingProvider] = useState("");
  const handledSetupCompleteRef = useRef(false);

  const billingStatusQuery = useBillingStatus();
  const isBillingEnabled = Boolean(billingStatusQuery.data?.enabled);
  const {
    isPending: isBillingDetailsPending,
    data: billingDetails,
    error,
    refetch: refetchBillingDetails,
  } = useBillingDetails(isBillingEnabled);

  useEffect(() => {
    if (billingDetails?.billingProviders?.length) {
      const firstProvider = billingDetails.billingProviders[0];
      setSelectedBillingProvider(firstProvider.type);
    } else {
      setSelectedBillingProvider("");
    }
  }, [billingDetails]);

  const isLoading = billingStatusQuery.isPending || (isBillingEnabled && isBillingDetailsPending);
  const hasBillingProviders = Boolean(billingDetails?.billingProviders?.length);
  const isStripe = selectedBillingProvider === "STRIPE";
  const isCustomPaymentPortalEnabled = isStripe && Boolean(billingDetails?.customPaymentPortalEnabled);
  const selectedProvider = billingDetails?.billingProviders?.find(
    (provider) => provider.type === selectedBillingProvider
  );

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
        router.replace("/payment-methods", { scroll: false });
      }
    };

    void reconcileSetupRedirect();
  }, [isCustomPaymentPortalEnabled, refetchBillingDetails, refetchSubscriptions, router, searchParams, snackbar]);

  return (
    <div>
      <AccountManagementHeader userName={selectUser?.name} userEmail={selectUser?.email} />
      <PageContainer>
        <PageTitle icon={SlidersIcon} className="mb-6">
          Payment Methods
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
              onBillingProviderChange={setSelectedBillingProvider}
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
              selectedProvider && <ProviderManagedPaymentMethodPanel provider={selectedProvider} />
            )}
          </>
        )}
      </PageContainer>
    </div>
  );
};

export default PaymentMethodsPage;

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import { Box, Stack } from "@mui/material";
import { useSelector } from "react-redux";

import ExternalArrowIcon from "src/components/Icons/ArrowExternal/ArrowExternal";
import StatusChip from "src/components/StatusChip/StatusChip";
import useProductTierCustomMetrics from "src/hooks/query/useProductTierCustomMetrics";
import { useGlobalData } from "src/providers/GlobalDataProvider";
import { selectUserrootData } from "src/slices/userDataSlice";
import { colors } from "src/themeConfig";
import type { CustomerBillingProvider } from "src/types/consumption";
import getSafeExternalURL from "src/utils/getSafeExternalURL";
import Button from "components/Button/Button";
import Card from "components/Card/Card";
import LoadingSpinner from "components/LoadingSpinner/LoadingSpinner";
import { DisplayText, Text } from "components/Typography/Typography";

import AccountManagementHeader from "../components/AccountManagement/AccountManagementHeader";
import {
  getBillingProviderLabel,
  getSelectedBillingProvider,
  isMarketplaceBillingProvider,
  MARKETPLACE_CUSTOMER_PORTALS,
} from "../components/BillingProviders/BillingProviderLabel";
import BillingIcon from "../components/Icons/BillingIcon";
import PageContainer from "../components/Layout/PageContainer";
import PageTitle from "../components/Layout/PageTitle";

import BillingProviderTabs from "./components/BillingProviderTabs";
import ConsumptionUsage from "./components/ConsumptionUsage";
import InvoicesTable from "./components/InvoicesTable";
import StripeDefaultPaymentMethodSummary from "./components/StripeDefaultPaymentMethodSummary";
import useBillingDetails from "./hooks/useBillingDetails";
import useBillingStatus from "./hooks/useBillingStatus";
import useConsumptionInvoices from "./hooks/useConsumptionInvoices";
import useConsumptionUsage from "./hooks/useConsumptionUsage";
import getBillingDetailsErrorMessage from "./utils/getBillingDetailsErrorMessage";

const BillingPage = () => {
  const { subscriptions, isSubscriptionsPending, refetchSubscriptions } = useGlobalData();
  const [userSelectedProvider, setUserSelectedProvider] = useState<CustomerBillingProvider["type"]>();
  const [isStripePaymentMethodsEmpty, setIsStripePaymentMethodsEmpty] = useState(false);
  const selectUser = useSelector(selectUserrootData);
  // Track previous paymentConfigured state to detect changes
  const previousPaymentConfiguredRef = useRef<boolean | undefined>(undefined);

  const billingStatusQuery = useBillingStatus();

  const isBillingEnabled = Boolean(billingStatusQuery.data?.enabled);

  const {
    isPending: isBillingDetailsPending,
    data: billingDetails,
    error: billingDetailsError,
    refetch: refetchBillingDetails,
  } = useBillingDetails(isBillingEnabled);
  const { data: consumptionUsageData, isPending: isConsumptionDataPending } = useConsumptionUsage();
  const selectedProvider = getSelectedBillingProvider(billingDetails?.billingProviders, userSelectedProvider);
  const selectedBillingProvider = selectedProvider?.type || "";
  const isStripe = isBillingEnabled && selectedProvider?.type === "STRIPE";
  const isMarketplace = isMarketplaceBillingProvider(selectedProvider?.type);
  const customerPortal = MARKETPLACE_CUSTOMER_PORTALS[selectedBillingProvider];
  const { data: invoicesData, isPending: isInvoicesPending, error: invoicesError } = useConsumptionInvoices(isStripe);

  const rootSubscriptionIds = useMemo(
    () =>
      subscriptions.filter((subscription) => subscription.roleType === "root").map((subscription) => subscription.id),
    [subscriptions]
  );
  const { data: productTierCustomMetricsData, isLoading: isProductTierCustomMetricsLoading } =
    useProductTierCustomMetrics(rootSubscriptionIds);

  const invoices = useMemo(() => invoicesData?.invoices || [], [invoicesData]);

  const paymentURL = invoices.find(
    (invoice) => invoice.invoiceStatus === "open" || invoice.invoiceStatus === "pastDue"
  )?.invoiceUrl;

  // Refetch subscriptions when paymentConfigured status changes
  useEffect(() => {
    const currentPaymentConfigured = billingDetails?.paymentConfigured;
    const previousPaymentConfigured = previousPaymentConfiguredRef.current;

    if (previousPaymentConfigured !== undefined && previousPaymentConfigured !== currentPaymentConfigured) {
      refetchSubscriptions();
    }

    previousPaymentConfiguredRef.current = currentPaymentConfigured;
  }, [billingDetails?.paymentConfigured, refetchSubscriptions]);

  const invoicesTotalAmount = invoices.reduce((acc, invoice) => {
    if (invoice.invoiceStatus === "open" || invoice.invoiceStatus === "pastDue") {
      acc = acc + (invoice.totalAmount || 0);
    }
    return acc;
  }, 0);

  const paymentConfigured = billingDetails?.paymentConfigured;
  const error = billingDetailsError || billingStatusQuery.error;
  const errorDisplayText = error ? getBillingDetailsErrorMessage(error) : "";

  const isLoading =
    isSubscriptionsPending ||
    billingStatusQuery.isPending ||
    (isBillingEnabled && isBillingDetailsPending) ||
    isConsumptionDataPending ||
    isProductTierCustomMetricsLoading;
  const isCustomPaymentPortalEnabled = isStripe && Boolean(billingDetails?.customPaymentPortalEnabled);
  const showStripePaymentMethodEmptyState = isCustomPaymentPortalEnabled && isStripePaymentMethodsEmpty;

  const handleStripePaymentMethodsEmptyChange = useCallback((isEmpty: boolean) => {
    setIsStripePaymentMethodsEmpty(isEmpty);
  }, []);

  const balanceDueLink = selectedProvider?.balanceDueLink;
  const safePaymentURL = getSafeExternalURL(paymentURL);
  const safeBalanceDueLink = getSafeExternalURL(balanceDueLink);
  const safePaymentInfoPortalURL = getSafeExternalURL(billingDetails?.paymentInfoPortalURL);
  const payNowLink = isStripe ? safePaymentURL : isMarketplace ? undefined : safeBalanceDueLink;

  return (
    <div>
      <AccountManagementHeader userName={selectUser?.name} userEmail={selectUser?.email} />
      <PageContainer>
        <PageTitle icon={BillingIcon} className="mb-6">
          Billing & Invoices
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
              {errorDisplayText}
            </DisplayText>
          </Stack>
        ) : (
          <>
            <ConsumptionUsage
              consumptionUsageData={consumptionUsageData}
              productTierCustomMetricsData={productTierCustomMetricsData}
            />

            {billingDetails && billingDetails?.billingProviders && billingDetails?.billingProviders?.length > 0 && (
              <div className="mt-6 pb-2 border-b border-gray-200">
                <Text size="medium" weight="semibold" color={colors.gray900}>
                  Payment Summary
                </Text>
                <Text size="xsmall" weight="regular" color={colors.gray600} sx={{ marginTop: "2px" }}>
                  Review your outstanding balance and default payment method for upcoming invoices.
                </Text>
              </div>
            )}

            <BillingProviderTabs
              billingProviders={billingDetails?.billingProviders}
              selectedBillingProvider={selectedBillingProvider}
              onBillingProviderChange={setUserSelectedProvider}
              className="mt-3"
            />

            {isStripe && isInvoicesPending ? (
              <LoadingSpinner />
            ) : isStripe && invoicesError ? (
              <Text size="small" weight="regular" color={colors.gray600} sx={{ mt: "20px" }}>
                Unable to load Stripe invoices. Try refreshing the page or select another billing provider.
              </Text>
            ) : (
              <>
                {!!selectedProvider && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
                    <Card
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box>
                        <Text size="large" weight="semibold" color={colors.gray900}>
                          Outstanding Balance
                        </Text>
                        <Text size="small" weight="regular" color={colors.gray600} marginTop="2px">
                          {customerPortal
                            ? `${customerPortal.description} Cloud billing may include charges for other products.`
                            : "Amount currently due across open and past-due invoices."}
                        </Text>
                      </Box>
                      <Stack
                        direction="row"
                        flexWrap={customerPortal ? "wrap" : undefined}
                        gap="24px"
                        justifyContent="space-between"
                        alignItems="flex-end"
                        marginTop="48px"
                      >
                        <Text size="large" weight="semibold" color={colors.gray900}>
                          {isStripe ? `$${invoicesTotalAmount}` : isMarketplace ? "Unavailable in this portal" : "NA"}
                        </Text>
                        {!!customerPortal && (
                          <Link href={customerPortal.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outlined" endIcon={<ExternalArrowIcon color="currentColor" />}>
                              {customerPortal.label}
                            </Button>
                          </Link>
                        )}
                        {!isMarketplace &&
                          (payNowLink ? (
                            <Link href={payNowLink} target="_blank" rel="noopener noreferrer">
                              <Button
                                variant="contained"
                                endIcon={
                                  <ArrowOutwardIcon
                                    sx={{
                                      fontSize: "18px",
                                    }}
                                  />
                                }
                              >
                                Pay outstanding balance
                              </Button>
                            </Link>
                          ) : (
                            <Button
                              variant="contained"
                              endIcon={
                                <ArrowOutwardIcon
                                  sx={{
                                    fontSize: "18px",
                                  }}
                                />
                              }
                              disabled
                              disabledMessage={
                                isStripe
                                  ? "No outstanding invoice is available to pay."
                                  : "The balance portal is not available. Please contact support for assistance."
                              }
                            >
                              Pay outstanding balance
                            </Button>
                          ))}
                      </Stack>
                    </Card>
                    <Card
                      sx={{
                        backgroundColor: isStripe ? colors.white : colors.gray50,
                        ...(!isCustomPaymentPortalEnabled || !showStripePaymentMethodEmptyState
                          ? {
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                            }
                          : {}),
                      }}
                    >
                      <Box>
                        <Text size="large" weight="semibold" color={colors.gray900}>
                          {isCustomPaymentPortalEnabled ? "Default Payment Method" : "Payment Method"}
                        </Text>
                        <Text size="small" weight="regular" color={colors.gray600} marginTop="2px">
                          {!isStripe
                            ? `${getBillingProviderLabel(selectedProvider)} manages payment configuration for this account`
                            : showStripePaymentMethodEmptyState
                              ? "No payment method added yet."
                              : isCustomPaymentPortalEnabled
                                ? "This payment method will be charged when you pay your balance."
                                : "Change how you pay for your plan"}
                        </Text>
                      </Box>

                      {isCustomPaymentPortalEnabled ? (
                        <StripeDefaultPaymentMethodSummary
                          enabled={isCustomPaymentPortalEnabled}
                          onPaymentMethodsEmptyChange={handleStripePaymentMethodsEmptyChange}
                          onDefaultPaymentMethodChanged={async () => {
                            await refetchBillingDetails();
                            refetchSubscriptions();
                          }}
                        />
                      ) : (
                        <Stack
                          direction="row"
                          gap="24px"
                          justifyContent="space-between"
                          alignItems="flex-end"
                          marginTop="48px"
                        >
                          <StatusChip
                            label={
                              !isStripe
                                ? "Managed externally"
                                : paymentConfigured === true
                                  ? "Configured"
                                  : "Not Configured"
                            }
                            category={!isStripe ? "unknown" : paymentConfigured === true ? "success" : "failed"}
                            sx={{ alignSelf: "center" }}
                          />
                          {isStripe && safePaymentInfoPortalURL ? (
                            <Link href={safePaymentInfoPortalURL} target="_blank" rel="noopener noreferrer">
                              <Button variant="contained" endIcon={<ArrowOutwardIcon sx={{ fontSize: "18px" }} />}>
                                Configure
                              </Button>
                            </Link>
                          ) : null}
                        </Stack>
                      )}
                    </Card>
                  </div>
                )}
                {isStripe && <InvoicesTable invoices={invoices} />}
              </>
            )}
          </>
        )}
      </PageContainer>
    </div>
  );
};

export default BillingPage;

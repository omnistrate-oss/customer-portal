"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import { Box, Stack } from "@mui/material";
import { useSelector } from "react-redux";

import StatusChip from "src/components/StatusChip/StatusChip";
import { useGlobalData } from "src/providers/GlobalDataProvider";
import { selectUserrootData } from "src/slices/userDataSlice";
import getSafeExternalURL from "src/utils/getSafeExternalURL";
import Button from "components/Button/Button";
import Card from "components/Card/Card";
import LoadingSpinner from "components/LoadingSpinner/LoadingSpinner";
import { DisplayText, Text } from "components/Typography/Typography";

import AccountManagementHeader from "../components/AccountManagement/AccountManagementHeader";
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
  const { refetchSubscriptions } = useGlobalData();
  const [paymentURL, setPaymentURL] = useState("");
  const [selectedBillingProvider, setSelectedBillingProvider] = useState("");
  const [isStripePaymentMethodsEmpty, setIsStripePaymentMethodsEmpty] = useState(false);
  const selectUser = useSelector(selectUserrootData);
  // Track previous paymentConfigured state to detect changes
  const previousPaymentConfiguredRef = useRef<boolean | undefined>(undefined);

  const billingStatusQuery = useBillingStatus();

  const isBillingEnabled = Boolean(billingStatusQuery.data?.enabled);

  const {
    isPending: isBillingDetailsPending,
    data: billingDetails,
    error,
    refetch: refetchBillingDetails,
  } = useBillingDetails(isBillingEnabled);
  const { data: consumptionUsageData, isPending: isConsumptionDataPending } = useConsumptionUsage();
  const { data: invoicesData, isPending: isInvoicesPending } = useConsumptionInvoices();

  const invoices = useMemo(() => invoicesData?.invoices || [], [invoicesData]);

  useEffect(() => {
    if (billingDetails?.billingProviders?.length) {
      const firstProvider = billingDetails.billingProviders[0];
      setSelectedBillingProvider(firstProvider.type);
    }
  }, [billingDetails]);

  useEffect(() => {
    const firstOpenInvoice = invoices.find((invoice) => ["open", "pastDue"].includes(invoice.invoiceStatus as string));
    const paymentURL = firstOpenInvoice?.invoiceUrl;
    if (paymentURL) {
      setPaymentURL(paymentURL);
    }
  }, [invoices]);

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
    if (["open", "pastDue"].includes(invoice.invoiceStatus as string)) {
      acc = acc + (invoice.totalAmount || 0);
    }
    return acc;
  }, 0);

  const paymentConfigured = billingDetails?.paymentConfigured;
  const errorDisplayText = error ? getBillingDetailsErrorMessage(error) : "";

  const isLoading = isBillingDetailsPending || isConsumptionDataPending || isInvoicesPending;
  const isStripe = selectedBillingProvider === "STRIPE";
  const isCustomPaymentPortalEnabled = isStripe && Boolean(billingDetails?.customPaymentPortalEnabled);
  const showStripePaymentMethodEmptyState = isCustomPaymentPortalEnabled && isStripePaymentMethodsEmpty;

  const handleStripePaymentMethodsEmptyChange = useCallback((isEmpty: boolean) => {
    setIsStripePaymentMethodsEmpty(isEmpty);
  }, []);

  useEffect(() => {
    if (!isCustomPaymentPortalEnabled) {
      setIsStripePaymentMethodsEmpty(false);
    }
  }, [isCustomPaymentPortalEnabled]);

  if (isLoading) return <LoadingSpinner />;
  const balanceDueLink =
    billingDetails?.billingProviders?.find((provider) => provider.type === selectedBillingProvider)?.balanceDueLink ||
    "#";
  const safePaymentURL = getSafeExternalURL(paymentURL);
  const safeBalanceDueLink = getSafeExternalURL(balanceDueLink);
  const safePaymentInfoPortalURL = getSafeExternalURL(billingDetails?.paymentInfoPortalURL);
  const payNowLink = isStripe ? safePaymentURL : safeBalanceDueLink;

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
            <ConsumptionUsage consumptionUsageData={consumptionUsageData} />

            {billingDetails && billingDetails?.billingProviders && billingDetails?.billingProviders?.length > 0 && (
              <div className="mt-6 pb-2 border-b border-[#E9EAEB]">
                <Text size="medium" weight="semibold" color="#181D27">
                  Payment Summary
                </Text>
                <Text size="xsmall" weight="regular" color="#535862" sx={{ marginTop: "2px" }}>
                  Review your outstanding balance and default payment method for upcoming invoices.
                </Text>
              </div>
            )}

            <BillingProviderTabs
              billingProviders={billingDetails?.billingProviders}
              selectedBillingProvider={selectedBillingProvider}
              onBillingProviderChange={setSelectedBillingProvider}
              className="mt-3"
            />

            {selectedBillingProvider && (
              <div className="grid grid-cols-2 gap-6 mt-5">
                <Card
                  sx={{
                    boxShadow: "0px 1px 2px 0px #0A0D120D",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    <Text size="large" weight="semibold" color="#181D27">
                      Outstanding Balance
                    </Text>
                    <Text size="small" weight="regular" color="#535862" marginTop="2px">
                      Amount currently due across open and past-due invoices.{" "}
                    </Text>
                  </Box>
                  <Stack
                    direction="row"
                    gap="24px"
                    justifyContent="space-between"
                    alignItems="flex-end"
                    marginTop="48px"
                  >
                    {/*@ts-ignore */}
                    <DisplayText size="small" weight="semibold">
                      {selectedBillingProvider === "STRIPE" ? `$${invoicesTotalAmount}` : "NA"}
                    </DisplayText>
                    {payNowLink ? (
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
                        disabled={!payNowLink}
                      >
                        Pay outstanding balance
                      </Button>
                    )}
                  </Stack>
                </Card>
                <Card
                  sx={{
                    boxShadow: "0px 1px 2px 0px #0A0D120D",
                    backgroundColor: isStripe ? "#FFF" : "#FAFAFA",
                    ...(isCustomPaymentPortalEnabled && !showStripePaymentMethodEmptyState
                      ? {
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }
                      : {}),
                  }}
                >
                  <Box>
                    <Text size="large" weight="semibold" color="#181D27">
                      {isCustomPaymentPortalEnabled ? "Default Payment Method" : "Payment Method"}
                    </Text>
                    <Text size="small" weight="regular" color="#535862" marginTop="2px">
                      {showStripePaymentMethodEmptyState
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
                    <Stack direction="row" gap="24px" justifyContent="space-between" marginTop="10px">
                      <StatusChip
                        label={
                          !isStripe ? "Non Configurable" : paymentConfigured === true ? "Configured" : "Not Configured"
                        }
                        category={!isStripe ? "failed" : paymentConfigured === true ? "success" : "failed"}
                        sx={{ alignSelf: "center" }}
                      />
                      {isStripe && safePaymentInfoPortalURL ? (
                        <Link href={safePaymentInfoPortalURL} target="_blank" rel="noopener noreferrer">
                          <Button
                            disabled={!isStripe}
                            variant="contained"
                            endIcon={<ArrowOutwardIcon sx={{ fontSize: "18px" }} />}
                          >
                            Configure
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
                        >
                          Configure
                        </Button>
                      )}
                    </Stack>
                  )}
                </Card>
              </div>
            )}
            {isStripe && <InvoicesTable invoices={invoices} />}
          </>
        )}
      </PageContainer>
    </div>
  );
};

export default BillingPage;

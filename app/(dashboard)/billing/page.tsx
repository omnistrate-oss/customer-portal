"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import { Box, Stack, tabClasses } from "@mui/material";
import { useSelector } from "react-redux";

import StatusChip from "src/components/StatusChip/StatusChip";
import { Tab, Tabs } from "src/components/Tab/Tab";
import { useGlobalData } from "src/providers/GlobalDataProvider";
import { selectUserrootData } from "src/slices/userDataSlice";
import { colors } from "src/themeConfig";
import Button from "components/Button/Button";
import Card from "components/Card/Card";
import LoadingSpinner from "components/LoadingSpinner/LoadingSpinner";
import { DisplayText, Text } from "components/Typography/Typography";

import AccountManagementHeader from "../components/AccountManagement/AccountManagementHeader";
import BillingIcon from "../components/Icons/BillingIcon";
import PageContainer from "../components/Layout/PageContainer";
import PageTitle from "../components/Layout/PageTitle";

import ConsumptionUsage from "./components/ConsumptionUsage";
import { StripeIcon } from "./components/Icons";
import InvoicesTable from "./components/InvoicesTable";
import useBillingDetails from "./hooks/useBillingDetails";
import useBillingStatus from "./hooks/useBillingStatus";
import useConsumptionInvoices from "./hooks/useConsumptionInvoices";
import useConsumptionUsage from "./hooks/useConsumptionUsage";

const BillingPage = () => {
  const { refetchSubscriptions } = useGlobalData();
  const [paymentURL, setPaymentURL] = useState("");
  const [selectedBillingProvider, setSelectedBillingProvider] = useState("");
  const selectUser = useSelector(selectUserrootData);
  // Track previous paymentConfigured state to detect changes
  const previousPaymentConfiguredRef = useRef<boolean | undefined>();

  const billingStatusQuery = useBillingStatus();

  const isBillingEnabled = Boolean(billingStatusQuery.data?.enabled);

  const { isPending: isBillingDetailsPending, data: billingDetails, error } = useBillingDetails(isBillingEnabled);
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
  let errorDisplayText = "";

  if (error) {
    // @ts-ignore
    const errorMessage = error?.response?.data?.message;
    errorDisplayText =
      "Something went wrong. Try refreshing the page. If the issue persists please contact support for assistance";

    if (errorMessage) {
      if (
        errorMessage === "Your provider has not enabled billing for the user." ||
        errorMessage === "Your provider has not enabled billing for the services."
      ) {
        errorDisplayText = "Billing has not been configured. Please contact support for assistance";
      }

      if (errorMessage === "You have not been subscribed to a service yet.") {
        errorDisplayText = "Please subscribe to a Product to start using billing";
      }

      if (errorMessage === "You have not been enrolled in a service plan with a billing plan yet.") {
        errorDisplayText =
          "You have not been enrolled in a plan with a billing plan. Please contact support for assistance";
      } else {
        errorDisplayText = errorMessage;
      }
    }
  }

  const isLoading = isBillingDetailsPending || isConsumptionDataPending || isInvoicesPending;

  if (isLoading) return <LoadingSpinner />;
  const isStripe = selectedBillingProvider === "STRIPE";
  const balanceDueLink =
    billingDetails?.billingProviders?.find((provider) => provider.type === selectedBillingProvider)?.balanceDueLink ||
    "#";

  return (
    <div>
      <AccountManagementHeader userName={selectUser?.name} userEmail={selectUser?.email} />
      <PageContainer>
        <PageTitle icon={BillingIcon} className="mb-6">
          Billing
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

            {selectedBillingProvider && (
              <Tabs value={selectedBillingProvider} className="mt-3">
                {billingDetails?.billingProviders?.map((provider) => {
                  const styles =
                    provider.type === "STRIPE"
                      ? {
                          borderBottom: "1px solid #635BFF",
                          backgroundColor: "#EAE9FF",
                          color: colors.gray600,
                        }
                      : {
                          borderBottom: "1px solid #D79640",
                          backgroundColor: "#FFF4ED",
                          color: colors.gray600,
                        };

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
                              <img src={provider.logoURL} width="24" height="24" alt="Img" className="object-cover" />
                            </div>
                            <div>{provider.name || "Billing Provider"}</div>
                          </Stack>
                        )
                      }
                      value={provider.type}
                      onClick={() => setSelectedBillingProvider(provider.type)}
                      sx={{
                        padding: "8px 18px !important",
                        fontWeight: "500",
                        marginRight: "0px",
                        borderWidth: "1px",
                        "&:hover": styles,
                        [`&.${tabClasses.selected}`]: styles,
                      }}
                    />
                  );
                })}
              </Tabs>
            )}

            {selectedBillingProvider && (
              <div className="grid grid-cols-2 gap-6 mt-3">
                <Card sx={{ boxShadow: "0px 1px 2px 0px #0A0D120D" }}>
                  <Box>
                    <Text size="large" weight="semibold" color="#181D27">
                      Balance
                    </Text>
                    <Text size="small" weight="regular" color="#535862" marginTop="2px">
                      Pay open invoices amount
                    </Text>
                  </Box>
                  <Stack direction="row" gap="24px" justifyContent="space-between" marginTop="10px">
                    {/*@ts-ignore */}
                    <DisplayText size="small" weight="semibold">
                      {selectedBillingProvider === "STRIPE" ? `$${invoicesTotalAmount}` : "NA"}
                    </DisplayText>
                    {!isStripe || paymentURL ? (
                      <Link href={isStripe ? paymentURL : balanceDueLink} target="_blank">
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
                          Pay Now
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
                        disabled={!paymentURL}
                      >
                        Pay Now
                      </Button>
                    )}
                  </Stack>
                </Card>
                <Card sx={{ boxShadow: "0px 1px 2px 0px #0A0D120D", backgroundColor: isStripe ? "#FFF" : "#FAFAFA" }}>
                  <Box>
                    <Text size="large" weight="semibold" color="#181D27">
                      Payment Method
                    </Text>
                    <Text size="small" weight="regular" color="#535862" marginTop="2px">
                      Change how you pay for your plan
                    </Text>
                  </Box>

                  <Stack direction="row" gap="24px" justifyContent="space-between" marginTop="10px">
                    <StatusChip
                      label={
                        !isStripe ? "Non Configurable" : paymentConfigured === true ? "Configured" : "Not Configured"
                      }
                      category={!isStripe ? "failed" : paymentConfigured === true ? "success" : "failed"}
                      sx={{ alignSelf: "center" }}
                    />
                    {isStripe && billingDetails?.paymentInfoPortalURL ? (
                      <Link href={billingDetails?.paymentInfoPortalURL} target="_blank">
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

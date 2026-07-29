"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { Box, Collapse, Stack } from "@mui/material";
import { getCloudAccountId, getCloudAccountProvider } from "app/(dashboard)/cloud-accounts/utils";
import PageContainer from "app/(dashboard)/components/Layout/PageContainer";
import NoServiceFoundUI from "app/(dashboard)/components/NoServiceFoundUI/NoServiceFoundUI";
import useInstancesDescribe from "app/(dashboard)/instances/hooks/useInstancesDescribe";
import { RiArrowGoBackFill } from "react-icons/ri";

import Button from "src/components/Button/Button";
import LoadingSpinner from "src/components/LoadingSpinner/LoadingSpinner";
import { Tab, Tabs } from "src/components/Tab/Tab";
import { DisplayText } from "src/components/Typography/Typography";
import { useGlobalData } from "src/providers/GlobalDataProvider";
import { ResourceInstance } from "src/types/resourceInstance";
import { getResultParams } from "src/utils/instance";
import { CloudAccountTab } from "src/utils/routes";

import AccountDetailsTab from "./components/AccountDetailsTab";
import CloudAccountOverview from "./components/CloudAccountOverview";
import GovernanceControlsTab from "./components/GovernanceControlsTab";

const TABS: CloudAccountTab[] = ["Account Details", "Governance Controls"];

const isCloudAccountTab = (value?: string | null): value is CloudAccountTab =>
  Boolean(value) && (TABS as string[]).includes(value as string);

const CloudAccountDetailsPage = ({
  params,
}: {
  params: Promise<{
    serviceId: string;
    servicePlanId: string;
    instanceId: string;
    subscriptionId: string;
  }>;
}) => {
  const { serviceId, servicePlanId, instanceId, subscriptionId } = use(params);
  const searchParams = useSearchParams();
  const view = searchParams?.get("view");

  const [currentTab, setCurrentTab] = useState<CloudAccountTab>("Account Details");
  const [isSummaryVisible, setIsSummaryVisible] = useState(true);

  useEffect(() => {
    document.title = "Cloud Account Details";
  }, []);

  useEffect(() => {
    if (isCloudAccountTab(view)) {
      setCurrentTab(view);
    }
  }, [view]);

  const { subscriptionsObj, serviceOfferingsObj, isFetchingServiceOfferings, isFetchingSubscriptions } =
    useGlobalData();

  const offering = serviceOfferingsObj[serviceId]?.[servicePlanId];
  const subscription = subscriptionsObj[subscriptionId];

  // Cloud account instances always live on the injected account-config resource of their
  // offering, so the resource key is derived rather than carried in the URL.
  const resourceKey = useMemo(
    () =>
      offering?.resourceParameters?.find((resource) => resource.resourceId.startsWith("r-injectedaccountconfig"))
        ?.urlKey,
    [offering?.resourceParameters]
  );

  const instanceQuery = useInstancesDescribe({
    serviceProviderId: offering?.serviceProviderId ?? "",
    serviceKey: offering?.serviceURLKey ?? "",
    serviceAPIVersion: offering?.serviceAPIVersion ?? "",
    serviceEnvironmentKey: offering?.serviceEnvironmentURLKey ?? "",
    serviceModelKey: offering?.serviceModelURLKey ?? "",
    productTierKey: offering?.productTierURLKey ?? "",
    resourceKey: resourceKey ?? "",
    id: instanceId,
    subscriptionId,
    enabled: Boolean(offering && resourceKey),
  });

  const instance = instanceQuery.data as ResourceInstance | undefined;
  const resultParams = getResultParams(instance);
  const cloudProvider = getCloudAccountProvider(resultParams);

  if (!isFetchingServiceOfferings && !isFetchingSubscriptions && (!subscription || !offering)) {
    return (
      <PageContainer>
        <Box pt="100px">
          <NoServiceFoundUI text="Product Not Found" showMessage />
        </Box>
      </PageContainer>
    );
  }

  if (isFetchingServiceOfferings || isFetchingSubscriptions || instanceQuery.isLoading) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    );
  }

  if (!instance) {
    return (
      <PageContainer>
        <Stack p={3} pt="150px" alignItems="center" justifyContent="center">
          {/* @ts-expect-error This is a valid prop */}
          <DisplayText size="xsmall" sx={{ wordBreak: "break-word", textAlign: "center", maxWidth: 900 }}>
            Cloud Account not found
          </DisplayText>
        </Stack>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Link href="/cloud-accounts">
          <Button startIcon={<RiArrowGoBackFill />}>Back to Cloud Accounts</Button>
        </Link>
        <Button
          endIcon={isSummaryVisible ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          onClick={() => setIsSummaryVisible((prev) => !prev)}
        >
          {isSummaryVisible ? "Hide Summary" : "Show Summary"}
        </Button>
      </Stack>

      <Collapse in={isSummaryVisible}>
        <CloudAccountOverview
          accountId={getCloudAccountId(resultParams)}
          cloudProvider={cloudProvider}
          serviceName={subscription?.serviceName}
          serviceLogoURL={subscription?.serviceLogoURL}
          productTierName={subscription?.productTierName}
          subscriptionOwnerName={subscription?.subscriptionOwnerName}
          status={instance.status}
        />
      </Collapse>

      <Stack direction="row" alignItems="center" justifyContent="space-between" gap="24px" sx={{ marginTop: "20px" }}>
        <Tabs value={currentTab} variant="scrollable" scrollButtons="auto">
          {TABS.map((tab) => (
            <Tab
              data-testid={`${tab.replace(/\s+/g, "-").toLowerCase()}-tab`}
              key={tab}
              label={tab}
              value={tab}
              onClick={() => setCurrentTab(tab)}
              disableRipple
            />
          ))}
        </Tabs>
      </Stack>

      {currentTab === "Account Details" && <AccountDetailsTab instance={instance} />}
      {currentTab === "Governance Controls" && <GovernanceControlsTab cloudProvider={cloudProvider} />}
    </PageContainer>
  );
};

export default CloudAccountDetailsPage;

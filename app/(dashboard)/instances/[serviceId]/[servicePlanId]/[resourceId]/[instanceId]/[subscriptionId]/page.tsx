"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { Box, Collapse, Stack } from "@mui/material";
import PageContainer from "app/(dashboard)/components/Layout/PageContainer";
import NoServiceFoundUI from "app/(dashboard)/components/NoServiceFoundUI/NoServiceFoundUI";
import InstanceActionMenu from "app/(dashboard)/instances/components/InstanceActionMenu";
import InstanceDialogs from "app/(dashboard)/instances/components/InstanceDialogs";
import useInstances from "app/(dashboard)/instances/hooks/useInstances";
import { Overlay } from "app/(dashboard)/instances/page";
import { RiArrowGoBackFill } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";

import RefreshWithToolTip from "src/components/RefreshWithTooltip/RefreshWithToolTip";
import ResourceCustomDNS from "src/components/ResourceInstance/Connectivity/ResourceCustomDNS";
import { Tab, Tabs } from "src/components/Tab/Tab";
import { CLI_MANAGED_RESOURCES } from "src/constants/resource";
import useResourceInstance from "src/hooks/useResourceInstance";
import useServiceOfferingResourceSchema from "src/hooks/useServiceOfferingResourceSchema";
import { useGlobalData } from "src/providers/GlobalDataProvider";
import {
  selectInstanceDetailsSummaryVisibility,
  toggleInstanceDetailsSummaryVisibility,
} from "src/slices/genericSlice";
import { NetworkType } from "src/types/common/enums";
import Button from "components/Button/Button";
import LoadingSpinner from "components/LoadingSpinner/LoadingSpinner";
import AuditLogs from "components/ResourceInstance/AuditLogs/AuditLogs";
import Backup from "components/ResourceInstance/Backup/Backup";
import Connectivity from "components/ResourceInstance/Connectivity/Connectivity";
import Logs from "components/ResourceInstance/Logs/Logs";
import Metrics from "components/ResourceInstance/Metrics/Metrics";
import NodesTable from "components/ResourceInstance/NodesTable/NodesTable";
import ResourceInstanceDetails from "components/ResourceInstance/ResourceInstanceDetails/ResourceInstanceDetails";
import ResourceInstanceOverview from "components/ResourceInstance/ResourceInstanceOverview/ResourceInstanceOverview";
import { DisplayText } from "components/Typography/Typography";

import { checkCustomDNSEndpoint, getTabs } from "./utils";

export type CurrentTab =
  | "Instance Details"
  | "Connectivity"
  | "Nodes"
  | "Metrics"
  | "Logs"
  | "Audit Logs"
  | "Backups"
  | "Custom DNS";

const isResourceBYOA = false;

const InstanceDetailsPage = ({
  params,
}: {
  params: {
    serviceId: string;
    servicePlanId: string;
    resourceId: string;
    instanceId: string;
    subscriptionId: string;
  };
}) => {
  const { serviceId, servicePlanId, resourceId, instanceId, subscriptionId } = params;
  const searchParams = useSearchParams();
  const view = searchParams?.get("view");
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [overlayType, setOverlayType] = useState<Overlay>("delete-dialog");

  const [currentTab, setCurrentTab] = useState<CurrentTab>("Instance Details");

  // Set Page Title
  useEffect(() => {
    document.title = currentTab;
  }, [currentTab]);

  useEffect(() => {
    if (view) {
      setCurrentTab(view as CurrentTab);
    }
  }, [view]);

  const insightsVisible = useSelector(selectInstanceDetailsSummaryVisibility);
  const dispatch = useDispatch();

  const { subscriptionsObj, serviceOfferingsObj, isFetchingServiceOfferings, isFetchingSubscriptions } =
    useGlobalData();

  const offering = serviceOfferingsObj[serviceId]?.[servicePlanId];
  const subscription = subscriptionsObj[subscriptionId];

  const { resourceName, resourceKey, resourceType } = useMemo(() => {
    const resource = offering?.resourceParameters.find((resource) => resource.resourceId === resourceId);

    return {
      resourceName: resource?.name,
      resourceKey: resource?.urlKey,
      resourceType: resource?.resourceType,
    };
  }, [offering, resourceId]);

  const isCliManagedResource = useMemo(() => CLI_MANAGED_RESOURCES.includes(resourceType as string), [resourceType]);

  const { data: instances = [] } = useInstances();
  const resourceInstanceQuery = useResourceInstance({
    serviceProviderId: offering?.serviceProviderId,
    serviceKey: offering?.serviceURLKey,
    serviceAPIVersion: offering?.serviceAPIVersion,
    serviceEnvironmentKey: offering?.serviceEnvironmentURLKey,
    serviceModelKey: offering?.serviceModelURLKey,
    productTierKey: offering?.productTierURLKey,
    resourceKey: resourceKey,
    resourceInstanceId: instanceId,
    resourceId,
    subscriptionId: subscription?.id,
  });

  const { data: resourceInstanceData, refetch: refetchInstance } = resourceInstanceQuery;

  const resourceSchemaQuery = useServiceOfferingResourceSchema({
    serviceId,
    resourceId,
    instanceId,
  });

  const tabs = useMemo(
    () =>
      getTabs(
        resourceInstanceData?.isMetricsEnabled,
        resourceInstanceData?.isLogsEnabled,
        resourceInstanceData?.active,
        isResourceBYOA,
        isCliManagedResource,
        resourceType,
        // @ts-ignore
        resourceInstanceData?.backupStatus?.backupPeriodInHours,
        checkCustomDNSEndpoint(resourceInstanceData ? resourceInstanceData?.connectivity?.globalEndpoints : {})
      ),
    [resourceInstanceData, isCliManagedResource, resourceType]
  );

  const disabledTabs = useMemo(
    () => (resourceInstanceData?.status === "DISCONNECTED" ? ["backups"] : []),
    [resourceInstanceData, tabs]
  );

  if (!isFetchingServiceOfferings && !isFetchingSubscriptions && (!subscription || !offering)) {
    return (
      <PageContainer>
        <Box pt="100px">
          <NoServiceFoundUI text="Product Not Found" showMessage />
        </Box>
      </PageContainer>
    );
  }

  if (isFetchingServiceOfferings || isFetchingSubscriptions || resourceInstanceQuery.isFetching) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    );
  }

  if (!resourceInstanceData) {
    return (
      <PageContainer>
        <Stack p={3} pt="200px" alignItems="center" justifyContent="center">
          <DisplayText
            // @ts-ignore
            size="xsmall"
            sx={{ wordBreak: "break-word", textAlign: "center", maxWidth: 900 }}
          >
            Deployment Instance not found
          </DisplayText>
        </Stack>
      </PageContainer>
    );
  }

  const queryData = {
    serviceProviderId: offering.serviceProviderId,
    serviceKey: offering.serviceURLKey,
    serviceAPIVersion: offering.serviceAPIVersion,
    serviceEnvironmentKey: offering.serviceEnvironmentURLKey,
    serviceModelKey: offering.serviceModelURLKey,
    productTierKey: offering.productTierURLKey,
    subscriptionId: subscription.id,
    resourceInstanceId: instanceId,
    resourceKey: resourceKey,
  };

  let cloudProvider = resourceInstanceData?.cloudProvider;

  // The api doesn't return cloud provider field in the root object for a Cloud Provider Account instance
  // Get the cloud provider data from result parameters in this case
  if (!cloudProvider) {
    // @ts-ignore
    if (resourceInstanceData?.resultParameters?.cloud_provider) {
      // @ts-ignore
      cloudProvider = resourceInstanceData?.resultParameters?.cloud_provider;
    }
  }

  return (
    <PageContainer>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Link href="/instances">
          <Button startIcon={<RiArrowGoBackFill />}>Back to list of Deployment Instances</Button>
        </Link>
        <Button
          endIcon={insightsVisible ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          onClick={() => dispatch(toggleInstanceDetailsSummaryVisibility())}
        >
          {insightsVisible ? "Hide Summary" : "Show Summary"}
        </Button>
      </Stack>
      <Collapse in={insightsVisible}>
        <ResourceInstanceOverview
          serviceName={subscription?.serviceName}
          productTierName={subscription?.productTierName}
          serviceLogoURL={subscription?.serviceLogoURL}
          resourceInstanceId={instanceId}
          region={resourceInstanceData.region}
          cloudProvider={cloudProvider}
          status={resourceInstanceData.status}
          createdAt={resourceInstanceData.createdAt}
          modifiedAt={resourceInstanceData.modifiedAt}
          isCliManagedResource={isCliManagedResource}
          subscriptionOwner={subscription.subscriptionOwnerName}
          detailedNetworkTopology={resourceInstanceData?.detailedNetworkTopology || {}}
          onViewNodesClick={() => {
            setCurrentTab("Nodes");
          }}
        />
      </Collapse>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap="24px" sx={{ marginTop: "20px" }}>
        <Tabs value={currentTab}>
          {Object.entries(tabs).map(([key, value]) => {
            const isDisabled = disabledTabs?.includes(key);
            return (
              <Tab
                data-testid={`${value?.replace(" ", "-").toLowerCase()}-tab`}
                key={key}
                label={value}
                value={value}
                onClick={() => {
                  setCurrentTab(value as CurrentTab);
                }}
                disableRipple
                disabled={isDisabled}
              />
            );
          })}
        </Tabs>

        <Stack direction="row" alignItems="center" gap="16px">
          <RefreshWithToolTip disabled={resourceInstanceQuery.isFetching} refetch={refetchInstance} />
          <InstanceActionMenu
            variant="details-page"
            instance={resourceInstanceData?.unprocessedData}
            serviceOffering={offering}
            subscription={subscription}
            setOverlayType={setOverlayType}
            setIsOverlayOpen={setIsOverlayOpen}
            refetchData={refetchInstance}
          />
        </Stack>
      </Stack>
      {currentTab === tabs.resourceInstanceDetails && (
        <ResourceInstanceDetails
          resourceInstanceId={instanceId}
          createdAt={resourceInstanceData.createdAt}
          modifiedAt={resourceInstanceData.modifiedAt}
          resultParameters={resourceInstanceData.resultParameters}
          isLoading={resourceSchemaQuery.isPending || resourceInstanceQuery.isPending}
          resultParametersSchema={resourceSchemaQuery?.data?.DESCRIBE?.outputParameters?.map((param) => {
            const createInputParam = resourceSchemaQuery?.data?.CREATE?.inputParameters?.find(
              (inputParam) => inputParam.key === param.key
            );
            return {
              ...param,
              tabIndex: createInputParam?.tabIndex,
            };
          })}
          serviceOffering={offering}
          subscriptionId={subscriptionId}
          customNetworkDetails={resourceInstanceData.customNetworkDetails}
          cloudProviderAccountInstanceURL="/cloud-accounts"
          resourceInstanceData={resourceInstanceData}
          autoscalingEnabled={resourceInstanceData.autoscalingEnabled}
          highAvailability={resourceInstanceData.highAvailability}
          backupStatus={resourceInstanceData.backupStatus}
          autoscaling={resourceInstanceData.autoscaling}
          autostopEnabled={resourceInstanceData.serverlessEnabled}
          isCliManagedResource={isCliManagedResource}
          maintenanceTasks={resourceInstanceData.maintenanceTasks}
          licenseDetails={resourceInstanceData?.subscriptionLicense}
        />
      )}
      {currentTab === tabs.connectivity && (
        <Connectivity
          networkType={resourceInstanceData.connectivity.networkType}
          clusterEndpoint={resourceInstanceData.connectivity.clusterEndpoint}
          nodeEndpoints={resourceInstanceData.connectivity.nodeEndpoints}
          ports={resourceInstanceData.connectivity.ports}
          availabilityZones={resourceInstanceData.connectivity.availabilityZones}
          publiclyAccessible={resourceInstanceData.connectivity.publiclyAccessible}
          privateNetworkCIDR={resourceInstanceData.connectivity.privateNetworkCIDR}
          privateNetworkId={resourceInstanceData.connectivity.privateNetworkId}
          globalEndpoints={resourceInstanceData.connectivity.globalEndpoints}
          nodes={resourceInstanceData.nodes}
          queryData={queryData}
          refetchInstance={resourceInstanceQuery.refetch}
          additionalEndpoints={resourceInstanceData.connectivity.additionalEndpoints}
        />
      )}
      {currentTab === tabs.nodes && (
        <NodesTable
          isAccessSide={true}
          resourceName={resourceName}
          nodes={resourceInstanceData.nodes}
          refetchData={resourceInstanceQuery.refetch}
          isRefetching={resourceInstanceQuery.isRefetching}
          isLoading={resourceInstanceQuery.isPending}
          serviceOffering={offering}
          resourceKey={resourceKey}
          resourceInstanceId={instanceId}
          resourceInstancestatus={resourceInstanceData.status}
          subscriptionData={subscription}
          subscriptionId={subscription.id}
          isBYOAServicePlan={offering?.serviceModelType === "BYOA"}
          isServerless={resourceInstanceData?.serverlessEnabled}
        />
      )}
      {currentTab === tabs.metrics && (
        <Metrics
          resourceInstanceId={instanceId}
          nodes={resourceInstanceData.nodes}
          socketBaseURL={resourceInstanceData.metricsSocketURL}
          instanceStatus={resourceInstanceData.status}
          resourceKey={resourceInstanceData.resourceKey}
          customMetrics={resourceInstanceData.customMetrics || []}
          mainResourceHasCompute={resourceInstanceData.mainResourceHasCompute}
          productTierType={offering.productTierType}
        />
      )}
      {currentTab === tabs.logs && (
        <Logs
          resourceInstanceId={instanceId}
          nodes={resourceInstanceData.nodes}
          socketBaseURL={resourceInstanceData.logsSocketURL}
          instanceStatus={resourceInstanceData.status}
          resourceKey={resourceInstanceData.resourceKey}
          mainResourceHasCompute={resourceInstanceData.mainResourceHasCompute}
        />
      )}

      {currentTab === tabs.auditLogs && <AuditLogs instanceId={instanceId} subscriptionId={subscriptionId} />}
      {currentTab === tabs.backups && (
        <Backup
          // @ts-ignore
          backupStatus={resourceInstanceData.backupStatus}
          instanceId={instanceId}
          accessQueryParams={queryData}
          resourceName={resourceName}
          networkType={
            (resourceInstanceData?.connectivity?.networkType
              ? resourceInstanceData?.connectivity?.networkType.toUpperCase()
              : "PUBLIC") as NetworkType
          }
        />
      )}
      {currentTab === tabs.customDNS && (
        <ResourceCustomDNS
          globalEndpoints={resourceInstanceData.connectivity.globalEndpoints}
          context="access"
          accessQueryParams={queryData}
          refetchInstance={resourceInstanceQuery.refetch}
        />
      )}

      <InstanceDialogs
        variant="details-page"
        isOverlayOpen={isOverlayOpen}
        setIsOverlayOpen={setIsOverlayOpen}
        overlayType={overlayType}
        setOverlayType={setOverlayType}
        instance={resourceInstanceData?.unprocessedData}
        instances={instances}
        serviceOffering={offering}
        subscription={subscription}
        refetchData={refetchInstance}
      />
    </PageContainer>
  );
};

export default InstanceDetailsPage;

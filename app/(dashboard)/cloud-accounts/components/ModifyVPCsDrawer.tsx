"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Chip from "components/Chip/Chip";
import LoadingSpinner from "components/LoadingSpinner/LoadingSpinner";
import { $api } from "src/api/query";
import { getResourceInstanceDetails } from "src/api/resourceInstance";
import { cloudProviderLongLogoMap } from "src/constants/cloudProviders";
import useEnvironmentType from "src/hooks/useEnvironmentType";
import useSnackbar from "src/hooks/useSnackbar";
import { useGlobalData } from "src/providers/GlobalDataProvider";
import { ResourceInstance } from "src/types/resourceInstance";
import { getResultParams } from "src/utils/instance";

import CloudAccountSummaryCard, { SummarySection } from "./CloudAccountSummaryCard";
import ConfigureVPCsStep, { ConfigureVPCsFormValues, VpcRecord } from "./steps/ConfigureVPCsStep";

const READY_STATUSES = ["READY", "RUNNING", "COMPLETE"];

type ModifyVPCsDrawerProps = {
  selectedInstance: ResourceInstance;
  onClose: () => void;
};

const ModifyVPCsDrawer: React.FC<ModifyVPCsDrawerProps> = ({ selectedInstance, onClose }) => {
  const queryClient = useQueryClient();
  const environmentType = useEnvironmentType();
  const snackbar = useSnackbar();
  const hasShownRefreshError = useRef(false);

  const { subscriptionsObj, serviceOfferingsObj, servicesObj } = useGlobalData();

  const [vpcValues, setVpcValues] = useState<ConfigureVPCsFormValues>({
    enableNewVpcs: true,
    bringOwnVpcs: false,
    selectedRegions: [],
    selectedVpcIds: [],
  });

  // ─── Derive account config data from the selected instance ────────────────
  const resultParams = useMemo(() => getResultParams(selectedInstance), [selectedInstance]);
  const cloudProvider = resultParams?.cloud_provider || "";

  const subscription = subscriptionsObj[selectedInstance.subscriptionId as string];
  const offering = subscription ? serviceOfferingsObj[subscription.serviceId]?.[subscription.productTierId] : undefined;

  const accountConfigId = useMemo(() => {
    return typeof resultParams?.cloud_provider_account_config_id === "string"
      ? resultParams.cloud_provider_account_config_id
      : undefined;
  }, [resultParams]);

  const accountConfigStatus = useMemo(() => {
    if (typeof resultParams?.account_config_status === "string") return resultParams.account_config_status;
    if (typeof selectedInstance?.status === "string") return selectedInstance.status;
    return undefined;
  }, [resultParams, selectedInstance]);

  const isAccountConfigReady = Boolean(accountConfigStatus && READY_STATUSES.includes(accountConfigStatus));

  // ─── Cloud native networks query ──────────────────────────────────────────
  const cloudNativeNetworksQuery = $api.useQuery(
    "get",
    "/2022-09-01-00/accountconfig/{id}/cloud-native-networks",
    {
      params: {
        path: { id: accountConfigId || "" },
      },
      headers: { "x-ignore-global-error": true },
    },
    {
      enabled: Boolean(vpcValues.bringOwnVpcs && accountConfigId && isAccountConfigReady),
      retry: 2,
      retryDelay: 3000,
    }
  );

  const syncCloudNativeNetworksMutation = $api.useMutation(
    "post",
    "/2022-09-01-00/accountconfig/{id}/cloud-native-networks/sync",
    {
      onSuccess: () => {
        cloudNativeNetworksQuery.refetch();
      },
      onError: () => {
        snackbar.showError("Failed to sync networks. Please try again.");
      },
    }
  );

  const allCloudNativeNetworks = useMemo(
    () => cloudNativeNetworksQuery.data?.cloudNativeNetworks || [],
    [cloudNativeNetworksQuery.data?.cloudNativeNetworks]
  );

  // ─── Regions ──────────────────────────────────────────────────────────────
  const offeringRegions = useMemo(() => {
    if (!offering || !cloudProvider) return [];
    const regionMap: Record<string, string[] | undefined> = {
      aws: offering.awsRegions,
      gcp: offering.gcpRegions,
      azure: offering.azureRegions,
      oci: offering.ociRegions,
    };
    return (regionMap[cloudProvider] ?? []).slice().sort((a, b) => a.localeCompare(b));
  }, [offering, cloudProvider]);

  const availableRegions = offeringRegions;

  // ─── VPCs ─────────────────────────────────────────────────────────────────
  const availableVpcs = useMemo<VpcRecord[]>(() => {
    const filteredNetworks =
      vpcValues.selectedRegions.length > 0
        ? allCloudNativeNetworks.filter((network) => vpcValues.selectedRegions.includes(network.region))
        : allCloudNativeNetworks;

    return filteredNetworks.map((network) => {
      const normalizedStatus =
        network.status === "AVAILABLE" || network.status === "READY"
          ? "Available"
          : network.status === "FAILED"
            ? "Unavailable"
            : "Unknown";

      return {
        id: network.cloudNativeNetworkId || network.id,
        name: network.name || network.cloudNativeNetworkId || network.id,
        status: normalizedStatus,
        statusMessage: network.statusMessage,
        networkId: network.cloudNativeNetworkId,
      };
    });
  }, [allCloudNativeNetworks, vpcValues.selectedRegions]);

  const lastSyncedAt = useMemo(() => {
    if (!allCloudNativeNetworks.length) return undefined;
    const latest = allCloudNativeNetworks.reduce<string | undefined>((maxDate, network) => {
      if (!network.updatedAt) return maxDate;
      if (!maxDate) return network.updatedAt;
      return new Date(network.updatedAt) > new Date(maxDate) ? network.updatedAt : maxDate;
    }, undefined);
    return latest ? new Date(latest).toLocaleString() : undefined;
  }, [allCloudNativeNetworks]);

  const isLoadingVpcs = cloudNativeNetworksQuery.isFetching || syncCloudNativeNetworksMutation.isPending;

  const handleResyncVpcs = () => {
    if (!accountConfigId) return;
    syncCloudNativeNetworksMutation.mutate({
      params: { path: { id: accountConfigId } },
      body: {
        regions: vpcValues.selectedRegions.length > 0 ? vpcValues.selectedRegions : undefined,
      },
    });
  };

  // ─── Polling for account config readiness ─────────────────────────────────
  const fetchInstanceDetails = useCallback(async () => {
    const resource = offering?.resourceParameters?.find((r) => r.resourceId.startsWith("r-injectedaccountconfig"));
    if (!resource) return;
    return getResourceInstanceDetails(
      offering?.serviceProviderId,
      offering?.serviceURLKey,
      offering?.serviceAPIVersion,
      offering?.serviceEnvironmentURLKey,
      offering?.serviceModelURLKey,
      offering?.productTierURLKey,
      resource?.urlKey,
      selectedInstance.id,
      selectedInstance.subscriptionId
    );
  }, [selectedInstance, offering]);

  useEffect(() => {
    if (!vpcValues.bringOwnVpcs || !selectedInstance || (accountConfigId && isAccountConfigReady)) return;

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const response = await fetchInstanceDetails();
        const ri = response?.data;
        const refreshedParams = getResultParams(ri);
        if (!cancelled && refreshedParams) {
          // Invalidate the instances list so derived data updates
          queryClient.invalidateQueries({
            queryKey: ["get", "/2022-09-01-00/resource-instance", { params: { query: { environmentType } } }],
          });
          const status = refreshedParams.account_config_status || ri?.status;
          if (!(status && READY_STATUSES.includes(status)) && !cancelled) {
            retryTimer = setTimeout(poll, 5000);
          }
        }
      } catch {
        if (!cancelled && !hasShownRefreshError.current) {
          hasShownRefreshError.current = true;
          snackbar.showError("Unable to refresh account configuration. Please try again.");
        }
      }
    };

    void poll();
    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
    };
  }, [
    accountConfigId,
    isAccountConfigReady,
    selectedInstance,
    fetchInstanceDetails,
    vpcValues.bringOwnVpcs,
    queryClient,
    environmentType,
    snackbar,
  ]);

  // ─── Summary ──────────────────────────────────────────────────────────────
  const summarySections = useMemo((): SummarySection[] => {
    const privateConnectivityFlag = resultParams?.enable_private_connectivity ?? resultParams?.PrivateLink;
    const privateConnectivityEnabled = typeof privateConnectivityFlag === "boolean" ? privateConnectivityFlag : false;

    const accountIdentityItems =
      cloudProvider === "gcp"
        ? [
            { label: "GCP Project ID", value: resultParams?.gcp_project_id || undefined },
            { label: "GCP Project Number", value: resultParams?.gcp_project_number || undefined },
          ]
        : cloudProvider === "azure"
          ? [
              { label: "Azure Subscription ID", value: resultParams?.azure_subscription_id || undefined },
              { label: "Azure Tenant ID", value: resultParams?.azure_tenant_id || undefined },
            ]
          : cloudProvider === "oci"
            ? [
                { label: "Tenancy OCID", value: resultParams?.oci_tenancy_id || undefined },
                { label: "Domain OCID", value: resultParams?.oci_domain_id || undefined },
              ]
            : cloudProvider === "byoc-onprem"
              ? [{ label: "Kubernetes Cluster Name", value: resultParams?.cluster_name || undefined }]
              : [{ label: "Account ID", value: resultParams?.aws_account_id || undefined }];

    const standardItems = [
      { label: "Product Name", value: servicesObj[subscription?.serviceId]?.serviceName || undefined },
      { label: "Subscription Plan", value: offering?.productTierName || undefined },
      { label: "Subscription", value: subscription?.id || undefined },
      {
        label: "Cloud Provider",
        value: cloudProvider
          ? cloudProviderLongLogoMap[cloudProvider as keyof typeof cloudProviderLongLogoMap]
          : undefined,
      },
      ...accountIdentityItems,
      ...(cloudProvider !== "byoc-onprem"
        ? [
            {
              label: "Private Connectivity",
              value: privateConnectivityEnabled ? (
                <Chip label="Enabled" fontColor="#067647" bgColor="#ECFDF3" borderColor="#ABEFC6" />
              ) : (
                <Chip label="Disabled" fontColor="#B54708" bgColor="#FFFAEB" borderColor="#FEDF89" />
              ),
            },
          ]
        : []),
    ];

    const sections: SummarySection[] = [{ title: "Standard Information", items: standardItems }];

    const vpcItems = [
      {
        label: "Creating new VPCs",
        value: vpcValues.enableNewVpcs ? (
          <Chip label="Enabled" fontColor="#067647" bgColor="#ECFDF3" borderColor="#ABEFC6" />
        ) : undefined,
      },
      {
        label: "Enable existing VPCs",
        value: vpcValues.bringOwnVpcs ? (
          <Chip label="Enabled" fontColor="#067647" bgColor="#ECFDF3" borderColor="#ABEFC6" />
        ) : undefined,
      },
      {
        label: "Regions",
        value: vpcValues.selectedRegions.length > 0 ? `${vpcValues.selectedRegions.length} selected` : undefined,
      },
      {
        label: "VPCs",
        value: vpcValues.selectedVpcIds.length > 0 ? `${vpcValues.selectedVpcIds.length} selected` : undefined,
      },
    ];
    sections.push({ title: "VPC Configuration", items: vpcItems });

    return sections;
  }, [resultParams, cloudProvider, servicesObj, subscription, offering, vpcValues]);

  // ─── Handle update ────────────────────────────────────────────────────────
  const handleUpdate = () => {
    // TODO: API call to update VPC configuration
    snackbar.showSuccess("VPC configuration updated");
    onClose();
  };

  if (!offering) {
    return <LoadingSpinner />;
  }

  return (
    <div data-testid="modify-vpcs-drawer">
      <div className="grid grid-cols-7 items-start gap-8">
        <div className="col-span-5">
          <ConfigureVPCsStep
            values={vpcValues}
            onChange={(patch) => setVpcValues((prev) => ({ ...prev, ...patch }))}
            availableRegions={availableRegions}
            availableVpcs={availableVpcs}
            isLoadingVpcs={isLoadingVpcs}
            onResync={handleResyncVpcs}
            lastSyncedAt={lastSyncedAt}
            cloudProvider={cloudProvider}
          />
        </div>

        <div className="col-span-2">
          <CloudAccountSummaryCard
            sections={summarySections}
            onDoItLater={onClose}
            onNext={handleUpdate}
            nextLabel="Update"
            isNextLoading={false}
            isNextDisabled={false}
          />
        </div>
      </div>
    </div>
  );
};

export default ModifyVPCsDrawer;

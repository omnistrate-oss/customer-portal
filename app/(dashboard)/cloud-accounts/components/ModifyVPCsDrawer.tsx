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

import { getCloudNativeNetworkRegions, getDefaultSelectedRegions, hasCloudNativeVpcConfiguration } from "../utils";

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
  const hasSelectedInstanceCloudNativeVpc = useMemo(() => hasCloudNativeVpcConfiguration(resultParams), [resultParams]);
  const cloudProvider = resultParams?.cloud_provider || "";
  const privateConnectivityFlag =
    resultParams?.private_link ?? resultParams?.enable_private_connectivity ?? resultParams?.PrivateLink;
  const privateConnectivityEnabled =
    typeof privateConnectivityFlag === "boolean" ? privateConnectivityFlag : Boolean(privateConnectivityFlag);

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

  const isAccountConfigReady = Boolean(
    accountConfigStatus && READY_STATUSES.includes(accountConfigStatus.toUpperCase())
  );

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
      enabled: Boolean(accountConfigId && isAccountConfigReady),
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
        void queryClient.invalidateQueries({ queryKey: ["get", "/2022-09-01-00/resource-instance"] });
      },
    }
  );

  const allCloudNativeNetworks = useMemo(
    () => cloudNativeNetworksQuery.data?.cloudNativeNetworks || [],
    [cloudNativeNetworksQuery.data?.cloudNativeNetworks]
  );

  const bringOwnVpcsLocked = hasSelectedInstanceCloudNativeVpc || allCloudNativeNetworks.length > 0;

  useEffect(() => {
    if (!bringOwnVpcsLocked) return;
    setVpcValues((previous) => (previous.bringOwnVpcs ? previous : { ...previous, bringOwnVpcs: true }));
  }, [bringOwnVpcsLocked]);

  const networkRegions = useMemo(() => getCloudNativeNetworkRegions(allCloudNativeNetworks), [allCloudNativeNetworks]);

  useEffect(() => {
    if (networkRegions.length === 0) return;
    setVpcValues((previous) => {
      const selectedRegions = getDefaultSelectedRegions(networkRegions);
      if (previous.selectedRegions.join("|") === selectedRegions.join("|")) return previous;
      return { ...previous, bringOwnVpcs: true, selectedRegions, selectedVpcIds: [] };
    });
  }, [networkRegions]);

  useEffect(() => {
    if (accountConfigId && isAccountConfigReady && vpcValues.selectedRegions.length > 0) {
      void cloudNativeNetworksQuery.refetch();
      void queryClient.invalidateQueries({ queryKey: ["get", "/2022-09-01-00/resource-instance"] });
    }
  }, [accountConfigId, isAccountConfigReady, vpcValues.selectedRegions, cloudNativeNetworksQuery.refetch, queryClient]);

  // ─── Regions ──────────────────────────────────────────────────────────────
  const availableRegions = networkRegions;

  // ─── VPCs ─────────────────────────────────────────────────────────────────
  const availableVpcs = useMemo<VpcRecord[]>(() => {
    const filteredNetworks =
      vpcValues.selectedRegions.length > 0
        ? allCloudNativeNetworks.filter((network) => vpcValues.selectedRegions.includes(network.region))
        : allCloudNativeNetworks;

    return filteredNetworks.map((network) => {
      return {
        id: network.cloudNativeNetworkId || network.id,
        name: network.name || network.cloudNativeNetworkId || network.id,
        region: network.region,
        status: network.status || "PENDING",
        statusMessage: network.statusMessage,
        networkId: network.cloudNativeNetworkId,
        imported: network.imported,
        inUse: network.inUse,
      };
    });
  }, [allCloudNativeNetworks, vpcValues.selectedRegions]);

  const [lastSyncedAt, setLastSyncedAt] = useState("");
  useEffect(() => {
    if (!cloudNativeNetworksQuery.dataUpdatedAt) {
      setLastSyncedAt("");
      return;
    }

    const update = () => {
      const diff = Math.round((Date.now() - cloudNativeNetworksQuery.dataUpdatedAt) / 60000);
      setLastSyncedAt(diff < 1 ? "Just now" : `${diff} min ago`);
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [cloudNativeNetworksQuery.dataUpdatedAt]);

  const isLoadingVpcs = cloudNativeNetworksQuery.isFetching || syncCloudNativeNetworksMutation.isPending;

  const cloudNativeNetworksMutation = $api.useMutation(
    "post",
    "/2022-09-01-00/accountconfig/{id}/cloud-native-networks/import",
    {
      onSuccess: () => {
        void cloudNativeNetworksQuery.refetch();
        void queryClient.invalidateQueries({ queryKey: ["get", "/2022-09-01-00/resource-instance"] });
        setVpcValues((previous) => ({ ...previous, selectedVpcIds: [] }));
        snackbar.showSuccess("VPC configuration updated");
      },
      onError: () => snackbar.showError("Failed to update VPC configuration. Please try again."),
    }
  );

  const handleNetworkAction = (networkIds: string[], imported: boolean) => {
    if (!accountConfigId || networkIds.length === 0) return;
    cloudNativeNetworksMutation.mutate({
      params: { path: { id: accountConfigId } },
      body: {
        cloudNativeNetworks: networkIds.flatMap((cloudNativeNetworkId) => {
          const network = availableVpcs.find((vpc) => vpc.id === cloudNativeNetworkId);
          return network?.region ? [{ cloudNativeNetworkId, import: imported, region: network.region }] : [];
        }),
      },
    });
  };

  const handleResyncVpcs = () => {
    if (!accountConfigId) return;
    syncCloudNativeNetworksMutation.mutate({
      params: { path: { id: accountConfigId } },
      headers: { "x-ignore-global-error": "true" },
      body: {},
    });
  };

  const updateCloudAccountMutation = $api.useMutation(
    "patch",
    "/2022-09-01-00/resource-instance/{serviceProviderId}/{serviceKey}/{serviceAPIVersion}/{serviceEnvironmentKey}/{serviceModelKey}/{productTierKey}/{resourceKey}/{id}",
    {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ["get", "/2022-09-01-00/resource-instance"] });
        snackbar.showSuccess("VPC configuration updated");
        onClose();
      },
      onError: () => snackbar.showError("Failed to update VPC configuration. Please try again."),
    }
  );

  // ─── Polling for account config readiness ─────────────────────────────────
  const fetchInstanceDetails = useCallback(async () => {
    const resource = offering?.resourceParameters?.find((r) => r.resourceId.startsWith("r-injectedaccountconfig"));
    if (!resource || !offering) return;
    return getResourceInstanceDetails(
      offering.serviceProviderId,
      offering.serviceURLKey,
      offering.serviceAPIVersion,
      offering.serviceEnvironmentURLKey,
      offering.serviceModelURLKey,
      offering.productTierURLKey,
      resource.urlKey,
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
    const privateConnectivityFlag = resultParams?.private_link;
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
                <Chip label="Disabled" fontColor="#667085" bgColor="#F2F4F7" borderColor="#D0D5DD" />
              ),
            },
          ]
        : []),
    ];

    const sections: SummarySection[] = [{ title: "Standard Information", items: standardItems }];

    const vpcItems = [
      {
        label: "Creating new VPCs",
        value: (
          <Chip
            label={vpcValues.enableNewVpcs ? "Enabled" : "Disabled"}
            fontColor={vpcValues.enableNewVpcs ? "#067647" : "#667085"}
            bgColor={vpcValues.enableNewVpcs ? "#ECFDF3" : "#F2F4F7"}
            borderColor={vpcValues.enableNewVpcs ? "#ABEFC6" : "#D0D5DD"}
          />
        ),
      },
      {
        label: "Enable existing VPCs",
        value: (
          <Chip
            label={vpcValues.bringOwnVpcs ? "Enabled" : "Disabled"}
            fontColor={vpcValues.bringOwnVpcs ? "#067647" : "#667085"}
            bgColor={vpcValues.bringOwnVpcs ? "#ECFDF3" : "#F2F4F7"}
            borderColor={vpcValues.bringOwnVpcs ? "#ABEFC6" : "#D0D5DD"}
          />
        ),
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
    if (!offering || !selectedInstance.id) return;

    const resource = offering.resourceParameters.find((item) => item.resourceId.startsWith("r-injectedaccountconfig"));
    if (!resource) {
      snackbar.showError("Account configuration resource not found.");
      return;
    }

    updateCloudAccountMutation.mutate({
      params: {
        path: {
          serviceProviderId: offering.serviceProviderId,
          serviceKey: offering.serviceURLKey,
          serviceAPIVersion: offering.serviceAPIVersion,
          serviceEnvironmentKey: offering.serviceEnvironmentURLKey,
          serviceModelKey: offering.serviceModelURLKey,
          productTierKey: offering.productTierURLKey,
          resourceKey: resource.urlKey,
          id: selectedInstance.id,
        },
        query: { subscriptionId: selectedInstance.subscriptionId as string },
      },
      body: {
        requestParams: {
          allow_new_cloud_native_network_creation: vpcValues.enableNewVpcs,
        },
      },
    });
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
            privateConnectivityEnabled={privateConnectivityEnabled}
            bringOwnVpcsLocked={bringOwnVpcsLocked}
            onImport={(ids) => handleNetworkAction(ids, true)}
            onUnimport={(ids) => handleNetworkAction(ids, false)}
            isImporting={cloudNativeNetworksMutation.isPending}
            emptyStateMessage={
              cloudNativeNetworksQuery.isError
                ? "Unable to load VPCs from the account configuration. Click Resync to try again."
                : availableRegions.length === 0
                  ? "No cloud-native VPCs were returned for this account configuration. Click Resync to discover them."
                  : "No VPCs found for the selected regions. Click Resync to fetch."
            }
          />
        </div>

        <div className="col-span-2">
          <CloudAccountSummaryCard
            sections={summarySections}
            onDoItLater={onClose}
            onNext={handleUpdate}
            nextLabel="Update"
            isNextLoading={updateCloudAccountMutation.isPending}
            isNextDisabled={updateCloudAccountMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
};

export default ModifyVPCsDrawer;

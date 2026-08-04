"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef } from "react";

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

import useCloudNativeNetworks from "../hooks/useCloudNativeNetworks";
import { hasCloudNativeVpcConfiguration } from "../utils";

import CloudAccountSummaryCard, { SummarySection } from "./CloudAccountSummaryCard";
import ConfigureVPCsStep from "./steps/ConfigureVPCsStep";

const READY_STATUSES = ["READY", "RUNNING", "COMPLETE"];
const TERMINAL_STATUSES = [...READY_STATUSES, "FAILED"];
const POLL_INTERVAL_MS = 5_000;
const POLL_MAX_DURATION_MS = 2 * 60 * 1000;

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

  // ─── Cloud native networks ────────────────────────────────────────────────
  const {
    vpcValues,
    setVpcValues,
    availableRegions,
    availableVpcs,
    isLoadingVpcs,
    isImporting,
    lastSyncedAt,
    bringOwnVpcsLocked,
    emptyStateMessage,
    handleResync,
    handleImport,
    handleUnimport,
  } = useCloudNativeNetworks({
    accountConfigId,
    isAccountConfigReady,
    hasExistingCloudNativeVpc: hasSelectedInstanceCloudNativeVpc,
    contextKey: selectedInstance.id as string,
  });

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
  // Depend on the instance id/subscription rather than the instance object: the object gets a
  // fresh identity on every list refetch, which would restart the poll and defeat its backoff.
  const instanceId = selectedInstance.id;
  const instanceSubscriptionId = selectedInstance.subscriptionId;

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
      instanceId,
      instanceSubscriptionId
    );
  }, [instanceId, instanceSubscriptionId, offering]);

  useEffect(() => {
    if (!vpcValues.bringOwnVpcs || !instanceId || (accountConfigId && isAccountConfigReady)) return;

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout>;
    const startedAt = Date.now();

    const poll = async () => {
      try {
        const response = await fetchInstanceDetails();
        if (cancelled) return;

        const ri = response?.data;
        const refreshedParams = getResultParams(ri);
        const status = String(refreshedParams.account_config_status || ri?.status || "").toUpperCase();

        if (TERMINAL_STATUSES.includes(status)) {
          // Refresh the instances list once we're done so derived data picks up the new status
          void queryClient.invalidateQueries({
            queryKey: ["get", "/2022-09-01-00/resource-instance", { params: { query: { environmentType } } }],
          });
          return;
        }
      } catch {
        if (!cancelled && !hasShownRefreshError.current) {
          hasShownRefreshError.current = true;
          snackbar.showError("Unable to refresh account configuration. Please try again.");
        }
      }

      if (!cancelled && Date.now() - startedAt < POLL_MAX_DURATION_MS) {
        retryTimer = setTimeout(poll, POLL_INTERVAL_MS);
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
    instanceId,
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
            onResync={handleResync}
            lastSyncedAt={lastSyncedAt}
            cloudProvider={cloudProvider}
            privateConnectivityEnabled={privateConnectivityEnabled}
            bringOwnVpcsLocked={bringOwnVpcsLocked}
            onImport={handleImport}
            onUnimport={handleUnimport}
            isImporting={isImporting}
            emptyStateMessage={emptyStateMessage}
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

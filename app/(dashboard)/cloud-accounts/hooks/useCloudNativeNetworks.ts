"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from "react";

import { $api } from "src/api/query";
import useSnackbar from "src/hooks/useSnackbar";

import type { ConfigureVPCsFormValues, VpcRecord } from "../components/steps/ConfigureVPCsStep";
import { getCloudNativeNetworkRegions } from "../utils";

const RESOURCE_INSTANCE_QUERY_KEY = ["get", "/2022-09-01-00/resource-instance"];

type UseCloudNativeNetworksParams = {
  /** Account config the VPCs belong to. The query stays idle until this is known and ready. */
  accountConfigId?: string;
  isAccountConfigReady: boolean;
  /** True when the instance already has cloud-native VPCs — locks "bring your own VPCs" on. */
  hasExistingCloudNativeVpc: boolean;
  /** Changing this clears the current selection and re-hydrates regions from the API. */
  contextKey: string;
  /** Extra gate on top of accountConfigId/readiness — the wizard only fetches on its VPC step. */
  enabled?: boolean;
  /** Kick off a sync the first time the list comes back empty. Wizard-only behaviour. */
  autoSyncWhenEmpty?: boolean;
};

export type UseCloudNativeNetworksResult = {
  vpcValues: ConfigureVPCsFormValues;
  setVpcValues: Dispatch<SetStateAction<ConfigureVPCsFormValues>>;
  availableRegions: string[];
  availableVpcs: VpcRecord[];
  isLoadingVpcs: boolean;
  isImporting: boolean;
  lastSyncedAt: string;
  bringOwnVpcsLocked: boolean;
  emptyStateMessage: string;
  handleResync: () => void;
  handleImport: (vpcIds: string[]) => void;
  handleUnimport: (vpcIds: string[]) => void;
};

/**
 * Shared cloud-native VPC state for the cloud-account wizard's "Configure VPCs" step and the
 * standalone "Modify VPCs" drawer: list + sync + import/unimport, region hydration, and the
 * "last synced" ticker. Both surfaces render the same ConfigureVPCsStep, so they need the
 * same behaviour — keeping it here stops them drifting.
 */
const useCloudNativeNetworks = ({
  accountConfigId,
  isAccountConfigReady,
  hasExistingCloudNativeVpc,
  contextKey,
  enabled = true,
  autoSyncWhenEmpty = false,
}: UseCloudNativeNetworksParams): UseCloudNativeNetworksResult => {
  const queryClient = useQueryClient();
  const snackbar = useSnackbar();

  const [vpcValues, setVpcValues] = useState<ConfigureVPCsFormValues>({
    enableNewVpcs: true,
    bringOwnVpcs: false,
    selectedRegions: [],
    selectedVpcIds: [],
  });

  const previousContextKey = useRef(contextKey);
  const hasHydratedRegions = useRef(false);

  useEffect(() => {
    if (previousContextKey.current === contextKey) return;

    previousContextKey.current = contextKey;
    hasHydratedRegions.current = false;
    setVpcValues((previous) => ({ ...previous, selectedRegions: [], selectedVpcIds: [] }));
  }, [contextKey]);

  const networksQuery = $api.useQuery(
    "get",
    "/2022-09-01-00/accountconfig/{id}/cloud-native-networks",
    {
      params: { path: { id: accountConfigId || "" } },
      headers: { "x-ignore-global-error": true },
    },
    {
      enabled: Boolean(enabled && accountConfigId && isAccountConfigReady),
      retry: 2,
      retryDelay: 3000,
    }
  );

  const syncMutation = $api.useMutation("post", "/2022-09-01-00/accountconfig/{id}/cloud-native-networks/sync", {
    onSuccess: () => {
      void networksQuery.refetch();
      void queryClient.invalidateQueries({ queryKey: RESOURCE_INSTANCE_QUERY_KEY });
    },
  });

  const importMutation = $api.useMutation("post", "/2022-09-01-00/accountconfig/{id}/cloud-native-networks/import", {
    onSuccess: () => {
      void networksQuery.refetch();
      void queryClient.invalidateQueries({ queryKey: RESOURCE_INSTANCE_QUERY_KEY });
      setVpcValues((previous) => ({ ...previous, selectedVpcIds: [] }));
      snackbar.showSuccess("VPC configuration updated");
    },
    onError: () => snackbar.showError("Failed to update VPC configuration. Please try again."),
  });

  const allNetworks = useMemo(
    () => networksQuery.data?.cloudNativeNetworks || [],
    [networksQuery.data?.cloudNativeNetworks]
  );

  const availableRegions = useMemo(() => getCloudNativeNetworkRegions(allNetworks), [allNetworks]);

  const bringOwnVpcsLocked = hasExistingCloudNativeVpc || allNetworks.length > 0;

  useEffect(() => {
    if (!networksQuery.isSuccess || availableRegions.length === 0) return;
    if (hasHydratedRegions.current) return;

    hasHydratedRegions.current = true;
    setVpcValues((previous) => ({
      ...previous,
      bringOwnVpcs: true,
      selectedRegions: availableRegions,
      selectedVpcIds: [],
    }));
  }, [networksQuery.isSuccess, availableRegions]);

  useEffect(() => {
    if (!bringOwnVpcsLocked) return;
    setVpcValues((previous) => (previous.bringOwnVpcs ? previous : { ...previous, bringOwnVpcs: true }));
  }, [bringOwnVpcsLocked]);

  useEffect(() => {
    if (accountConfigId && isAccountConfigReady && vpcValues.selectedRegions.length > 0) {
      void networksQuery.refetch();
      void queryClient.invalidateQueries({ queryKey: RESOURCE_INSTANCE_QUERY_KEY });
    }
  }, [accountConfigId, isAccountConfigReady, vpcValues.selectedRegions, networksQuery.refetch, queryClient]);

  const availableVpcs = useMemo<VpcRecord[]>(() => {
    const filtered =
      vpcValues.selectedRegions.length > 0
        ? allNetworks.filter((network) => vpcValues.selectedRegions.includes(network.region))
        : allNetworks;

    return filtered.map((network) => ({
      id: network.cloudNativeNetworkId || network.id,
      name: network.name || network.cloudNativeNetworkId || network.id,
      region: network.region,
      status: network.status || "PENDING",
      statusMessage: network.statusMessage,
      networkId: network.cloudNativeNetworkId,
      imported: network.imported,
      inUse: network.inUse,
    }));
  }, [allNetworks, vpcValues.selectedRegions]);

  const [lastSyncedAt, setLastSyncedAt] = useState("");
  useEffect(() => {
    if (!networksQuery.dataUpdatedAt) {
      setLastSyncedAt("");
      return;
    }

    const update = () => {
      const diff = Math.round((Date.now() - networksQuery.dataUpdatedAt) / 60000);
      setLastSyncedAt(diff < 1 ? "Just now" : `${diff} min ago`);
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [networksQuery.dataUpdatedAt]);

  const isLoadingVpcs = networksQuery.isFetching || syncMutation.isPending;

  const hasSyncedOnEmpty = useRef(false);
  useEffect(() => {
    if (!autoSyncWhenEmpty) return;

    if (
      enabled &&
      vpcValues.bringOwnVpcs &&
      accountConfigId &&
      isAccountConfigReady &&
      !networksQuery.isFetching &&
      networksQuery.isSuccess &&
      allNetworks.length === 0 &&
      !syncMutation.isPending &&
      !hasSyncedOnEmpty.current
    ) {
      hasSyncedOnEmpty.current = true;
      syncMutation.mutate({
        params: { path: { id: accountConfigId } },
        headers: { "x-ignore-global-error": "true" },
        body: {},
      });
    }

    // Reset flag when bringOwnVpcs is toggled off or the account changes
    if (!vpcValues.bringOwnVpcs || !accountConfigId) {
      hasSyncedOnEmpty.current = false;
    }
  }, [
    autoSyncWhenEmpty,
    enabled,
    vpcValues.bringOwnVpcs,
    accountConfigId,
    isAccountConfigReady,
    networksQuery.isFetching,
    networksQuery.isSuccess,
    allNetworks.length,
    syncMutation,
  ]);

  const handleResync = () => {
    if (!accountConfigId) return;
    syncMutation.mutate({
      params: { path: { id: accountConfigId } },
      headers: { "x-ignore-global-error": "true" },
      body: {},
    });
  };

  const mutateImport = (vpcIds: string[], shouldImport: boolean) => {
    if (!accountConfigId || vpcIds.length === 0) return;
    importMutation.mutate({
      params: { path: { id: accountConfigId } },
      body: {
        cloudNativeNetworks: vpcIds.flatMap((cloudNativeNetworkId) => {
          const network = availableVpcs.find((vpc) => vpc.id === cloudNativeNetworkId);
          return network?.region ? [{ cloudNativeNetworkId, import: shouldImport, region: network.region }] : [];
        }),
      },
    });
  };

  const emptyStateMessage = networksQuery.isError
    ? "Unable to load VPCs from the account configuration. Click Resync to try again."
    : availableRegions.length === 0
      ? "No cloud-native VPCs were returned for this account configuration. Click Resync to discover them."
      : "No VPCs found for the selected regions. Click Resync to fetch.";

  return {
    vpcValues,
    setVpcValues,
    availableRegions,
    availableVpcs,
    isLoadingVpcs,
    isImporting: importMutation.isPending,
    lastSyncedAt,
    bringOwnVpcsLocked,
    emptyStateMessage,
    handleResync,
    handleImport: (vpcIds) => mutateImport(vpcIds, true),
    handleUnimport: (vpcIds) => mutateImport(vpcIds, false),
  };
};

export default useCloudNativeNetworks;

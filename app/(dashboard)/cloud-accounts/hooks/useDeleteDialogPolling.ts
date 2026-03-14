import { useCallback, useMemo } from "react";

import { apiClient } from "src/api/client";
import axios from "src/axios";
import { AccountConfig } from "src/types/account-config";
import { ResourceInstance } from "src/types/resourceInstance";

type InstanceDescribeParams = {
  serviceProviderId?: string;
  serviceURLKey?: string;
  serviceAPIVersion?: string;
  serviceEnvironmentURLKey?: string;
  serviceModelURLKey?: string;
  productTierURLKey?: string;
  resourceUrlKey?: string;
  instanceId?: string;
  subscriptionId?: string;
};

/**
 * Hook that provides API fetch functions for the delete dialog polling.
 * Both calls suppress global error snackbar (ignoreGlobalErrorSnack / x-ignore-global-error).
 *
 * This hook only provides the fetch functions — polling logic lives in the page component.
 */
const useDeleteDialogPolling = (
  instanceParams: InstanceDescribeParams,
  accountConfigId?: string
) => {
  const {
    serviceProviderId,
    serviceURLKey,
    serviceAPIVersion,
    serviceEnvironmentURLKey,
    serviceModelURLKey,
    productTierURLKey,
    resourceUrlKey,
    instanceId,
    subscriptionId,
  } = instanceParams;

  const canFetchInstance = Boolean(
    serviceProviderId && serviceURLKey && resourceUrlKey && instanceId && subscriptionId
  );

  /** Fetch instance describe. Returns instance data or throws on error. */
  const fetchInstanceDetails = useCallback(async (): Promise<ResourceInstance | null> => {
    if (!canFetchInstance) return null;

    const queryParams: Record<string, string> = {};
    if (subscriptionId) {
      queryParams.subscriptionId = subscriptionId;
    }

    const response = await axios.get(
      `/resource-instance/${serviceProviderId}/${serviceURLKey}/${serviceAPIVersion}/${serviceEnvironmentURLKey}/${serviceModelURLKey}/${productTierURLKey}/${resourceUrlKey}/${instanceId}`,
      {
        params: queryParams,
        ignoreGlobalErrorSnack: true,
      }
    );
    return response.data as ResourceInstance;
  }, [
    canFetchInstance,
    serviceProviderId,
    serviceURLKey,
    serviceAPIVersion,
    serviceEnvironmentURLKey,
    serviceModelURLKey,
    productTierURLKey,
    resourceUrlKey,
    instanceId,
    subscriptionId,
  ]);

  const canFetchAccountConfig = Boolean(accountConfigId);

  /** Fetch account config by ID. Returns account config data or throws on error. */
  const fetchAccountConfig = useCallback(async (): Promise<AccountConfig | null> => {
    if (!canFetchAccountConfig || !accountConfigId) return null;

    const response = await apiClient.GET("/2022-09-01-00/accountconfig/{id}", {
      params: { path: { id: accountConfigId } },
      headers: {
        "x-ignore-global-error": true,
      },
    });

    if (response.error) {
      // Throw an error with the HTTP status so callers can detect 404 etc.
      const err = Object.assign(new Error("Failed to fetch account config"), { status: response.response.status });
      throw err;
    }
    return response.data as AccountConfig;
  }, [canFetchAccountConfig, accountConfigId]);

  return useMemo(
    () => ({
      fetchInstanceDetails,
      fetchAccountConfig,
      canFetchInstance,
      canFetchAccountConfig,
    }),
    [fetchInstanceDetails, fetchAccountConfig, canFetchInstance, canFetchAccountConfig]
  );
};

export default useDeleteDialogPolling;

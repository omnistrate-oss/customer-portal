import { FC, useCallback, useMemo } from "react";

import DataGridFilter from "src/components/DataGridFilter/DataGridFilter";
import { FilterConfig } from "src/components/DataGridFilter/types";
import { deriveOptionsFromData } from "src/components/DataGridFilter/utils";
import { cloudProviderLabels } from "src/constants/cloudProviders";
import { getResourceInstanceStatusStylesAndLabel } from "src/constants/statusChipStyles/resourceInstanceStatus";
import { AccountConfig } from "src/types/account-config";
import { SetState } from "src/types/common/reactGenerics";
import { ResourceInstance } from "src/types/resourceInstance";
import { Subscription } from "src/types/subscription";
import formatDateUTC from "src/utils/formatDateUTC";
import { getResultParams } from "src/utils/instance";

import { getCloudAccountId, getCloudAccountProvider, getExistingVpcCount } from "../utils";

type CloudAccountsFiltersProps = {
  instances: ResourceInstance[];
  setFilteredInstances: SetState<ResourceInstance[]>;
  subscriptionsObj: Record<string, Subscription>;
  accountConfigsHash: Record<string, AccountConfig>;
};

const getLifecycleStatusLabel = (
  instance: ResourceInstance,
  accountConfigsHash: Record<string, AccountConfig>
): string => {
  const status = instance.status ?? "";
  const accountConfigId = getResultParams(instance)?.cloud_provider_account_config_id;
  const linkedAccountConfig = accountConfigsHash[accountConfigId];

  if (status === "DELETING" && linkedAccountConfig?.status === "READY_TO_OFFBOARD") {
    return "Ready to Offboard";
  }

  if (status === "DELETING" && !linkedAccountConfig) {
    return "Offboarding";
  }

  return getResourceInstanceStatusStylesAndLabel(status)?.label ?? status;
};

const CloudAccountsFilters: FC<CloudAccountsFiltersProps> = ({
  instances,
  setFilteredInstances,
  subscriptionsObj,
  accountConfigsHash,
}) => {
  const filterConfig: FilterConfig<ResourceInstance> = useMemo(
    () => ({
      status: {
        leftMenuLabel: "Lifecycle Status",
        filterType: "multi-select",
        accessor: (instance) => getLifecycleStatusLabel(instance, accountConfigsHash),
        options: deriveOptionsFromData(instances, (instance) => getLifecycleStatusLabel(instance, accountConfigsHash)),
      },
      "cloud-provider": {
        leftMenuLabel: "Cloud Provider",
        filterType: "multi-select",
        accessor: (instance) => getCloudAccountProvider(getResultParams(instance)),
        options: deriveOptionsFromData(
          instances,
          (instance) => getCloudAccountProvider(getResultParams(instance)) ?? "",
          (provider) => cloudProviderLabels[provider as keyof typeof cloudProviderLabels] ?? provider
        ),
      },
      "product-name": {
        leftMenuLabel: "Product Name",
        filterType: "multi-select",
        accessor: (instance) => subscriptionsObj[instance.subscriptionId as string]?.serviceName,
        options: deriveOptionsFromData(
          instances,
          (instance) => subscriptionsObj[instance.subscriptionId as string]?.serviceName ?? ""
        ),
      },
      "subscription-plan": {
        leftMenuLabel: "Subscription Plan",
        filterType: "multi-select",
        accessor: (instance) => subscriptionsObj[instance.subscriptionId as string]?.productTierName,
        options: deriveOptionsFromData(
          instances,
          (instance) => subscriptionsObj[instance.subscriptionId as string]?.productTierName ?? ""
        ),
      },
      "subscription-owner": {
        leftMenuLabel: "Subscription Owner",
        filterType: "multi-select",
        accessor: (instance) => subscriptionsObj[instance.subscriptionId as string]?.subscriptionOwnerName,
        options: deriveOptionsFromData(
          instances,
          (instance) => subscriptionsObj[instance.subscriptionId as string]?.subscriptionOwnerName ?? ""
        ),
      },
      "created-on": {
        leftMenuLabel: "Created On",
        filterType: "date-range",
        accessor: (instance) => instance.created_at,
      },
    }),
    [accountConfigsHash, instances, subscriptionsObj]
  );

  const getSearchableText = useCallback(
    (instance: ResourceInstance) => {
      const resultParams = getResultParams(instance);
      const subscription = subscriptionsObj[instance.subscriptionId as string];
      const provider = getCloudAccountProvider(resultParams);
      const existingVpcCount = getExistingVpcCount(instance);
      const allowNewVpcs =
        resultParams?.cluster_name || resultParams?.allow_new_cloud_native_network_creation == null
          ? ""
          : resultParams.allow_new_cloud_native_network_creation
            ? "Yes"
            : "No";
      const privateLink =
        resultParams?.private_link == null || resultParams?.cluster_name || resultParams?.nebius_tenant_id
          ? ""
          : resultParams.private_link
            ? "Enabled"
            : "Disabled";
      const existingVpcs =
        !resultParams?.cloud_provider_account_config_id || resultParams?.cluster_name
          ? ""
          : existingVpcCount == null
            ? "Not configured"
            : `${existingVpcCount} ${existingVpcCount === 1 ? "VPC" : "VPCs"}`;

      return [
        getCloudAccountId(resultParams),
        getLifecycleStatusLabel(instance, accountConfigsHash),
        allowNewVpcs,
        existingVpcs,
        privateLink,
        subscription?.subscriptionOwnerName,
        formatDateUTC(instance.created_at),
        subscription?.productTierName,
        subscription?.serviceName,
        provider,
        provider ? cloudProviderLabels[provider] : "",
      ].join(" ");
    },
    [accountConfigsHash, subscriptionsObj]
  );

  return (
    <DataGridFilter
      data={instances}
      setFilteredData={setFilteredInstances}
      filterConfig={filterConfig}
      getSearchableText={getSearchableText}
    />
  );
};

export default CloudAccountsFilters;

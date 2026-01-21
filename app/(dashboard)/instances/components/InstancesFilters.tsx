import { useMemo } from "react";

import DataGridFilter from "src/components/DataGridFilter/DataGridFilter";
import { FilterConfig, KeyConfig } from "src/components/DataGridFilter/types";
import { deriveOptionsFromData } from "src/components/DataGridFilter/utils";
import { getInstanceHealthStatus } from "src/components/InstanceHealthStatusChip/InstanceHealthStatusChip";
import { cloudProviderLabelsShort } from "src/constants/cloudProviders";
import { instaceHealthStatusMap } from "src/constants/statusChipStyles/resourceInstanceHealthStatus";
import { resourceInstanceStatusMap } from "src/constants/statusChipStyles/resourceInstanceStatus";
import { useGlobalData } from "src/providers/GlobalDataProvider";
import { SetState } from "src/types/common/reactGenerics";
import { ResourceInstance, ResourceInstanceNetworkTopology } from "src/types/resourceInstance";

import { loadStatusLabel, loadStatusMap } from "../constants";

type InstancesFiltersProps = {
  instances: ResourceInstance[];
  setFilteredInstances: SetState<ResourceInstance[]>;
};

const InstancesFilters: React.FC<InstancesFiltersProps> = ({ instances, setFilteredInstances }) => {
  const { subscriptionsObj } = useGlobalData();

  const customTagKeys = useMemo<KeyConfig[]>(() => {
    const customTagsMap = new Map<string, Set<string>>();

    instances?.forEach((instance) => {
      const customTags = instance?.customTags;
      customTags?.forEach((tag) => {
        if (tag?.key && tag?.value) {
          if (!customTagsMap.has(tag.key)) {
            customTagsMap.set(tag.key, new Set());
          }
          customTagsMap.get(tag.key)?.add(tag.value);
        }
      });
    });

    return Array.from(customTagsMap.entries()).map(([key, values]) => ({
      key,
      label: key,
      possibleValues: Array.from(values).map((value) => ({ label: value, value })),
    }));
  }, [instances]);

  const filterConfig: FilterConfig<ResourceInstance> = useMemo(
    () => ({
      "product-name": {
        leftMenuLabel: "Product Name",
        filterType: "multi-select",
        options: deriveOptionsFromData(instances, (instance) => {
          const subscription = subscriptionsObj[instance.subscriptionId as string];
          return subscription?.serviceName || "";
        }),
        customFilter: (item, selectedValues) => {
          if (selectedValues.length === 0) return true;
          const subscription = subscriptionsObj[item.subscriptionId as string];
          const serviceName = subscription?.serviceName;
          return serviceName ? selectedValues.includes(serviceName) : false;
        },
      },
      "subscription-plan": {
        leftMenuLabel: "Subscription Plan",
        filterType: "multi-select",
        options: deriveOptionsFromData(instances, (instance) => {
          const subscription = subscriptionsObj[instance.subscriptionId as string];
          return subscription?.productTierName || "";
        }),
        customFilter: (item, selectedValues) => {
          if (selectedValues.length === 0) return true;
          const subscription = subscriptionsObj[item.subscriptionId as string];
          const productTierName = subscription?.productTierName;
          return productTierName ? selectedValues.includes(productTierName) : false;
        },
      },
      "resource-name": {
        leftMenuLabel: "Resource Name",
        filterType: "multi-select",
        options: deriveOptionsFromData(instances, (instance) => {
          const detailedNetworkTopology = instance?.detailedNetworkTopology;
          const [, mainResource] =
            Object.entries(detailedNetworkTopology || {}).find(([, resource]: any) => resource.main) || [];
          return (mainResource as any)?.resourceName || "";
        }),
        customFilter: (item, selectedValues) => {
          if (selectedValues.length === 0) return true;
          const detailedNetworkTopology = item?.detailedNetworkTopology;
          const [, mainResource] =
            Object.entries(detailedNetworkTopology || {}).find(([, resource]: any) => resource.main) || [];
          const resourceName = (mainResource as any)?.resourceName;
          return resourceName ? selectedValues.includes(resourceName) : false;
        },
      },
      "cloud-provider": {
        leftMenuLabel: "Cloud Provider",
        filterType: "multi-select",
        accessor: (instance) => String(instance.cloud_provider || ""),
        options: deriveOptionsFromData(instances, (instance) => String(instance.cloud_provider || "")),
      },
      region: {
        leftMenuLabel: "Region",
        filterType: "multi-select",
        accessor: (instance) => instance.region,
        options: (() => {
          const regionToCloudProvider = instances.reduce(
            (acc, instance) => {
              const region = instance.region;
              if (!region) {
                return acc;
              }
              // Only set the cloud provider for a region once
              if (acc[region] === undefined) {
                acc[region] = instance.cloud_provider;
              }
              return acc;
            },
            {} as Record<string, ResourceInstance["cloud_provider"] | undefined>
          );

          return deriveOptionsFromData(
            instances,
            (instance) => instance.region || "",
            (value) => {
              // Append Cloud Provider to Region
              const cloudProvider = regionToCloudProvider[value] || "Unknown";
              return `${cloudProviderLabelsShort[cloudProvider] || cloudProvider} - ${value}`;
            }
          );
        })(),
      },
      "subscription-owner": {
        leftMenuLabel: "Subscription Owner",
        filterType: "multi-select",
        options: deriveOptionsFromData(instances, (instance) => {
          const subscription = subscriptionsObj[instance.subscriptionId as string];
          return subscription?.subscriptionOwnerName || "";
        }),
        customFilter: (item, selectedValues) => {
          if (selectedValues.length === 0) return true;
          const subscription = subscriptionsObj[item.subscriptionId as string];
          const ownerName = subscription?.subscriptionOwnerName;
          return ownerName ? selectedValues.includes(ownerName) : false;
        },
      },
      tags: {
        leftMenuLabel: "Tags",
        filterType: "key-value",
        keys: customTagKeys,
        customFilter: (item, selectedValues) => {
          if (selectedValues.length === 0) return true;

          const instanceTags = item.customTags;
          if (!instanceTags?.length) return false;

          return selectedValues.some((kv) => {
            const separatorIndex = kv.indexOf(":");
            if (separatorIndex === -1) return false;

            const key = kv.slice(0, separatorIndex);
            const value = kv.slice(separatorIndex + 1);

            return instanceTags.some((tag) => tag?.key === key && tag?.value === value);
          });
        },
      },
      "lifecycle-status": {
        leftMenuLabel: "Lifecycle Status",
        filterType: "multi-select",
        accessor: (instance) => instance.status,
        options: deriveOptionsFromData(
          instances,
          (instance) => instance.status || "",
          (value) => resourceInstanceStatusMap[value]?.label || value
        ),
      },
      "health-status": {
        leftMenuLabel: "Health Status",
        filterType: "multi-select",
        options: deriveOptionsFromData(
          instances,
          (instance) => {
            const status = instance.status;
            const detailedNetworkTopology = instance?.detailedNetworkTopology ?? {};
            return getInstanceHealthStatus(
              detailedNetworkTopology as Record<string, ResourceInstanceNetworkTopology>,
              status as string
            );
          },
          (value) => instaceHealthStatusMap[value]?.label || value
        ),
        customFilter: (item, selectedValues) => {
          if (selectedValues.length === 0) return true;
          const status = item.status;
          const detailedNetworkTopology = item?.detailedNetworkTopology ?? {};
          const healthStatus = getInstanceHealthStatus(
            detailedNetworkTopology as Record<string, ResourceInstanceNetworkTopology>,
            status as string
          );
          return healthStatus ? selectedValues.includes(healthStatus) : false;
        },
      },
      load: {
        leftMenuLabel: "Load",
        filterType: "multi-select",
        options: deriveOptionsFromData(
          instances,
          (instance) => loadStatusMap[instance?.instanceLoadStatus || ""] || "Unknown",
          (value) => loadStatusLabel[value] || value
        ),
        customFilter: (item, selectedValues) => {
          if (selectedValues.length === 0) return true;
          const load = loadStatusMap[item?.instanceLoadStatus || ""] || "Unknown";
          return selectedValues.includes(load);
        },
      },
      "created-on": {
        leftMenuLabel: "Created On",
        filterType: "date-range",
        accessor: (instance) => instance.created_at,
      },
    }),
    [instances, customTagKeys, subscriptionsObj]
  );

  return <DataGridFilter data={instances} setFilteredData={setFilteredInstances} filterConfig={filterConfig} />;
};

export default InstancesFilters;

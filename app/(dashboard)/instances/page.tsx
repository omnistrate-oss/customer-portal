"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Stack } from "@mui/material";
import { createColumnHelper } from "@tanstack/react-table";

import LoadIndicatorHigh from "src/components/Icons/LoadIndicator/LoadIndicatorHigh";
import LoadIndicatorIdle from "src/components/Icons/LoadIndicator/LoadIndicatorIdle";
import LoadIndicatorNormal from "src/components/Icons/LoadIndicator/LoadIndicatorNormal";
import InstanceHealthStatusChip, {
  getInstanceHealthStatus,
} from "src/components/InstanceHealthStatusChip/InstanceHealthStatusChip";
import InstanceLicenseStatusChip from "src/components/InstanceLicenseStatusChip/InstanceLicenseStatusChip";
import { BlackTooltip } from "src/components/Tooltip/Tooltip";
import { cloudProviderLongLogoMap } from "src/constants/cloudProviders";
import { getResourceInstanceStatusStylesAndLabel } from "src/constants/statusChipStyles/resourceInstanceStatus";
import { useGlobalData } from "src/providers/GlobalDataProvider";
import { ResourceInstance, ResourceInstanceNetworkTopology } from "src/types/resourceInstance";
import { isCloudAccountInstance } from "src/utils/access/byoaResource";
import formatDateUTC from "src/utils/formatDateUTC";
import { getInstanceDetailsRoute } from "src/utils/routes";
import DataGridText from "components/DataGrid/DataGridText";
import DataTable from "components/DataTable/DataTable";
import GridCellExpand from "components/GridCellExpand/GridCellExpand";
import RegionIcon from "components/Region/RegionIcon";
import ServiceNameWithLogo from "components/ServiceNameWithLogo/ServiceNameWithLogo";
import StatusChip from "components/StatusChip/StatusChip";

import PageContainer from "../components/Layout/PageContainer";

import CustomTagsCell from "./components/CustomTagsCell";
import InstanceDialogs from "./components/InstanceDialogs";
import InstancesOverview from "./components/InstancesOverview";
import InstancesTableHeader from "./components/InstancesTableHeader";
import StatusCell from "./components/StatusCell";
import useInstances from "./hooks/useInstances";
import { loadStatusMap } from "./constants";
import {
  FilterCategorySchema,
  getFilteredInstances,
  getInstanceFiltersObject,
  getIntialFiltersObject,
  getMainResourceFromInstance,
  getRowBorderStyles,
} from "./utils";

const columnHelper = createColumnHelper<ResourceInstance>();
export type Overlay =
  | "create-instance-form"
  | "modify-instance-form"
  | "delete-dialog"
  | "restore-dialog"
  | "upgrade-dialog"
  | "generate-token-dialog"
  | "reboot-dialog"
  | "stop-dialog"
  | "create-instance-dialog";

const InstancesPage = () => {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [overlayType, setOverlayType] = useState<Overlay>("create-instance-form");
  const [isOverlayOpen, setIsOverlayOpen] = useState<boolean>(false);

  const {
    subscriptionsObj,
    serviceOfferingsObj,
    isFetchingSubscriptions,
    isFetchingServiceOfferings,
    setShowGlobalProviderError,
  } = useGlobalData();

  const [selectedFilters, setSelectedFilters] =
    useState<Record<string, FilterCategorySchema>>(getIntialFiltersObject());

  const dataTableColumns = useMemo(() => {
    return [
      columnHelper.accessor("id", {
        id: "id",
        header: "Instance ID",
        cell: (data) => {
          const { id: instanceId, subscriptionId, resourceID } = data.row.original;
          const { serviceId, productTierId } = subscriptionsObj[subscriptionId as string] || {};

          const resourceInstanceUrlLink = getInstanceDetailsRoute({
            serviceId,
            servicePlanId: productTierId,
            resourceId: resourceID as string,
            instanceId: instanceId as string,
            subscriptionId: subscriptionId as string,
          });

          return (
            <DataGridText
              color="primary"
              showCopyButton
              linkProps={{
                href: resourceInstanceUrlLink,
              }}
              style={{
                fontWeight: 600,
              }}
            >
              {instanceId}
            </DataGridText>
          );
        },
        meta: {
          minWidth: 240,
        },
      }),

      columnHelper.accessor("customTags", {
        id: "Tags",
        header: "Tags",
        cell: (data) => {
          const tags = data.row.original.customTags;
          return <CustomTagsCell customTags={tags} />;
        },
        meta: {
          minWidth: 170,
        },
      }),
      columnHelper.accessor(
        (row) => {
          const subscription = subscriptionsObj[row.subscriptionId as string];
          return subscription?.serviceName;
        },
        {
          id: "serviceName",
          header: "Product Name",
          cell: (data) => {
            const subscription = subscriptionsObj[data.row.original.subscriptionId as string];
            const serviceName = subscription?.serviceName;
            const serviceLogoURL = subscription?.serviceLogoURL;

            return <ServiceNameWithLogo serviceName={serviceName} serviceLogoURL={serviceLogoURL} />;
          },
          meta: {
            minWidth: 230,
          },
        }
      ),
      columnHelper.accessor(
        (row) => {
          const subscription = subscriptionsObj[row.subscriptionId as string];
          const offering =
            serviceOfferingsObj[subscription?.serviceId as string]?.[subscription?.productTierId as string];

          const mainResource = getMainResourceFromInstance(row, offering);
          return mainResource?.name || "-";
        },
        {
          id: "resourceName",
          header: "Resource Name",
        }
      ),
      columnHelper.accessor(
        (row) => {
          const subscription = subscriptionsObj[row.subscriptionId as string];
          return subscription?.productTierName;
        },
        {
          id: "subscriptionPlan",
          header: "Subscription Plan",
        }
      ),
      columnHelper.accessor("status", {
        id: "status",
        header: "Lifecycle Status",
        cell: (data) => {
          const status = data.row.original.status;
          const statusSytlesAndLabel = getResourceInstanceStatusStylesAndLabel(status as string);

          return <StatusChip status={status} {...statusSytlesAndLabel} />;
        },
        meta: {
          minWidth: 170,
        },
      }),
      columnHelper.accessor(
        (row) => {
          const status = row.status;
          const detailedNetworkTopology = row?.detailedNetworkTopology ?? {};
          const healthStatus = getInstanceHealthStatus(
            detailedNetworkTopology as Record<string, ResourceInstanceNetworkTopology>,
            status as string
          );
          return healthStatus;
        },
        {
          id: "healthStatus",
          header: "Health Status",
          cell: (data) => {
            const value = data.cell.getValue();
            const { id: instanceId, subscriptionId, resourceID } = data.row.original;
            const { serviceId, productTierId } = subscriptionsObj[subscriptionId as string] || {};

            const resourceInstanceUrlLink = getInstanceDetailsRoute({
              serviceId,
              servicePlanId: productTierId,
              resourceId: resourceID as string,
              instanceId: instanceId as string,
              subscriptionId: subscriptionId as string,
              viewType: "Nodes",
            });

            return (
              <InstanceHealthStatusChip
                computedHealthStatus={value}
                detailedNetworkTopology={
                  (data.row.original?.detailedNetworkTopology ?? {}) as Record<string, ResourceInstanceNetworkTopology>
                }
                viewNodesLink={resourceInstanceUrlLink}
              />
            );
          },
          meta: {
            minWidth: 160,
            disableBrowserTooltip: true,
          },
        }
      ),
      columnHelper.accessor((row) => loadStatusMap[row.instanceLoadStatus || "UNKNOWN"] || "Unknown", {
        id: "instanceLoadStatus",
        header: "Load",
        cell: (data) => {
          const instanceLoadStatus = loadStatusMap[data.row.original.instanceLoadStatus || "UNKNOWN"] || "Unknown";

          return (
            <Stack direction="row" alignItems="center" gap="4px">
              {(instanceLoadStatus === "STOPPED" || instanceLoadStatus === "N/A") && (
                <StatusChip status="UNKNOWN" label="Unknown" />
              )}
              {instanceLoadStatus === "Unknown" && <Box>-</Box>}

              {instanceLoadStatus === "Low" && (
                <BlackTooltip title="Idle" placement="top">
                  <span style={{ display: "flex", alignItems: "center" }}>
                    <LoadIndicatorIdle />
                  </span>
                </BlackTooltip>
              )}
              {instanceLoadStatus === "Medium" && (
                <BlackTooltip title="Normal" placement="top">
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "-2px",
                    }}
                  >
                    <LoadIndicatorNormal />
                  </span>
                </BlackTooltip>
              )}
              {instanceLoadStatus === "High" && (
                <BlackTooltip title="High" placement="top">
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "-4px",
                    }}
                  >
                    <LoadIndicatorHigh />
                  </span>
                </BlackTooltip>
              )}
            </Stack>
          );
        },
        meta: {
          minWidth: 120,
          disableBrowserTooltip: true,
        },
      }),
      columnHelper.accessor("subscriptionLicense", {
        id: "subscriptionLicense",
        header: "License Status",
        cell: (data) => {
          const licenseDetails = data.cell.getValue();
          const licenseExpirationDate = licenseDetails?.expirationDate;

          return <InstanceLicenseStatusChip expirationDate={licenseExpirationDate} showExpirationDateTooltip={true} />;
        },
      }),

      columnHelper.accessor((row) => formatDateUTC(row.created_at), {
        id: "created_at",
        header: "Created On",
        cell: (data) => {
          return data.row.original.created_at ? formatDateUTC(data.row.original.created_at) : "-";
        },
        meta: {
          minWidth: 225,
        },
      }),
      columnHelper.accessor("cloud_provider", {
        id: "cloud_provider",
        header: "Cloud Provider",
        cell: (data) => {
          const cloudProvider = data.row.original.cloud_provider;

          return cloudProvider ? cloudProviderLongLogoMap[cloudProvider] : "-";
        },
        meta: {
          minWidth: 100,
        },
      }),

      columnHelper.accessor("region", {
        id: "region",
        header: "Region",
        cell: (data) => {
          return <GridCellExpand value={data.row.original.region || "Global"} startIcon={<RegionIcon />} />;
        },
      }),
      columnHelper.accessor(
        (row) => {
          const subscription = subscriptionsObj[row.subscriptionId as string];
          return subscription?.subscriptionOwnerName;
        },
        {
          id: "subscriptionOwner",
          header: "Subscription Owner",
        }
      ),
      columnHelper.accessor((row) => formatDateUTC(row.last_modified_at), {
        id: "last_modified_at",
        header: "Last Modified",
        cell: (data) => {
          return data.row.original.last_modified_at ? formatDateUTC(data.row.original.last_modified_at) : "-";
        },
        meta: {
          minWidth: 225,
        },
      }),
    ];
  }, [subscriptionsObj, serviceOfferingsObj]);

  const {
    data: instances = [],
    isPending: isLoadingInstances,
    isFetching: isFetchingInstances,
    refetch: refetchInstances,
    isError: isInstancesError,
  } = useInstances({ retry: 3 });

  useEffect(() => {
    if (isInstancesError) {
      setShowGlobalProviderError(true);
    }
  }, [isInstancesError, setShowGlobalProviderError]);

  // Filter BYOA Account Instances
  const nonBYOAInstances = useMemo(() => {
    return instances.filter((instance) => !isCloudAccountInstance(instance));
  }, [instances]);

  const filterOptionsMap = useMemo(
    () => getInstanceFiltersObject(nonBYOAInstances, subscriptionsObj),
    [nonBYOAInstances, subscriptionsObj]
  );

  const filteredInstances = useMemo(
    () => getFilteredInstances(nonBYOAInstances, selectedFilters, subscriptionsObj),
    [nonBYOAInstances, selectedFilters, subscriptionsObj]
  );
  const failedInstances = useMemo(() => {
    return nonBYOAInstances?.filter((instance) => instance.status === "FAILED");
  }, [nonBYOAInstances]);

  const overloadedInstances = useMemo(() => {
    return nonBYOAInstances?.filter((instance) =>
      //@ts-ignore
      ["POD_OVERLOAD", "LOAD_OVERLOADED"].includes(instance.instanceLoadStatus)
    );
  }, [nonBYOAInstances]);

  const unhealthyInstances = useMemo(() => {
    return nonBYOAInstances?.filter((instance) => {
      const instanceHealthStatus = getInstanceHealthStatus(
        (instance?.detailedNetworkTopology ?? {}) as Record<string, ResourceInstanceNetworkTopology>,

        instance.status as string
      );
      if (instanceHealthStatus === "UNHEALTHY") return true;

      return false;
    });
  }, [nonBYOAInstances]);

  const selectedInstance = useMemo(() => {
    return nonBYOAInstances.find((instance) => instance.id === selectedRows[0]);
  }, [selectedRows, nonBYOAInstances]);

  // Subscription of the Selected Instance
  const selectedInstanceSubscription = useMemo(() => {
    return subscriptionsObj[selectedInstance?.subscriptionId as string];
  }, [selectedInstance, subscriptionsObj]);

  // Offering of the Selected Instance
  const selectedInstanceOffering = useMemo(() => {
    const { serviceId, productTierId } = selectedInstanceSubscription || {};
    return serviceOfferingsObj[serviceId]?.[productTierId];
  }, [selectedInstanceSubscription, serviceOfferingsObj]);

  const instancesCountSummary = useMemo(
    () => [
      {
        title: "Failed Deployments",
        count: failedInstances?.length,
        handleClick: () => {
          setSelectedFilters((prev) => {
            return {
              ...getIntialFiltersObject(),
              lifecycleStatus: {
                ...prev["lifecycleStatus"],
                options: [
                  {
                    value: "FAILED",
                    label: "Failed",
                  },
                ],
              },
            };
          });
        },
      },
      {
        title: "Unhealthy Deployments",
        count: unhealthyInstances?.length,

        handleClick: () => {
          setSelectedFilters((prev) => {
            return {
              ...getIntialFiltersObject(),
              healthStatus: {
                ...prev["healthStatus"],
                options: [
                  {
                    value: "UNHEALTHY",
                    label: "Unhealthy",
                  },
                ],
              },
            };
          });
        },
      },
      {
        title: "Overload Deployments",
        count: overloadedInstances?.length,

        handleClick: () => {
          setSelectedFilters((prev) => {
            return {
              ...getIntialFiltersObject(),
              load: {
                ...prev["load"],
                options: [
                  {
                    value: "High",
                    label: "High",
                  },
                ],
              },
            };
          });
        },
      },
    ],
    [failedInstances, overloadedInstances, unhealthyInstances]
  );

  return (
    <PageContainer>
      <InstancesOverview summary={instancesCountSummary} />
      <div className="mt-8">
        <DataTable
          columns={dataTableColumns}
          rows={filteredInstances}
          noRowsText="No instances"
          HeaderComponent={InstancesTableHeader}
          headerProps={{
            count: filteredInstances.length,
            selectedInstance,
            setSelectedRows,
            setOverlayType,
            setIsOverlayOpen,
            selectedInstanceOffering,
            selectedInstanceSubscription,
            refetchInstances,
            isFetchingInstances,
            filterOptionsMap,
            selectedFilters,
            setSelectedFilters,
            isLoadingInstances,
          }}
          isLoading={isLoadingInstances || isFetchingSubscriptions || isFetchingServiceOfferings}
          selectedRows={selectedRows}
          onRowSelectionChange={setSelectedRows}
          selectionMode="single"
          getRowClassName={(rowData) => {
            const healthStatus = getInstanceHealthStatus(
              (rowData?.detailedNetworkTopology ?? {}) as Record<string, ResourceInstanceNetworkTopology>,
              rowData.status
            );
            return healthStatus;
          }}
          tableStyles={{ ...getRowBorderStyles() }}
          statusColumn={{
            id: "instance-status",
            header: "",
            cell: ({ row }) => {
              const upcomingUpgrade = row.original.maintenanceTasks?.upgrade_paths?.[0];
              return (
                <div className="flex items-center justify-center">
                  <StatusCell upcomingUpgrade={upcomingUpgrade} />
                </div>
              );
            },
            meta: {
              width: 50,
              styles: {
                padding: "0px",
                paddingLeft: "4px",
              },
            },
          }}
        />
      </div>

      <InstanceDialogs
        variant="instances-page"
        isOverlayOpen={isOverlayOpen}
        setIsOverlayOpen={setIsOverlayOpen}
        overlayType={overlayType}
        setOverlayType={setOverlayType}
        instances={instances}
        instance={selectedInstance}
        serviceOffering={selectedInstanceOffering}
        subscription={selectedInstanceSubscription}
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        refetchData={refetchInstances}
      />
    </PageContainer>
  );
};

export default InstancesPage;

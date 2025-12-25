import { useMemo, useState } from "react";
import { Box } from "@mui/material";

import RegionIcon from "src/components/Region/RegionIcon";
import PropertyDetails, { Row } from "src/components/ResourceInstance/ResourceInstanceDetails/PropertyDetails";
import SideDrawerHeader from "src/components/SideDrawerHeader/SideDrawerHeader";
import StatusChip from "src/components/StatusChip/StatusChip";
import { Tab, Tabs } from "src/components/Tab/Tab";
import { Text } from "src/components/Typography/Typography";
import { cloudProviderLongLogoMap } from "src/constants/cloudProviders";
import { useGlobalData } from "src/providers/GlobalDataProvider";
import { CloudProvider } from "src/types/common/enums";
import { InstanceSnapshot } from "src/types/instance-snapshot";
import { ResourceInstance } from "src/types/resourceInstance";
import formatDateUTC from "src/utils/formatDateUTC";
import { getInstanceDetailsRoute, getSubscriptionsRoute } from "src/utils/routes";

type SnapshotDetailsProps = {
  selectedSnapshot?: InstanceSnapshot;
  instances: ResourceInstance[];
};

type TabKey = "snapshot-information" | "deployment-parameters";

const tabs: Record<TabKey, string> = {
  "snapshot-information": "Snapshot Information",
  "deployment-parameters": "Deployment Parameters",
};

const SnapshotDetails: React.FC<SnapshotDetailsProps> = ({ selectedSnapshot, instances }) => {
  const { subscriptionsObj } = useGlobalData();
  const [currentTab, setCurrentTab] = useState<TabKey>("snapshot-information");

  const snapshotInfoRows: Row[] = useMemo(() => {
    if (!selectedSnapshot) return [];

    const {
      snapshotId,
      productTierName,
      productTierVersion,
      subscriptionId,
      sourceInstanceId,
      cloudProvider,
      region,
      createdTime,
      completeTime,
      encrypted,
    } = selectedSnapshot;

    const instance = instances.find((instance) => instance.id === sourceInstanceId);
    const instanceSubscription = subscriptionsObj[instance?.subscriptionId || ""];

    return [
      { label: "Snapshot ID", value: snapshotId, valueType: "text" },
      { label: "Product Name", value: selectedSnapshot.serviceName, valueType: "text" },
      { label: "Subscription Plan", value: productTierName, valueType: "text" },
      { label: "Plan Version", value: productTierVersion, valueType: "text" },
      {
        label: "Subscription ID",
        value: subscriptionId,
        valueType: "link",
        linkProps: { href: getSubscriptionsRoute({ subscriptionId }) },
      },
      {
        label: "Source Instance",
        value: sourceInstanceId,
        valueType: instance ? "link" : "text",
        linkProps:
          instance?.id && instanceSubscription
            ? {
                href: getInstanceDetailsRoute({
                  serviceId: instanceSubscription.serviceId,
                  servicePlanId: instanceSubscription.productTierId,
                  resourceId: instance.resourceID as string,
                  instanceId: instance.id,
                  subscriptionId: instance.subscriptionId as string,
                }),
              }
            : undefined,
      },
      {
        label: "Cloud Provider",
        valueType: "custom",
        value: cloudProviderLongLogoMap[cloudProvider as CloudProvider] || "-",
      },
      {
        label: "Region",
        valueType: "custom",
        value: (
          <Box display="flex" alignItems="center" gap="8px">
            <RegionIcon />
            <Text size="small" weight="medium" color="#535862">
              {region}
            </Text>
          </Box>
        ),
      },
      {
        label: "Created At",
        value: createdTime ? formatDateUTC(createdTime) : "-",
        valueType: "text",
      },
      {
        label: "Completion Time",
        value: completeTime ? formatDateUTC(completeTime) : "-",
        valueType: "text",
      },
      {
        label: "Encryption Status",
        valueType: "custom",
        value: <StatusChip status={encrypted ? "ENCRYPTED" : "NOT_ENCRYPTED"} />,
      },
    ];
  }, [selectedSnapshot, instances]);

  const deploymentParamsRows: Row[] = useMemo(() => {
    const outputParams = selectedSnapshot?.outputParams;
    if (!outputParams || outputParams.length === 0) return [];

    return outputParams.map((el) => {
      return {
        label: el.displayName || el.key,
        value: el.value,
        valueType: el.type,
      } as Row;
    });
  }, [selectedSnapshot?.outputParams]);

  return (
    <>
      <SideDrawerHeader
        title="Snapshot Details"
        description="Summary information for the selected deployment snapshot"
      />

      <Tabs value={currentTab} sx={{ marginTop: "24px" }}>
        {(Object.entries(tabs) as [TabKey, string][]).map(([key, label]) => (
          <Tab
            key={key}
            label={label}
            value={key}
            onClick={() => setCurrentTab(key)}
            sx={{ padding: "12px !important" }}
          />
        ))}
      </Tabs>

      {currentTab === "snapshot-information" && selectedSnapshot && (
        <Box sx={{ marginTop: "24px" }}>
          <PropertyDetails
            rows={{
              title: "Snapshot Information",
              desc: "Basic information about the deployment instance associated with this snapshot",
              rows: snapshotInfoRows,
              flexWrap: true,
            }}
          />
        </Box>
      )}

      {currentTab === "deployment-parameters" && selectedSnapshot && (
        <Box sx={{ marginTop: "24px" }}>
          {deploymentParamsRows.length > 0 ? (
            <PropertyDetails
              rows={{
                title: "Deployment Parameters",
                desc: "Configuration values and connection parameters generated for this snapshot",
                rows: deploymentParamsRows,
                flexWrap: true,
              }}
            />
          ) : (
            <Text size="small" weight="medium" color="#535862">
              No deployment parameters available for this snapshot.
            </Text>
          )}
        </Box>
      )}
    </>
  );
};

export default SnapshotDetails;

import { useMemo } from "react";
import { Box } from "@mui/material";

import RegionIcon from "src/components/Region/RegionIcon";
import PropertyDetails, { Row } from "src/components/ResourceInstance/ResourceInstanceDetails/PropertyDetails";
import StatusChip from "src/components/StatusChip/StatusChip";
import { Text } from "src/components/Typography/Typography";
import { cloudProviderLongLogoMap } from "src/constants/cloudProviders";
import { CloudProvider } from "src/types/common/enums";
import { InstanceSnapshot } from "src/types/instance-snapshot";
import { ResourceInstance } from "src/types/resourceInstance";
import formatDateUTC from "src/utils/formatDateUTC";
import { getInstanceDetailsRoute, getSubscriptionsRoute } from "src/utils/routes";

type SnapshotDetailsTabProps = {
  snapshot: InstanceSnapshot;
  instances: ResourceInstance[];
  subscriptionsObj: Record<string, any>;
};

const SnapshotDetailsTab: React.FC<SnapshotDetailsTabProps> = ({ snapshot, instances, subscriptionsObj }) => {
  const snapshotInfoRows: Row[] = useMemo(() => {
    if (!snapshot) return [];

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
    } = snapshot;

    const instance = instances.find((instance) => instance.id === sourceInstanceId);
    const instanceSubscription = subscriptionsObj[instance?.subscriptionId || ""];

    return [
      { label: "Snapshot ID", value: snapshotId, valueType: "text" },
      { label: "Product Name", value: snapshot.serviceName, valueType: "text" },
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
        value: completeTime && completeTime !== "0001-01-01T00:00:00Z" ? formatDateUTC(completeTime) : "-",
        valueType: "text",
      },
      {
        label: "Encryption Status",
        valueType: "custom",
        value: <StatusChip status={encrypted ? "ENCRYPTED" : "NOT_ENCRYPTED"} />,
      },
    ];
  }, [snapshot, instances, subscriptionsObj]);

  return (
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
  );
};

export default SnapshotDetailsTab;

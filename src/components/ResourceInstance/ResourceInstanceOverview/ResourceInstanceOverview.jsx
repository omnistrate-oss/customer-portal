import { styled } from "@mui/material";

import InstanceHealthStatusChip, {
  getInstanceHealthStatus,
} from "src/components/InstanceHealthStatusChip/InstanceHealthStatusChip";
import StatusChip from "src/components/StatusChip/StatusChip";
import { cloudProviderLongLogoMap } from "src/constants/cloudProviders";
import { getResourceInstanceStatusStylesAndLabel } from "src/constants/statusChipStyles/resourceInstanceStatus";
import { colors } from "src/themeConfig";

import RegionIcon from "../../Region/RegionIcon";
import { Text } from "../../Typography/Typography";

const ServiceLogoImg = styled("img")({
  height: "40px",
  width: "40px",
  objectFit: "contain",
  borderRadius: "50%",
  flexShrink: 0,
  objectPosition: "center",
  border: "1px solid rgba(0, 0, 0, 0.08)",
  boxShadow: "0px 1px 2px 0px #1018280D",
});

function ResourceInstanceOverview(props) {
  const {
    region,
    cloudProvider,
    status,
    subscriptionOwner,
    detailedNetworkTopology,
    onViewNodesClick,
    serviceName,
    productTierName,
    serviceLogoURL,
  } = props;

  const healthStatus = getInstanceHealthStatus(detailedNetworkTopology, status);

  const statusStylesAndLabel = getResourceInstanceStatusStylesAndLabel(status || "UNKNOWN");

  return (
    <div
      data-testid="resource-instance-overview"
      className="grid rounded-xl overflow-hidden border border-[#E4E7EC]"
      style={{
        gridTemplateColumns: `repeat(7, minmax(0, 1fr))`,
        marginTop: "10px",
      }}
    >
      {[
        "Product Name",
        "Subscription Plan",
        "Subscription Owner",
        "Lifecycle Status",
        "Region",
        "Cloud Provider",
        "Health Status",
      ]
        .filter((el) => el)
        .map((label, index) => (
          <div
            style={{
              padding: "12px 10px",
              backgroundColor: "#F9FAFB",
            }}
            className="flex items-center justify-center border-b border-[#E4E7EC]"
            key={index}
          >
            <Text size="xsmall" weight="semibold" color="#717680">
              {label}
            </Text>
          </div>
        ))}
      <div style={{ padding: "14px" }} className="flex items-center justify-center gap-2">
        {serviceLogoURL && <ServiceLogoImg src={serviceLogoURL} alt={serviceName} />}
        <Text size="small" weight="regular" color={colors.gray600} ellipsis title={serviceName}>
          {serviceName}
        </Text>
      </div>
      <div style={{ padding: "14px" }} className="flex items-center justify-center">
        <Text size="small" weight="regular" color={colors.gray600} ellipsis title={productTierName}>
          {productTierName}
        </Text>
      </div>

      <div style={{ padding: "14px" }} className="flex items-center justify-center">
        <Text size="small" weight="regular" color={colors.gray600} ellipsis title={subscriptionOwner}>
          {subscriptionOwner}
        </Text>
      </div>

      <div style={{ padding: "14px" }} className="flex items-center justify-center">
        {status ? (
          <StatusChip status={status} {...statusStylesAndLabel} showOverflowTitle />
        ) : (
          <StatusChip status={"UNKNOWN"} label={"Unknown"} />
        )}
      </div>

      <div style={{ padding: "14px" }} className="flex items-center justify-center gap-1.5">
        <RegionIcon style={{ flexShrink: "0" }} />
        <Text size="small" weight="regular" color="#475467" ellipsis>
          {region ?? "Global"}
        </Text>
      </div>

      <div style={{ padding: "14px" }} className="flex items-center justify-center">
        {cloudProvider ? (
          cloudProviderLongLogoMap[cloudProvider]
        ) : (
          <Text size="small" weight="regular" color={colors.gray600} ellipsis title="Everywhere">
            Everywhere
          </Text>
        )}
      </div>

      <div style={{ padding: "14px" }} className="flex items-center justify-center">
        <InstanceHealthStatusChip
          computedHealthStatus={healthStatus}
          detailedNetworkTopology={detailedNetworkTopology}
          onViewNodesClick={onViewNodesClick}
          openLinkInSameTab={true}
        />
      </div>
    </div>
  );
}

export default ResourceInstanceOverview;

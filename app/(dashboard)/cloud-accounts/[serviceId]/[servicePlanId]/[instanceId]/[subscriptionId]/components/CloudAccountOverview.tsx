import { FC, ReactNode } from "react";
import { styled } from "@mui/material";

import GridCellExpand from "src/components/GridCellExpand/GridCellExpand";
import StatusChip from "src/components/StatusChip/StatusChip";
import { Text } from "src/components/Typography/Typography";
import { cloudProviderLongLogoMap } from "src/constants/cloudProviders";
import { getResourceInstanceStatusStylesAndLabel } from "src/constants/statusChipStyles/resourceInstanceStatus";
import { colors } from "src/themeConfig";
import { CloudProvider } from "src/types/common/enums";

const COLUMNS = [
  "Account ID / Project ID",
  "Cloud Provider",
  "Product",
  "Subscription plan",
  "Subscription owner",
  "Lifecycle status",
];

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

const Cell: FC<{ children: ReactNode }> = ({ children }) => (
  <div style={{ padding: "14px" }} className="flex items-center justify-center gap-2 overflow-hidden">
    {children}
  </div>
);

const TextCell: FC<{ value?: string }> = ({ value }) =>
  value ? (
    <Text size="small" weight="regular" color={colors.gray600} ellipsis title={value}>
      {value}
    </Text>
  ) : (
    <>-</>
  );

type CloudAccountOverviewProps = {
  accountId: string;
  cloudProvider?: CloudProvider;
  serviceName?: string;
  serviceLogoURL?: string;
  productTierName?: string;
  subscriptionOwnerName?: string;
  status?: string;
};

const CloudAccountOverview: FC<CloudAccountOverviewProps> = ({
  accountId,
  cloudProvider,
  serviceName,
  serviceLogoURL,
  productTierName,
  subscriptionOwnerName,
  status,
}) => {
  const statusStylesAndLabel = getResourceInstanceStatusStylesAndLabel(status || "UNKNOWN");

  return (
    <div
      data-testid="cloud-account-overview"
      className="grid rounded-xl overflow-hidden border border-[#E4E7EC]"
      style={{ gridTemplateColumns: `repeat(${COLUMNS.length}, minmax(0, 1fr))`, marginTop: "10px" }}
    >
      {COLUMNS.map((label) => (
        <div
          key={label}
          style={{ padding: "12px 10px", backgroundColor: "#F9FAFB" }}
          className="flex items-center justify-center border-b border-[#E4E7EC]"
        >
          <Text size="xsmall" weight="semibold" color="#717680">
            {label}
          </Text>
        </div>
      ))}

      <Cell>
        <GridCellExpand
          value={accountId || "-"}
          copyButton={Boolean(accountId)}
          justifyContent="center"
          // Body text, not link styling: the cell is not clickable, and the provider has its own column.
          textStyles={{ color: colors.gray600, fontSize: "14px", fontWeight: 400, lineHeight: "20px" }}
        />
      </Cell>

      <Cell>{cloudProvider ? cloudProviderLongLogoMap[cloudProvider] : "-"}</Cell>

      <Cell>
        {serviceLogoURL && <ServiceLogoImg src={serviceLogoURL} alt={serviceName} />}
        <TextCell value={serviceName} />
      </Cell>

      <Cell>
        <TextCell value={productTierName} />
      </Cell>

      <Cell>
        <TextCell value={subscriptionOwnerName} />
      </Cell>

      <Cell>
        <StatusChip status={status || "UNKNOWN"} {...statusStylesAndLabel} showOverflowTitle />
      </Cell>
    </div>
  );
};

export default CloudAccountOverview;

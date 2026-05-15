import { FC, useState } from "react";
import { Box, Stack } from "@mui/material";

import Button from "src/components/Button/Button";
import CopyButton from "src/components/Button/CopyButton";
import Card from "src/components/Card/Card";
import ExternalArrowIcon from "src/components/Icons/ArrowExternal/ArrowExternal";
import StatusChip from "src/components/StatusChip/StatusChip";
import { Text } from "src/components/Typography/Typography";

import DataUnavailableMessage from "../DataUnavailableMessage";
import { ContainerCard } from "../ResourceInstanceDetails/PropertyDetails";

type Dashboard = {
  dashboardLink: string;
  description: string;
};

export type MetricsFeature = {
  dashboards?: Record<string, Dashboard>;
  grafanaEndpoint?: string;
  instanceOrgId?: string;
  instanceOrgPassword?: string;
};

const isSafeDashboardUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

type GrafanaMetricsProps = {
  metricsFeature?: MetricsFeature;
  instanceStatus?: string;
};

const getDashboardDisplayName = (description: string): string => {
  // Strip instance ID prefix like "instance-d6thil8rl " from description
  return description.replace(/^instance-\S+\s+/, "");
};

const getDashboardTypeLabel = (key: string): string => {
  if (key.includes("exporter")) {
    return "Exporter / Service";
  }
  return "Grafana Dashboard";
};

const getDashboardTypeColor = (
  key: string
): {
  color: string;
  bgColor: string;
  borderColor: string;
} => {
  if (key.includes("exporter")) {
    return {
      color: "#6941C6",
      bgColor: "#F9F5FF",
      borderColor: "#D6BBFB",
    };
  }
  return {
    color: "#067647",
    bgColor: "#ECFDF3",
    borderColor: "#ABEFC6",
  };
};

const CredentialRow: FC<{
  label: string;
  value: string;
  isLast?: boolean;
  isPassword?: boolean;
}> = ({ label, value, isLast = false, isPassword = false }) => {
  const [isVisible, setIsVisible] = useState(false);

  const displayValue = isPassword && !isVisible ? "●●●●●●●●" : value;

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{
        padding: "14px 24px",
        borderBottom: isLast ? "none" : "1px solid #E4E7EC",
      }}
    >
      <Text size="small" weight="medium" color="#414651">
        {label}
      </Text>
      <Stack direction="row" alignItems="center" gap="8px">
        <Text
          size="small"
          weight="regular"
          color="#414651"
          sx={{
            maxWidth: "400px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {displayValue}
        </Text>
        {isPassword && (
          <Text
            size="xsmall"
            weight="medium"
            sx={{
              color: "#7F56D9",
              cursor: "pointer",
              userSelect: "none",
            }}
            onClick={() => setIsVisible(!isVisible)}
          >
            {isVisible ? "Hide" : "Show"}
          </Text>
        )}
        <CopyButton
          text={value}
          iconProps={{
            color: "#6941C6",
            width: 18,
            height: 18,
          }}
          iconButtonProps={{ padding: "4px" }}
        />
      </Stack>
    </Stack>
  );
};

const DashboardCard: FC<{
  dashboardKey: string;
  dashboard: Dashboard;
  instanceStatus?: string;
}> = ({ dashboardKey, dashboard, instanceStatus }) => {
  const displayName = getDashboardDisplayName(dashboard.description);
  const typeLabel = getDashboardTypeLabel(dashboardKey);
  const typeColor = getDashboardTypeColor(dashboardKey);
  const linkIsSafe = isSafeDashboardUrl(dashboard.dashboardLink);
  const isRunning = instanceStatus === "RUNNING";

  return (
    <Box
      sx={{
        border: "1px solid #E9EAEB",
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "12px",
      }}
    >
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap="8px" mb="8px">
          <Text size="medium" weight="semibold" color="#181D27">
            {displayName}
          </Text>
          <StatusChip
            label={typeLabel}
            color={typeColor.color}
            backgroundColor={typeColor.bgColor}
            borderColor={typeColor.borderColor}
            sx={{ flexShrink: 0 }}
          />
        </Stack>
        {dashboard.description !== displayName && (
          <Text size="small" weight="regular" color="#535862">
            {dashboard.description}
          </Text>
        )}
      </Box>

      <Stack direction="row" alignItems="center" justifyContent="space-between">
        {isRunning ? (
          <StatusChip label="Available" category="success" dot />
        ) : (
          <StatusChip label="Unavailable" category="unknown" dot />
        )}
        <Button
          variant="contained"
          size="xsmall"
          href={linkIsSafe ? dashboard.dashboardLink : undefined}
          target="_blank"
          rel="noopener noreferrer"
          disabled={!linkIsSafe}
          endIcon={<ExternalArrowIcon color="#FFFFFF" />}
          sx={{
            backgroundColor: "#7F56D9",
            "&:hover": {
              backgroundColor: "#6941C6",
            },
          }}
        >
          Open Dashboard
        </Button>
      </Stack>
    </Box>
  );
};

const GrafanaMetrics: FC<GrafanaMetricsProps> = ({ metricsFeature, instanceStatus }) => {
  if (instanceStatus === "DISCONNECTED") {
    return (
      <DataUnavailableMessage
        title="Metrics Unavailable"
        description="Please connect the cloud account to view metrics"
      />
    );
  }

  const dashboards = metricsFeature?.dashboards;
  const grafanaEndpoint = metricsFeature?.grafanaEndpoint;

  if (!dashboards || !grafanaEndpoint || Object.keys(dashboards).length === 0) {
    return (
      <Card
        mt={4}
        sx={{
          paddingTop: "12.5px",
          paddingLeft: "20px",
          paddingRight: "20px",
          minHeight: "500px",
        }}
      >
        <Stack direction="row" justifyContent="center" marginTop="200px">
          <Text size="xlarge">
            {`Metrics are not available${instanceStatus !== "RUNNING" ? " as the instance is not running" : ""}`}
          </Text>
        </Stack>
      </Card>
    );
  }

  const dashboardOrder = ["overview", "networking"];
  const dashboardEntries = Object.entries(dashboards).sort(([a], [b]) => {
    const aIndex = dashboardOrder.indexOf(a);
    const bIndex = dashboardOrder.indexOf(b);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });

  return (
    <Stack gap="20px" mt="32px">
      {/* Grafana Access Section */}
      <ContainerCard title="Grafana Access" description="Use these credentials to access the Grafana dashboards">
        <CredentialRow label="Grafana Endpoint" value={grafanaEndpoint} />
        {metricsFeature.instanceOrgId && (
          <CredentialRow label="Username" value={metricsFeature.instanceOrgId} />
        )}
        {metricsFeature.instanceOrgPassword && (
          <CredentialRow label="Password" value={metricsFeature.instanceOrgPassword} isPassword isLast />
        )}
      </ContainerCard>

      {/* Dashboards Section */}
      <ContainerCard title="Dashboards" contentBoxProps={{ padding: "16px 24px 24px" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "16px",
          }}
        >
          {dashboardEntries.map(([key, dashboard]) => (
            <DashboardCard key={key} dashboardKey={key} dashboard={dashboard} instanceStatus={instanceStatus} />
          ))}
        </Box>
      </ContainerCard>
    </Stack>
  );
};

export default GrafanaMetrics;

import { FC, useState } from "react";
import { Box, Divider, Stack } from "@mui/material";

import CopyButton from "src/components/Button/CopyButton";
import ExternalArrowIcon from "src/components/Icons/ArrowExternal/ArrowExternal";
import StatusChip from "src/components/StatusChip/StatusChip";
import { Text } from "src/components/Typography/Typography";
import { BarChart01, Server05, TrendUp01 } from "src/icons";

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

type GrafanaMetricsProps = {
  metricsFeature?: MetricsFeature;
  instanceStatus?: string;
};

// Networking and Overview are the default dashboards and are always listed first.
const DASHBOARD_ORDER = ["overview", "networking"];

const isSafeDashboardUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

const getDashboardDisplayName = (description: string): string => {
  // Strip instance ID prefix like "instance-d6thil8rl " from description
  return description.replace(/^instance-\S+\s+/, "");
};

const getDashboardMeta = (key: string, description: string): { label: string; Icon: typeof Server05 } => {
  const normalizedKey = key.toLowerCase();
  if (normalizedKey.includes("overview")) {
    return { label: "Overview", Icon: TrendUp01 };
  }
  if (normalizedKey.includes("network")) {
    return { label: "Networking", Icon: Server05 };
  }
  return { label: getDashboardDisplayName(description), Icon: BarChart01 };
};

/** A single labelled credential shown in the horizontal Grafana Access row. */
const CredentialColumn: FC<{
  label: string;
  value: string;
  isPassword?: boolean;
  flex?: number;
}> = ({ label, value, isPassword = false, flex = 1 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const displayValue = isPassword && !isVisible ? "●●●●●●●●" : value;

  return (
    <Box flex={flex} minWidth={0}>
      <Text size="small" weight="medium" color="#414651">
        {label}
      </Text>
      <Stack direction="row" alignItems="center" gap="8px" mt="8px">
        <Text
          size="small"
          weight="regular"
          color="#414651"
          sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {displayValue}
        </Text>
        {isPassword && (
          <Text
            size="xsmall"
            weight="medium"
            sx={{ color: "#7F56D9", cursor: "pointer", userSelect: "none", flexShrink: 0 }}
            onClick={() => setIsVisible(!isVisible)}
          >
            {isVisible ? "Hide" : "Show"}
          </Text>
        )}
        <CopyButton
          text={value}
          iconProps={{ color: "#6941C6", width: 18, height: 18 }}
          iconButtonProps={{ padding: "4px" }}
        />
      </Stack>
    </Box>
  );
};

const OpenDashboardLink: FC<{ href: string; disabled?: boolean }> = ({ href, disabled = false }) => {
  const baseSx = {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 600,
    textDecoration: "none",
  } as const;

  if (disabled) {
    return (
      <Box component="span" sx={{ ...baseSx, color: "#D0D5DD", cursor: "not-allowed" }}>
        Open Dashboard
        <ExternalArrowIcon color="#D0D5DD" width={16} height={16} />
      </Box>
    );
  }

  return (
    <Box
      component="a"
      data-testid="open-dashboard-link"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      sx={{ ...baseSx, color: "#6941C6" }}
    >
      Open Dashboard
      <ExternalArrowIcon color="#6941C6" width={16} height={16} />
    </Box>
  );
};

const DashboardCard: FC<{
  dashboardKey: string;
  dashboard: Dashboard;
}> = ({ dashboardKey, dashboard }) => {
  const { label, Icon } = getDashboardMeta(dashboardKey, dashboard.description);
  const linkIsSafe = isSafeDashboardUrl(dashboard.dashboardLink);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        border: "1px solid #E9EAEB",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <Stack direction="row" alignItems="center" gap="12px" sx={{ padding: "20px", flexGrow: 1 }}>
        <Box
          sx={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            backgroundColor: "#F4EBFF",
            color: "#7F56D9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={24} />
        </Box>
        <Box minWidth={0}>
          <Text
            size="medium"
            weight="semibold"
            color="#181D27"
            sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {label}
          </Text>
        </Box>
        <StatusChip label="Available" category="success" sx={{ flexShrink: 0, ml: "auto" }} />
      </Stack>

      <Divider sx={{ borderColor: "#E9EAEB" }} />

      <Box sx={{ padding: "16px 20px", display: "flex", justifyContent: "center" }}>
        <OpenDashboardLink href={dashboard.dashboardLink} disabled={!linkIsSafe} />
      </Box>
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
      <ContainerCard title="Grafana Dashboards" mt="24px" contentBoxProps={{ padding: "24px" }}>
        <Stack direction="row" justifyContent="center" sx={{ padding: "80px 0" }}>
          <Text size="large" color="#535862">
            {`Metrics are not available${instanceStatus !== "RUNNING" ? " as the instance is not running" : ""}`}
          </Text>
        </Stack>
      </ContainerCard>
    );
  }

  const dashboardEntries = Object.entries(dashboards).sort(([a], [b]) => {
    const aIndex = DASHBOARD_ORDER.indexOf(a.toLowerCase());
    const bIndex = DASHBOARD_ORDER.indexOf(b.toLowerCase());
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });

  return (
    <Stack gap="24px" mt="24px">
      {/* Grafana Access Section */}
      <ContainerCard
        title="Grafana Access"
        description="Use these credentials to access the Grafana dashboards"
        contentBoxProps={{ padding: "20px 24px" }}
      >
        <Stack
          direction="row"
          spacing="24px"
          divider={<Divider orientation="vertical" flexItem sx={{ borderColor: "#E4E7EC" }} />}
        >
          <CredentialColumn label="Grafana Endpoint" value={grafanaEndpoint} flex={2} />
          {metricsFeature.instanceOrgId && <CredentialColumn label="Username" value={metricsFeature.instanceOrgId} />}
          {metricsFeature.instanceOrgPassword && (
            <CredentialColumn label="Password" value={metricsFeature.instanceOrgPassword} isPassword />
          )}
        </Stack>
      </ContainerCard>

      {/* Dashboards Section */}
      <ContainerCard
        title="Grafana Dashboards"
        statusChip={
          <StatusChip
            label={`${dashboardEntries.length} Dashboards`}
            category="success"
            sx={{ borderRadius: "9999px" }}
          />
        }
        contentBoxProps={{ padding: "16px 24px 24px" }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "16px",
          }}
        >
          {dashboardEntries.map(([key, dashboard]) => (
            <DashboardCard key={key} dashboardKey={key} dashboard={dashboard} />
          ))}
        </Box>
      </ContainerCard>
    </Stack>
  );
};

export default GrafanaMetrics;

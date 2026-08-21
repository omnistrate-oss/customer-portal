import { FC, useState } from "react";
import { Box, Stack } from "@mui/material";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";

import Button from "src/components/Button/Button";
import CopyButton from "src/components/Button/CopyButton";
import Card from "src/components/Card/Card";
import DataTable from "src/components/DataTable/DataTable";
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

const CredentialColumn: FC<{
  label: string;
  value: string;
  isPassword?: boolean;
  showDivider?: boolean;
}> = ({ label, value, isPassword = false, showDivider = false }) => {
  const [isVisible, setIsVisible] = useState(false);

  const displayValue = isPassword && !isVisible ? "•".repeat(15) : value;

  return (
    <Stack
      gap="6px"
      sx={{
        padding: "16px 24px",
        minWidth: 0,
        ...(showDivider && {
          borderTop: { xs: "1px solid #E9EAEB", md: "none" },
          borderLeft: { xs: "none", md: "1px solid #E9EAEB" },
        }),
      }}
    >
      <Text size="small" weight="semibold" color="#414651">
        {label}
      </Text>
      <Stack direction="row" alignItems="center" gap="8px" sx={{ minWidth: 0 }}>
        <Text
          size="small"
          weight="regular"
          color="#414651"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
          }}
        >
          {displayValue}
        </Text>
        {isPassword && (
          <Button
            type="button"
            variant="text"
            aria-label={isVisible ? "Hide password value" : "Show password value"}
            aria-pressed={isVisible}
            sx={{
              color: "#7F56D9",
              flexShrink: 0,
              fontSize: "14px",
              fontWeight: 600,
              lineHeight: "20px",
              minWidth: 0,
              padding: 0,
            }}
            onClick={() => setIsVisible((prev) => !prev)}
          >
            {isVisible ? "Hide" : "Show"}
          </Button>
        )}
        <CopyButton
          text={value}
          iconProps={{ color: "#6941C6", width: 16, height: 16 }}
          iconButtonProps={{ padding: "2px" }}
        />
      </Stack>
    </Stack>
  );
};

type DashboardRow = {
  key: string;
  name: string;
  link: string;
  statusLabel: string;
  isAvailable: boolean;
};

const OpenDashboardLink: FC<{ link: string; disabled: boolean }> = ({ link, disabled }) => (
  <Box
    component="a"
    href={disabled ? undefined : link}
    target={disabled ? undefined : "_blank"}
    rel={disabled ? undefined : "noopener noreferrer"}
    aria-disabled={disabled}
    sx={{
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      fontSize: "14px",
      fontWeight: 600,
      lineHeight: "20px",
      whiteSpace: "nowrap",
      textDecoration: "none",
      color: disabled ? "#D0D5DD" : "#6941C6",
      cursor: disabled ? "not-allowed" : "pointer",
      pointerEvents: disabled ? "none" : "auto",
    }}
  >
    Open Dashboard
    <ExternalArrowIcon color={disabled ? "#D0D5DD" : "#6941C6"} width={16} height={16} />
  </Box>
);

const dashboardColumnHelper = createColumnHelper<DashboardRow>();

const DASHBOARD_COLUMNS: ColumnDef<DashboardRow>[] = [
  dashboardColumnHelper.accessor("name", {
    header: "Dashboard",
    cell: ({ getValue }) => (
      <Text size="small" weight="medium" color="#181D27">
        {getValue()}
      </Text>
    ),
    meta: { flex: 1.4, minWidth: 220 },
  }),
  dashboardColumnHelper.accessor("statusLabel", {
    header: "Status",
    cell: ({ getValue, row }) => (
      <StatusChip label={getValue()} category={row.original.isAvailable ? "success" : "unknown"} dot />
    ),
    meta: { flex: 1, minWidth: 160 },
  }),
  dashboardColumnHelper.display({
    id: "action",
    header: "Action",
    enableSorting: false,
    cell: ({ row }) => <OpenDashboardLink link={row.original.link} disabled={!row.original.isAvailable} />,
    meta: { flex: 1, minWidth: 200 },
  }),
];

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

  const isRunning = instanceStatus === "RUNNING";

  const credentials = [
    { label: "Grafana Endpoint", value: grafanaEndpoint, isPassword: false },
    ...(metricsFeature?.instanceOrgId
      ? [{ label: "Username", value: metricsFeature.instanceOrgId, isPassword: false }]
      : []),
    ...(metricsFeature?.instanceOrgPassword
      ? [{ label: "Password", value: metricsFeature.instanceOrgPassword, isPassword: true }]
      : []),
  ];

  const dashboardOrder = ["overview", "networking"];
  const dashboardRows: DashboardRow[] = Object.entries(dashboards)
    .sort(([a], [b]) => {
      const aIndex = dashboardOrder.indexOf(a);
      const bIndex = dashboardOrder.indexOf(b);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    })
    .map(([key, dashboard]) => {
      const isAvailable = isRunning && isSafeDashboardUrl(dashboard.dashboardLink);

      return {
        key,
        name: getDashboardDisplayName(dashboard.description),
        link: dashboard.dashboardLink,
        statusLabel: isAvailable ? "Available" : "Unavailable",
        isAvailable,
      };
    });

  return (
    <Stack gap="20px" mt="32px">
      {/* Grafana Access Section */}
      <ContainerCard
        title="Grafana Access"
        description="Use these credentials to access the Grafana dashboards"
        contentBoxProps={{ padding: 0 }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: credentials.map((_, index) => (index === 0 ? "minmax(0, 1.5fr)" : "minmax(0, 1fr)")).join(" "),
            },
          }}
        >
          {credentials.map((credential, index) => (
            <CredentialColumn
              key={credential.label}
              label={credential.label}
              value={credential.value}
              isPassword={credential.isPassword}
              showDivider={index > 0}
            />
          ))}
        </Box>
      </ContainerCard>

      {/* Dashboards Section */}
      <ContainerCard
        title="Grafana Dashboards"
        statusChip={
          <StatusChip
            label={String(dashboardRows.length)}
            color="#067647"
            backgroundColor="#ECFDF3"
            borderColor="#ABEFC6"
          />
        }
        contentBoxProps={{ padding: 0 }}
      >
        <DataTable<DashboardRow>
          rows={dashboardRows}
          columns={DASHBOARD_COLUMNS}
          rowId="key"
          noRowsText="No dashboards available"
          hidePagination
          minHeight="auto"
          tableStyles={{ border: "none", borderRadius: 0, boxShadow: "none" }}
        />
      </ContainerCard>
    </Stack>
  );
};

export default GrafanaMetrics;

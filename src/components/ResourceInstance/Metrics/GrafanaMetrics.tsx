import { FC, useMemo, useState } from "react";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import { Box, Stack, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";

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
          <Text
            size="small"
            weight="semibold"
            sx={{
              color: "#7F56D9",
              cursor: "pointer",
              userSelect: "none",
              flexShrink: 0,
            }}
            onClick={() => setIsVisible((prev) => !prev)}
          >
            {isVisible ? "Hide" : "Show"}
          </Text>
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

type SortKey = "name" | "status";
type SortState = { key: SortKey; direction: "asc" | "desc" } | null;

const DASHBOARD_COLUMNS: {
  key: SortKey | "action";
  label: string;
  width: string;
  sortable: boolean;
}[] = [
  { key: "name", label: "Dashboard", width: "40%", sortable: true },
  { key: "status", label: "Status", width: "30%", sortable: true },
  { key: "action", label: "Action", width: "30%", sortable: false },
];

const headerCellSx = {
  padding: "12px 24px",
  backgroundColor: "#F9FAFB",
  borderBottom: "1px solid #E9EAEB",
  userSelect: "none",
};

const bodyCellSx = {
  padding: "16px 24px",
  borderBottom: "1px solid #E9EAEB",
  verticalAlign: "middle",
};

const OpenDashboardLink: FC<{ link: string; disabled: boolean }> = ({ link, disabled }) => (
  <Box
    component="a"
    href={disabled ? undefined : link}
    target="_blank"
    rel="noopener noreferrer"
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

const DashboardsTable: FC<{ rows: DashboardRow[] }> = ({ rows }) => {
  const [sort, setSort] = useState<SortState>(null);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const sorted = [...rows].sort((a, b) => {
      const aValue = sort.key === "name" ? a.name : a.statusLabel;
      const bValue = sort.key === "name" ? b.name : b.statusLabel;
      return aValue.localeCompare(bValue);
    });
    return sort.direction === "asc" ? sorted : sorted.reverse();
  }, [rows, sort]);

  const handleSort = (key: SortKey) => {
    setSort((prev) => {
      if (prev?.key !== key) return { key, direction: "asc" };
      return prev.direction === "asc" ? { key, direction: "desc" } : null;
    });
  };

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table sx={{ tableLayout: "fixed", width: "100%", minWidth: "600px" }}>
        <TableHead>
          <TableRow>
            {DASHBOARD_COLUMNS.map((column) => {
              const isActive = sort?.key === column.key;
              return (
                <TableCell
                  key={column.key}
                  sx={{
                    ...headerCellSx,
                    width: column.width,
                    cursor: column.sortable ? "pointer" : "default",
                  }}
                  onClick={column.sortable ? () => handleSort(column.key as SortKey) : undefined}
                >
                  <Stack direction="row" alignItems="center" gap="4px">
                    <Text size="xsmall" weight="semibold" color="#717680">
                      {column.label}
                    </Text>
                    {column.sortable &&
                      (isActive ? (
                        sort?.direction === "asc" ? (
                          <ArrowUpwardIcon sx={{ fontSize: 14, color: "#717680" }} />
                        ) : (
                          <ArrowDownwardIcon sx={{ fontSize: 14, color: "#717680" }} />
                        )
                      ) : (
                        <UnfoldMoreIcon sx={{ fontSize: 16, color: "#A4A7AE" }} />
                      ))}
                  </Stack>
                </TableCell>
              );
            })}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedRows.map((row, index) => {
            const isLast = index === sortedRows.length - 1;
            const cellSx = isLast ? { ...bodyCellSx, borderBottom: "none" } : bodyCellSx;
            return (
              <TableRow key={row.key}>
                <TableCell sx={cellSx}>
                  <Text size="small" weight="medium" color="#181D27">
                    {row.name}
                  </Text>
                </TableCell>
                <TableCell sx={cellSx}>
                  <StatusChip
                    label={row.statusLabel}
                    category={row.isAvailable ? "success" : "unknown"}
                    dot
                  />
                </TableCell>
                <TableCell sx={cellSx}>
                  <OpenDashboardLink link={row.link} disabled={!row.isAvailable} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
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
    .map(([key, dashboard]) => ({
      key,
      name: getDashboardDisplayName(dashboard.description),
      link: dashboard.dashboardLink,
      statusLabel: isRunning ? "Available" : "Unavailable",
      isAvailable: isRunning && isSafeDashboardUrl(dashboard.dashboardLink),
    }));

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
        <DashboardsTable rows={dashboardRows} />
      </ContainerCard>
    </Stack>
  );
};

export default GrafanaMetrics;

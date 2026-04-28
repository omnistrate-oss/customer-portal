export const dataTestIds = {
  tabs: {
    instanceDetailsTab: "instance-details-tab",
    connectivityTab: "connectivity-tab",
    nodesTab: "nodes-tab",
    metricsTab: "metrics-tab",
    liveLogsTab: "live-logs-tab",
    auditLogsTab: "audit-logs-tab",
    backupsTab: "backups-tab",
    customDNSTab: "custom-dns-tab",
  },
  resourceInstanceOverview: "resource-instance-overview",

  // Instance Details Tab
  instanceDetails: {
    deploymentId: "deployment-id",
    createdAt: "created-at",
    modifiedAt: "modified-at",
    highAvailabilityStatus: "high-availability-status",
    backupsStatus: "backups-status",
    autoScalingStatus: "autoscaling-status",

    licenseStatusTable: "license-status-table",
    outputParametersTable: "output-parameters-table",
  },

  // Connectivity Tab
  connectivity: {
    networkType: "network-type",
    availabilityZones: "availability-zones",
    publiclyAccessible: "publicly-accessible",
    privateNetworkCIDR: "private-network-cidr",
    privateNetworkId: "private-network-id",
  },

  metrics: {
    nodeIdMenu: "node-id-menu",

    cpuUsageCard: "cpu-usage-card",
    loadAverageCard: "load-average-card",
    storageCard: "storage-card",
    totalRamCard: "total-ram-card",
    usedRamCard: "used-ram-card",
    ramUsageCard: "ram-usage-card",
    systemUptimeCard: "system-uptime-card",
  },

  liveLogs: {
    nodeIdMenu: "node-id-menu",

    logsContainer: "logs-container",
    scrollToTopButton: "scroll-to-top-button",
    scrollToBottomButton: "scroll-to-bottom-button",
  },
};

export const pageElements = {
  nodesTableDescription: "View and manage your Nodes",

  metricsDescription: "Metrics for monitoring and performance insights",
  stoppedInstanceMetricsMessage: "Metrics are not available as the instance is not running",

  liveLogsDescription: "Detailed logs for monitoring and troubleshooting",
  stoppedInstanceLiveLogsMessage: "Logs are not available as the instance is not running",

  auditLogsTableTitle: "List of Logs",
};

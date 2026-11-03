// Saved column preferences are keyed by these ids, so renaming one drops what users saved for that table.
export const COLUMN_PREFERENCE_TABLE_IDS = {
  accessControl: "access-control",
  alerts: "alerts",
  auditLogs: "audit-logs",
  billingInvoices: "billing-invoices",
  cloudAccounts: "cloud-accounts",
  customNetworks: "custom-networks",
  dashboardAuditLogs: "dashboard-audit-logs",
  installerHub: "installer-hub",
  instanceAuditLogs: "instance-audit-logs",
  instanceBackups: "instance-backups",
  instanceDetailsSnapshots: "instance-details-snapshots",
  instanceNodes: "instance-nodes",
  instanceNodesCustomTenancy: "instance-nodes-custom-tenancy",
  instanceSnapshots: "instance-snapshots",
  instances: "instances",
  nebiusBindings: "nebius-bindings",
  subscriptions: "subscriptions",
  usageBreakdown: "usage-breakdown",
} as const;

export type ColumnPreferenceTableId = (typeof COLUMN_PREFERENCE_TABLE_IDS)[keyof typeof COLUMN_PREFERENCE_TABLE_IDS];

// Bump a table's version (default 1) when its columns or defaults change enough that saved layouts should start
// over. Layouts saved for an older version are ignored, and deleted the next time the user saves any table.
export const COLUMN_PREFERENCE_TABLE_VERSIONS: Partial<Record<ColumnPreferenceTableId, number>> = {};

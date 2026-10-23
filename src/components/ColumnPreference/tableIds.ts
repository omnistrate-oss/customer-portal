// Saved column preferences are keyed by these ids, so renaming one drops what users saved for that table.
export const COLUMN_PREFERENCE_TABLE_IDS = {
  accessControl: "access-control",
  alerts: "alerts",
  auditLogs: "audit-logs",
  customNetworks: "custom-networks",
  dashboardAuditLogs: "dashboard-audit-logs",
  instanceSnapshots: "instance-snapshots",
  subscriptions: "subscriptions",
} as const;

export type ColumnPreferenceTableId = (typeof COLUMN_PREFERENCE_TABLE_IDS)[keyof typeof COLUMN_PREFERENCE_TABLE_IDS];

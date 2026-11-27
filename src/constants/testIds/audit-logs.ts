export const auditLogsTestIds = {
  actionChip: (action: string) => `audit-action-${action.toLowerCase()}`,
} as const;

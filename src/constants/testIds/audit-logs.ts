export const auditLogsTestIds = {
  actionChip: (action: string) => `audit-action-${action.toLowerCase()}`,
  row: (eventId: string) => `audit-row-${eventId}`,
} as const;

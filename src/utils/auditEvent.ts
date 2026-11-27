import type { AuditEvent, JITAccessRequestDetails, JITAuditAction, JITAuditEvent } from "src/types/auditEvent";

const JIT_ACTIONS: JITAuditAction[] = ["Requested", "Approved", "Denied", "Revoked", "Expired"];

const getJITAction = (message: string): JITAuditAction | null =>
  JIT_ACTIONS.find((action) => message.startsWith(`${action} just-in-time access`)) ?? null;

const requestedDetails = (details: JITAccessRequestDetails) => ({
  clusterName: details.clusterName,
  requestedRole: details.requestedRole,
  reason: details.reason,
});

export const normalizeJITAuditEvent = (event: AuditEvent): JITAuditEvent | null => {
  if (!event.accessRequest) return null;

  const action = getJITAction(event.message);
  const details = event.accessRequest;

  switch (action) {
    case "Requested":
      return { action, details: requestedDetails(details), event };
    case "Approved":
      return {
        action,
        details: {
          ...requestedDetails(details),
          approvalMethod: details.approvalMethod,
          grantedDurationSeconds: details.grantedDurationSeconds,
          expiresAt: details.expiresAt,
        },
        event,
      };
    case "Denied":
      return { action, details: requestedDetails(details), event };
    case "Revoked":
      return {
        action,
        details: {
          ...requestedDetails(details),
          approvalMethod: details.approvalMethod,
          grantStartedAt: details.grantStartedAt,
          expiresAt: details.expiresAt,
          actualAccessDurationSeconds: details.actualAccessDurationSeconds,
        },
        event,
      };
    case "Expired":
      return {
        action,
        details: {
          ...requestedDetails(details),
          approvalMethod: details.approvalMethod,
          grantStartedAt: details.grantStartedAt,
          grantedDurationSeconds: details.grantedDurationSeconds,
        },
        event,
      };
    default:
      return { action: null, details, event };
  }
};

export const formatAuditDuration = (seconds?: number): string | undefined => {
  if (seconds === undefined) return undefined;
  if (seconds % 3600 === 0) {
    const hours = seconds / 3600;
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }
  if (seconds % 60 === 0) {
    const minutes = seconds / 60;
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  }
  return `${seconds} ${seconds === 1 ? "second" : "seconds"}`;
};

export const formatAuditCloudProvider = (cloudProvider?: string): string | undefined => {
  if (!cloudProvider) return undefined;

  const normalizedProvider = cloudProvider.trim().toLowerCase();
  const providerNames: Record<string, string> = {
    aws: "AWS",
    azure: "Azure",
    gcp: "GCP",
    nebius: "Nebius",
    oci: "OCI",
  };

  return providerNames[normalizedProvider] ?? cloudProvider.trim();
};

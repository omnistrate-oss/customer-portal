import type { AuditEvent, JITAuditAction, JITAuditEvent } from "src/types/auditEvent";

type SupportedJITAuditEvent = Exclude<JITAuditEvent, { action: null }>;

type JITFixtureDefinition = {
  [TAction in JITAuditAction]: {
    action: TAction;
    actor: { kind: "human"; userId: string } | { kind: "system" };
    details: Extract<SupportedJITAuditEvent, { action: TAction }>["details"];
  };
}[JITAuditAction];

const accountId = "123456789012";
const clusterName = "customer-production";
const reason = "Investigate a synthetic availability issue";

export const jitFixtureDefinitions: JITFixtureDefinition[] = [
  {
    action: "Requested",
    actor: { kind: "human", userId: "user-provider-requester" },
    details: { clusterName, requestedRole: "Reader", reason },
  },
  {
    action: "Approved",
    actor: { kind: "human", userId: "user-provider-approver" },
    details: {
      clusterName,
      requestedRole: "Reader",
      reason,
      approvalMethod: "Manual",
      grantedDurationSeconds: 3600,
      expiresAt: "2026-11-26T13:00:00Z",
    },
  },
  {
    action: "Denied",
    actor: { kind: "human", userId: "user-provider-denier" },
    details: { clusterName, requestedRole: "Admin", reason },
  },
  {
    action: "Revoked",
    actor: { kind: "human", userId: "user-provider-revoker" },
    details: {
      clusterName,
      requestedRole: "Reader",
      reason,
      approvalMethod: "Manual",
      grantStartedAt: "2026-11-26T12:00:00Z",
      expiresAt: "2026-11-26T13:00:00Z",
      actualAccessDurationSeconds: 1800,
    },
  },
  {
    action: "Expired",
    actor: { kind: "system" },
    details: {
      clusterName,
      requestedRole: "Reader",
      reason,
      approvalMethod: "Manual",
      grantStartedAt: "2026-11-26T12:00:00Z",
      grantedDurationSeconds: 3600,
    },
  },
];

export const createJITAuditEvent = (definition: JITFixtureDefinition, index: number): AuditEvent => ({
  accessRequest: definition.details,
  cloudProvider: "aws",
  cloudProviderAccountId: accountId,
  environmentType: "PROD",
  eventSource: "Operations",
  id: `event-jit-${definition.action.toLowerCase()}`,
  message: `${definition.action} just-in-time access for AWS account ${accountId}.`,
  region: "us-east-1",
  resourceInstanceId: "",
  resourceName: clusterName,
  subscriptionId: "",
  time: `2026-11-26T12:${String(index).padStart(2, "0")}:00Z`,
  ...(definition.actor.kind === "system" ? { userName: "System" } : { userId: definition.actor.userId }),
});

export const createUnsupportedJITAuditEvent = (): AuditEvent => ({
  accessRequest: { clusterName, requestedRole: "Reader", reason },
  cloudProvider: "aws",
  cloudProviderAccountId: accountId,
  environmentType: "PROD",
  eventSource: "Operations",
  id: "event-jit-unsupported",
  message: `Escalated just-in-time access for AWS account ${accountId}.`,
  region: "us-east-1",
  resourceInstanceId: "",
  resourceName: clusterName,
  subscriptionId: "",
  time: "2026-11-26T12:06:00Z",
  userId: "user-provider-unsupported",
});

import type { components, paths } from "./schema";

export type ListAllAuditEventsSuccessResponse =
  paths["/2022-09-01-00/resource-instance/audit-events"]["get"]["responses"]["200"]["content"]["application/json"];

export type AuditEvent = components["schemas"]["DescribeAuditEventResult"];

export type JITAccessRequestDetails = components["schemas"]["CustomerJITAccessRequestAuditDetails"];

export type JITAuditAction = "Requested" | "Approved" | "Denied" | "Revoked" | "Expired";

type JITAuditEventBase<TAction extends JITAuditAction | null, TDetails> = {
  action: TAction;
  details: TDetails;
  event: AuditEvent;
};

type JITCommonDetails = Pick<JITAccessRequestDetails, "clusterName" | "requestedRole" | "reason">;

export type RequestedJITAuditEvent = JITAuditEventBase<"Requested", JITCommonDetails>;

export type ApprovedJITAuditEvent = JITAuditEventBase<
  "Approved",
  JITCommonDetails & Pick<JITAccessRequestDetails, "approvalMethod" | "grantedDurationSeconds" | "expiresAt">
>;

export type DeniedJITAuditEvent = JITAuditEventBase<"Denied", JITCommonDetails>;

export type RevokedJITAuditEvent = JITAuditEventBase<
  "Revoked",
  JITCommonDetails &
    Pick<JITAccessRequestDetails, "approvalMethod" | "grantStartedAt" | "expiresAt" | "actualAccessDurationSeconds">
>;

export type ExpiredJITAuditEvent = JITAuditEventBase<
  "Expired",
  JITCommonDetails & Pick<JITAccessRequestDetails, "approvalMethod" | "grantStartedAt" | "grantedDurationSeconds">
>;

export type UnsupportedJITAuditEvent = JITAuditEventBase<null, JITAccessRequestDetails>;

export type JITAuditEvent =
  | RequestedJITAuditEvent
  | ApprovedJITAuditEvent
  | DeniedJITAuditEvent
  | RevokedJITAuditEvent
  | ExpiredJITAuditEvent
  | UnsupportedJITAuditEvent;

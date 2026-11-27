import { Box, Stack } from "@mui/material";
import type { FC } from "react";
import type { OnCopyProps } from "react-json-view";

import CopyButton from "src/components/Button/CopyButton";
import JSONView from "src/components/JSONView/JSONView";
import { Text } from "src/components/Typography/Typography";
import { colors } from "src/themeConfig";
import type { AuditEvent, JITAuditEvent } from "src/types/auditEvent";
import { formatAuditCloudProvider, formatAuditDuration, normalizeJITAuditEvent } from "src/utils/auditEvent";
import formatDateUTC from "src/utils/formatDateUTC";

type AuditLogEventDetailsViewProps = {
  rowData: AuditEvent;
};

type DetailRowProps = {
  copyable?: boolean;
  label: string;
  value?: string;
};

const hasValue = (value: number | string | undefined): boolean => value !== undefined && value !== "";

const DetailRow: FC<DetailRowProps> = ({ copyable = false, label, value }) => {
  if (!value) return null;

  return (
    <Box display="grid" gridTemplateColumns="142px minmax(0, 1fr)" gap="8px" py="2px">
      <Text size="xsmall" weight="semibold" color={colors.gray600}>
        {label}
      </Text>
      <Stack direction="row" gap="4px" alignItems="flex-start" minWidth={0}>
        <Text size="xsmall" weight="medium" color={colors.gray900} sx={{ overflowWrap: "anywhere" }}>
          {value}
        </Text>
        {copyable ? <CopyButton text={value} iconButtonProps={{ padding: "0px" }} /> : null}
      </Stack>
    </Box>
  );
};

const JITDetails: FC<{ jitEvent: JITAuditEvent }> = ({ jitEvent }) => {
  const { action, details, event } = jitEvent;
  const hasApprovalMethod =
    (action === "Approved" || action === "Revoked" || action === "Expired") && hasValue(details.approvalMethod);
  const hasLifecycleDetails =
    hasApprovalMethod ||
    (action === "Approved" && (hasValue(details.grantedDurationSeconds) || hasValue(details.expiresAt))) ||
    (action === "Revoked" &&
      (hasValue(details.grantStartedAt) ||
        hasValue(details.expiresAt) ||
        hasValue(details.actualAccessDurationSeconds))) ||
    (action === "Expired" && (hasValue(details.grantStartedAt) || hasValue(details.grantedDurationSeconds)));

  return (
    <Stack gap="2px">
      <Box
        display="grid"
        columnGap="40px"
        sx={{
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            lg: hasLifecycleDetails ? "minmax(280px, 1fr) minmax(320px, 1fr)" : "minmax(0, 620px)",
          },
        }}
      >
        <Stack gap="2px" minWidth={0}>
          <DetailRow copyable label="Full message" value={event.message} />
          <DetailRow label="Cloud Provider" value={formatAuditCloudProvider(event.cloudProvider)} />
          <DetailRow label="Region" value={event.region} />
          <DetailRow copyable label="Kubernetes Cluster" value={details.clusterName} />
          <DetailRow label="Access Type" value={details.requestedRole} />
        </Stack>

        {hasLifecycleDetails ? (
          <Stack gap="2px" minWidth={0}>
            {hasApprovalMethod ? <DetailRow label="Approval Method" value={details.approvalMethod} /> : null}
            {action === "Approved" ? (
              <>
                <DetailRow label="Granted Duration" value={formatAuditDuration(details.grantedDurationSeconds)} />
                <DetailRow label="Scheduled Expiration" value={formatDateUTC(details.expiresAt)} />
              </>
            ) : null}
            {action === "Revoked" ? (
              <>
                <DetailRow label="Access Started" value={formatDateUTC(details.grantStartedAt)} />
                <DetailRow label="Scheduled Expiration" value={formatDateUTC(details.expiresAt)} />
                <DetailRow
                  label="Actual Access Duration"
                  value={formatAuditDuration(details.actualAccessDurationSeconds)}
                />
              </>
            ) : null}
            {action === "Expired" ? (
              <>
                <DetailRow label="Access Started" value={formatDateUTC(details.grantStartedAt)} />
                <DetailRow label="Granted Duration" value={formatAuditDuration(details.grantedDurationSeconds)} />
              </>
            ) : null}
          </Stack>
        ) : null}
      </Box>

      <Box maxWidth="620px">
        <DetailRow label="Reason" value={details.reason} />
      </Box>
    </Stack>
  );
};

const AuditLogEventDetailsView = ({ rowData: event }: AuditLogEventDetailsViewProps) => {
  const jitEvent = normalizeJITAuditEvent(event);

  return (
    <Box role="region" aria-label={`Audit event details for ${event.id}`} sx={{ p: "16px 20px" }}>
      {jitEvent ? (
        <JITDetails jitEvent={jitEvent} />
      ) : (
        <Stack gap="2px">
          <Box maxWidth="620px">
            <DetailRow copyable label="Full message" value={event.message} />
            <DetailRow label="Resource Name" value={event.resourceName} />
            <DetailRow label="Cloud Provider" value={event.cloudProvider} />
            <DetailRow label="Region" value={event.region} />
            <DetailRow label="User Agent" value={event.userAgent} />
          </Box>
          {event.workflowFailures?.length ? (
            <Box mt="12px" width="100%">
              <JSONView
                src={event.workflowFailures}
                theme="isotope"
                enableClipboard={(copy: OnCopyProps) => {
                  navigator.clipboard.writeText(JSON.stringify(copy.src));
                }}
                displayDataTypes={false}
                style={{
                  flex: 1,
                  width: "100%",
                  padding: "16px",
                  borderRadius: "12px",
                  minHeight: "140px",
                  maxHeight: "160px",
                  overflowY: "auto",
                }}
              />
            </Box>
          ) : null}
        </Stack>
      )}
    </Box>
  );
};

export default AuditLogEventDetailsView;

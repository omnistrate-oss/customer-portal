import { FC, useMemo } from "react";
import { CircularProgress, Stack } from "@mui/material";
import { createColumnHelper } from "@tanstack/react-table";
import useAccountConfig from "app/(dashboard)/cloud-accounts/hooks/useAccountConfig";

import DataTable from "src/components/DataTable/DataTable";
import DataGridHeaderTitle from "src/components/Headers/DataGridHeaderTitle";
import RefreshWithToolTip from "src/components/RefreshWithTooltip/RefreshWithToolTip";
import RegionIcon from "src/components/Region/RegionIcon";
import StatusChip from "src/components/StatusChip/StatusChip";
import { Text } from "src/components/Typography/Typography";
import { getAccountConfigStatusStylesAndLabel } from "src/constants/statusChipStyles/accountConfig";
import { AccountConfig } from "src/types/account-config";
import formatDateUTC from "src/utils/formatDateUTC";

type NebiusBinding = NonNullable<AccountConfig["nebiusBindings"]>[number];

// Nebius reports "no expiry" as a zero date rather than omitting the field.
const NO_EXPIRY_MARKERS = new Set(["0001-01-01T00:00:00Z", "1970-01-01T00:00:00Z"]);

const formatKeyExpiry = (raw?: string): string => {
  if (!raw) return "-";
  if (NO_EXPIRY_MARKERS.has(raw)) return "No expiry";
  return formatDateUTC(raw) || "-";
};

const columnHelper = createColumnHelper<NebiusBinding>();

type NebiusBindingsTableHeaderProps = {
  count: number;
  refetch: () => void;
  isFetching: boolean;
};

const NebiusBindingsTableHeader: FC<NebiusBindingsTableHeaderProps> = ({ count, refetch, isFetching }) => (
  <div className="flex items-center justify-between gap-4 py-5 px-6 border-b border-[#EAECF0]">
    <DataGridHeaderTitle
      title="Nebius Bindings"
      desc="The per-region service account bindings configured under this tenant"
      count={count}
      units={{ singular: "Binding", plural: "Bindings" }}
    />

    <div className="flex justify-end items-center gap-4 flex-wrap flex-grow">
      <div className="flex items-center">{isFetching && <CircularProgress size={20} />}</div>
      <RefreshWithToolTip refetch={refetch} disabled={isFetching} />
    </div>
  </div>
);

type NebiusBindingsTableProps = {
  accountConfigId?: string;
};

const NebiusBindingsTable: FC<NebiusBindingsTableProps> = ({ accountConfigId }) => {
  const { data, isFetching, refetch } = useAccountConfig({
    accountConfigId: accountConfigId ?? "",
    enabled: Boolean(accountConfigId),
  });

  const accountConfig = data as AccountConfig | undefined;
  const bindings: NebiusBinding[] = useMemo(() => accountConfig?.nebiusBindings ?? [], [accountConfig]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("projectID", {
        id: "projectID",
        header: "Project ID",
        meta: { minWidth: 220 },
      }),
      columnHelper.accessor("region", {
        id: "region",
        header: "Region",
        cell: (data) =>
          data.row.original.region ? (
            <Stack direction="row" alignItems="center" gap="6px">
              <RegionIcon />
              <Text size="small" weight="regular" color="#535862">
                {data.row.original.region}
              </Text>
            </Stack>
          ) : (
            "-"
          ),
        meta: { minWidth: 140 },
      }),
      columnHelper.accessor("status", {
        id: "status",
        header: "Status",
        cell: (data) => {
          const status = data.row.original.status;
          if (!status) return "-";
          return <StatusChip status={status} {...getAccountConfigStatusStylesAndLabel(status)} />;
        },
        meta: { minWidth: 140 },
      }),
      columnHelper.accessor("serviceAccountID", {
        id: "serviceAccountID",
        header: "Service Account ID",
        meta: { minWidth: 220 },
      }),
      columnHelper.accessor("publicKeyID", {
        id: "publicKeyID",
        header: "Public Key ID",
        meta: { minWidth: 220 },
      }),
      columnHelper.accessor((row) => formatKeyExpiry(row.keyExpiresAt), {
        id: "keyExpiresAt",
        header: "Key Expiry",
        meta: { minWidth: 180 },
      }),
    ],
    []
  );

  return (
    <div data-testid="nebius-bindings-table">
      <DataTable
        columns={columns}
        rows={bindings}
        noRowsText="No Nebius bindings"
        isLoading={isFetching}
        HeaderComponent={NebiusBindingsTableHeader}
        headerProps={{
          count: bindings.length,
          refetch,
          isFetching,
        }}
      />
    </div>
  );
};

export default NebiusBindingsTable;

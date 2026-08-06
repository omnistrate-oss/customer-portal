"use client";

import { useMemo } from "react";
import CheckIcon from "@mui/icons-material/Check";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Box, Stack, Tooltip as MuiTooltip } from "@mui/material";

import Button from "src/components/Button/Button";
import CardWithTitle from "src/components/Card/CardWithTitle";
import Checkbox from "src/components/Checkbox/Checkbox";
import DataGrid from "src/components/DataGrid/DataGrid";
import Autocomplete from "src/components/FormElementsv2/AutoComplete/AutoComplete";
import DataGridHeaderTitle from "src/components/Headers/DataGridHeaderTitle";
import LoadingSpinner from "src/components/LoadingSpinner/LoadingSpinner";
import StatusChip from "src/components/StatusChip/StatusChip";
import { Text } from "src/components/Typography/Typography";
import Tooltip from "components/Tooltip/Tooltip";

import { canImportCloudNativeNetwork, canUnimportCloudNativeNetwork, isBringOwnVpcsSupported } from "../../utils";

import { StyledLink } from "./GrantAccessStep";

export type VpcRecord = {
  id: string;
  name: string;
  status: string;
  region: string;
  statusMessage?: string;
  networkId?: string;
  imported?: boolean;
  inUse?: boolean;
};

export type ConfigureVPCsFormValues = {
  enableNewVpcs: boolean;
  bringOwnVpcs: boolean;
  selectedRegions: string[];
  selectedVpcIds: string[];
};

type ConfigureVPCsStepProps = {
  values: ConfigureVPCsFormValues;
  onChange: (values: Partial<ConfigureVPCsFormValues>) => void;
  availableRegions?: string[];
  availableVpcs?: VpcRecord[];
  isLoadingVpcs?: boolean;
  isFetchingVPCs?: boolean;
  onResync?: () => void;
  onImport?: (vpcIds: string[]) => void;
  onUnimport?: (vpcIds: string[]) => void;
  isImporting?: boolean;
  lastSyncedAt?: string;
  cloudProvider?: string;
  privateConnectivityEnabled?: boolean;
  emptyStateMessage?: string;
  bringOwnVpcsLocked?: boolean;
};

// Map backend VPC status to StatusChip category
const vpcStatusCategoryMap = {
  READY: "success",
  AVAILABLE: "success",
  IN_USE: "inProgress",
  VERIFYING: "inProgress",
  PENDING: "pending",
  FAILED: "failed",
};

const VpcBaseCheckbox = (props: React.ComponentProps<typeof Checkbox>) => (
  <MuiTooltip
    title={props.disabled ? "This VPC is failed or already in use and cannot be selected." : ""}
    placement="top"
    arrow
  >
    <span>
      <Checkbox {...props} />
    </span>
  </MuiTooltip>
);

const VpcsDataGridHeader = ({
  totalCount,
  lastSyncedAt,
  isLoadingVpcs,
  isFetchingVPCs,
  onResync,
  onImport,
  onUnimport,
  isImporting,
  selectedImportIds,
  selectedUnimportIds,
}: {
  totalCount: number;
  lastSyncedAt?: string;
  isLoadingVpcs: boolean;
  isFetchingVPCs: boolean;
  onResync?: () => void;
  onImport?: (vpcIds: string[]) => void;
  onUnimport?: (vpcIds: string[]) => void;
  isImporting: boolean;
  selectedImportIds: string[];
  selectedUnimportIds: string[];
}) => {
  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap="16px"
        sx={{ px: "24px", py: "16px", borderBottom: "1px solid #E9EAEB" }}
      >
        <DataGridHeaderTitle
          title="Choose VPCs"
          desc="Choose among the available VPCs in the selected regions"
          count={totalCount}
          units={{ singular: "VPC", plural: "VPCs" }}
        />
      </Stack>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap="16px"
        sx={{ px: "24px", py: "12px", borderBottom: "1px solid #E9EAEB" }}
      >
        {lastSyncedAt && (
          <Text size="xsmall" weight="regular" color="#535862">
            Last synced: {lastSyncedAt}
          </Text>
        )}

        <Stack alignItems="flex-end" gap="4px">
          <Stack direction="row" alignItems="center" gap="12px">
            <Button
              variant="outlined"
              onClick={onResync}
              disabled={isFetchingVPCs || isLoadingVpcs}
              startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
              data-testid="resync-vpcs-button"
            >
              Resync
            </Button>
            <Tooltip
              title={
                isImporting
                  ? "A VPC update is already in progress."
                  : selectedUnimportIds.length === 0
                    ? "Select an imported VPC that is not in use to unimport it."
                    : ""
              }
            >
              <span>
                <Button
                  variant="outlined"
                  onClick={() => onUnimport?.(selectedUnimportIds)}
                  disabled={isImporting || selectedUnimportIds.length === 0}
                  data-testid="unimport-vpcs-button"
                >
                  Unimport
                  {selectedUnimportIds.length > 0 ? ` (${selectedUnimportIds.length})` : ""}
                </Button>
              </span>
            </Tooltip>
            <Tooltip
              title={
                isImporting
                  ? "A VPC update is already in progress."
                  : selectedImportIds.length === 0
                    ? "Select an available VPC to import it."
                    : ""
              }
            >
              <span>
                <Button
                  variant="contained"
                  onClick={() => onImport?.(selectedImportIds)}
                  disabled={isImporting || selectedImportIds.length === 0}
                  data-testid="import-vpcs-button"
                >
                  Import{selectedImportIds.length > 0 ? ` (${selectedImportIds.length})` : ""}
                </Button>
              </span>
            </Tooltip>
          </Stack>
        </Stack>
      </Stack>
    </>
  );
};

const ConfigureVPCsStep: React.FC<ConfigureVPCsStepProps> = ({
  values,
  onChange,
  availableRegions = [],
  availableVpcs = [],
  isLoadingVpcs = false,
  isFetchingVPCs = false,
  onResync,
  onImport,
  onUnimport,
  isImporting = false,
  lastSyncedAt,
  cloudProvider = "aws",
  privateConnectivityEnabled = false,
  emptyStateMessage = "No VPCs found for the selected regions. Click Resync to fetch.",
  bringOwnVpcsLocked = false,
}) => {
  // The checkbox renders unchecked on unsupported providers, so gate the panel on the same
  // condition — otherwise the region/VPC picker stays visible under an unchecked box.
  const showVpcSelection = isBringOwnVpcsSupported(cloudProvider) && values.bringOwnVpcs;
  const selectableVpcIds = useMemo(
    () =>
      new Set(
        availableVpcs
          .filter((vpc) => canImportCloudNativeNetwork(vpc) || canUnimportCloudNativeNetwork(vpc))
          .map((vpc) => vpc.id)
      ),
    [availableVpcs]
  );
  const selectedImportIds = values.selectedVpcIds.filter((id) => {
    const vpc = availableVpcs.find((item) => item.id === id);
    return vpc && canImportCloudNativeNetwork(vpc);
  });
  const selectedUnimportIds = values.selectedVpcIds.filter((id) => {
    const vpc = availableVpcs.find((item) => item.id === id);
    return vpc && canUnimportCloudNativeNetwork(vpc);
  });

  const vpcColumns = useMemo(
    () => [
      {
        field: "name",
        headerName: "Name",
        flex: 1,
        minWidth: 180,
        renderCell: (params) => (
          <Text
            size="small"
            weight="medium"
            color="#101828"
            sx={{
              width: "100%",
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "block",
            }}
            title={params.row.name}
          >
            {params.row.name}
          </Text>
        ),
      },
      {
        field: "status",
        headerName: "Status",
        flex: 0.6,
        minWidth: 90,
        renderCell: (params) => (
          <StatusChip status={params.row.status} category={vpcStatusCategoryMap[params.row.status] || "unknown"} />
        ),
      },

      {
        field: "region",
        headerName: "Regions",
        flex: 0.55,
        minWidth: 110,
        valueGetter: (params) => params.row.region || "-",
      },
      {
        field: "imported",
        headerName: "Imported",
        flex: 0.55,
        minWidth: 80,
        valueGetter: (params) => (params.row.imported ? "Yes" : "No"),
      },
      {
        field: "inUse",
        headerName: "In Use",
        flex: 0.55,
        minWidth: 70,
        valueGetter: (params) => (params.row.inUse ? "Yes" : "No"),
      },
      {
        field: "networkId",
        headerName: "Network ID",
        flex: 1,
        minWidth: 180,
        renderCell: (params) => (
          <Text
            size="small"
            weight="regular"
            color="#344054"
            sx={{
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "block",
            }}
            title={params.row.networkId}
          >
            {params.row.networkId || "-"}
          </Text>
        ),
      },
      {
        field: "statusMessage",
        headerName: "Status Message",
        flex: 1.2,
        minWidth: 220,
        renderCell: (params) => (
          <Text
            size="small"
            weight="regular"
            color="#344054"
            sx={{
              width: "100%",
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "block",
            }}
            title={params.row.statusMessage}
          >
            {params.row.statusMessage || "Available for deployments"}
          </Text>
        ),
      },
    ],
    []
  );

  return (
    <Stack gap="20px">
      <CardWithTitle
        title="VPC Configuration"
        description={
          <>
            <Text size="small" weight="regular" color="#535862">
              Configure network settings for your workloads by allowing automatically managed VPCs or importing custom
              VPCs across selected regions
            </Text>
            {privateConnectivityEnabled && (
              <Text size="small" weight="regular" color="#535862">
                <Text size="small" weight="semibold" color="#344054" sx={{ display: "inline" }}>
                  Private Link is enabled -
                </Text>{" "}
                <StyledLink href="https://docs.omnistrate.com/operate-guides/byoc-cloud-accounts/#imported-vpc-requirements-for-byoc-privatelink">
                  View VPC configuration instructions for Private Link
                </StyledLink>
              </Text>
            )}
          </>
        }
      >
        <Stack gap="16px">
          {/* Enable new VPCs */}
          {(() => {
            const canUncheckNewVpcs = values.bringOwnVpcs;
            return (
              <Stack direction="row" alignItems="center" gap="12px">
                <Tooltip
                  title={
                    !canUncheckNewVpcs && values.enableNewVpcs
                      ? "Keep Bring your own VPCs enabled before disabling new VPC creation"
                      : ""
                  }
                  placement="top"
                  arrow
                >
                  <span>
                    <Checkbox
                      data-testid="enable-new-vpcs-checkbox"
                      checked={values.enableNewVpcs}
                      onChange={(e) => {
                        if (!e.target.checked && !values.bringOwnVpcs) return;
                        onChange({ enableNewVpcs: e.target.checked });
                      }}
                      disabled={!canUncheckNewVpcs}
                      checkedIcon={
                        <Box
                          className="bring-own-vpcs-checked-icon"
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#7F56D9",
                            color: "#FFFFFF",
                          }}
                        >
                          <CheckIcon sx={{ fontSize: 16 }} />
                        </Box>
                      }
                      sx={{
                        p: 0,
                        "&.Mui-disabled.Mui-checked .bring-own-vpcs-checked-icon": {
                          backgroundColor: "#D6BBFB",
                          border: "1px solid #D0D5DD",
                        },
                      }}
                    />
                  </span>
                </Tooltip>

                <Text size="small" weight="medium">
                  Enable creating new VPCs (enabled by default)
                </Text>
              </Stack>
            );
          })()}

          {/* Bring own VPCs – only available for supported cloud providers */}
          {(() => {
            const isBringOwnVpcsEnabledForProvider = isBringOwnVpcsSupported(cloudProvider);
            return (
              <Stack direction="row" alignItems="center" gap="12px">
                <Tooltip
                  title={
                    !isBringOwnVpcsEnabledForProvider
                      ? "Bring your own VPCs is currently available for AWS, GCP, and Azure only"
                      : bringOwnVpcsLocked
                        ? "Bring your own VPCs is enabled because cloud-native VPCs are available."
                        : !values.enableNewVpcs && values.bringOwnVpcs
                          ? "Keep new VPC creation enabled before disabling Bring your own VPCs"
                          : ""
                  }
                  placement="top"
                  arrow
                >
                  <span>
                    <Checkbox
                      data-testid="bring-own-vpcs-checkbox"
                      checked={isBringOwnVpcsEnabledForProvider && values.bringOwnVpcs}
                      onChange={(e) => {
                        if (!e.target.checked && !values.enableNewVpcs) return;
                        onChange({ bringOwnVpcs: e.target.checked });
                      }}
                      disabled={!isBringOwnVpcsEnabledForProvider || bringOwnVpcsLocked}
                      checkedIcon={
                        <Box
                          className="bring-own-vpcs-checked-icon"
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#7F56D9",
                            color: "#FFFFFF",
                          }}
                        >
                          <CheckIcon sx={{ fontSize: 16 }} />
                        </Box>
                      }
                      sx={{
                        p: 0,
                        "&.Mui-disabled.Mui-checked .bring-own-vpcs-checked-icon": {
                          backgroundColor: "#D6BBFB",
                          border: "1px solid #D0D5DD",
                        },
                      }}
                    />
                  </span>
                </Tooltip>

                <Text size="small" weight="medium" color={isBringOwnVpcsEnabledForProvider ? "#344054" : "#98A2B3"}>
                  Bring your own VPCs for deployments
                </Text>
              </Stack>
            );
          })()}

          {/* Regions selector – shown when bringOwnVpcs is checked */}
          {isLoadingVpcs ? (
            <LoadingSpinner />
          ) : showVpcSelection ? (
            <Stack gap="8px">
              <Text size="small" weight="medium" color="#344054">
                Regions
              </Text>
              <Text size="xsmall" weight="regular" color="#535862">
                Select regions
              </Text>
              <Autocomplete
                multiple
                options={availableRegions}
                value={values.selectedRegions}
                onChange={(_, newValue) => onChange({ selectedRegions: newValue, selectedVpcIds: [] })}
                disableCloseOnSelect
                placeholder="Select regions"
                data-testid="regions-autocomplete"
              />

              {/* VPCs table */}
              {values.selectedRegions.length > 0 ? (
                <DataGrid
                  autoHeight
                  checkboxSelection
                  disableSelectionOnClick
                  getRowId={(row) => row.id}
                  columns={vpcColumns}
                  rows={isFetchingVPCs || isLoadingVpcs ? [] : availableVpcs}
                  selectionModel={values.selectedVpcIds}
                  onSelectionModelChange={(newSelection) => {
                    onChange({ selectedVpcIds: (newSelection as string[]).filter((id) => selectableVpcIds.has(id)) });
                  }}
                  enableSelectAll
                  isRowSelectable={(params) => selectableVpcIds.has(params.row.id)}
                  components={{
                    Header: VpcsDataGridHeader,
                    BaseCheckbox: VpcBaseCheckbox,
                  }}
                  componentsProps={{
                    header: {
                      totalCount: availableVpcs.length,
                      lastSyncedAt,
                      isLoadingVpcs,
                      isFetchingVPCs,
                      onResync,
                      onImport,
                      onUnimport,
                      isImporting,
                      selectedImportIds,
                      selectedUnimportIds,
                    },
                  }}
                  loading={isLoadingVpcs || isFetchingVPCs}
                  noRowsText={isLoadingVpcs || isFetchingVPCs ? "Loading VPCs…" : emptyStateMessage}
                  sx={{
                    mt: "8px",
                    borderRadius: "8px",
                    boxShadow: "none",
                    overflowX: "auto",
                    "& .MuiDataGrid-virtualScroller": {
                      overflowX: "auto",
                      overflowY: "hidden",
                    },
                    "& .MuiDataGrid-main": {
                      minHeight: 0,
                    },
                    "& .MuiDataGrid-columnHeaderCheckbox": {
                      paddingLeft: "24px !important",
                    },
                    "& .MuiDataGrid-cellCheckbox": {
                      paddingLeft: "24px !important",
                    },
                  }}
                />
              ) : (
                <Box
                  sx={{
                    mt: "8px",
                    minHeight: "96px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid #E9EAEB",
                    borderRadius: "8px",
                    bgcolor: "#F9FAFB",
                  }}
                >
                  <Text size="small" weight="regular" color="#667085">
                    {values.selectedRegions.length === 0 ? "No regions selected." : emptyStateMessage}
                  </Text>
                </Box>
              )}
            </Stack>
          ) : null}
        </Stack>
      </CardWithTitle>
    </Stack>
  );
};

export default ConfigureVPCsStep;

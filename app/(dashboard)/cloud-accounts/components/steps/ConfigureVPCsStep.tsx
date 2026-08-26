"use client";

import CheckIcon from "@mui/icons-material/Check";
import { Box, Tooltip as MuiTooltip, Stack } from "@mui/material";
import { useMemo } from "react";

import Tooltip from "components/Tooltip/Tooltip";
import Button from "src/components/Button/Button";
import CardWithTitle from "src/components/Card/CardWithTitle";
import Checkbox from "src/components/Checkbox/Checkbox";
import LoadingSpinnerSmall from "src/components/CircularProgress/CircularProgress";
import DataGrid from "src/components/DataGrid/DataGrid";
import DataGridText from "src/components/DataGrid/DataGridText";
import Autocomplete from "src/components/FormElementsv2/AutoComplete/AutoComplete";
import DataGridHeaderTitle from "src/components/Headers/DataGridHeaderTitle";
import RefreshIcon from "src/components/Icons/Refresh/Refresh";
import LoadingSpinner from "src/components/LoadingSpinner/LoadingSpinner";
import StatusChip from "src/components/StatusChip/StatusChip";
import { Text } from "src/components/Typography/Typography";

import { canImportCloudNativeNetwork, canUnimportCloudNativeNetwork, isBringOwnVpcsSupported } from "../../utils";

import { StyledLink } from "./GrantAccessStep";

export type VpcRecord = {
  id: string;
  name?: string;
  status: string;
  region: string;
  statusMessage?: string;
  networkId?: string;
  cidr?: string;
  imported?: boolean;
  inUse?: boolean;
};

export type ConfigureVPCsFormValues = {
  enableNewVpcs: boolean;
  bringOwnVpcs: boolean;
  selectedRegions: string[];
  selectedVpcIds: string[];
};

export const getVpcBooleanChipProps = (value: boolean) => ({
  label: value ? "Yes" : "No",
  category: value ? ("success" as const) : ("unknown" as const),
});

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
  isLoadingVpcs: boolean;
  isFetchingVPCs: boolean;
  onResync?: () => void;
  onImport?: (vpcIds: string[]) => void;
  onUnimport?: (vpcIds: string[]) => void;
  isImporting: boolean;
  selectedImportIds: string[];
  selectedUnimportIds: string[];
}) => {
  const selectedVpcs = selectedImportIds.length + selectedUnimportIds.length;
  const hasMixedSelection = selectedImportIds.length > 0 && selectedUnimportIds.length > 0;
  const importDisabledMessage = isImporting
    ? "A VPC update is already in progress."
    : hasMixedSelection
      ? "Select only import or unimport VPCs at a time."
      : selectedVpcs === 0
        ? "Select an available VPC to import it."
        : selectedImportIds.length === 0
          ? "Only available VPCs can be imported."
          : "";
  const unimportDisabledMessage = isImporting
    ? "A VPC update is already in progress."
    : hasMixedSelection
      ? "Select only import or unimport VPCs at a time."
      : selectedVpcs === 0
        ? "Select an imported VPC that is not in use to unimport it."
        : selectedUnimportIds.length === 0
          ? "Only imported VPCs that are not in use can be unimported."
          : "";

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

        <Stack alignItems="flex-end" gap="4px">
          <Stack direction="row" alignItems="center" gap="12px">
            <RefreshIcon
              width={18}
              height={18}
              onClick={isFetchingVPCs || isLoadingVpcs ? undefined : onResync}
              disabled={isFetchingVPCs || isLoadingVpcs}
              data-testid="resync-vpcs-button"
              style={{
                cursor: isFetchingVPCs || isLoadingVpcs ? "default" : "pointer",
              }}
            />

            <Button
              variant="contained"
              size="small"
              onClick={() => onUnimport?.(selectedUnimportIds)}
              disabled={isImporting || hasMixedSelection || selectedUnimportIds.length === 0}
              disabledMessage={unimportDisabledMessage}
              data-testid="unimport-vpcs-button"
              sx={{ minWidth: "120px" }}
            >
              Unimport
              {selectedUnimportIds.length > 0 && isImporting ? (
                <LoadingSpinnerSmall />
              ) : selectedUnimportIds.length > 0 ? (
                ` (${selectedUnimportIds.length})`
              ) : (
                ""
              )}
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => onImport?.(selectedImportIds)}
              disabled={isImporting || hasMixedSelection || selectedImportIds.length === 0}
              disabledMessage={importDisabledMessage}
              data-testid="import-vpcs-button"
              sx={{ minWidth: "120px" }}
            >
              Import
              {selectedImportIds.length > 0 && isImporting ? (
                <LoadingSpinnerSmall />
              ) : selectedImportIds.length > 0 ? (
                ` (${selectedImportIds.length})`
              ) : (
                ""
              )}
            </Button>
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
        minWidth: 90,
        renderCell: (params) => (
          <StatusChip {...getVpcBooleanChipProps(params.row.imported)} data-testid="vpc-imported-chip" />
        ),
      },
      {
        field: "inUse",
        headerName: "In Use",
        flex: 0.55,
        minWidth: 70,
        renderCell: (params) => (
          <StatusChip {...getVpcBooleanChipProps(params.row.inUse)} data-testid="vpc-in-use-chip" />
        ),
      },
      {
        field: "networkId",
        headerName: "Network ID",
        flex: 1,
        minWidth: 180,
        renderCell: (params) => (
          <DataGridText showCopyButton={Boolean(params.row.networkId)}>{params.row.networkId || "-"}</DataGridText>
        ),
      },
      {
        field: "cidr",
        headerName: "CIDR",
        minWidth: 130,
        flex: 0.8,
        valueGetter: (params) => params.row.cidr || "-",
      },
      {
        field: "statusMessage",
        headerName: "Status Message",
        flex: 1.2,
        minWidth: 220,
        valueGetter: (params) => params.row.statusMessage || "-",
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
              <Stack direction="row" alignItems="flex-start" gap="12px">
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

                <Stack gap="2px">
                  <Text size="small" weight="medium">
                    Enable creating new VPCs
                  </Text>
                  <Text size="xsmall" weight="regular" color="#535862">
                    Automatically create new VPCs for deployments when needed
                  </Text>
                </Stack>
              </Stack>
            );
          })()}

          {/* Bring own VPCs – only available for supported cloud providers */}
          {(() => {
            const isBringOwnVpcsEnabledForProvider = isBringOwnVpcsSupported(cloudProvider);
            return (
              <Stack direction="row" alignItems="flex-start" gap="12px">
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

                <Stack gap="2px">
                  <Text size="small" weight="medium" color={isBringOwnVpcsEnabledForProvider ? "#344054" : "#98A2B3"}>
                    Bring your own VPCs for deployments
                  </Text>
                  <Text size="xsmall" weight="regular" color={isBringOwnVpcsEnabledForProvider ? "#535862" : "#98A2B3"}>
                    Import VPCs from this cloud account for use in deployments
                  </Text>
                </Stack>
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

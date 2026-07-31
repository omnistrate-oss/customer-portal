"use client";

import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Autocomplete, Box, Chip, Tooltip as MuiTooltip, Stack, TextField } from "@mui/material";
import { useMemo, useState } from "react";

import Tooltip from "components/Tooltip/Tooltip";
import Button from "src/components/Button/Button";
import CardWithTitle from "src/components/Card/CardWithTitle";
import Checkbox from "src/components/Checkbox/Checkbox";
import DataGrid from "src/components/DataGrid/DataGrid";
import DataGridHeaderTitle from "src/components/Headers/DataGridHeaderTitle";
import StatusChip from "src/components/StatusChip/StatusChip";
import { Text } from "src/components/Typography/Typography";

import { canImportCloudNativeNetwork, canUnimportCloudNativeNetwork, isBringOwnVpcsSupported } from "../../utils";

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

const InstructionItem = ({
  number,
  title,
  description,
  expandLabel,
  children,
  forceOpen = false,
}: {
  number: number;
  title: string;
  description: string;
  expandLabel: string;
  children: React.ReactNode;
  forceOpen?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const isOpen = forceOpen || open;

  return (
    <Stack gap="10px">
      <Stack direction="row" alignItems="flex-start" gap="12px">
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            border: "1px solid #D0D5DD",
            bgcolor: "#F9FAFB",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Text size="xsmall" weight="semibold" color="#344054">
            {number}
          </Text>
        </Box>
        <Box flex={1}>
          <Text size="small" weight="semibold" color="#101828">
            {title}{" "}
            <Text size="small" weight="regular" color="#344054" sx={{ display: "inline" }}>
              - {description}
            </Text>
          </Text>
        </Box>
      </Stack>
      <Box sx={{ ml: "36px" }}>
        <Stack direction="row" alignItems="center" gap="4px" sx={{ cursor: "pointer" }} onClick={() => setOpen(!open)}>
          <Text size="small" weight="medium" color="#667085">
            {isOpen ? expandLabel.replace(/^Show|^View|^Check/, "Hide") : expandLabel}
          </Text>
          {isOpen ? (
            <KeyboardArrowUpIcon sx={{ color: "#344054", fontSize: 18 }} />
          ) : (
            <KeyboardArrowDownIcon sx={{ color: "#344054", fontSize: 18 }} />
          )}
        </Stack>
        {isOpen && (
          <Box
            sx={{
              mt: "8px",
              p: "12px",
              border: "1px solid #E9EAEB",
              borderRadius: "8px",
              bgcolor: "#F9FAFB",
            }}
          >
            {children}
          </Box>
        )}
      </Box>
    </Stack>
  );
};

const InstructionPanel = ({ children }: { children: React.ReactNode }) => (
  <Stack
    gap="8px"
    sx={{
      p: "12px",
      border: "1px solid #E9EAEB",
      borderRadius: "8px",
      bgcolor: "#F9FAFB",
    }}
  >
    {children}
  </Stack>
);

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

const CodeBlock = ({ label, children }: { label?: string; children: React.ReactNode }) => (
  <Box>
    {label && (
      <Text size="xsmall" weight="medium" color="#667085" sx={{ mb: "6px" }}>
        {label}
      </Text>
    )}
    <Box
      component="pre"
      sx={{
        m: 0,
        p: "12px 24px",
        border: "1px solid #E9EAEB",
        borderRadius: "8px",
        bgcolor: "#F5F5F5",
        color: "#344054",
        fontFamily: "monospace",
        fontSize: "13px",
        lineHeight: 1.45,
        whiteSpace: "pre-wrap",
      }}
    >
      {children}
    </Box>
  </Box>
);

const VpcsDataGridHeader = ({
  totalCount,
  lastSyncedAt,
  isLoadingVpcs,
  onResync,
}: {
  totalCount: number;
  lastSyncedAt?: string;
  isLoadingVpcs: boolean;
  onResync?: () => void;
}) => {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      gap="16px"
      sx={{ px: "24px", py: "20px", borderBottom: "1px solid #E9EAEB" }}
    >
      <DataGridHeaderTitle
        title="Choose VPCs"
        desc="Choose among the available VPCs in the selected regions"
        count={totalCount}
        units={{ singular: "VPC", plural: "VPCs" }}
      />
      <Stack direction="row" alignItems="center" gap="12px">
        {lastSyncedAt && (
          <Text size="xsmall" weight="regular" color="#535862">
            Last synced: {lastSyncedAt}
          </Text>
        )}
        <Button
          variant="outlined"
          onClick={onResync}
          disabled={isLoadingVpcs}
          startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
          data-testid="resync-vpcs-button"
        >
          Resync
        </Button>
      </Stack>
    </Stack>
  );
};

const ConfigureVPCsStep: React.FC<ConfigureVPCsStepProps> = ({
  values,
  onChange,
  availableRegions = [],
  availableVpcs = [],
  isLoadingVpcs = false,
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
  const [showAllInstructions, setShowAllInstructions] = useState(false);
  const [showKubernetesInstructions, setShowKubernetesInstructions] = useState(false);

  const isAwsWithPrivateConnect = cloudProvider === "aws" && privateConnectivityEnabled;
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
        minWidth: 140,
        renderCell: (params) => (
          <StatusChip status={params.row.status} category={vpcStatusCategoryMap[params.row.status] || "unknown"} />
        ),
      },

      {
        field: "imported",
        headerName: "Imported",
        flex: 0.55,
        minWidth: 110,
        valueGetter: (params) => (params.row.imported ? "Yes" : "No"),
      },
      {
        field: "inUse",
        headerName: "In use",
        flex: 0.55,
        minWidth: 100,
        valueGetter: (params) => (params.row.inUse ? "Yes" : "No"),
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
        field: "cidr",
        headerName: "CIDR",
        flex: 1,
        minWidth: 100,
      },
    ],
    []
  );

  const privateConnectInstructions = [
    {
      title: "Enable VPC DNS",
      description: "Required for private endpoint name resolution.",
      expandLabel: "Show DNS settings",
      content: (
        <InstructionPanel>
          <CodeBlock label="VPC settings">{`enableDnsHostnames = true
enableDnsSupport   = true`}</CodeBlock>
        </InstructionPanel>
      ),
    },
    {
      title: "Tag VPC and workload subnets",
      description: "Used to identify where private workloads run.",
      expandLabel: "Show instructions",
      content: (
        <InstructionPanel>
          <CodeBlock label="Tag">{`{managed-by-tag-key} = {managed-by-tag-value}`}</CodeBlock>
          <CodeBlock>Only tag the subnets where workloads should be deployed.</CodeBlock>
        </InstructionPanel>
      ),
    },
    {
      title: "Confirm outbound access",
      description: "Choose NAT, Transit Gateway, VPN, or Direct Connect",
      expandLabel: "View outbound access options",
      content: (
        <InstructionPanel>
          <CodeBlock>{`Required for
* Container image pulls
* Helm chart downloads
* Deployment bootstrap dependencies`}</CodeBlock>
          <CodeBlock>{`Choose one
* NAT Gateway
* Transit Gateway
* VPN
* Direct Connect`}</CodeBlock>
        </InstructionPanel>
      ),
    },
    {
      title: "Create the Interface VPC Endpoint",
      description: "Use the provided PrivateLink service name.",
      expandLabel: "Show instructions",
      content: (
        <InstructionPanel>
          <Text size="small" weight="semibold" color="#344054">
            Create an Interface VPC Endpoint for the provided PrivateLink service.
          </Text>
          <CodeBlock label="Required endpoint tag">Name = {"{private-endpoint-name}"}</CodeBlock>
          <CodeBlock label="Allow inbound from your VPC CIDR">TCP 8443-8506 from your VPC CIDR</CodeBlock>
        </InstructionPanel>
      ),
    },
    {
      title: "Review cross-region setup (if applicable)",
      description: "Only shown when regions differ.",
      expandLabel: "Check cross-region requirements",
      content: (
        <Stack gap="10px">
          <InstructionPanel>
            <CodeBlock label="AWS CLI">--service-region &lt;region&gt;</CodeBlock>
            <CodeBlock label="Terraform">service_region = &quot;&lt;region&gt;&quot;</CodeBlock>
          </InstructionPanel>
          <CodeBlock>Do not enable private DNS for cross-region Interface VPC Endpoints.</CodeBlock>
        </Stack>
      ),
    },
  ];

  return (
    <Stack gap="20px">
      <CardWithTitle title="VPC Configuration">
        <Stack gap="16px">
          {/* Enable new VPCs */}
          {(() => {
            const canUncheckNewVpcs = values.bringOwnVpcs;
            return (
              <Stack direction="row" alignItems="center" gap="12px">
                <Tooltip
                  title={!canUncheckNewVpcs && values.enableNewVpcs ? "At least one VPC option must be enabled" : ""}
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
                      sx={{ p: 0 }}
                    />
                  </span>
                </Tooltip>

                <Text size="small" weight="medium" color={!canUncheckNewVpcs ? "#98A2B3" : "#344054"}>
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
                          ? "At least one VPC option must be enabled"
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
                      sx={{ p: 0 }}
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
          {values.bringOwnVpcs && (
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
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option}
                      label={option}
                      size="small"
                      sx={{
                        borderRadius: "6px",
                        border: "1px solid #D0D5DD",
                        height: "24px",
                      }}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={values.selectedRegions.length === 0 ? "Select regions" : ""}
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                      },
                    }}
                  />
                )}
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
                  rows={isLoadingVpcs ? [] : availableVpcs}
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
                      onResync,
                    },
                  }}
                  loading={isLoadingVpcs}
                  noRowsText={isLoadingVpcs ? "Loading VPCs…" : emptyStateMessage}
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

              {/* Import / Unimport buttons */}
              <Stack direction="row" justifyContent="flex-end" gap="12px" sx={{ mt: "16px" }}>
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
          )}
        </Stack>
      </CardWithTitle>

      {/* Private connectivity instructions – shown for AWS with private connectivity */}
      {isAwsWithPrivateConnect && values.bringOwnVpcs && (
        <CardWithTitle
          title="Instructions to configure VPCs for private connectivity"
          actionButton={
            <Button
              variant="outlined"
              endIcon={
                showAllInstructions ? (
                  <KeyboardArrowUpIcon sx={{ fontSize: 16 }} />
                ) : (
                  <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
                )
              }
              onClick={() => setShowAllInstructions(!showAllInstructions)}
            >
              {showAllInstructions ? "Hide all instructions" : "Show all instructions"}
            </Button>
          }
        >
          <Stack gap="16px">
            {privateConnectInstructions.map((inst, idx) => (
              <InstructionItem
                key={idx}
                number={idx + 1}
                title={inst.title}
                description={inst.description}
                expandLabel={inst.expandLabel}
                forceOpen={showAllInstructions}
              >
                {inst.content}
              </InstructionItem>
            ))}
            <Stack direction="row" alignItems="center" sx={{ pt: "4px" }}>
              <Text size="small" weight="semibold" color="#344054" sx={{ pr: "10px" }}>
                Optional add-on
              </Text>
              <Box sx={{ height: "1px", bgcolor: "#E9EAEB", flex: 1 }} />
            </Stack>
            <Box sx={{ pl: "28px" }}>
              <Stack gap="10px">
                <Stack direction="row" alignItems="center" gap="4px" flexWrap="wrap">
                  <Text size="small" weight="semibold" color="#101828">
                    Add Kubernetes subnet tags
                  </Text>
                  <Chip
                    label="Optional"
                    size="small"
                    sx={{
                      height: 22,
                      bgcolor: "#F2F4F7",
                      color: "#344054",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  />
                  <Text size="small" weight="regular" color="#344054">
                    - Add this tag if you plan to use internal load balancers.
                  </Text>
                </Stack>
                <Stack
                  direction="row"
                  alignItems="center"
                  gap="4px"
                  sx={{ cursor: "pointer" }}
                  onClick={() => setShowKubernetesInstructions((prev) => !prev)}
                >
                  <Text size="small" weight="medium" color="#667085">
                    {showKubernetesInstructions ? "Hide how to" : "Show me how"}
                  </Text>
                  {showKubernetesInstructions ? (
                    <KeyboardArrowUpIcon sx={{ color: "#344054", fontSize: 18 }} />
                  ) : (
                    <KeyboardArrowDownIcon sx={{ color: "#344054", fontSize: 18 }} />
                  )}
                </Stack>
                {showKubernetesInstructions && (
                  <InstructionPanel>
                    <CodeBlock label="For private subnets">kubernetes.io/role/internal-elb = 1</CodeBlock>
                    <CodeBlock label="For public subnets">kubernetes.io/role/elb = 1</CodeBlock>
                  </InstructionPanel>
                )}
              </Stack>
            </Box>
          </Stack>
        </CardWithTitle>
      )}
    </Stack>
  );
};

export default ConfigureVPCsStep;

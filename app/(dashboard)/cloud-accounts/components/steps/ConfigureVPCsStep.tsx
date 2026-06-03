"use client";

import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Autocomplete, Box, Checkbox, Chip, Stack, TextField } from "@mui/material";
import { useState } from "react";

import Tooltip from "components/Tooltip/Tooltip";
import Button from "src/components/Button/Button";
import CardWithTitle from "src/components/Card/CardWithTitle";
import StatusChip from "src/components/StatusChip/StatusChip";
import { Text } from "src/components/Typography/Typography";

export type VpcRecord = {
  id: string;
  name: string;
  status: string;
  statusMessage?: string;
  networkId?: string;
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
}) => {
  const [showAllInstructions, setShowAllInstructions] = useState(false);
  const [showKubernetesInstructions, setShowKubernetesInstructions] = useState(false);

  const selectedVpcs = availableVpcs.filter((v) => values.selectedVpcIds.includes(v.id));

  const isAwsWithPrivateConnect = cloudProvider === "aws" && privateConnectivityEnabled;

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
            <CodeBlock label="Terraform">service_region = "&lt;region&gt;"</CodeBlock>
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
              <Tooltip
                title={!canUncheckNewVpcs && values.enableNewVpcs ? "At least one VPC option must be enabled" : ""}
                placement="top"
                arrow
              >
                <Stack direction="row" alignItems="center" gap="12px">
                  <Checkbox
                    data-testid="enable-new-vpcs-checkbox"
                    checked={values.enableNewVpcs}
                    onChange={(e) => {
                      if (!e.target.checked && !values.bringOwnVpcs) return;
                      onChange({ enableNewVpcs: e.target.checked });
                    }}
                    sx={{
                      p: 0,
                      color: "#D0D5DD",
                      "&.Mui-checked": { color: "#7F56D9" },
                    }}
                  />
                  <Text size="small" weight="medium" color="#344054">
                    Enable creating new VPCs (enabled by default)
                  </Text>
                </Stack>
              </Tooltip>
            );
          })()}

          {/* Bring own VPCs – only available for AWS and GCP */}
          {(() => {
            const isBringOwnVpcsSupported = cloudProvider === "aws" || cloudProvider === "gcp";
            return (
              <Tooltip
                title={
                  !isBringOwnVpcsSupported
                    ? "Bring your own VPCs is currently available for AWS and GCP only"
                    : !values.enableNewVpcs && values.bringOwnVpcs
                      ? "At least one VPC option must be enabled"
                      : ""
                }
                placement="top"
                arrow
              >
                <Stack direction="row" alignItems="center" gap="12px">
                  <Checkbox
                    data-testid="bring-own-vpcs-checkbox"
                    checked={isBringOwnVpcsSupported && values.bringOwnVpcs}
                    onChange={(e) => {
                      if (!e.target.checked && !values.enableNewVpcs) return;
                      onChange({ bringOwnVpcs: e.target.checked });
                    }}
                    disabled={!isBringOwnVpcsSupported}
                    sx={{
                      p: 0,
                      color: "#D0D5DD",
                      "&.Mui-checked": { color: "#7F56D9" },
                    }}
                  />
                  <Text size="small" weight="medium" color={isBringOwnVpcsSupported ? "#344054" : "#98A2B3"}>
                    Bring your own VPCs for deployments
                  </Text>
                </Stack>
              </Tooltip>
            );
          })()}

          {/* Regions selector – shown when bringOwnVpcs is checked */}
          {values.bringOwnVpcs && (
            <Stack gap="8px">
              <Stack direction="row" alignItems="center" gap="4px">
                <Text size="small" weight="medium" color="#344054">
                  Regions
                </Text>
                <Text size="small" weight="regular" color="#B42318">
                  *
                </Text>
              </Stack>
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
              {values.selectedRegions.length > 0 && (
                <Box
                  sx={{
                    border: "1px solid #E9EAEB",
                    borderRadius: "12px",
                    overflow: "hidden",
                    mt: "8px",
                  }}
                >
                  {/* Table header */}
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ px: "16px", py: "12px", borderBottom: "1px solid #E9EAEB" }}
                  >
                    <Stack direction="row" alignItems="center" gap="8px">
                      <Text size="small" weight="semibold" color="#101828">
                        Choose VPCs
                      </Text>
                      {selectedVpcs.length > 0 && (
                        <Box
                          sx={{
                            bgcolor: "#F9F5FF",
                            borderRadius: "16px",
                            px: "8px",
                            py: "2px",
                          }}
                        >
                          <Text size="xsmall" weight="medium" color="#6941C6">
                            {selectedVpcs.length} VPC{selectedVpcs.length !== 1 ? "s" : ""}
                          </Text>
                        </Box>
                      )}
                    </Stack>
                    <Stack direction="row" alignItems="center" gap="12px">
                      {lastSyncedAt && (
                        <Text size="xsmall" weight="regular" color="#535862">
                          Last synced: {lastSyncedAt}
                        </Text>
                      )}
                      <Button
                        variant="outlined"
                        sx={{
                          height: "32px !important",
                          padding: "6px 12px !important",
                          minWidth: "unset",
                        }}
                        onClick={onResync}
                        disabled={isLoadingVpcs}
                        startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
                        data-testid="resync-vpcs-button"
                      >
                        Resync
                      </Button>
                    </Stack>
                  </Stack>

                  <Text size="xsmall" weight="regular" color="#535862" sx={{ px: "16px", py: "8px", display: "block" }}>
                    Choose among the available VPCs in the selected regions
                  </Text>

                  {/* Table */}
                  <Box sx={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #E9EAEB" }}>
                          <th style={{ width: 40, padding: "8px 16px" }} />
                          {["Name", "Status", "Status Message", "Network ID"].map((col) => (
                            <th
                              key={col}
                              style={{
                                padding: "8px 16px",
                                textAlign: "left",
                                fontSize: 12,
                                fontWeight: 500,
                                color: "#535862",
                              }}
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {isLoadingVpcs ? (
                          <tr>
                            <td colSpan={5} style={{ padding: "24px", textAlign: "center" }}>
                              <Text size="small" weight="regular" color="#535862">
                                Loading VPCs…
                              </Text>
                            </td>
                          </tr>
                        ) : availableVpcs.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ padding: "24px", textAlign: "center" }}>
                              <Text size="small" weight="regular" color="#535862">
                                No VPCs found for the selected regions. Click Resync to fetch.
                              </Text>
                            </td>
                          </tr>
                        ) : (
                          availableVpcs.map((vpc) => {
                            const isSelected = values.selectedVpcIds.includes(vpc.id);
                            return (
                              <tr
                                key={vpc.id}
                                style={{
                                  borderBottom: "1px solid #E9EAEB",
                                  background: isSelected ? "#FAFAFA" : "white",
                                }}
                              >
                                <td style={{ padding: "8px 16px" }}>
                                  <Checkbox
                                    data-testid={`vpc-checkbox-${vpc.id}`}
                                    checked={isSelected}
                                    onChange={(e) => {
                                      const newIds = e.target.checked
                                        ? [...values.selectedVpcIds, vpc.id]
                                        : values.selectedVpcIds.filter((id) => id !== vpc.id);
                                      onChange({ selectedVpcIds: newIds });
                                    }}
                                    sx={{
                                      p: 0,
                                      color: "#D0D5DD",
                                      "&.Mui-checked": { color: "#7F56D9" },
                                    }}
                                  />
                                </td>
                                <td style={{ padding: "8px 16px" }}>
                                  <Text size="small" weight="medium" color="#101828">
                                    {vpc.name}
                                  </Text>
                                </td>
                                <td style={{ padding: "8px 16px" }}>
                                  <StatusChip
                                    status={vpc.status}
                                    category={vpcStatusCategoryMap[vpc.status] || "unknown"}
                                  />
                                </td>
                                <td style={{ padding: "8px 16px" }}>
                                  <Text size="small" weight="regular" color="#344054">
                                    {vpc.statusMessage || "Available for deployments"}
                                  </Text>
                                </td>
                                <td style={{ padding: "8px 16px" }}>
                                  <Text
                                    size="small"
                                    weight="regular"
                                    color="#344054"
                                    sx={{
                                      maxWidth: "160px",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      display: "block",
                                    }}
                                    title={vpc.networkId}
                                  >
                                    {vpc.networkId || "-"}
                                  </Text>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </Box>
                </Box>
              )}

              {/* Import / Unimport buttons */}
              {values.selectedVpcIds.length > 0 && (
                <Stack direction="row" gap="12px" sx={{ mt: "12px" }}>
                  <Button
                    variant="contained"
                    onClick={() => onImport?.(values.selectedVpcIds)}
                    disabled={isImporting}
                    data-testid="import-vpcs-button"
                    sx={{ height: "36px !important", padding: "8px 16px !important" }}
                  >
                    Import {values.selectedVpcIds.length} VPC{values.selectedVpcIds.length !== 1 ? "s" : ""}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => onUnimport?.(values.selectedVpcIds)}
                    disabled={isImporting}
                    data-testid="unimport-vpcs-button"
                    sx={{ height: "36px !important", padding: "8px 16px !important" }}
                  >
                    Unimport
                  </Button>
                </Stack>
              )}
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
              sx={{
                height: "32px !important",
                padding: "6px 12px !important",
                fontSize: "13px !important",
              }}
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

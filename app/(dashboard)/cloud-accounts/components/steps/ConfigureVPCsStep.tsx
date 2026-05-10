"use client";

import { useState } from "react";
import RefreshIcon from "@mui/icons-material/Refresh";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { Autocomplete, Box, Checkbox, Chip, Stack, TextField } from "@mui/material";

import Button from "src/components/Button/Button";
import CardWithTitle from "src/components/Card/CardWithTitle";
import { Text } from "src/components/Typography/Typography";

export type VpcRecord = {
  id: string;
  name: string;
  status: "Available" | "Unavailable" | "Unknown";
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
  lastSyncedAt?: string;
  cloudProvider?: string;
};

const AWS_REGIONS = [
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "ca-central-1",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "eu-central-1",
  "eu-north-1",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "ap-northeast-2",
  "ap-south-1",
  "sa-east-1",
];

const VPC_STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Available: { bg: "#ECFDF3", text: "#067647", border: "#ABEFC6" },
  Unavailable: { bg: "#FEF3F2", text: "#B42318", border: "#FECDCA" },
  Unknown: { bg: "#F9FAFB", text: "#344054", border: "#D0D5DD" },
};

const InstructionItem = ({
  number,
  title,
  description,
  expandLabel,
}: {
  number: number;
  title: string;
  description: string;
  expandLabel: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <Stack gap="6px">
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
        <Stack
          direction="row"
          alignItems="center"
          gap="4px"
          sx={{ cursor: "pointer" }}
          onClick={() => setOpen(!open)}
        >
          <Text size="small" weight="medium" color="#6941C6">
            {expandLabel}
          </Text>
          {open ? (
            <KeyboardArrowUpIcon sx={{ color: "#6941C6", fontSize: 18 }} />
          ) : (
            <KeyboardArrowDownIcon sx={{ color: "#6941C6", fontSize: 18 }} />
          )}
        </Stack>
        {open && (
          <Box
            sx={{
              mt: "8px",
              p: "12px",
              border: "1px solid #E9EAEB",
              borderRadius: "8px",
              bgcolor: "#F9FAFB",
            }}
          >
            <Text size="small" weight="regular" color="#344054">
              Detailed instructions for this step will appear here.
            </Text>
          </Box>
        )}
      </Box>
    </Stack>
  );
};

const ConfigureVPCsStep: React.FC<ConfigureVPCsStepProps> = ({
  values,
  onChange,
  availableRegions = AWS_REGIONS,
  availableVpcs = [],
  isLoadingVpcs = false,
  onResync,
  lastSyncedAt,
  cloudProvider = "aws",
}) => {
  const [showAllInstructions, setShowAllInstructions] = useState(false);
  const [showKubernetesInstructions, setShowKubernetesInstructions] = useState(false);

  const selectedVpcs = availableVpcs.filter((v) => values.selectedVpcIds.includes(v.id));

  const isAwsWithPrivateConnect = cloudProvider === "aws";

  const privateConnectInstructions = [
    {
      title: "Enable VPC DNS",
      description: "Required for private endpoint name resolution.",
      expandLabel: "Show DNS settings",
    },
    {
      title: "Tag VPC and workload subnets",
      description: "Used to identify where private workloads run.",
      expandLabel: "Show instructions",
    },
    {
      title: "Confirm outbound access",
      description: "Choose NAT, Transit Gateway, VPN, or Direct Connect",
      expandLabel: "View outbound access options",
    },
    {
      title: "Create the Interface VPC Endpoint",
      description: "Use the provided PrivateLink service name.",
      expandLabel: "Show instructions",
    },
    {
      title: "Review cross-region setup (if applicable)",
      description: "Only shown when regions differ.",
      expandLabel: "Check cross-region requirements",
    },
  ];

  const displayedInstructions = showAllInstructions
    ? privateConnectInstructions
    : privateConnectInstructions.slice(0, 3);

  return (
    <Stack gap="20px">
      <CardWithTitle title="VPC Configuration">
        <Stack gap="16px">
          {/* Enable new VPCs */}
          <Stack direction="row" alignItems="center" gap="12px">
            <Checkbox
              data-testid="enable-new-vpcs-checkbox"
              checked={values.enableNewVpcs}
              onChange={(e) => onChange({ enableNewVpcs: e.target.checked })}
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

          {/* Bring own VPCs */}
          <Stack direction="row" alignItems="center" gap="12px">
            <Checkbox
              data-testid="bring-own-vpcs-checkbox"
              checked={values.bringOwnVpcs}
              onChange={(e) => onChange({ bringOwnVpcs: e.target.checked })}
              sx={{
                p: 0,
                color: "#D0D5DD",
                "&.Mui-checked": { color: "#7F56D9" },
              }}
            />
            <Text size="small" weight="medium" color="#344054">
              Bring your own VPCs for deployments
            </Text>
          </Stack>

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

                  <Text
                    size="xsmall"
                    weight="regular"
                    color="#535862"
                    sx={{ px: "16px", py: "8px", display: "block" }}
                  >
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
                            const statusColors =
                              VPC_STATUS_COLORS[vpc.status] || VPC_STATUS_COLORS.Unknown;
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
                                  <Chip
                                    label={vpc.status}
                                    size="small"
                                    sx={{
                                      bgcolor: statusColors.bg,
                                      color: statusColors.text,
                                      border: `1px solid ${statusColors.border}`,
                                      borderRadius: "16px",
                                      fontWeight: 500,
                                      fontSize: 12,
                                    }}
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
            {displayedInstructions.map((inst, idx) => (
              <InstructionItem
                key={idx}
                number={idx + 1}
                title={inst.title}
                description={inst.description}
                expandLabel={inst.expandLabel}
              />
            ))}
          </Stack>
        </CardWithTitle>
      )}

      {/* Optional add-on */}
      {isAwsWithPrivateConnect && values.bringOwnVpcs && (
        <CardWithTitle title="Optional add-on">
          <Stack gap="8px">
            <Stack direction="row" alignItems="center" gap="4px">
              <Text size="small" weight="semibold" color="#101828">
                Add Kubernetes subnet tags
              </Text>
              <Box
                sx={{
                  bgcolor: "#F2F4F7",
                  borderRadius: "16px",
                  px: "8px",
                  py: "2px",
                  ml: "4px",
                }}
              >
                <Text size="xsmall" weight="medium" color="#344054">
                  Optional
                </Text>
              </Box>
              <Text size="small" weight="regular" color="#344054" sx={{ ml: "4px" }}>
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
              <Text size="small" weight="medium" color="#6941C6">
                Show me how
              </Text>
              {showKubernetesInstructions ? (
                <KeyboardArrowUpIcon sx={{ color: "#6941C6", fontSize: 18 }} />
              ) : (
                <KeyboardArrowDownIcon sx={{ color: "#6941C6", fontSize: 18 }} />
              )}
            </Stack>
            {showKubernetesInstructions && (
              <Box
                sx={{
                  mt: "8px",
                  p: "12px",
                  border: "1px solid #E9EAEB",
                  borderRadius: "8px",
                  bgcolor: "#F9FAFB",
                }}
              >
                <Text size="small" weight="regular" color="#344054">
                  Add the Kubernetes subnet tag to your subnets to enable internal load balancers.
                  Tag key: <strong>kubernetes.io/role/internal-elb</strong>, Tag value:{" "}
                  <strong>1</strong>
                </Text>
              </Box>
            )}
          </Stack>
        </CardWithTitle>
      )}
    </Stack>
  );
};

export default ConfigureVPCsStep;

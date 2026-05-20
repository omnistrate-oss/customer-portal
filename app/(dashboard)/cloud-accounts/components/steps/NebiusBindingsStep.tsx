"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";

import { apiClient } from "src/api/client";
import CardWithTitle from "src/components/Card/CardWithTitle";
import StatusChip from "src/components/StatusChip/StatusChip";
import { Text } from "src/components/Typography/Typography";
import useSnackbar from "src/hooks/useSnackbar";

interface NebiusBinding {
  projectID: string;
  serviceAccountID: string;
  publicKeyID: string;
  privateKeyPEM: string;
  ownsArtifactBucket?: boolean;
  // Result fields (read-only)
  status?: string;
  statusMessage?: string;
  region?: string;
  keyState?: string;
  keyFingerprint?: string;
}

export interface NebiusBindingsStepProps {
  accountConfigId?: string;
  nebiusTenantId?: string;
  fetchClickedInstanceDetails?: () => Promise<any>;
}

const emptyBinding = (): NebiusBinding => ({
  projectID: "",
  serviceAccountID: "",
  publicKeyID: "",
  privateKeyPEM: "",
  ownsArtifactBucket: false,
});

const bindingFields: Array<{
  field: keyof Pick<NebiusBinding, "projectID" | "serviceAccountID" | "publicKeyID" | "privateKeyPEM">;
  label: string;
  description: string;
  placeholder: string;
  multiline?: boolean;
}> = [
  {
    field: "projectID",
    label: "Project ID",
    description: "The Nebius project that will be used for this binding",
    placeholder: "project-staging-4a7c92",
  },
  {
    field: "serviceAccountID",
    label: "Service Account ID",
    description: "Service account with project-level permissions to create and manage required infrastructure.",
    placeholder: "sa-omnistrate-staging",
  },
  {
    field: "publicKeyID",
    label: "Public Key ID",
    description: "The public key ID for the authorized key associated with this service account.",
    placeholder: "pk-staging-2d4f6b",
  },
  {
    field: "privateKeyPEM",
    label: "Private Key PEM",
    description: "Use the private key that matches this binding's Public Key ID.",
    placeholder: "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----",
    multiline: true,
  },
];

const toTestIdField = (field: string) => field.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

const getBindingStatusMessage = (binding: NebiusBinding) => {
  if (binding.status === "READY") {
    return "Access verified. This binding can be used for deployments.";
  }

  return binding.statusMessage;
};

const NebiusBindingsStep: React.FC<NebiusBindingsStepProps> = ({ accountConfigId, nebiusTenantId }) => {
  const snackbar = useSnackbar();
  const [bindings, setBindings] = useState<NebiusBinding[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | false>(false);
  const [editingIndexes, setEditingIndexes] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);

  // Fetch existing bindings
  const fetchBindings = useCallback(async () => {
    if (!nebiusTenantId) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await apiClient.GET("/2022-09-01-00/accountconfig/nebius/tenant/{nebiusTenantID}", {
        params: { path: { nebiusTenantID: nebiusTenantId } },
      });
      if (isMounted.current && res.data?.nebiusBindings) {
        const fetchedBindings = res.data.nebiusBindings.map((b) => ({
          projectID: b.projectID,
          serviceAccountID: b.serviceAccountID,
          publicKeyID: b.publicKeyID,
          privateKeyPEM: "",
          ownsArtifactBucket: b.ownsArtifactBucket,
          status: b.status,
          statusMessage: b.statusMessage,
          region: b.region,
          keyState: b.keyState,
          keyFingerprint: b.keyFingerprint,
        }));
        setBindings(fetchedBindings);
        setEditingIndexes([]);
        setExpandedIndex((currentExpandedIndex) =>
          currentExpandedIndex === false && fetchedBindings.length > 0 ? 0 : currentExpandedIndex
        );
      }
    } catch {
      // Ignore - may not have bindings yet
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, [nebiusTenantId]);

  useEffect(() => {
    isMounted.current = true;
    fetchBindings();
    return () => {
      isMounted.current = false;
    };
  }, [fetchBindings]);

  // Update bindings mutation
  const updateBindingsMutation = useMutation({
    mutationFn: async (updatedBindings: NebiusBinding[]) => {
      if (!accountConfigId) throw new Error("Account config ID not available");
      const res = await apiClient.PUT("/2022-09-01-00/accountconfig/{id}", {
        params: { path: { id: accountConfigId } },
        body: {
          nebiusBindings: updatedBindings
            .filter((b) => b.projectID && b.serviceAccountID && b.publicKeyID && b.privateKeyPEM)
            .map((b) => ({
              projectID: b.projectID,
              serviceAccountID: b.serviceAccountID,
              publicKeyID: b.publicKeyID,
              privateKeyPEM: b.privateKeyPEM,
              ownsArtifactBucket: b.ownsArtifactBucket,
            })),
        },
      });
      return res;
    },
    onSuccess: () => {
      snackbar.showSuccess("Bindings updated successfully. Verifying...");
      // Re-fetch after a short delay to get updated statuses
      setTimeout(() => {
        fetchBindings();
      }, 3000);
    },
    onError: () => {
      snackbar.showError("Failed to update bindings. Please try again.");
    },
  });

  const handleAddBinding = () => {
    const newBindings = [...bindings, emptyBinding()];
    setBindings(newBindings);
    setExpandedIndex(newBindings.length - 1);
    setEditingIndexes((prev) => [...prev, newBindings.length - 1]);
  };

  const handleDeleteBinding = (index: number) => {
    const newBindings = bindings.filter((_, i) => i !== index);
    setBindings(newBindings);
    setExpandedIndex(false);
    setEditingIndexes((prev) =>
      prev
        .filter((editingIndex) => editingIndex !== index)
        .map((editingIndex) => (editingIndex > index ? editingIndex - 1 : editingIndex))
    );
    // If the binding had a status (was saved), we need to update the server
    if (bindings[index]?.status) {
      updateBindingsMutation.mutate(newBindings);
    }
  };

  const handleFieldChange = (index: number, field: keyof NebiusBinding, value: string | boolean) => {
    setBindings((prev) => prev.map((b, i) => (i === index ? { ...b, [field]: value } : b)));
  };

  const handleVerify = (index: number) => {
    const binding = bindings[index];
    if (!binding.projectID || !binding.serviceAccountID || !binding.publicKeyID || !binding.privateKeyPEM) {
      snackbar.showError("Please fill in all required fields before verifying.");
      return;
    }
    updateBindingsMutation.mutate(bindings);
  };

  if (isLoading) {
    return (
      <CardWithTitle title="Bindings">
        <Stack alignItems="center" justifyContent="center" py="40px">
          <CircularProgress size={32} />
          <Text size="small" weight="regular" color="#667085" sx={{ mt: 2 }}>
            Loading bindings...
          </Text>
        </Stack>
      </CardWithTitle>
    );
  }

  return (
    <CardWithTitle title="Bindings">
      <Stack gap="24px">
        {bindings.length === 0 && (
          <Text size="small" weight="regular" color="#667085" sx={{ py: "4px" }}>
            No bindings configured yet. Click &quot;Add Binding&quot; to create one.
          </Text>
        )}

        {bindings.map((binding, index) => {
          const isDraft = !binding.status;
          const statusLabel = isDraft ? "Draft" : binding.status || "Unknown";
          const isEditing = isDraft || editingIndexes.includes(index);
          const isFieldDisabled = binding.status === "READY" && !isEditing;

          return (
            <Accordion
              key={index}
              expanded={expandedIndex === index}
              onChange={(_, expanded) => setExpandedIndex(expanded ? index : false)}
              sx={{
                border: "1px solid #E9EAEB",
                borderRadius: "12px !important",
                boxShadow: "none",
                overflow: "hidden",
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary
                expandIcon={<KeyboardArrowUpIcon sx={{ color: "#98A2B3" }} />}
                sx={{
                  px: "24px",
                  py: "20px",
                  minHeight: "90px",
                  borderBottom: expandedIndex === index ? "1px solid #E9EAEB" : "none",
                  "& .MuiAccordionSummary-content": { my: 0 },
                  "& .MuiAccordionSummary-expandIconWrapper": { transform: "rotate(180deg)" },
                  "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": { transform: "rotate(0deg)" },
                }}
              >
                <Stack gap="4px" width="100%">
                  <Stack direction="row" alignItems="center" gap="10px">
                    <Text size="large" weight="semibold" color="#6941C6">
                      Binding {index + 1}
                    </Text>
                    <StatusChip
                      status={statusLabel}
                      tick={binding.status === "READY"}
                      fontStyles={{ fontSize: "12px", lineHeight: "18px", fontWeight: 500 }}
                    />
                  </Stack>
                  <Text size="medium" weight="regular" color="#667085" ellipsis maxWidth="70%">
                    {binding.projectID || "New binding"}
                    {binding.region ? ` (${binding.region})` : ""}
                  </Text>
                </Stack>
              </AccordionSummary>

              <AccordionDetails sx={{ p: 0 }}>
                <Stack>
                  <Stack gap="28px" sx={{ px: "24px", py: "24px" }}>
                    {bindingFields.map((fieldConfig) => (
                      <Box
                        key={fieldConfig.field}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", md: "280px minmax(0, 1fr)" },
                          columnGap: "44px",
                          rowGap: "10px",
                          alignItems: "start",
                        }}
                      >
                        <Box>
                          <Text size="small" weight="semibold" color="#344054">
                            {fieldConfig.label}{" "}
                            <Box component="span" sx={{ color: "#F04438" }}>
                              *
                            </Box>
                          </Text>
                          <Text size="small" weight="regular" color="#667085">
                            {fieldConfig.description}
                          </Text>
                        </Box>
                        <TextField
                          placeholder={fieldConfig.placeholder}
                          value={binding[fieldConfig.field] || ""}
                          onChange={(e) => handleFieldChange(index, fieldConfig.field, e.target.value)}
                          size="small"
                          fullWidth
                          disabled={isFieldDisabled}
                          multiline={fieldConfig.multiline}
                          minRows={fieldConfig.multiline ? 5 : undefined}
                          maxRows={fieldConfig.multiline ? 7 : undefined}
                          data-testid={`nebius-binding-${index}-${toTestIdField(fieldConfig.field)}`}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "8px",
                              backgroundColor: isFieldDisabled ? "#FCFCFD" : "#FFFFFF",
                              color: "#667085",
                              fontSize: "16px",
                              lineHeight: "24px",
                              "& fieldset": { borderColor: "#D0D5DD" },
                              "&:hover fieldset": { borderColor: "#D0D5DD" },
                              "&.Mui-focused fieldset": { borderColor: "#7F56D9", borderWidth: "1px" },
                            },
                            "& .MuiOutlinedInput-input": {
                              color: "#667085",
                              WebkitTextFillColor: "#667085",
                            },
                            "& textarea": {
                              fontSize: "13px",
                              lineHeight: "18px",
                            },
                          }}
                        />
                      </Box>
                    ))}
                  </Stack>

                  {getBindingStatusMessage(binding) && (
                    <Box sx={{ px: "24px", pb: "20px" }}>
                      <Text size="small" weight="regular" color={binding.status === "FAILED" ? "#D92D20" : "#667085"}>
                        {getBindingStatusMessage(binding)}
                      </Text>
                    </Box>
                  )}

                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ borderTop: "1px solid #E9EAEB", px: "24px", py: "16px" }}
                  >
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleDeleteBinding(index)}
                      data-testid={`nebius-binding-${index}-delete-button`}
                      sx={{
                        borderColor: "#FDA29B",
                        color: "#B42318",
                        borderRadius: "8px",
                        textTransform: "none",
                        fontWeight: 600,
                        boxShadow: "0px 1px 2px 0px #0A0D120D",
                      }}
                    >
                      Delete
                    </Button>

                    {isFieldDisabled ? (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setEditingIndexes((prev) => [...prev, index])}
                        data-testid={`nebius-binding-${index}-edit-button`}
                        sx={{
                          borderColor: "#D0D5DD",
                          color: "#344054",
                          borderRadius: "8px",
                          textTransform: "none",
                          fontWeight: 600,
                          boxShadow: "0px 1px 2px 0px #0A0D120D",
                        }}
                      >
                        Edit
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleVerify(index)}
                        disabled={
                          updateBindingsMutation.isPending ||
                          !binding.projectID ||
                          !binding.serviceAccountID ||
                          !binding.publicKeyID ||
                          !binding.privateKeyPEM
                        }
                        data-testid={`nebius-binding-${index}-verify-button`}
                        sx={{
                          backgroundColor: "#12B76A",
                          borderRadius: "8px",
                          textTransform: "none",
                          fontWeight: 600,
                          boxShadow: "none",
                          "&:hover": { backgroundColor: "#12B76A" },
                        }}
                      >
                        {updateBindingsMutation.isPending ? <CircularProgress size={16} /> : "Verify"}
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </AccordionDetails>
            </Accordion>
          );
        })}

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddBinding}
          sx={{
            alignSelf: "flex-start",
            borderColor: "#D0D5DD",
            color: "#344054",
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 600,
            boxShadow: "0px 1px 2px 0px #0A0D120D",
          }}
          data-testid="nebius-add-binding-button"
        >
          Add Binding
        </Button>
      </Stack>
    </CardWithTitle>
  );
};

export default NebiusBindingsStep;

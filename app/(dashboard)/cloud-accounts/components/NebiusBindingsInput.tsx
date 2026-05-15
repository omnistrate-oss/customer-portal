"use client";

import { FC } from "react";
import { Add } from "@mui/icons-material";
import { IconButton } from "@mui/material";

import DeleteIcon from "src/components/Icons/Delete/Delete";
import formatDateUTC from "src/utils/formatDateUTC";
import Button from "components/Button/Button";

export type NebiusBindingFormValue = {
  // User-editable fields
  projectID: string;
  serviceAccountID: string;
  publicKeyID: string;
  privateKeyPEM: string;
  // Read-only metadata. Only populated when the binding came from the server;
  // the presence of `status` distinguishes existing bindings from new ones.
  status?: string;
  region?: string;
  keyExpiresAt?: string;
};

export const EMPTY_NEBIUS_BINDING: NebiusBindingFormValue = {
  projectID: "",
  serviceAccountID: "",
  publicKeyID: "",
  privateKeyPEM: "",
};

const NO_EXPIRY_MARKERS = new Set(["0001-01-01T00:00:00Z", "1970-01-01T00:00:00Z"]);

export const formatKeyExpiry = (raw?: string): string => {
  if (!raw) return "-";
  if (NO_EXPIRY_MARKERS.has(raw)) return "No expiry";
  return formatDateUTC(raw) || "-";
};

export const isExistingBinding = (binding: NebiusBindingFormValue) => Boolean(binding.status);

type RemoveButtonProps = {
  onRemove: () => void;
  disabled?: boolean;
  index: number;
};

/** Action button rendered in the section header to remove a binding. */
export const RemoveBindingButton: FC<RemoveButtonProps> = ({ onRemove, disabled, index }) => (
  <IconButton
    type="button"
    size="small"
    disabled={disabled}
    onClick={onRemove}
    aria-label={`Remove Binding ${index + 1}`}
    data-testid={`remove-nebius-binding-${index}`}
  >
    <DeleteIcon />
  </IconButton>
);

type AddBindingButtonProps = {
  onAdd: () => void;
  disabled?: boolean;
};

/** Add button rendered after the binding sections via afterSections. */
export const AddBindingButton: FC<AddBindingButtonProps> = ({ onAdd, disabled }) => (
  <div>
    <Button
      variant="outlined"
      startIcon={<Add />}
      onClick={onAdd}
      disabled={disabled}
      data-testid="add-nebius-binding"
    >
      Add Binding
    </Button>
  </div>
);

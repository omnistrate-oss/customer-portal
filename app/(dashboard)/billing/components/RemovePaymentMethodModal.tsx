"use client";

import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack } from "@mui/material";

import { colors } from "src/themeConfig";
import { ConsumptionPaymentMethod } from "src/types/consumption";
import Button from "components/Button/Button";
import { Text } from "components/Typography/Typography";

import { getPaymentMethodPrimaryLabel } from "./paymentMethodUtils";

type RemovePaymentMethodModalProps = {
  method: ConsumptionPaymentMethod | null;
  open: boolean;
  isLoading?: boolean;
  errorMessage?: string;
  onClose: () => void;
  onConfirm: () => void;
};

const RemovePaymentMethodModal = ({
  method,
  open,
  isLoading,
  errorMessage,
  onClose,
  onConfirm,
}: RemovePaymentMethodModalProps) => {
  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      PaperProps={{
        sx: {
          width: "100%",
          maxWidth: 520,
          padding: "24px",
        },
      }}
    >
      <DialogTitle sx={{ padding: 0 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap="16px">
          <Stack direction="row" alignItems="center" gap="12px">
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{
                width: 40,
                height: 40,
                borderRadius: "8px",
                backgroundColor: colors.error50,
                color: colors.error700,
              }}
            >
              <DeleteOutlineIcon />
            </Stack>
            <Text size="large" weight="bold">
              Remove Payment Method
            </Text>
          </Stack>
          <IconButton onClick={onClose} disabled={isLoading}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ padding: 0, marginTop: "20px" }}>
        <Text size="small" weight="regular" color={colors.gray600}>
          {method
            ? `Remove ${getPaymentMethodPrimaryLabel(method)} from this billing account?`
            : "Remove this payment method from this billing account?"}
        </Text>
        <Text size="small" weight="regular" color={colors.gray600} mt={1}>
          The backend will block removal if unpaid invoices exist, or if this is the last method while current usage or
          active subscriptions still require a payment method.
        </Text>
        {errorMessage && (
          <Text
            size="small"
            weight="medium"
            color={colors.error700}
            mt={2}
            sx={{
              backgroundColor: colors.error50,
              border: `1px solid ${colors.error200}`,
              borderRadius: "8px",
              padding: "10px 12px",
            }}
          >
            {errorMessage}
          </Text>
        )}
      </DialogContent>
      <DialogActions sx={{ padding: 0, paddingTop: "24px" }}>
        <Button variant="outlined" size="large" disabled={isLoading} onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          size="large"
          bgColor={colors.error700}
          fontColor="#FFFFFF"
          disabled={isLoading}
          isLoading={isLoading}
          onClick={onConfirm}
        >
          Remove
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RemovePaymentMethodModal;

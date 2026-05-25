"use client";

import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack } from "@mui/material";

import { colors } from "src/themeConfig";
import { ConsumptionPaymentMethod } from "src/types/consumption";
import Button from "components/Button/Button";
import LoadingSpinnerSmall from "components/CircularProgress/CircularProgress";
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
        style: {
          borderRadius: "12px",
          minWidth: "600px",
          maxWidth: "600px",
        },
      }}
    >
      <DialogTitle
        sx={{
          pt: "24px",
          pb: "20px",
          position: "relative",
        }}
      >
        <Stack direction="row" alignItems="center" gap="16px">
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
          <Text size="large" weight="semibold" color="#101828">
            Remove Payment Method
          </Text>
        </Stack>
        <IconButton
          onClick={onClose}
          disabled={isLoading}
          aria-label="Close remove payment method dialog"
          sx={{
            position: "absolute",
            right: "16px",
            top: "16px",
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pb: "4px" }}>
        <Text size="small" weight="regular" color="#344054">
          {method
            ? `Remove ${getPaymentMethodPrimaryLabel(method)} from this billing account?`
            : "Remove this payment method from this billing account?"}
        </Text>
        {errorMessage ? (
          <Text
            size="small"
            weight="medium"
            color={colors.error700}
            mt={1}
            sx={{
              backgroundColor: colors.error50,
              border: `1px solid ${colors.error200}`,
              borderRadius: "8px",
              padding: "10px 12px",
            }}
          >
            {errorMessage}
          </Text>
        ) : (
          <Text size="small" weight="regular" color="#344054" mt={1}>
            Removal is blocked when unpaid invoices, current usage, or active subscriptions still require a payment
            method.
          </Text>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "12px",
          p: "28px 24px 24px",
        }}
      >
        <Button variant="outlined" disabled={isLoading} onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          bgColor={colors.error700}
          fontColor="#FFFFFF"
          disabled={isLoading || Boolean(errorMessage)}
          onClick={onConfirm}
        >
          Remove {isLoading && <LoadingSpinnerSmall />}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RemovePaymentMethodModal;

import { useState } from "react";
import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack } from "@mui/material";
import CSS from "csstype";

import useSnackbar from "src/hooks/useSnackbar";
import { colors } from "src/themeConfig";

import Button from "../Button/Button";
import LoadingSpinnerSmall from "../CircularProgress/CircularProgress";
import TextField from "../FormElementsv2/TextField/TextField";
import ArrowBulletIcon from "../Icons/ArrowIcon/ArrowBulletIcon";
import CloseIcon from "../Icons/Close/CloseIcon";
import { Text } from "../Typography/Typography";

export const ListItem = ({ children, textStyles = {} }: { children: React.ReactNode; textStyles?: CSS.Properties }) => {
  return (
    <Stack direction="row" gap="12px" maxWidth="100%">
      <ArrowBulletIcon style={{ flexShrink: 0 }} />

      <Text size="small" weight="regular" color="#344054" style={textStyles}>
        {children}
      </Text>
    </Stack>
  );
};

type ConfirmationDialogProps = {
  open: boolean;
  onClose: () => void;
  width?: string;
  icon: React.ComponentType;
  title: string;
  content: React.ComponentType;
  cancelButtonLabel?: string;
  confirmButtonLabel?: string;
  confirmButtonColor?: string;
  isLoading?: boolean;

  confirmationText?: string;
  onConfirm?: () => Promise<boolean> | boolean;
  customConfirmButton?: React.ReactNode;
  hideCancelButton?: boolean;
};

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onClose,
  width = "600px",
  icon: Icon,
  title,
  content: Content,
  cancelButtonLabel = "Cancel",
  confirmButtonLabel = "Confirm",
  confirmButtonColor = colors.success600,
  isLoading = false,

  confirmationText,
  onConfirm = async () => {
    return true;
  },
  customConfirmButton,
  hideCancelButton = false,
}) => {
  const snackbar = useSnackbar();
  const [inputValue, setInputValue] = useState("");

  const handleClose = () => {
    onClose();
    setInputValue("");
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{
        style: {
          borderRadius: "12px",
          minWidth: width,
          maxWidth: width,
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
          <Icon />

          <Text size="large" weight="semibold" color="#101828">
            {title}
          </Text>
        </Stack>
        <IconButton
          onClick={handleClose}
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
        <Content />

        {confirmationText && (
          <>
            <Text size="small" weight="medium" color="#344054" sx={{ mt: "12px" }}>
              To confirm, type <b>{confirmationText}</b> in the field below:
            </Text>

            <TextField
              inputProps={{ "data-testid": "confirmation-text-input" }}
              id="confirmationText"
              name="confirmationText"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              sx={{
                marginTop: "12px",
                [`& .Mui-focused .MuiOutlinedInput-notchedOutline`]: {
                  borderColor: "rgba(254, 228, 226, 1) !important",
                },
              }}
            />
          </>
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
        {!hideCancelButton && (
          <Button variant="outlined" onClick={handleClose}>
            {cancelButtonLabel}
          </Button>
        )}

        {customConfirmButton ? (
          customConfirmButton
        ) : (
          <Button
            data-testid="submit-button"
            variant="contained"
            disabled={isLoading}
            bgColor={confirmButtonColor}
            fontColor="#FFFFFF"
            onClick={async () => {
              if (confirmationText && inputValue !== confirmationText) {
                snackbar.showError(`Please type "${confirmationText}" to confirm the action.`);
                return;
              }
              const res = await onConfirm();
              if (res) {
                handleClose();
              }
            }}
          >
            {confirmButtonLabel} {isLoading && <LoadingSpinnerSmall />}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;

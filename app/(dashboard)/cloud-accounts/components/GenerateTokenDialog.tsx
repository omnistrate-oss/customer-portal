import { InputAdornment } from "@mui/material";
import clipboard from "clipboardy";

import Button from "src/components/Button/Button";
import CopyButton from "src/components/Button/CopyButton";
import ConfirmationDialog from "src/components/Dialog/ConfirmationDialog";
import TextField from "src/components/FormElementsv2/TextField/TextField";
import LoadingSpinner from "src/components/LoadingSpinner/LoadingSpinner";
import { Text } from "src/components/Typography/Typography";
import formatDateUTC from "src/utils/formatDateUTC";

import DocumentDialogIcon from "./DocumentIcon";

interface TokenDetails {
  token?: string;
  expirationTimestamp?: string;
}

type GenerateTokenDialogProps = {
  open: boolean;
  onClose: () => void;
  isGeneratingToken: boolean;
  tokenDetails: TokenDetails | null;
  dashboardEndpoint?: string;
};

const GenerateTokenDialog: React.FC<GenerateTokenDialogProps> = ({
  open,
  onClose,
  isGeneratingToken,
  tokenDetails,
  dashboardEndpoint,
}) => {
  const Content = () => {
    if (isGeneratingToken) {
      return (
        <div style={{ margin: "45px" }}>
          <LoadingSpinner />
        </div>
      );
    }

    const expiresIn = tokenDetails?.expirationTimestamp
      ? Math.ceil((new Date(tokenDetails.expirationTimestamp).getTime() - new Date().getTime()) / 1000 / 60)
      : 0;

    return (
      <>
        <Text size="small" weight="regular" color="#344054">
          A temporary token has been generated. Use it to log into your Kubernetes dashboard.
        </Text>
        <Text size="small" weight="bold" color="#344054" sx={{ mt: "20px" }}>
          Token expires in <span style={{ color: "#6941C6" }}>{expiresIn} mins</span>, at{" "}
          <span
            style={{
              color: "#6941C6",
            }}
          >
            {formatDateUTC(tokenDetails?.expirationTimestamp)}
          </span>
        </Text>
        <TextField
          disabled
          value={tokenDetails?.token || ""}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <CopyButton text={tokenDetails?.token || ""} />
              </InputAdornment>
            ),
          }}
        />
      </>
    );
  };

  return (
    <ConfirmationDialog
      icon={DocumentDialogIcon}
      title="Kubernetes Dashboard Access"
      content={Content}
      onClose={onClose}
      open={open}
      customConfirmButton={
        <Button
          disabled={isGeneratingToken}
          variant="contained"
          onClick={() => {
            clipboard.write(tokenDetails?.token || "");
            window.open(dashboardEndpoint ? `https://${dashboardEndpoint}` : "", "_blank");
            onClose();
          }}
        >
          Copy Token & Open Dashboard
        </Button>
      }
    />
  );
};

export default GenerateTokenDialog;

import { InputAdornment, Stack } from "@mui/material";
import clipboard from "clipboardy";
import { FC } from "react";

import { $api } from "src/api/query";
import AlertText from "src/components/AlertText/AlertText";
import Button from "src/components/Button/Button";
import CopyButton from "src/components/Button/CopyButton";
import Card from "src/components/Card/Card";
import TextField from "src/components/FormElementsv2/TextField/TextField";
import { Text } from "src/components/Typography/Typography";
import formatDateUTC from "src/utils/formatDateUTC";

export interface TokenDetails {
  token?: string;
  expirationTimestamp?: string;
}

type LogsDashboardProps = {
  dashboardEndpoint?: string;
  id: string;
  subscriptionId: string;
};

const getDashboardUrl = (dashboardEndpoint?: string): string => {
  if (!dashboardEndpoint) return "";
  if (/^https?:\/\//i.test(dashboardEndpoint)) return dashboardEndpoint;
  return `https://${dashboardEndpoint}`;
};

const getErrorMessage = (error: unknown): string => {
  if (!error) return "";
  const errorData = error as {
    message?: string;
    response?: {
      data?: {
        message?: string;
      };
    };
  };

  return errorData.response?.data?.message || errorData.message || "Unable to generate token. Please try again.";
};

const LogsDashboard: FC<LogsDashboardProps> = ({ dashboardEndpoint, id, subscriptionId }) => {
  const generateTokenMutation = $api.useMutation(
    "post",
    "/2022-09-01-00/resource-instance/{id}/deployment-cell-dashboard/token"
  );
  const tokenDetails = generateTokenMutation.data as TokenDetails | null | undefined;
  const isGeneratingToken = generateTokenMutation.isPending;

  const handleGenerateToken = () => {
    if (!id || !subscriptionId) return;

    generateTokenMutation.mutate({
      params: {
        path: {
          id,
        },
        query: {
          subscriptionId,
        },
      },
    });
  };

  const token = tokenDetails?.token || "";
  const dashboardUrl = getDashboardUrl(dashboardEndpoint);
  const errorMessage = getErrorMessage(generateTokenMutation.error);
  const expiresIn = tokenDetails?.expirationTimestamp
    ? Math.ceil((new Date(tokenDetails.expirationTimestamp).getTime() - new Date().getTime()) / 1000 / 60)
    : 0;
  const canGenerateToken = Boolean(dashboardEndpoint && id && subscriptionId);

  return (
    <Card mt="32px" sx={{ padding: "24px", borderRadius: "8px", maxWidth: "720px" }}>
      <Stack gap="20px">
        <Text size="medium" weight="bold" color="#181D27">
          Logs Dashboard Access
        </Text>

        {token ? (
          <Text size="small" weight="regular" color="#344054">
            A temporary token has been generated. Use it to log into your logs dashboard.
          </Text>
        ) : (
          <Text size="small" weight="regular" color="#344054">
            Generate a temporary token to log into your logs dashboard.
          </Text>
        )}

        {!canGenerateToken && <AlertText>Logs dashboard access is not available.</AlertText>}

        {errorMessage && <AlertText>{errorMessage}</AlertText>}

        {tokenDetails?.expirationTimestamp && (
          <Text size="small" weight="bold" color="#344054">
            Token expires in <span style={{ color: "#6941C6" }}>{expiresIn} mins</span>, at{" "}
            <span style={{ color: "#6941C6" }}>{formatDateUTC(tokenDetails.expirationTimestamp)}</span>
          </Text>
        )}

        {token && (
          <TextField
            disabled
            label="Token"
            value={token}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <CopyButton text={token} />
                </InputAdornment>
              ),
            }}
          />
        )}

        <Stack direction="row" justifyContent="flex-end">
          {token && (
            <Button
              disabled={!dashboardUrl}
              variant="contained"
              onClick={() => {
                clipboard.write(token);
                window.open(dashboardUrl, "_blank");
              }}
            >
              Copy Token & Open Dashboard
            </Button>
          )}
        </Stack>
      </Stack>
    </Card>
  );
};

export default LogsDashboard;

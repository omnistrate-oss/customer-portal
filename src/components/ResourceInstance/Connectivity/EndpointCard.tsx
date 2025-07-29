import { FC, useState } from "react";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { Box, Stack } from "@mui/material";

import Button from "src/components/Button/Button";
import CopyButton from "src/components/Button/CopyButton";
import PrivateResourceIcon from "src/components/Icons/PrivateResource/PrivateResource";
import PublicResourceIcon from "src/components/Icons/PublicResource/PublicResource";
import StatusChip from "src/components/StatusChip/StatusChip";
import { Text } from "src/components/Typography/Typography";

type EndpointCardProps = {
  isPrimary?: boolean;
  isPublic?: boolean;
  endpointName: string;
  endpointURL: string;
  openPorts?: number[];
};

const EndpointLine = ({ isPrimary, openPort, endpointURL, mt = "0px" }) => {
  const portEndpoint = { 443: "https://", 80: "http://" };

  // Determine the full URL with appropriate protocol
  let urlWithProtocol = endpointURL;

  // If URL already has a protocol, use it as-is
  const hasProtocol = endpointURL.startsWith("http:") || endpointURL.startsWith("https:");
  if (hasProtocol) {
    urlWithProtocol = endpointURL;
  } else {
    // Add appropriate protocol based on port number (if available)
    const protocolPrefix = portEndpoint[openPort];
    urlWithProtocol = protocolPrefix ? `${protocolPrefix}${endpointURL}` : endpointURL;
  }

  // Append port to URL if it's not standard HTTP (80) or HTTPS (443) port
  // and the URL doesn't already contain a port
  const urlAlreadyHasPort = urlWithProtocol.includes(":") && !hasProtocol;
  if (openPort && openPort !== 80 && openPort !== 443 && !hasProtocol && !urlAlreadyHasPort) {
    urlWithProtocol = `${urlWithProtocol}:${openPort}`;
  }

  return (
    <Stack direction="row" gap="6px" alignItems="center" mt={mt}>
      <Text size="small" weight="regular" color={isPrimary ? "#6941C6" : "#475467"}>
        {urlWithProtocol.includes("http") ? (
          <a href={urlWithProtocol} target="_blank" rel="noopener noreferrer">
            <span>{urlWithProtocol}</span>
          </a>
        ) : (
          <span>{urlWithProtocol}</span>
        )}
      </Text>

      <CopyButton
        text={urlWithProtocol}
        iconProps={{
          color: "#6941C6",
          width: 20,
          height: 20,
          marginTop: 0,
        }}
        iconButtonProps={{ padding: "0px" }}
      />
    </Stack>
  );
};

const EndpointCard: FC<EndpointCardProps> = ({ isPrimary, isPublic, endpointName, endpointURL, openPorts }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldShowViewMoreButton = openPorts && openPorts.length > 1;

  return (
    <Box
      borderRadius="12px"
      p="12px 16px"
      display="flex"
      gap="16px"
      border={isPrimary ? "1px solid #7F56D9" : "1px solid #EAECF0"}
      bgcolor={isPrimary ? "#F9F5FF" : "#FFFFFF"}
    >
      {isPublic ? <PublicResourceIcon /> : <PrivateResourceIcon />}

      <Box>
        <Stack direction="row" flexWrap="wrap" gap="8px" mb="6px">
          <Text size="small" weight="medium" color="#53389E">
            {endpointName}
          </Text>
          <StatusChip label={isPublic ? "Public" : "Private"} category={isPublic ? "success" : "unknown"} />
          {isPrimary && <StatusChip label="Primary" color="#7F56D9" borderColor="#7F56D9" bgColor="#F9F5FF" />}
        </Stack>

        <EndpointLine endpointURL={endpointURL} isPrimary={isPrimary} openPort={openPorts?.[0]} mt="8px" />

        {isExpanded &&
          openPorts?.map((port, index) =>
            index >= 1 ? (
              <EndpointLine key={index} endpointURL={endpointURL} isPrimary={isPrimary} openPort={port} mt="18px" />
            ) : null
          )}

        {shouldShowViewMoreButton && (
          <Button
            sx={{ color: "#6941C6", marginTop: "8px" }}
            endIcon={isExpanded ? <RemoveCircleOutlineIcon /> : <AddCircleOutlineIcon />}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "View Less" : "View More"}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default EndpointCard;

import { FC, useMemo, useState } from "react";
import Image from "next/image";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { Box, Stack, styled, SxProps, Theme } from "@mui/material";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import MuiTableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";

import Button from "src/components/Button/Button";
import CopyButton from "src/components/Button/CopyButton";
import PrivateResourceIcon from "src/components/Icons/PrivateResource/PrivateResource";
import PublicResourceIcon from "src/components/Icons/PublicResource/PublicResource";
import StatusChip from "src/components/StatusChip/StatusChip";
import { Text } from "src/components/Typography/Typography";

import resourcePortsIcon from "../../../../public/assets/images/dashboard/resource-instance-nodes/ports.svg";
import { ContainerCard } from "../ResourceInstanceDetails/PropertyDetails";

import CustomDNSEndPoint from "./CustomDNSEndPoint";
const TableCell = styled(MuiTableCell)({
  borderBottom: "none",
});

type ResourceConnectivityEndpointProps = {
  isPrimaryResource?: boolean;
  resourceName: string;
  endpointURL?: string;
  viewType: "ports" | "endpoint";
  ports?: string | [];
  containerStyles: SxProps<Theme>;
  context: "access" | "fleet";
  ResourceConnectivityCustomDNS?: any;
  customDNSData?: {
    enabled: boolean;
    dnsName?: string;
    status?: string;
    cnameTarget?: string;
    aRecordTarget?: string;
    name?: string;
  };
  publiclyAccessible?: boolean;
};

// Define the expected type for each port item
interface PortItem {
  resourceName: string;
  ports: string | string[]; // 'ports' can be a string or an array of strings
}

const ResourceConnectivityEndpoint: FC<ResourceConnectivityEndpointProps> = (props) => {
  const {
    resourceName,
    endpointURL,
    ports,
    containerStyles,
    viewType,
    isPrimaryResource = false,
    ResourceConnectivityCustomDNS,
    customDNSData,
    publiclyAccessible,
  } = props;
  const [isEndpointsExpanded, setIsEndpointsExpanded] = useState(false);
  const toggleExpanded = () => setIsEndpointsExpanded((prev) => !prev);

  const portsArray = useMemo(() => {
    const resourcePorts = (Array.isArray(ports) ? ports : []) as PortItem[];

    const selectedPortItem = resourcePorts.find((item) => item.resourceName === resourceName);

    const parsePorts = (portsString: string): number[] | string[] => {
      if (portsString.includes("-")) {
        const [start, end] = portsString.split("-").map((part) => Number(part.trim()));
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          // Return the original range string
          return [portsString];
        }
      }
      // Split comma-separated values into numbers
      return portsString
        .split(",")
        .map((port) => Number(port.trim()))
        .filter((port) => !isNaN(port));
    };

    const portValues =
      typeof selectedPortItem?.ports === "string"
        ? parsePorts(selectedPortItem.ports)
        : Array.isArray(selectedPortItem?.ports)
          ? selectedPortItem.ports.map((port) => (typeof port === "string" ? Number(port.trim()) : port))
          : typeof ports === "string"
            ? parsePorts(ports)
            : [];

    return portValues;
  }, [ports, resourceName]);

  const sortedPortsArray = Array.isArray(portsArray)
    ? portsArray.sort((a, b) => {
        // If either value is a string, do not sort
        if (typeof a === "string" || typeof b === "string") return 0;

        // Sort 443 to come first
        if (a === 443) return -1;
        if (b === 443) return 1;

        // Sort 80 to come after 443
        if (a === 80) return -1;
        if (b === 80) return 1;

        return 0; // Keep other numbers in their original order
      })
    : portsArray; // If not an array, return as is

  const portEndpoint = { 443: "https://", 80: "http://" };

  const endpointPort = (endpoint, port) => {
    const endpointURL = portEndpoint[Number(String(port).trim())];
    if (endpointURL) return `${endpointURL}${endpoint}`;
    else if (port) return `${endpoint}:${port}`;
    else return `${endpoint}`;
  };

  return (
    <ContainerCard title={resourceName} contentBoxProps={{ padding: "12px 16px" }} marginTop="20px">
      <Box
        sx={{
          border: isPrimaryResource ? "1px solid #7F56D9" : "1px solid #EAECF0",
          background: isPrimaryResource ? "#F9F5FF" : "white",
          borderRadius: "12px",
          boxShadow: "box-shadow: 0px 1px 2px 0px #0A0D120D",
          ...containerStyles,
        }}
      >
        <Table>
          <TableBody>
            <TableRow>
              <TableCell
                sx={{
                  paddingRight: "8px",
                  paddingTop: "16px",
                  verticalAlign: "top",
                }}
              >
                {viewType === "endpoint" ? (
                  publiclyAccessible ? (
                    <PublicResourceIcon />
                  ) : (
                    <PrivateResourceIcon />
                  )
                ) : (
                  <Image src={resourcePortsIcon} alt="resource-ports" style={{ minWidth: "36px" }} />
                )}
              </TableCell>
              <TableCell
                width="100%"
                sx={{
                  paddingLeft: "8px",
                  paddingRight: "8px",
                  marginBottom: "10px",
                }}
              >
                <Stack direction="row" alignItems="center" gap="8px">
                  <Text size="small" weight="medium" color="#53389E">
                    {"Endpoint"}
                  </Text>
                  <StatusChip
                    label={publiclyAccessible ? "Public" : "Private"}
                    category={publiclyAccessible ? "success" : "unknown"}
                  />
                  {isPrimaryResource && (
                    <StatusChip label="Primary" color="#7F56D9" borderColor="#7F56D9" backgroundColor="#F9F5FF" />
                  )}
                </Stack>

                {portsArray.length === 0 ? (
                  <CopyButton
                    text={`${endpointURL}`}
                    iconProps={{
                      color: "#6941C6",
                      width: 20,
                      height: 20,
                      marginTop: 0,
                    }}
                    iconButtonProps={{ padding: "0px" }}
                  />
                ) : (
                  Array.isArray(sortedPortsArray) &&
                  sortedPortsArray.map((port, index) => {
                    if ((index === 0 && !isEndpointsExpanded) || isEndpointsExpanded) {
                      return (
                        <Box alignSelf="start" key={index} marginTop="8px" marginBottom="8px" display="flex" gap="12px">
                          <Text size="small" weight="regular" color={isPrimaryResource ? "#6941C6" : ""}>
                            {portEndpoint[port] ? (
                              <a href={`${endpointPort(endpointURL, port)}`} target="_blank" rel="noopener noreferrer">
                                {endpointPort(endpointURL, port)}
                              </a>
                            ) : (
                              endpointPort(endpointURL, port)
                            )}
                          </Text>
                          <CopyButton
                            text={endpointPort(endpointURL, port)}
                            iconProps={{
                              color: "#6941C6",
                              width: 20,
                              height: 20,
                              marginTop: 0,
                            }}
                            iconButtonProps={{ padding: "0px" }}
                          />
                        </Box>
                      );
                    }
                    return null; // Return null for cases that should not be rendered
                  })
                )}
                {portsArray.length > 1 && (
                  <Stack direction="row">
                    <Button
                      sx={{ color: "#6941C6" }}
                      startIcon={isEndpointsExpanded ? <RemoveCircleOutlineIcon /> : <AddCircleOutlineIcon />}
                      onClick={toggleExpanded}
                    >
                      {isEndpointsExpanded ? "View Less" : "View More"}
                    </Button>
                  </Stack>
                )}
              </TableCell>
            </TableRow>
            {ResourceConnectivityCustomDNS}
          </TableBody>
        </Table>
      </Box>
      {customDNSData?.dnsName && customDNSData && (
        <Box marginTop={"16px"}>
          <CustomDNSEndPoint
            isPrimaryResource={isPrimaryResource}
            endpointURL={customDNSData?.dnsName}
            endpointName={customDNSData?.name ? customDNSData?.name : "Custom DNS Endpoint"}
          />
        </Box>
      )}
    </ContainerCard>
  );
};

export default ResourceConnectivityEndpoint;

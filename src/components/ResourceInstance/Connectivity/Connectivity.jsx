import { useEffect, useMemo, useState } from "react";

import PropertyDetails from "../ResourceInstanceDetails/PropertyDetails";

import CLIManagedConnectivityDetails from "./CLIManagedConnectivityDetails";
import ResourceConnectivityEndpoint from "./ConnectivityEndpoint";

function Connectivity(props) {
  const {
    networkType,
    ports,
    publiclyAccessible,
    privateNetworkCIDR,
    privateNetworkId,
    globalEndpoints,
    nodes,
    additionalEndpoints,
  } = props;

  const [availabilityZones, setAvailabilityZones] = useState("");
  const primaryResourceName = globalEndpoints?.primary?.resourceName;
  const primaryResourceEndpoint = globalEndpoints?.primary?.endpoint;
  const primaryResourcePorts = ports?.[0];

  const [otherResourceFilteredPorts, otherResourceFilteredEndpoints] = useMemo(() => {
    const otherResourcePorts = ports?.slice(1) ?? [];
    const otherEndpoints = globalEndpoints?.others;

    const otherResourceFilteredPorts = [];
    const otherResourceFilteredEndpoints = [];

    otherEndpoints?.forEach((endpointData) => {
      const { resourceName, endpoint } = endpointData;
      if (resourceName && endpoint) {
        const matchingResourcePort = otherResourcePorts.find(
          (port) => port.resourceName === resourceName && port.ports
        );
        if (matchingResourcePort) {
          // filter out omnistrate observability
          if (resourceName === "Omnistrate Observability") {
            return;
          }
          otherResourceFilteredPorts.push(matchingResourcePort);
          otherResourceFilteredEndpoints.push(endpointData);
        }
      }
    });
    return [otherResourceFilteredPorts, otherResourceFilteredEndpoints];
  }, [ports, globalEndpoints]);

  useEffect(() => {
    let availabilityZone = "";
    const nodeAvailabilityZone = [];
    nodes.map((node) => {
      if (!nodeAvailabilityZone.includes(node.availabilityZone)) {
        if (availabilityZone) {
          if (node?.availabilityZone) {
            availabilityZone = availabilityZone + "," + node.availabilityZone;
          }
        } else availabilityZone = node.availabilityZone;
        nodeAvailabilityZone.push(node.availabilityZone);
      }
    });
    setAvailabilityZones(availabilityZone);
  }, [nodes]);

  const rows = useMemo(() => {
    const res = [];

    if (primaryResourceName && primaryResourceEndpoint) {
      res.push(
        <ResourceConnectivityEndpoint
          isPrimaryResource={true}
          endpointURL={primaryResourceEndpoint}
          resourceName={primaryResourceName}
          viewType="endpoint"
          ports={primaryResourcePorts?.ports}
          resourceHasCompute={globalEndpoints?.primary?.resourceHasCompute}
          customDNSData={globalEndpoints?.primary?.customDNSEndpoint}
          publiclyAccessible={globalEndpoints?.primary?.publiclyAccessible}
        />
      );
    }

    if (otherResourceFilteredEndpoints?.length > 0) {
      otherResourceFilteredEndpoints.forEach(
        ({ resourceName, endpoint, resourceId, customDNSEndpoint, publiclyAccessible }) => {
          if (resourceName && endpoint && otherResourceFilteredPorts) {
            res.push(
              <ResourceConnectivityEndpoint
                key={resourceId}
                isPrimaryResource={false}
                resourceName={resourceName}
                ports={otherResourceFilteredPorts}
                viewType="endpoint"
                endpointURL={endpoint}
                customDNSData={customDNSEndpoint}
                publiclyAccessible={publiclyAccessible}
              />
            );
          }
        }
      );
    }

    return res;
  }, [
    primaryResourceName,
    primaryResourceEndpoint,
    otherResourceFilteredEndpoints,
    primaryResourcePorts,
    otherResourceFilteredPorts,
    globalEndpoints?.primary?.customDNSEndpoint,
    globalEndpoints?.primary?.publiclyAccessible,
    globalEndpoints?.primary?.resourceHasCompute,
  ]);

  const connectivitySummaryData = useMemo(() => {
    const dataFields = [];
    if (networkType) {
      dataFields.push({
        dataTestId: "network-type",
        label: "Network Type",
        value: networkType,
      });
    }
    if (availabilityZones) {
      dataFields.push({
        dataTestId: "availability-zones",
        label: "Availability zones",
        value: availabilityZones,
      });
    }

    dataFields.push({
      dataTestId: "publicly-accessible",
      label: "Publicly Accessible",
      value: publiclyAccessible ? "Yes" : "No",
    });

    if (privateNetworkCIDR) {
      dataFields.push({
        dataTestId: "private-network-cidr",
        label: "Private network CIDR",
        value: privateNetworkCIDR,
      });
    }

    if (privateNetworkId) {
      dataFields.push({
        dataTestId: "private-network-id",
        label: "Private network ID",
        value: privateNetworkId,
      });
    }

    return dataFields;
  }, [networkType, availabilityZones, publiclyAccessible, privateNetworkCIDR, privateNetworkId]);

  if (additionalEndpoints.some((el) => el.additionalEndpoints)) {
    return <CLIManagedConnectivityDetails additionalEndpoints={additionalEndpoints} />;
  }

  return (
    <>
      <PropertyDetails
        rows={{
          title: "Connectivity Details",
          desc: "Information about the deployment instance connectivity options and network settings",
          rows: connectivitySummaryData,
          flexWrap: true,
        }}
        mt="20px"
      />
      <>{rows}</>
    </>
  );
}

export default Connectivity;

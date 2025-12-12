import { FC, ReactNode } from "react";
import Link from "next/link";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Box, Stack, styled } from "@mui/material";
import _ from "lodash";

import { CLI_MANAGED_RESOURCES } from "src/constants/resource";
import { chipCategoryColors } from "src/constants/statusChipStyles";
import { getResourceInstanceChipStylesAndLabel } from "src/constants/statusChipStyles/resourceInstanceHealthStatus";
import {
  InstanceComputedHealthStatus,
  ResourceInstanceNetworkTopology,
  ResourceInstanceNode,
  ResourceNetworkTopologyAdditionalEndpoint,
} from "src/types/resourceInstance";

import AlertTriangle from "../Icons/AlertTriangle/AlertTriangle";
import CircleCheckOutlineIcon from "../Icons/CircleCheckOutline/CircleCheckOutline";
import StatusChip from "../StatusChip/StatusChip";
import Tooltip from "../Tooltip/Tooltip";
import { Text } from "../Typography/Typography";

function getInstanceNodes(detailedNetworkTopology: Record<string, ResourceInstanceNetworkTopology> = {}) {
  let nodes: ResourceInstanceNode[] = [];

  Object.entries(detailedNetworkTopology).forEach(([, topologyDetails]) => {
    if (topologyDetails.hasCompute) {
      const nodesList = topologyDetails.nodes || [];
      nodes.push(...nodesList);
    }
  });
  //@ts-ignore
  nodes = nodes.filter((node) => !node.isServerless);

  nodes = _.uniqBy(nodes, "id");

  return nodes;
}

export function getComplexInstanceHealthStatus(
  detailedNetworkTopology: Record<string, ResourceInstanceNetworkTopology> = {}
): InstanceComputedHealthStatus {
  //instance health status for complex resource instances is derived using the node health status and the endpoint health status
  //we get an addtional field called 'additionalEndpoint' in the topology object
  //additional endpoints will have a healthStatus
  //use both node health status and additional endpoint health status to calculate aggregated health status

  //stores addtional endpoints for all resources in detailedNetworkTopology
  const nodes: ResourceInstanceNode[] = getInstanceNodes(detailedNetworkTopology);

  //stores addtional endpoints for all resources in detailedNetworkTopology
  const allAdditionalEndpoints: (ResourceNetworkTopologyAdditionalEndpoint & {
    endpointName: string;
  })[] = [];

  Object.values(detailedNetworkTopology).forEach((topologyDetails) => {
    const additionalEndpoints = topologyDetails.additionalEndpoints || {};
    Object.entries(additionalEndpoints).forEach(([endpointName, endpointDetails]) => {
      allAdditionalEndpoints.push({
        ...endpointDetails,
        endpointName,
      });
    });
  });

  const healthStatusEntities: {
    type: "node" | "additionalEnpoint";
    healthStatus: string;
    nodeID?: string;
    endpoint?: string;
  }[] = [];

  nodes.forEach((node) => {
    healthStatusEntities.push({
      type: "node",
      healthStatus: node.healthStatus || "UNKNOWN",
      nodeID: node.id,
    });
  });

  allAdditionalEndpoints.forEach((addtionalEnpoint) => {
    healthStatusEntities.push({
      type: "additionalEnpoint",
      healthStatus: addtionalEnpoint.healthStatus || "UNKNOWN",
      endpoint: addtionalEnpoint.endpoint,
    });
  });

  let computedHealthStatus: InstanceComputedHealthStatus = "UNKNOWN";

  if (healthStatusEntities.length > 0) {
    const unknownHealthEntities = healthStatusEntities.filter(
      (entity) => entity.healthStatus?.toUpperCase() === "UNKNOWN"
    );
    const naHealthEntities = healthStatusEntities.filter((entity) => entity.healthStatus?.toUpperCase() === "N/A");

    //health status is UNKNOWN if all entities have UNKNOWN health status
    if (unknownHealthEntities.length === healthStatusEntities.length) {
      computedHealthStatus = "UNKNOWN";

      //health status is N/A if all entities have N/A health status
    } else if (naHealthEntities.length === healthStatusEntities.length) {
      computedHealthStatus = "UNKNOWN";

      //health status is UNKNOWN if all entities have either UNKNOWN or N/A health status
    } else if (unknownHealthEntities.length + naHealthEntities.length === healthStatusEntities.length) {
      computedHealthStatus = "UNKNOWN";
    } else {
      //ignore UNKNOWN, N/A entities and calculate health status
      const nonUnknownHealthEntities = healthStatusEntities.filter(
        (node) => node.healthStatus?.toUpperCase() !== "UNKNOWN" && node.healthStatus?.toUpperCase() !== "N/A"
      );
      //healhy if all entities are healthy
      if (nonUnknownHealthEntities.every((entity) => entity.healthStatus === "HEALTHY")) {
        computedHealthStatus = "HEALTHY";
      } else if (
        //unhealhy if all entities are unhealthy
        nonUnknownHealthEntities.every((entity) => entity.healthStatus === "UNHEALTHY")
      ) {
        computedHealthStatus = "UNHEALTHY";
      } else {
        computedHealthStatus = "DEGRADED";
      }
    }
  }

  return computedHealthStatus;
}

export function getInstanceHealthStatus(
  detailedNetworkTopology: Record<string, ResourceInstanceNetworkTopology> = {},
  instanceLifecycleStatus: string | undefined
): InstanceComputedHealthStatus {
  let isCLIManagedResource = false;
  let isL7LoadBalancer = false;

  if (detailedNetworkTopology) {
    const mainResource = Object.values(detailedNetworkTopology).find(
      (topologyDetails) => topologyDetails.main === true
    );

    if (mainResource && CLI_MANAGED_RESOURCES.includes(mainResource.resourceType as string)) {
      isCLIManagedResource = true;
    }
    if (mainResource && mainResource.resourceType === "l7LoadBalancer") {
      isL7LoadBalancer = true;
    }
  }

  if (isCLIManagedResource || isL7LoadBalancer) return getComplexInstanceHealthStatus(detailedNetworkTopology);

  //return N/A for Stopped instances
  if (instanceLifecycleStatus === "STOPPED") return "UNKNOWN";

  const nodes: ResourceInstanceNode[] = getInstanceNodes(detailedNetworkTopology);

  let computedHealthStatus: InstanceComputedHealthStatus = "UNKNOWN";

  if (nodes.length > 0) {
    if (nodes.every((node) => node.healthStatus === "UNKNOWN")) {
      //health status is unknown if all nodes have unknown health status
      computedHealthStatus = "UNKNOWN";
      //
    } else {
      //ignore unknown nodes and calculate health status
      const nonUnknownHealthNodes = nodes.filter((node) => node.healthStatus !== "UNKNOWN");

      //healhy if all nodes are healthy
      if (nonUnknownHealthNodes.every((node) => node.healthStatus === "HEALTHY")) {
        computedHealthStatus = "HEALTHY";
      } else if (nonUnknownHealthNodes.every((node) => node.healthStatus === "UNHEALTHY")) {
        computedHealthStatus = "UNHEALTHY";
      } else {
        computedHealthStatus = "DEGRADED";
      }
    }
  } else {
    if (instanceLifecycleStatus === "RUNNING" || instanceLifecycleStatus === "READY") {
      computedHealthStatus = "HEALTHY";
    }
  }

  return computedHealthStatus;
}

const List = styled("ul")({
  margin: "0px",
  marginTop: "6px",
  listStyleType: "disc",
  padding: "0px",
  paddingLeft: "22px",
});

const ListItem = styled("li")({
  fontSize: "12px",
  lineHeight: "18px",
  fontWeight: 400,
});

const UnstyledLink = styled(Link)({
  textDecoration: "none",
});

type InstanceHealthStatusChipProps = {
  detailedNetworkTopology: Record<string, ResourceInstanceNetworkTopology>;
  onViewNodesClick?: () => void;
  viewNodesLink?: string;
  computedHealthStatus: InstanceComputedHealthStatus;
  openLinkInSameTab?: boolean;
};

const InstanceHealthStatusChip: FC<InstanceHealthStatusChipProps> = (props) => {
  const {
    detailedNetworkTopology,
    onViewNodesClick,
    viewNodesLink,
    computedHealthStatus,
    openLinkInSameTab = false,
  } = props;

  const nodes = getInstanceNodes(detailedNetworkTopology);

  const chipStylesAndLabel = getResourceInstanceChipStylesAndLabel(computedHealthStatus);

  let startIcon: ReactNode = "";
  if (computedHealthStatus === "DEGRADED") {
    startIcon = <AlertTriangle color={chipCategoryColors.pending.color} />;
  } else if (computedHealthStatus === "UNHEALTHY") {
    startIcon = <AlertTriangle color={chipCategoryColors.failed.color} />;
  }

  let tooltipContent: ReactNode;

  if (computedHealthStatus === "HEALTHY") {
    tooltipContent = (
      <Stack direction="row" alignItems="center" gap="7px">
        <CircleCheckOutlineIcon />
        <Text size="xsmall" weight="semibold" color="white">
          {" "}
          All nodes are healthy
        </Text>
      </Stack>
    );
  }

  if (computedHealthStatus === "DEGRADED" || computedHealthStatus === "UNHEALTHY") {
    const numNodesToDisplay = 3;
    let shouldShowEllipsis = false;
    //all nodes are
    const unhealthyNodes = nodes.filter((node) => node.healthStatus === "UNHEALTHY");
    let visibleNodes = unhealthyNodes;

    if (unhealthyNodes.length > numNodesToDisplay) {
      shouldShowEllipsis = true;
      visibleNodes = visibleNodes.filter((node, index) => index < numNodesToDisplay);
    }

    const viewAllNodesButton = (
      <Stack display="inline-flex" direction="row" alignItems="center" marginTop="12px" sx={{ cursor: "pointer" }}>
        <Text
          size="xsmall"
          weight="medium"
          color="white"
          onClick={() => {
            onViewNodesClick?.();
          }}
        >
          View All
        </Text>
        <ChevronRightIcon sx={{ color: "white" }} />
      </Stack>
    );

    tooltipContent = (
      <Box>
        <Stack direction="row" alignItems="center" gap="7px">
          <AlertTriangle color="#F79009" />
          <Text size="xsmall" weight="semibold" color="white">
            Unhealthy nodes
          </Text>
        </Stack>
        <List>
          {visibleNodes.map((node) => (
            <ListItem key={node.id}>{node.id}</ListItem>
          ))}
        </List>
        {shouldShowEllipsis && <Box textAlign="center">...</Box>}

        {/* {unhealthyNodes.length > numNodesToDisplay && ( */}
        {viewNodesLink ? (
          <UnstyledLink href={viewNodesLink} target={openLinkInSameTab ? "_self" : "_blank"}>
            {viewAllNodesButton}
          </UnstyledLink>
        ) : (
          viewAllNodesButton
        )}
      </Box>
    );
  }

  if (computedHealthStatus === "UNKNOWN") {
    tooltipContent = (
      <Stack direction="row" alignItems="center" gap="7px">
        <AlertTriangle color="#bababa" />
        <Text size="xsmall" weight="semibold" color="white">
          Nodes health status unknown
        </Text>
      </Stack>
    );
  }

  let isCLIManagedResource = false;

  if (detailedNetworkTopology) {
    const mainResource = Object.values(detailedNetworkTopology).find(
      (topologyDetails) => topologyDetails.main === true
    );

    if (mainResource && CLI_MANAGED_RESOURCES.includes(mainResource.resourceType as string)) {
      isCLIManagedResource = true;
    }
  }

  return (
    <Tooltip title={tooltipContent} isVisible={!isCLIManagedResource}>
      <Box display="inline-block">
        <StatusChip {...chipStylesAndLabel} startIcon={startIcon} />
      </Box>
    </Tooltip>
  );
};

export default InstanceHealthStatusChip;

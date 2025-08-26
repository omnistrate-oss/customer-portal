import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Box } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import _ from "lodash";
import { useSelector } from "react-redux";

import DataGridText from "src/components/DataGrid/DataGridText";
import GenerateTokenDialog from "src/components/GenerateToken/GenerateTokenDialog";
import NodeIcon from "src/components/Icons/Node/NodeIcon";
import { productTierTypes } from "src/constants/servicePlan";
import { getResourceInstanceStatusStylesAndLabel } from "src/constants/statusChipStyles/resourceInstanceStatus";

import zoneIcon from "public/assets/images/dashboard/resource-instance-nodes/zone.svg";

import { failoverResourceInstanceNode } from "../../../api/resourceInstance";
import { selectUserrootData } from "../../../slices/userDataSlice";
import {
  getEnumFromUserRoleString,
  isOperationAllowedByRBAC,
  operationEnum,
  viewEnum,
} from "../../../utils/isAllowedByRBAC";
import DataGrid from "../../DataGrid/DataGrid";
import GridCellExpand from "../../GridCellExpand/GridCellExpand";
import StatusChip from "../../StatusChip/StatusChip";

import NodesTableHeader from "./NodesTableHeader";
import { NodeStatus } from "./NodeStatus";

export const getRowBorderStyles = () => {
  const styles = {};

  for (const status of ["DEGRADED", "HEALTHY", "UNHEALTHY", "UNKNOWN", "NA"]) {
    const colorMap = {
      DEGRADED: "#F79009",
      HEALTHY: "#17B26A",
      UNHEALTHY: "#F04438",
      UNKNOWN: "#363F72",
      NA: "#676b83",
    };

    const color = colorMap[status];

    styles[`& .${status}::before`] = {
      content: '""',
      height: "38px",
      width: "4px",
      background: color,
      transform: "translateY(4px)",
      position: "absolute",
      borderTopRightRadius: "3px",
      borderBottomRightRadius: "3px",
    };
  }

  return styles;
};

export default function NodesTable(props) {
  const {
    isInventoryManageInstance,
    isManagedProxy,
    isAccessSide,
    subscriptionData,
    nodes = [],
    refetchData,
    isRefetching,
    isLoading,
    resourceName,
    serviceOffering,
    resourceInstanceId,
    subscriptionId,
    isBYOAServicePlan,
    resourceInstancestatus,
    isServerless,
  } = props;

  const isCustomTenancy = serviceOffering?.productTierType === productTierTypes.CUSTOM_TENANCY;

  const [searchText, setSearchText] = useState("");
  const [selectionModel, setSelectionModel] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isGenerateTokenDialogOpen, setIsGenerateTokenDialogOpen] = useState(false);
  const [dashboardEndpoint, setDashboardEndpoint] = useState("");

  const selectUser = useSelector(selectUserrootData);
  const role = getEnumFromUserRoleString(isAccessSide ? subscriptionData?.roleType : selectUser.roleType);
  const view = viewEnum.Access_Resources;

  const modifyAccessServiceAllowed = isOperationAllowedByRBAC(operationEnum.Update, role, view);
  //remove serverless nodes added on frontend or search by node ID
  const filteredNodes = useMemo(() => {
    let list = nodes.filter((node) => !node.isServerless);
    list = list?.filter((item) => item?.nodeId?.toLowerCase()?.includes(searchText?.toLowerCase()));

    list = _.uniqBy(list, "id");

    return list ?? [];
  }, [searchText, nodes]);

  const customTenancyColumns = useMemo(() => {
    const res = [
      {
        field: "nodeId",
        headerName: "Node ID",
        flex: 1,
        minWidth: 190,
        renderCell: (params) => {
          const nodeId = params.row.nodeId;
          return (
            <GridCellExpand
              startIcon={<NodeIcon />}
              value={nodeId}
              textStyles={{
                color: "#475467",
                marginLeft: "4px",
              }}
            />
          );
        },
      },
      {
        field: "resourceName",
        headerName: `Resource Name`,
        flex: 0.9,
        minWidth: 150,
      },
      {
        field: "isJob",
        headerName: `Resource Type`,
        flex: 0.9,
        minWidth: 80,
        renderCell: (params) => {
          const isJob = params.row.isJob;
          return isJob ? "Job Resource" : "Resource";
        },
      },
    ];
    if (isBYOAServicePlan) {
      res.push({
        field: "kubernetesDashboardEndpoint",
        headerName: "K8s Dashboard Endpoint",
        flex: 1,
        minWidth: 150,
        valueGetter: (params) => params.row.kubernetesDashboardEndpoint?.dashboardEndpoint || "-",
        renderCell: (params) => {
          const { row } = params;
          const dashboardEndpointRow = row.kubernetesDashboardEndpoint?.dashboardEndpoint;
          setDashboardEndpoint(row.kubernetesDashboardEndpoint?.dashboardEndpoint);
          const isDisconnected = resourceInstancestatus === "DISCONNECTED";
          if (!dashboardEndpointRow) {
            return "-";
          }

          return (
            <GridCellExpand
              value={dashboardEndpointRow}
              href={"https://" + dashboardEndpointRow}
              target="_blank"
              externalLinkArrow
              disabled={isDisconnected}
            />
          );
        },
      });
    }

    res.push(
      ...[
        {
          field: "ports",
          headerName: "Ports",
          flex: 0.7,
          minWidth: 150,
          valueGetter: (params) => params.row.ports || "-",
        },
        {
          field: "availabilityZone",
          headerName: "Availability Zone",
          flex: 1,
          minWidth: 155,
          valueGetter: (params) => params.row.availabilityZone,
          renderCell: (params) => {
            const availabilityZone = params.row.availabilityZone;
            return availabilityZone ? (
              <GridCellExpand
                startIcon={<Image src={zoneIcon} alt="zone" />}
                value={availabilityZone}
                textStyles={{
                  color: "#475467",
                  marginLeft: "4px",
                }}
              />
            ) : (
              "-"
            );
          },
        },
      ]
    );
    res.push({
      field: "status",
      headerName: "Lifecycle Status",
      flex: 1,
      valueGetter: (params) => params.row.status,
      renderCell: (params) => {
        const status = params.row.status;
        const statusStylesAndMap = getResourceInstanceStatusStylesAndLabel(status?.toUpperCase());
        return <StatusChip status={status} {...statusStylesAndMap} />;
      },
      minWidth: 200,
    });
    return res;
  }, []);

  const columns = useMemo(
    () => [
      {
        field: "nodeId",
        headerName: "Node ID",
        flex: 1,
        minWidth: 190,
        renderCell: (params) => {
          const nodeId = params.row.nodeId;
          return (
            <GridCellExpand
              startIcon={<NodeIcon />}
              value={nodeId}
              textStyles={{
                color: "#475467",
                marginLeft: "4px",
              }}
            />
          );
        },
      },
      {
        field: "resourceName",
        headerName: `Resource Name`,
        flex: 0.9,
        minWidth: 150,
      },
      {
        field: "isJob",
        headerName: `Resource Type`,
        flex: 0.9,
        minWidth: 80,
        renderCell: (params) => {
          const isJob = params.row.isJob;
          return isJob ? "Job Resource" : "Resource";
        },
      },
      {
        field: "endpoint",
        headerName: "Endpoint",
        flex: 1,
        minWidth: 170,
        renderCell: (params) => {
          const endpoint = params.row.endpoint;
          if (!endpoint || endpoint === "-internal") {
            return "-";
          }
          return <DataGridText showCopyButton>{params.row.endpoint}</DataGridText>;
        },
      },
      {
        field: "ports",
        headerName: "Ports",
        flex: 0.7,
        minWidth: 100,
        valueGetter: (params) => params.row.ports || "-",
      },
      {
        field: "availabilityZone",
        headerName: "Availability Zone",
        flex: 1,
        minWidth: 160,
        renderCell: (params) => {
          const availabilityZone = params.row.availabilityZone;
          return (
            <GridCellExpand
              startIcon={<Image src={zoneIcon} alt="zone" />}
              value={availabilityZone}
              textStyles={{
                color: "#475467",
                marginLeft: "4px",
              }}
            />
          );
        },
      },
      {
        field: "status",
        headerName: "Lifecycle Status",
        flex: 0.9,
        renderCell: (params) => {
          const status = params.row.status;
          const statusStylesAndMap = getResourceInstanceStatusStylesAndLabel(status);
          return <StatusChip status={status} {...statusStylesAndMap} />;
        },
        minWidth: 170,
      },
      {
        field: "healthStatus",
        headerName: "Health Status",
        flex: 0.9,
        renderCell: (params) => {
          const status = params.row.healthStatus ? params.row.healthStatus : "UNKNOWN";

          const lifecycleStatus = params.row.status;
          const isJob = params.row.isJob;
          if (lifecycleStatus === "STOPPED") return <StatusChip category="unknown" label="Unknown" />;

          return params.row?.detailedHealth ? (
            <NodeStatus
              detailedHealth={params.row?.detailedHealth}
              isStopped={params.row.healthStatus === "STOPPED"}
              isJob={isJob}
            />
          ) : (
            <StatusChip status={status} {...(status === "HEALTHY" ? { pulsateDot: true } : { dot: true })} />
          );
        },
        minWidth: 180,
      },
    ],
    []
  );

  const failoverMutation = useMutation({
    mutationFn: (payload) => {
      return failoverResourceInstanceNode(payload);
    },
    onSuccess: async () => {
      await refetchData();
      setSelectionModel([]);
    },
  });

  function handleFailover(nodeId, resourceKey) {
    if (serviceOffering && nodeId) {
      failoverMutation.mutate({
        serviceProviderId: serviceOffering?.serviceProviderId,
        serviceKey: serviceOffering?.serviceURLKey,
        serviceAPIVersion: serviceOffering?.serviceAPIVersion,
        serviceEnvironmentKey: serviceOffering?.serviceEnvironmentURLKey,
        serviceModelKey: serviceOffering?.serviceModelURLKey,
        productTierKey: serviceOffering?.productTierURLKey,
        resourceKey: resourceKey,
        instanceId: resourceInstanceId,
        failedReplicaId: nodeId,
        subscriptionId: subscriptionId,
      });
    }
  }

  useEffect(() => {
    if (selectionModel.length > 0) {
      const selectedNodeId = selectionModel[0];
      const node = filteredNodes.find((node) => node.id === selectedNodeId);
      if (node) {
        setSelectedNode(node);
      }
    } else {
      setSelectedNode(null);
    }
  }, [selectionModel, filteredNodes]);

  let isFailoverEnabled = false;

  if (selectedNode && selectedNode.status === "RUNNING") {
    isFailoverEnabled = true;
  }

  return (
    <Box mt={"32px"}>
      <DataGrid
        checkboxSelection={!isCustomTenancy}
        disableSelectionOnClick
        columns={isCustomTenancy ? customTenancyColumns : columns}
        rows={isLoading ? [] : filteredNodes}
        components={{
          Header: NodesTableHeader,
        }}
        componentsProps={{
          header: {
            resourceName,
            count: filteredNodes.length,
            isRefetching,
            isFailoverDisabled:
              !isFailoverEnabled ||
              failoverMutation.isPending ||
              !modifyAccessServiceAllowed ||
              (isInventoryManageInstance && isManagedProxy), //can't failover fleet instances of type serverless proxy and managedProxyType==="PortsbasedProxy"
            failoverDisabledMessage: !selectedNode
              ? "Please select a node"
              : !modifyAccessServiceAllowed
                ? "Unauthorized to failover nodes"
                : isInventoryManageInstance && isManagedProxy
                  ? "System managed proxy nodes cannot be failed over"
                  : selectedNode?.status !== "RUNNING"
                    ? "Node must be running to failover"
                    : failoverMutation.isPending
                      ? "Failover in progress"
                      : "",
            selectedNode,
            showFailoverButton: !isCustomTenancy && (isAccessSide || isInventoryManageInstance),
            showGenerateTokenButton: Boolean(isCustomTenancy && nodes.some((node) => node.kubernetesDashboardEndpoint)),
            disabledGenerateTokenButton: resourceInstancestatus === "DISCONNECTED",
            onGenerateTokenClick: () => setIsGenerateTokenDialogOpen(true),
            handleFailover,
            failoverMutation,
            searchText,
            setSearchText,
          },
        }}
        getRowClassName={(params) => `${params.row.healthStatus}`}
        sx={{
          "& .node-ports": {
            color: "#101828",
            fontWeight: 500,
          },
          borderRadius: "8px",

          ...getRowBorderStyles(),
        }}
        selectionModel={selectionModel}
        onSelectionModelChange={(newRowSelectionModel) => {
          if (newRowSelectionModel.length > 0) {
            const selectionSet = new Set(selectionModel);
            const newSelectedItem = newRowSelectionModel.filter((s) => !selectionSet.has(s));
            setSelectionModel(newSelectedItem);
          } else {
            setSelectionModel(newRowSelectionModel);
          }
        }}
        loading={isLoading}
        noRowsText={isServerless ? "No nodes to show - serverless instances do not have dedicated nodes" : "No nodes"}
      />
      <GenerateTokenDialog
        dashboardEndpoint={dashboardEndpoint}
        open={isGenerateTokenDialogOpen}
        onClose={() => setIsGenerateTokenDialogOpen(false)}
        selectedInstanceId={resourceInstanceId}
        subscriptionId={subscriptionId}
      />
    </Box>
  );
}

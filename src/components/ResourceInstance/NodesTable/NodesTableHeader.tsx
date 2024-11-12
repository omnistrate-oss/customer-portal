import { Stack } from "@mui/material";

import Button from "src/components/Button/Button";
import LoadingSpinnerSmall from "src/components/CircularProgress/CircularProgress";
import DataGridHeaderTitle from "src/components/Headers/DataGridHeaderTitle";
import FailoverIcon from "src/components/Icons/Failover/Failover";
import GenerateTokenIcon from "src/components/Icons/GenerateToken/GenerateTokenIcon";
import RefreshWithToolTip from "src/components/RefreshWithTooltip/RefreshWithToolTip";

const NodesTableHeader = ({
  resourceName,
  count,
  refetchData,
  isRefetching,
  isFailoverDisabled,
  selectedNode,
  showFailoverButton,
  showGenerateTokenButton,
  onGenerateTokenClick = () => {},
  handleFailover,
  failoverMutation,
  isGenerateTokenDisabled,
}) => {
  return (
    <>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        p="20px"
        borderBottom="1px solid #EAECF0"
      >
        <DataGridHeaderTitle
          title={`List of Nodes ${resourceName ? `for ${resourceName}` : ""}`}
          desc="View and manage your Nodes"
          count={count}
          units={{
            singular: "Node",
            plural: "Nodes",
          }}
        />
        <Stack direction="row" alignItems="center" gap="12px">
          <RefreshWithToolTip refetch={refetchData} disabled={isRefetching} />

          {showFailoverButton && (
            <Button
              variant="outlined"
              sx={{
                height: "40px !important",
                padding: "10px 14px !important",
              }}
              startIcon={<FailoverIcon disabled={isFailoverDisabled} />}
              disabled={isFailoverDisabled}
              onClick={() => {
                if (selectedNode && !isFailoverDisabled) {
                  handleFailover(selectedNode.nodeId, selectedNode.resourceKey);
                }
              }}
            >
              Failover
              {failoverMutation.isLoading && (
                <LoadingSpinnerSmall
                  sx={{ marginLeft: "12px" }}
                />
              )}
            </Button>
          )}

          {showGenerateTokenButton && (
            <Button
              variant="outlined"
              sx={{
                height: "40px !important",
                padding: "10px 14px !important",
              }}
              startIcon={
                <GenerateTokenIcon disabled={isGenerateTokenDisabled} />
              }
              onClick={onGenerateTokenClick}
              disabled={isGenerateTokenDisabled}
            >
              Generate Token
            </Button>
          )}
        </Stack>
      </Stack>
    </>
  );
};

export default NodesTableHeader;

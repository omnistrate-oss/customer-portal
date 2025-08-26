import { CircularProgress, Stack } from "@mui/material";

import Button from "src/components/Button/Button";
import LoadingSpinnerSmall from "src/components/CircularProgress/CircularProgress";
import SearchInput from "src/components/DataGrid/SearchInput";
import DataGridHeaderTitle from "src/components/Headers/DataGridHeaderTitle";
import FailoverIcon from "src/components/Icons/Failover/Failover";
import GenerateTokenIcon from "src/components/Icons/GenerateToken/GenerateTokenIcon";

type NodesTableHeaderProps = {
  resourceName?: string;
  count: number;
  refetchData: () => void;
  isRefetching: boolean;
  isFailoverDisabled: boolean;
  failoverDisabledMessage?: string;
  selectedNode?: { nodeId: string; resourceKey: string };
  showFailoverButton: boolean;
  showGenerateTokenButton: boolean;
  disabledGenerateTokenButton: boolean;
  onGenerateTokenClick?: () => void;
  handleFailover: (nodeId: string, resourceKey: string) => void;
  failoverMutation: { isPending: boolean };
  searchText: string;
  setSearchText: (text: string) => void;
};

const NodesTableHeader: React.FC<NodesTableHeaderProps> = ({
  resourceName,
  count,
  isRefetching,
  isFailoverDisabled,
  failoverDisabledMessage,
  selectedNode,
  showFailoverButton,
  showGenerateTokenButton,
  disabledGenerateTokenButton,
  onGenerateTokenClick = () => {},
  handleFailover,
  failoverMutation,
  searchText,
  setSearchText,
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
        <div className="flex items-center gap-4">
          <div className="flex items-center mr-6">{isRefetching && <CircularProgress size={20} />}</div>
          <SearchInput
            searchText={searchText}
            setSearchText={setSearchText}
            placeholder="Search by Node ID"
            width="250px"
          />

          {showFailoverButton && (
            <Button
              variant="outlined"
              sx={{
                height: "40px !important",
                padding: "10px 14px !important",
              }}
              startIcon={<FailoverIcon disabled={isFailoverDisabled} />}
              disabled={isFailoverDisabled}
              disabledMessage={failoverDisabledMessage}
              onClick={() => {
                if (selectedNode && !isFailoverDisabled) {
                  handleFailover(selectedNode.nodeId, selectedNode.resourceKey);
                }
              }}
            >
              Failover
              {failoverMutation.isPending && <LoadingSpinnerSmall sx={{ marginLeft: "12px" }} />}
            </Button>
          )}

          {showGenerateTokenButton && (
            <Button
              variant="outlined"
              sx={{
                height: "40px !important",
                padding: "10px 14px !important",
              }}
              disabled={disabledGenerateTokenButton}
              startIcon={<GenerateTokenIcon />}
              onClick={onGenerateTokenClick}
            >
              Generate Token
            </Button>
          )}
        </div>
      </Stack>
    </>
  );
};

export default NodesTableHeader;

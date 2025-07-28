import { useCallback, useEffect, useRef, useState } from "react";
import styled from "@emotion/styled";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { Box, CircularProgress, IconButton as MuiIconButton, Stack } from "@mui/material";
// import Ansi from "ansi-to-react";
import _ from "lodash";
import { dataTestIds } from "page-objects/instance-details-page";
import InfiniteScroll from "react-infinite-scroller";
import { useWebSocket } from "react-use-websocket/dist/lib/use-websocket";

import SearchInput from "src/components/DataGrid/SearchInput";
import FieldTitle from "src/components/FormElementsv2/FieldTitle/FieldTitle";
import MenuItem from "src/components/FormElementsv2/MenuItem/MenuItem";
import Select from "src/components/FormElementsv2/Select/Select";
import JobCompleted from "src/components/JobResource/JobCompleted";
import LoadingSpinner from "src/components/LoadingSpinner/LoadingSpinner";
import Switch from "src/components/Switch/Switch";

import useSnackbar from "../../../hooks/useSnackbar";
import Card from "../../Card/Card";
import Tooltip from "../../Tooltip/Tooltip";
import { Text } from "../../Typography/Typography";
import DataUnavailableMessage from "../DataUnavailableMessage";

import SyntaxHighlightedLog from "./SyntaxHighlightedLog";

const logsPerPage = 50;

const connectionStatuses = {
  idle: "idle",
  connected: "connected",
  failed: "error",
  disconnected: "disconnected",
};

const Log = styled("pre")({
  fontWeight: 500,
  fontSize: "12px",
  lineHeight: "16px",
  color: "#FFFFFF",
  wordBreak: "break-word",
  whiteSpace: "pre-wrap",
  marginBlock: "0px",
});

const LogsContainer = styled(Box)(() => ({
  height: 500,
  overflowY: "auto",
  // marginTop: 24,
  borderRadius: "8px",
  backgroundColor: "#101828",
  padding: "0px 60px 24px 24px",
  fontFamily: "Monaco, monospace",
  color: "#FFFFFF",
}));

const IconButton = ({ direction, divRef, titleText, dataTestId }) => {
  const position = direction === "up" ? { top: "20px" } : { bottom: "20px" };

  return (
    <MuiIconButton
      data-testid={dataTestId}
      onClick={() => divRef.current.scrollIntoView({ behavior: "smooth" })}
      sx={{
        position: "absolute",
        border: "1px solid #2B3E6B",
        right: "28px",
        backgroundColor: "#1D273F",
        boxShadow: "0px 1px 2px 0px #1018280D",

        "&:hover": {
          backgroundColor: "#1D273F",
        },
        ...position,
      }}
    >
      <Tooltip
        title={<Text sx={{ padding: "4px", color: "white" }}>{titleText}</Text>}
        placement={direction === "up" ? "bottom-start" : "top-start"}
      >
        {direction === "up" ? (
          <KeyboardArrowUpIcon sx={{ color: "#DCE1E8" }} />
        ) : (
          <KeyboardArrowDownIcon sx={{ color: "#DCE1E8" }} />
        )}
      </Tooltip>
    </MuiIconButton>
  );
};

function Logs(props) {
  const { nodes: nodesList = [], socketBaseURL, instanceStatus, resourceInstanceId } = props;
  const [logs, setLogs] = useState([]);
  const [, setLogBuffer] = useState(""); // Buffer for partial log lines
  const bufferTimeoutRef = useRef(null); // Add this ref
  const [enableSyntaxHighlighting, setEnableSyntaxHighlighting] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [
    invertLogOrder,
    // setInvertLogOrder
  ] = useState(false);

  let firstNode = null;

  const nodes = _.uniqBy(nodesList, "id");

  if (nodes.length > 0) {
    firstNode = nodes[0];
  }

  const [selectedNode, setSelectedNode] = useState(firstNode);

  const [errorMessage, setErrorMessage] = useState("");
  let logsSocketEndpoint = null;
  if (socketBaseURL && selectedNode) {
    logsSocketEndpoint = `${socketBaseURL}&podName=${selectedNode.id}&instanceId=${resourceInstanceId}`;
  }
  if (instanceStatus === "STOPPED") {
    logsSocketEndpoint = null;
  }

  const [isLogsDataLoaded, setIsLogsDataLoaded] = useState(false);
  const [socketConnectionStatus, setConnectionStatus] = useState(connectionStatuses.idle);
  const [hasMoreLogs, setHasMoreLogs] = useState(true);
  const [records, setRecords] = useState(logsPerPage);
  const startDivRef = useRef();
  const endDivRef = useRef();

  // Filter logs based on search text
  const filteredLogs = searchText ? logs.filter((log) => log.toLowerCase().includes(searchText.toLowerCase())) : logs;

  // Apply log order inversion if enabled
  const displayLogs = invertLogOrder ? [...filteredLogs].reverse() : filteredLogs;

  const loadMoreLogs = () => {
    if (records === displayLogs.length) {
      setHasMoreLogs(false);
    } else if (records < displayLogs.length) {
      setRecords((prev) => prev + logsPerPage);
    }
  };

  const snackbar = useSnackbar();

  // Helper function to flush buffer
  const flushBuffer = useCallback(() => {
    setLogBuffer((currentBuffer) => {
      if (currentBuffer.trim()) {
        setLogs((prevLogs) => [...prevLogs, currentBuffer]);
      }
      return "";
    });
  }, []);

  // Clear timeout on node change or unmount
  useEffect(() => {
    setLogs([]);
    setLogBuffer(""); // Clear buffer on new connection
    if (bufferTimeoutRef.current) {
      clearTimeout(bufferTimeoutRef.current);
    }
  }, [selectedNode]);

  // Reset pagination when search changes
  useEffect(() => {
    setRecords(logsPerPage);
    setHasMoreLogs(true);
  }, [searchText]);

  function handleNodeChange(event) {
    const { value } = event.target;
    setSelectedNode(value);
  }

  const { getWebSocket } = useWebSocket(logsSocketEndpoint, {
    onOpen: () => {
      setConnectionStatus(connectionStatuses.connected);
      setLogs([]);
      // setIsLogsDataLoaded(true);
    },
    onError: (event) => {
      console.log("Socket connection error", event);
    },
    onMessage: (event) => {
      if (!isLogsDataLoaded) {
        setIsLogsDataLoaded(true);
      }
      const data = event.data;
      // Clear existing timeout
      if (bufferTimeoutRef.current) {
        clearTimeout(bufferTimeoutRef.current);
      }

      // Process the incoming data with buffering
      setLogBuffer((currentBuffer) => {
        // Combine buffer with new data
        const combinedData = currentBuffer + data;

        // Split by line breaks (supporting both \r\n and \n)
        const lines = combinedData.split(/\r?\n/);

        // The last element might be incomplete if it doesn't end with a line break
        const potentialIncompleteLog = lines.pop();

        // Add complete lines to logs (if any)
        if (lines.length > 0) {
          setLogs((prevLogs) => [...prevLogs, ...lines?.map((line) => (line ? line : "\n"))]);
        }

        // Set timeout to flush buffer after 5 second of inactivity
        if (potentialIncompleteLog && potentialIncompleteLog.trim()) {
          bufferTimeoutRef.current = setTimeout(() => {
            flushBuffer();
          }, 5000);
        }

        // Return the potentially incomplete line as the new buffer
        // If the original data ended with a line break, this will be empty
        return potentialIncompleteLog || "";
      });
    },
    onClose: () => {
      // console.log("Socket Connection closed", event);
      if (bufferTimeoutRef.current) {
        clearTimeout(bufferTimeoutRef.current);
      }
      flushBuffer();
    },
    shouldReconnect: () => true,
    reconnectAttempts: 3,
    retryOnError: true,
    reconnectInterval: (attemptNumber) => {
      const interval = Math.pow(2, attemptNumber) * 1000;
      return interval;
    },
    onReconnectStop: () => {
      if (isLogsDataLoaded) {
        snackbar.showError("Unable to get the latest data. The displayed data might be outdated");
      } else {
        // snackbar.showError("Unable to get the latest data...");
        setErrorMessage("Can't access logs data. Please check if the instance is available and logs are enabled.");
      }
      if (bufferTimeoutRef.current) {
        clearTimeout(bufferTimeoutRef.current);
      }
      flushBuffer();
    },
  });

  useEffect(() => {
    function handleNetorkDisconnect() {
      snackbar.showError("Network disconnected. The displayed data might be outdated");
    }
    window.addEventListener("offline", handleNetorkDisconnect);
    //close the socket on unmount
    return () => {
      window.removeEventListener("offline", handleNetorkDisconnect);
      const socket = getWebSocket();
      if (socket) {
        socket.close();
      }

      if (bufferTimeoutRef.current) {
        clearTimeout(bufferTimeoutRef.current);
      }
      setLogBuffer("");
    };
  }, [logsSocketEndpoint]);

  if (instanceStatus === "DISCONNECTED") {
    return (
      <DataUnavailableMessage title="Logs Unavailable" description="Please connect the cloud account to view logs" />
    );
  }

  if (instanceStatus !== "COMPLETE" && selectedNode?.isJob !== true) {
    if (!logsSocketEndpoint || errorMessage || instanceStatus === "STOPPED") {
      return (
        <Card
          mt={4}
          sx={{
            paddingTop: "12.5px",
            paddingLeft: "20px",
            paddingRight: "20px",
            minHeight: "500px",
          }}
        >
          <Stack direction="row" justifyContent="center" marginTop="200px">
            <Text size="xlarge">
              {errorMessage ||
                `Logs are not available ${instanceStatus !== "RUNNING" ? "as the instance is not running" : ""}`}
            </Text>
          </Stack>
        </Card>
      );
    }
  }

  if (
    !isLogsDataLoaded &&
    socketConnectionStatus === connectionStatuses.connected &&
    instanceStatus !== "COMPLETE" &&
    selectedNode?.isJob !== true
  ) {
    return (
      <Stack flexDirection={"column"} gap="30px" alignItems="center" sx={{ marginTop: "200px", marginBottom: "200px" }}>
        <CircularProgress />
        <Text size="large" weight="medium">
          Connected to the server, logs will be available shortly
        </Text>
      </Stack>
    );
  }
  if (!isLogsDataLoaded && instanceStatus !== "COMPLETE" && selectedNode?.isJob !== true) {
    return <LoadingSpinner />;
  }

  return (
    <Card
      mt={"32px"}
      sx={{
        padding: 0,

        minHeight: "500px",
        borderRadius: "8px",
      }}
    >
      <Box>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          padding="20px"
          borderBottom="1px solid #EAECF0"
          gap="20px"
          flexWrap="wrap"
        >
          {nodes?.length > 0 && (
            <Box sx={{ minWidth: "200px" }}>
              <Select
                data-testid={dataTestIds.liveLogs.nodeIdMenu}
                value={selectedNode}
                sx={{
                  width: "100%",
                  height: "36px",
                  fontSize: "14px",
                }}
                onChange={handleNodeChange}
              >
                {nodes.map((node) => (
                  <MenuItem
                    value={node}
                    key={node.id}
                    sx={{
                      whiteSpace: "normal",
                      wordBreak: "break-all",
                      fontSize: "14px",
                    }}
                  >
                    {node.displayName}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          )}
          <Stack direction="row" justifyContent="end" alignItems="center" gap="20px" flexWrap="wrap">
            <SearchInput
              placeholder="Search logs..."
              searchText={searchText}
              setSearchText={setSearchText}
              width="250px"
            />

            <Stack direction="row" gap="6px" alignItems="center">
              <FieldTitle>Syntax Highlight</FieldTitle>
              <Switch
                checked={enableSyntaxHighlighting}
                onChange={(e) => setEnableSyntaxHighlighting(e.target.checked)}
                size="small"
              />
            </Stack>

            {/* <Stack direction="row" gap="6px" alignItems="center">
            <FieldTitle>Log Order</FieldTitle>
            <Switch checked={invertLogOrder} onChange={(e) => setInvertLogOrder(e.target.checked)} size="small" />
          </Stack> */}
          </Stack>
        </Stack>
      </Box>
      {instanceStatus === "COMPLETE" && selectedNode?.isJob === true ? (
        <JobCompleted />
      ) : (
        <Box sx={{ padding: "20px" }}>
          <Box position="relative">
            <LogsContainer data-testid="logs-container" className="sleek-scroll">
              <div ref={startDivRef} style={{ visibility: "hidden", height: "24px" }} />
              <InfiniteScroll pageStart={0} hasMore={hasMoreLogs} loadMore={loadMoreLogs} useWindow={false}>
                {displayLogs
                  ?.filter((log, index) => index < records)
                  .map((log, index) => {
                    return (
                      <Log key={`${log}-${index}`}>
                        <SyntaxHighlightedLog logLine={log} enableSyntaxHighlighting={enableSyntaxHighlighting} />
                      </Log>
                    );
                  })}
              </InfiniteScroll>
              <div ref={endDivRef} style={{ visibility: "hidden" }} />
            </LogsContainer>
            {isLogsDataLoaded && (
              <>
                <IconButton
                  dataTestId="scroll-to-top-button"
                  titleText="Navigate to top"
                  direction="up"
                  divRef={startDivRef}
                />
                <IconButton
                  dataTestId="scroll-to-bottom-button"
                  titleText="Navigate to bottom"
                  direction="down"
                  divRef={endDivRef}
                />
              </>
            )}
          </Box>
        </Box>
      )}
    </Card>
  );
}

export default Logs;

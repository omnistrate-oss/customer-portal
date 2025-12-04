import { useCallback, useEffect, useRef, useState } from "react";
import styled from "@emotion/styled";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { Box, CircularProgress, IconButton as MuiIconButton, Stack } from "@mui/material";
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

const logsPerPage = 1500;

const connectionStatuses = {
  idle: "idle",
  connected: "connected",
  failed: "error",
  disconnected: "disconnected",
};

// Styled components moved before main component to avoid hoisting issues
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
      <Tooltip title={titleText} placement={direction === "up" ? "bottom-start" : "top-start"}>
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
  const logsRef = useRef([]); // Store logs in ref to avoid re-renders
  const logsBuffer = useRef(""); // Buffer for partial log lines
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
  // eslint-disable-next-line no-unused-vars
  const [, setRenderTrigger] = useState(0); // Force re-render when logs update
  // renderTrigger is used implicitly to trigger re-renders - its value doesn't matter, just the fact that it changes

  const renderTimeoutRef = useRef(null); // Throttle re-renders
  const startDivRef = useRef();
  const endDivRef = useRef();

  // Filter logs based on search text - computed fresh each render
  const filteredLogs = searchText
    ? logsRef.current.filter((log) => log.toLowerCase().includes(searchText.toLowerCase()))
    : logsRef.current;

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
    if (logsBuffer.current.trim()) {
      logsRef.current = [...logsRef.current, logsBuffer.current];
      logsBuffer.current = ""; // Clear the buffer after flushing
      // Trigger re-render when buffer is flushed
      setRenderTrigger((prev) => prev + 1);
    }
  }, []);

  // Throttled function to trigger re-renders for new logs
  const throttledRenderUpdate = useCallback(() => {
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }
    renderTimeoutRef.current = setTimeout(() => {
      setRenderTrigger((prev) => prev + 1);
    }, 50); // Update every 50ms max (~20fps)
  }, []);

  // Clear timeout on node change or unmount
  useEffect(() => {
    logsRef.current = []; // Clear logs ref
    logsBuffer.current = ""; // Clear buffer on new connection
    if (bufferTimeoutRef.current) {
      clearTimeout(bufferTimeoutRef.current);
    }
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
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
      logsRef.current = []; // Clear logs ref
      setRecords(logsPerPage); // Reset records count
      logsBuffer.current = ""; // Clear buffer on new connection
      // Clear any existing timeout
      if (bufferTimeoutRef.current) {
        clearTimeout(bufferTimeoutRef.current);
      }
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
      //Process incoming data with buffering to combine incomplete logs
      // Combine buffer with new data
      const combinedData = logsBuffer.current + data;

      // Split by line breaks (supporting both \r\n and \n)
      const lines = combinedData.split(/\r?\n/);

      // The last element might be incomplete if it doesn't end with a line break
      const potentialIncompleteLog = lines.pop();

      // Add complete lines to logs (if any)
      if (lines.length > 0) {
        const previousLogCount = logsRef.current.length;
        // Update ref instead of state to avoid re-renders
        logsRef.current = [...logsRef.current, ...lines?.map((line) => (line ? line : "\n"))];

        // Only trigger re-render if new logs would be visible in current view
        // This is a huge performance optimization - we only re-render when necessary
        const filteredPreviousCount = searchText
          ? logsRef.current
              .slice(0, previousLogCount)
              .filter((log) => log.toLowerCase().includes(searchText.toLowerCase())).length
          : previousLogCount;

        if (filteredPreviousCount < records) {
          // New logs would be visible, trigger a throttled re-render
          throttledRenderUpdate();
        }

        // Only update hasMoreLogs if we're currently at the end and new logs are available
        if (!hasMoreLogs && filteredPreviousCount >= records - logsPerPage) {
          setHasMoreLogs(true);
        }
      }

      // Set timeout to flush buffer after 5 second of inactivity
      if (potentialIncompleteLog && potentialIncompleteLog.trim()) {
        bufferTimeoutRef.current = setTimeout(() => {
          flushBuffer();
        }, 5000);
      }

      // Update the buffer with the potentially incomplete log
      // If the original data ended with a line break, this will be empty

      logsBuffer.current = potentialIncompleteLog || "";
    },
    onClose: () => {
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
    // The filter function below always returns false to prevent the useWebSocket hook
    // from triggering rerenders due to internal state changes (such as incoming messages).
    // This is necessary for performance optimization, especially when handling large volumes
    // of log data, as it avoids unnecessary UI updates and keeps the interface responsive.
    filter: () => false,
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
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
      logsBuffer.current = "";
    };
  }, [logsSocketEndpoint, getWebSocket, snackbar]);

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
                  titleText={"Navigate to top"}
                  direction="up"
                  divRef={startDivRef}
                />
                <IconButton
                  dataTestId="scroll-to-bottom-button"
                  titleText={"Navigate to bottom"}
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

type MessageInputProps = {
  message?: string;
  initialRows?: number;
  minRows?: number;
  maxRows?: number;
  showCopyButton?: boolean;
};
import { FC, useCallback, useEffect, useRef, useState } from "react";
import { Box, TextField } from "@mui/material";

import { getEventMessageStylesAndLabel } from "src/constants/statusChipStyles/eventMessage";

import CopyButton from "../Button/CopyButton";

import DragIndicatorIcon from "./Icon/DragIndicatorIcon";

const MessageInput: FC<MessageInputProps> = ({ message, maxRows = 1000, showCopyButton = false }) => {
  // Mirror div for accurate line calculation
  const boxRef = useRef<HTMLDivElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const [mirrorRows, setMirrorRows] = useState(1);

  // Update mirrorRows whenever message or width changes
  useEffect(() => {
    if (mirrorRef.current && boxRef.current) {
      const mirror = mirrorRef.current;
      const box = boxRef.current;
      // Set mirror width to match the input
      mirror.style.width = `${box.offsetWidth}px`;
      // Set text and measure height
      mirror.textContent = message || " ";
      const height = mirror.offsetHeight;
      const lineHeight = parseFloat(getComputedStyle(mirror).lineHeight || "20");
      const rows = Math.round(height / lineHeight);
      setMirrorRows(Math.max(1, Math.min(rows, 4)));
    }
  }, [message]);

  // Use mirrorRows for dynamic row calculation
  const calculateRowsFromText = useCallback(() => mirrorRows, [mirrorRows]);

  const [rows, setRows] = useState(() => calculateRowsFromText());
  const [baseRows, setBaseRows] = useState(() => calculateRowsFromText()); // Track base text height
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef<number>(0);
  const startRows = useRef<number>(0);

  // Update rows when message changes, but respect manual adjustments
  useEffect(() => {
    if (!isDragging) {
      const newBaseRows = calculateRowsFromText();
      setBaseRows(newBaseRows);

      // Only auto-adjust if the current rows haven't been manually changed
      // or if the new content requires more space than current
      if (rows <= baseRows || newBaseRows > rows) {
        setRows(newBaseRows);
      }
    }
  }, [message, calculateRowsFromText, isDragging, baseRows, rows]);

  // Add click functionality to the drag icon for quick height adjustments
  const handleIconClick = useCallback(() => {
    if (!isDragging) {
      // Toggle between natural text height and expanded view
      if (rows === baseRows) {
        // Expand to show more content
        setRows(Math.min(baseRows + 1, maxRows));
      } else {
        // Reset to natural text height
        setRows(baseRows);
      }
    }
  }, [rows, baseRows, maxRows, isDragging]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Prevent click event when starting drag
      e.preventDefault();
      e.stopPropagation();

      setIsDragging(true);
      dragStartY.current = e.clientY;
      startRows.current = rows;
    },
    [rows]
  );

  // Improved drag functionality with dynamic minimum rows
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaY = e.clientY - dragStartY.current;
      // More sensitive dragging: 15px per row instead of 20px
      const deltaRows = Math.round(deltaY / 15);

      // Dynamic minRows: equal to text content (baseRows), no hardcoded minimum
      const dynamicMinRows = baseRows;
      const newRows = Math.max(dynamicMinRows, Math.min(maxRows, startRows.current + deltaRows));

      setRows(newRows);
    },
    [isDragging, maxRows, baseRows]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global mouse event listeners when dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ns-resize";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const messageStyles = getEventMessageStylesAndLabel(message);

  return (
    <Box
      ref={boxRef}
      sx={{
        display: "flex",
        alignItems: "stretch",
        width: "100%",
        position: "relative",
        marginTop: "8px",
        marginBottom: "8px",
      }}
    >
      {/* Hidden mirror for accurate line calculation */}
      <div
        ref={mirrorRef}
        style={{
          position: "absolute",
          visibility: "hidden",
          height: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontSize: "14px",
          fontWeight: 500,
          fontFamily: "inherit",
          lineHeight: "20px",
          boxSizing: "border-box",
          pointerEvents: "none",
          padding: "0px 60px 0px 0px",
          zIndex: -1,
        }}
      />
      <TextField
        value={message}
        disabled
        multiline
        rows={rows}
        variant="outlined"
        size="small"
        title=""
        sx={{
          flex: 1,
          "& .MuiInputBase-input.Mui-disabled": {
            WebkitTextFillColor: messageStyles.color,
            color: messageStyles.color,
            fontSize: "14px",
            fontWeight: 500,
            lineHeight: "20px",
          },
          "& .MuiOutlinedInput-root.Mui-disabled": {
            backgroundColor: "#FFFFFF",
            borderRadius: "8px",
            "& fieldset": {
              borderColor: "#D5D7DA",
            },
          },
        }}
      />
      <Box
        onMouseDown={handleMouseDown}
        onClick={handleIconClick}
        sx={{
          position: "absolute",
          right: 38,
          bottom: 3,
          width: "16px",
          height: "16px",
          cursor: "ns-resize",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "2px",
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.04)",
          },
          "&:active": {
            backgroundColor: "rgba(0, 0, 0, 0.08)",
          },
        }}
      >
        <DragIndicatorIcon />
      </Box>
      {showCopyButton && (
        <Box>
          <CopyButton text={message} iconProps={{ color: "#6941C6", width: 20, height: 20 }} />
        </Box>
      )}
    </Box>
  );
};

export default MessageInput;

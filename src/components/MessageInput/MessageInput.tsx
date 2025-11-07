import { FC, useLayoutEffect, useRef, useState } from "react";
import { Box, TextField } from "@mui/material";

import { getEventMessageStylesAndLabel } from "src/constants/statusChipStyles/eventMessage";

import CopyButton from "../Button/CopyButton";

import DragIndicatorIcon from "./Icon/DragIndicatorIcon";

type MessageInputProps = {
  message?: string;
  showCopyButton?: boolean;
};

const MIN_ROWS = 1;
const MAX_ROWS = 50; // Allow drag up to 50 rows

const MessageInput: FC<MessageInputProps> = ({ message, showCopyButton = false }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [rows, setRows] = useState(MIN_ROWS);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const startRows = useRef(MIN_ROWS);

  // Calculate rows based on content (auto sizing)
  useLayoutEffect(() => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    textarea.value = message || "";
    const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight || "20");
    // Clamp auto-sizing to 4 rows, but allow drag up to MAX_ROWS
    const scrollRows = Math.max(MIN_ROWS, Math.min(Math.ceil(textarea.scrollHeight / lineHeight), 4));
    setRows(scrollRows);
  }, [message]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    startRows.current = rows;
    document.body.style.cursor = "ns-resize";
  };

  // Mouse move and up listeners
  useLayoutEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - dragStartY.current;
      const deltaRows = Math.round(deltaY / 15); // 15px per row
      let newRows = startRows.current + deltaRows;
      newRows = Math.max(MIN_ROWS, Math.min(newRows, MAX_ROWS));
      setRows(newRows);
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = "";
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
    };
  }, [isDragging]);

  const messageStyles = getEventMessageStylesAndLabel(message ?? "");

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "stretch",
        width: "100%",
        position: "relative",
        marginTop: "8px",
        marginBottom: "8px",
      }}
    >
      {/* Hidden textarea for accurate row calculation */}
      <textarea
        ref={textareaRef}
        style={{
          position: "absolute",
          visibility: "hidden",
          height: 0,
          overflow: "hidden",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontSize: "14px",
          fontWeight: 500,
          fontFamily: "inherit",
          lineHeight: "20px",
          boxSizing: "border-box",
          pointerEvents: "none",
          zIndex: -1,
          padding: 0,
          border: 0,
          resize: "none",
        }}
        rows={MIN_ROWS}
        defaultValue={message}
        tabIndex={-1}
        aria-hidden
        readOnly
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
            overflowY: rows > 3 ? "auto" : "hidden",
            scrollbarWidth: rows > 3 ? "auto" : "none",
            msOverflowStyle: rows > 4 ? "auto" : "none",
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

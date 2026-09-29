import React from "react";
import { styled } from "@mui/material";
import Ansi from "ansi-to-react";

interface SyntaxHighlightedLogProps {
  logLine: string;
}

// Enhanced log renderer with basic syntax highlighting using styled components
const HighlightedLogContent = styled("span", {
  shouldForwardProp: (prop) => prop !== "logType",
})<{ logType?: string }>(({ logType }) => ({
  // Base styling consistent with Log component
  fontWeight: 500,
  fontSize: "12px",
  lineHeight: "16px",
  color: "#FFFFFF",
  wordBreak: "break-word",
  whiteSpace: "pre-wrap",
  marginBlock: "0px",

  // Enhanced typography for better readability
  fontFeatureSettings: '"liga" 1, "calt" 1', // Enable ligatures
  fontVariantLigatures: "contextual",

  // Better spacing and kerning
  letterSpacing: "0.02em",

  // Performance optimization - will-change for animations
  willChange: "transform",

  // Accessibility improvements
  tabSize: 2,
  MozTabSize: 2,

  // JSON highlighting
  ...(logType === "json" && {
    "& .json-key": {
      color: "#79C0FF",
      fontWeight: 600,
    },
    "& .json-string": {
      color: "#A5D6FF",
    },
    "& .json-number": {
      color: "#79C0FF",
      fontWeight: 500,
    },
    "& .json-boolean": {
      color: "#FF7B72",
      fontWeight: "bold",
    },
    "& .json-null": {
      color: "#8B949E",
      fontStyle: "italic",
    },
    "& .json-brace": {
      color: "#FFA657",
      fontWeight: "bold",
    },
  }),

  // Log level highlighting
  ...((logType === "log" || logType === "bash") && {
    "& .log-error": {
      color: "#FF7B72",
      fontWeight: "bold",
      textShadow: "0 0 3px rgba(255, 123, 114, 0.3)",
    },
    "& .log-warning": {
      color: "#FFA657",
      fontWeight: "bold",
    },
    "& .log-info": {
      color: "#79C0FF",
      fontWeight: 600,
    },
    "& .log-debug": {
      color: "#8B949E",
    },
    "& .log-timestamp": {
      color: "#A5D6FF",
      fontWeight: 500,
    },
    "& .log-ip": {
      color: "#FF7B72",
      fontWeight: 500,
    },
    "& .log-status": {
      color: "#56D364",
      fontWeight: "bold",
    },
    "& .log-method": {
      color: "#FFA657",
      fontWeight: "bold",
    },
  }),

  // SQL highlighting
  ...(logType === "sql" && {
    "& .sql-keyword": {
      color: "#FF7B72",
      fontWeight: "bold",
      textTransform: "uppercase",
    },
    "& .sql-string": {
      color: "#A5D6FF",
    },
    "& .sql-comment": {
      color: "#8B949E",
      fontStyle: "italic",
    },
    "& .sql-table": {
      color: "#79C0FF",
      fontWeight: 600,
    },
    "& .sql-function": {
      color: "#FFA657",
      fontWeight: 500,
    },
  }),

  // XML/HTML highlighting
  ...(logType === "xml" && {
    "& .xml-tag": {
      color: "#FF7B72",
      fontWeight: 500,
    },
    "& .xml-attr": {
      color: "#79C0FF",
      fontWeight: 500,
    },
    "& .xml-value": {
      color: "#A5D6FF",
    },
    "& .xml-bracket": {
      color: "#8B949E",
      fontWeight: "bold",
    },
  }),

  // Stack trace highlighting
  ...(logType === "stacktrace" && {
    "& .stack-exception": {
      color: "#FF7B72",
      fontWeight: "bold",
      textDecoration: "underline",
    },
    "& .stack-at": {
      color: "#8B949E",
      fontStyle: "italic",
    },
    "& .stack-file": {
      color: "#79C0FF",
      fontWeight: 500,
    },
    "& .stack-line": {
      color: "#FFA657",
      fontWeight: 500,
    },
    "& .stack-method": {
      color: "#A5D6FF",
      fontWeight: 500,
    },
  }),

  // HTTP highlighting
  ...(logType === "http" && {
    "& .http-method": {
      color: "#FFA657",
      fontWeight: "bold",
    },
    "& .http-path": {
      color: "#79C0FF",
      fontWeight: 500,
    },
    "& .http-status": {
      color: "#56D364",
      fontWeight: "bold",
    },
    "& .http-protocol": {
      color: "#8B949E",
      fontWeight: 500,
    },
  }),

  // YAML highlighting
  ...(logType === "yaml" && {
    "& .log-timestamp": {
      color: "#A5D6FF",
      fontWeight: 500,
    },
    "& .yaml-key": {
      color: "#79C0FF",
      fontWeight: 600,
    },
    "& .yaml-value": {
      color: "#A5D6FF",
    },
    "& .yaml-dash": {
      color: "#FFA657",
      fontWeight: "bold",
    },
    "& .yaml-separator": {
      color: "#8B949E",
      fontWeight: "bold",
    },
  }),
}));

const SyntaxHighlightedLog: React.FC<SyntaxHighlightedLogProps> = ({ logLine }) => {
  return (
    <HighlightedLogContent>
      <Ansi>{logLine}</Ansi>
    </HighlightedLogContent>
  );
};

export default SyntaxHighlightedLog;

import React from "react";
import { styled } from "@mui/material";
import Ansi from "ansi-to-react";

import { detectLogFormat } from "./logPatternDetector";

interface SyntaxHighlightedLogProps {
  logLine: string;
  enableSyntaxHighlighting?: boolean;
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

const applyBasicHighlighting = (text: string, format: string | null): string => {
  if (!format) return text;

  switch (format) {
    case "json":
      return (
        text
          // Highlight JSON braces and brackets
          .replace(/([{}[\]])/g, '<span class="json-brace">$1</span>')
          // Highlight keys
          .replace(/"([^"]+)"(\s*:)/g, '<span class="json-key">"$1"</span>$2')
          // Highlight string values
          .replace(/:\s*"([^"]*)"/g, ': <span class="json-string">"$1"</span>')
          // Highlight numbers
          .replace(/:\s*(\d+(?:\.\d+)?)/g, ': <span class="json-number">$1</span>')
          // Highlight booleans
          .replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>')
          // Highlight null
          .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>')
      );

    case "log":
    case "bash":
      return (
        text
          // Highlight log levels with stronger emphasis
          .replace(/\b(ERROR|FATAL|CRITICAL)\b/gi, '<span class="log-error">$1</span>')
          .replace(/\b(WARN|WARNING)\b/gi, '<span class="log-warning">$1</span>')
          .replace(/\b(INFO|INFORMATION)\b/gi, '<span class="log-info">$1</span>')
          .replace(/\b(DEBUG|TRACE|VERBOSE)\b/gi, '<span class="log-debug">$1</span>')
          // Highlight timestamps
          .replace(
            /\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2}(\.\d{3})?([+-]\d{2}:\d{2}|Z)?/g,
            '<span class="log-timestamp">$&</span>'
          )
          // Highlight IP addresses
          .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '<span class="log-ip">$&</span>')
          // Highlight HTTP status codes
          .replace(
            /\b(200|201|204|301|302|304|400|401|403|404|405|500|502|503|504)\b/g,
            '<span class="log-status">$1</span>'
          )
          // Highlight HTTP methods
          .replace(/\b(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\b/g, '<span class="log-method">$1</span>')
      );

    case "sql":
      return (
        text
          // Highlight SQL keywords
          .replace(
            /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|FROM|WHERE|JOIN|INNER|LEFT|RIGHT|OUTER|GROUP BY|ORDER BY|LIMIT|HAVING|DISTINCT|AS|ON|IN|EXISTS|BETWEEN|LIKE|AND|OR|NOT|IS|NULL)\b/gi,
            '<span class="sql-keyword">$1</span>'
          )
          // Highlight table names (simple heuristic)
          .replace(/\bFROM\s+(\w+)/gi, 'FROM <span class="sql-table">$1</span>')
          .replace(/\bJOIN\s+(\w+)/gi, 'JOIN <span class="sql-table">$1</span>')
          // Highlight functions
          .replace(
            /\b(COUNT|SUM|AVG|MAX|MIN|NOW|CONCAT|SUBSTRING|LENGTH)\s*\(/gi,
            '<span class="sql-function">$1</span>('
          )
          // Highlight strings
          .replace(/'([^']*)'/g, "<span class=\"sql-string\">'$1'</span>")
          // Highlight comments
          .replace(/--(.*)$/gm, '<span class="sql-comment">--$1</span>')
      );

    case "xml":
      return (
        text
          // Highlight XML brackets
          .replace(/([<>])/g, '<span class="xml-bracket">$1</span>')
          // Highlight tag names
          .replace(/<(\/?[^>\s]+)/g, '<span class="xml-bracket">&lt;</span><span class="xml-tag">$1</span>')
          // Highlight attributes
          .replace(/(\w+)=/g, '<span class="xml-attr">$1</span>=')
          // Highlight attribute values
          .replace(/="([^"]*)"/g, '=<span class="xml-value">"$1"</span>')
      );

    case "stacktrace":
      return (
        text
          // Highlight exception names
          .replace(/\b(\w*Exception|\w*Error):/g, '<span class="stack-exception">$1</span>:')
          // Highlight 'at' keyword
          .replace(/\bat\s+/g, '<span class="stack-at">at </span>')
          // Highlight method names
          .replace(/at\s+([^(]+)\(/g, 'at <span class="stack-method">$1</span>(')
          // Highlight file names and line numbers
          .replace(/\(([^:]+):(\d+)\)/g, '(<span class="stack-file">$1</span>:<span class="stack-line">$2</span>)')
          // Highlight file paths
          .replace(/File\s+"([^"]+)"/g, 'File <span class="stack-file">"$1"</span>')
      );

    case "http":
      return (
        text
          // Highlight HTTP methods
          .replace(/\b(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\b/g, '<span class="http-method">$1</span>')
          // Highlight paths
          .replace(/(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+([^\s]+)/g, '$1 <span class="http-path">$2</span>')
          // Highlight HTTP protocol
          .replace(/\bHTTP\/[\d.]+\b/g, '<span class="http-protocol">$&</span>')
          // Highlight status codes
          .replace(
            /\b(200|201|204|301|302|304|400|401|403|404|405|500|502|503|504)\b/g,
            '<span class="http-status">$1</span>'
          )
      );

    case "yaml":
      return (
        text
          // Highlight timestamps first (this fixes the issue where logs are detected as YAML)
          .replace(
            /\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2}(\.\d{3})?([+-]\d{2}:\d{2}|Z)?/g,
            '<span class="log-timestamp">$&</span>'
          )
          // Highlight YAML keys
          .replace(
            /^(\s*)([^:\s]+)(\s*:)/gm,
            '$1<span class="yaml-key">$2</span><span class="yaml-separator">$3</span>'
          )
          // Highlight list items
          .replace(/^(\s*)(-)(\s)/gm, '$1<span class="yaml-dash">$2</span>$3')
          // Highlight document separators
          .replace(/^(---|\.\.\.)/gm, '<span class="yaml-separator">$1</span>')
      );

    case "dockerfile":
      return (
        text
          // Highlight Docker keywords
          .replace(
            /\b(FROM|RUN|COPY|ADD|WORKDIR|CMD|ENTRYPOINT|ENV|ARG|EXPOSE|VOLUME|USER|LABEL)\b/gi,
            '<span class="log-method">$1</span>'
          )
          // Highlight common patterns as basic log format
          .replace(/\b(ERROR|FATAL|CRITICAL)\b/gi, '<span class="log-error">$1</span>')
          .replace(/\b(WARN|WARNING)\b/gi, '<span class="log-warning">$1</span>')
          .replace(/\b(INFO|INFORMATION)\b/gi, '<span class="log-info">$1</span>')
          .replace(/\b(DEBUG|TRACE|VERBOSE)\b/gi, '<span class="log-debug">$1</span>')
          // Highlight timestamps
          .replace(
            /\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2}(\.\d{3})?([+-]\d{2}:\d{2}|Z)?/g,
            '<span class="log-timestamp">$&</span>'
          )
      );

    default:
      return text;
  }
};

const SyntaxHighlightedLog: React.FC<SyntaxHighlightedLogProps> = ({ logLine, enableSyntaxHighlighting = true }) => {
  const detectedFormat = detectLogFormat(logLine);

  // If syntax highlighting is disabled, use a consistent styled wrapper
  if (!enableSyntaxHighlighting) {
    return (
      <HighlightedLogContent>
        <Ansi>{logLine}</Ansi>
      </HighlightedLogContent>
    );
  }

  // Apply highlighting if we detected a format
  if (detectedFormat) {
    const highlightedText = applyBasicHighlighting(logLine, detectedFormat);
    return <HighlightedLogContent logType={detectedFormat} dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  }

  // For regular logs with ANSI colors but no structured format - use consistent wrapper
  return (
    <HighlightedLogContent>
      <Ansi>{logLine}</Ansi>
    </HighlightedLogContent>
  );
};

export default SyntaxHighlightedLog;

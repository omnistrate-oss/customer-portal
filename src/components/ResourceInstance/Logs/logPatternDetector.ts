// Log format detection utilities
export interface LogPattern {
  name: string;
  language: string;
  detect: (line: string) => boolean;
  description: string;
}

export const LOG_PATTERNS: LogPattern[] = [
  {
    name: "JSON",
    language: "json",
    description: "Structured JSON logs",
    detect: (line: string): boolean => {
      const trimmed = line.trim();
      if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
        try {
          JSON.parse(trimmed);
          return true;
        } catch {
          return false;
        }
      }
      return false;
    },
  },
  {
    name: "XML",
    language: "xml",
    description: "XML formatted logs",
    detect: (line: string): boolean => {
      const trimmed = line.trim();
      return trimmed.startsWith("<") && trimmed.includes(">") && (trimmed.includes("</") || trimmed.endsWith("/>"));
    },
  },
  {
    name: "YAML",
    language: "yaml",
    description: "YAML configuration logs",
    detect: (line: string): boolean => {
      const trimmed = line.trim();
      // More specific YAML patterns to avoid false positives with JSON
      return (
        // YAML document separators
        trimmed.includes("---") ||
        trimmed.includes("...") ||
        // YAML-specific patterns (not JSON)
        /^[\s]*[\w-]+:\s*[^{[]/.test(trimmed) || // Key: value but not JSON
        /^[\s]*-\s+[\w-]+:/.test(trimmed) || // List item with key
        // YAML block scalars
        /^[\s]*[\w-]+:\s*[|>]/.test(trimmed)
      );
    },
  },
  {
    name: "SQL",
    language: "sql",
    description: "SQL query logs",
    detect: (line: string): boolean => {
      return /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|EXEC|SHOW|DESCRIBE|EXPLAIN)\b/i.test(line);
    },
  },
  // MOVED: Structured Log pattern BEFORE Docker to catch timestamped logs first
  {
    name: "Structured Log",
    language: "log",
    description: "Application logs with levels",
    detect: (line: string): boolean => {
      return (
        /\b(DEBUG|INFO|WARN|WARNING|ERROR|FATAL|TRACE)\b/i.test(line) ||
        /\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2}/.test(line) ||
        /level=(debug|info|warn|warning|error|fatal|trace)/i.test(line)
      );
    },
  },
  {
    name: "Docker",
    language: "dockerfile",
    description: "Docker build logs",
    detect: (line: string): boolean => {
      // More specific Docker patterns to avoid false positives
      const dockerKeywords = /\b(FROM|RUN|COPY|ADD|WORKDIR|CMD|ENTRYPOINT|ENV|ARG|EXPOSE|VOLUME|LABEL)\b/i;
      const dockerUserPattern = /\bUSER\s+\w+/i; // More specific USER pattern
      const dockerIndicators =
        line.includes("docker.io") ||
        line.includes("Successfully built") ||
        line.includes("Successfully tagged") ||
        line.includes("Dockerfile") ||
        line.includes("docker build") ||
        line.includes("Step ") ||
        /---> [a-f0-9]{12}/.test(line); // Docker build step hash

      return dockerKeywords.test(line) || dockerUserPattern.test(line) || dockerIndicators;
    },
  },
  {
    name: "Kubernetes",
    language: "yaml",
    description: "Kubernetes logs",
    detect: (line: string): boolean => {
      return (
        /\b(pod|deployment|service|configmap|secret|namespace|kubectl|kube-system)\b/i.test(line) ||
        line.includes("k8s.io") ||
        /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z/.test(line)
      );
    },
  },
  {
    name: "Stack Trace",
    language: "bash",
    description: "Error stack traces",
    detect: (line: string): boolean => {
      return (
        line.includes("Exception") ||
        line.includes("Error:") ||
        line.includes("Traceback") ||
        line.includes("    at ") ||
        line.includes("  File ") ||
        /\s+at\s+.*\(.*:\d+:\d+\)/.test(line) ||
        /^\s*File\s+".*",\s+line\s+\d+/.test(line)
      );
    },
  },
  {
    name: "HTTP Logs",
    language: "accesslog",
    description: "HTTP access logs",
    detect: (line: string): boolean => {
      // Common log format: IP - - [timestamp] "METHOD path HTTP/1.1" status size
      const commonLogFormat =
        /^\d+\.\d+\.\d+\.\d+.*\[.*\]\s+"(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+.*"\s+\d{3}\s+\d+/;
      const nginxFormat = /"(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+.*"\s+\d{3}\s+\d+/;
      const httpStatus = /\b(200|201|204|301|302|304|400|401|403|404|405|500|502|503|504)\b/;

      return (
        commonLogFormat.test(line) ||
        nginxFormat.test(line) ||
        (httpStatus.test(line) && /(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)/i.test(line))
      );
    },
  },
];

export const detectLogFormat = (logLine: string): string | null => {
  const line = logLine.trim();

  // Skip empty lines
  if (!line) return null;

  // Find the first matching pattern
  for (const pattern of LOG_PATTERNS) {
    if (pattern.detect(line)) {
      return pattern.language;
    }
  }

  return null;
};

export const getLogPatternInfo = (logLine: string): LogPattern | null => {
  const line = logLine.trim();

  if (!line) return null;

  for (const pattern of LOG_PATTERNS) {
    if (pattern.detect(line)) {
      return pattern;
    }
  }

  return null;
};

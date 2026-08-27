/**
 * Builds the base logs WebSocket URL from the observability endpoint returned by the API.
 *
 * @example `viewer:p#ss@logs.example.com` becomes a URL whose `password` query
 * parameter decodes to `p#ss` without creating a URL fragment.
 */
export const buildLogsSocketBaseURL = (clusterEndpoint?: string): string => {
  if (!clusterEndpoint) return "";

  const hostSeparatorIndex = clusterEndpoint.lastIndexOf("@");
  const credentialSeparatorIndex = clusterEndpoint.indexOf(":");

  if (
    credentialSeparatorIndex <= 0 ||
    hostSeparatorIndex <= credentialSeparatorIndex + 1 ||
    hostSeparatorIndex === clusterEndpoint.length - 1
  ) {
    return "";
  }

  const username = clusterEndpoint.slice(0, credentialSeparatorIndex);
  const password = clusterEndpoint.slice(credentialSeparatorIndex + 1, hostSeparatorIndex);
  const baseURL = clusterEndpoint.slice(hostSeparatorIndex + 1);

  try {
    const socketURL = new URL(`wss://${baseURL}/logs`);
    socketURL.searchParams.set("username", username);
    socketURL.searchParams.set("password", password);
    return socketURL.toString();
  } catch {
    return "";
  }
};

/** Adds the selected pod and instance to an encoded logs WebSocket base URL. */
export const buildLogsSocketURL = (
  socketBaseURL?: string,
  podName?: string,
  resourceInstanceId?: string
): string | null => {
  if (!socketBaseURL || !podName || !resourceInstanceId) return null;

  try {
    const socketURL = new URL(socketBaseURL);
    socketURL.searchParams.set("podName", podName);
    socketURL.searchParams.set("instanceId", resourceInstanceId);
    return socketURL.toString();
  } catch {
    return null;
  }
};

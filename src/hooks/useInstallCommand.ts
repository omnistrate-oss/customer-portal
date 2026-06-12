import { useCallback } from "react";

/**
 * Install-command helper hook.
 *
 * How it works:
 * 1. Accepts a backend URL/path from the install command
 * 2. Extracts endpoint path+query
 * 3. Builds proxy URL `/api/action?endpoint=...` for display/copy usage
 */
export default function useInstallCommand() {
  const getDownloadPath = useCallback((downloadURL: string) => {
    if (!downloadURL) return "";

    let downloadPath: string;
    try {
      const url = new URL(downloadURL);
      downloadPath = url.pathname + url.search;
    } catch {
      downloadPath = downloadURL;
    }

    if (!downloadPath.startsWith("/")) {
      downloadPath = `/${downloadPath}`;
    }

    return downloadPath;
  }, []);

  const getActionProxyUrl = useCallback(
    (downloadURL: string, absolute = false) => {
      const endpoint = getDownloadPath(downloadURL);
      if (!endpoint) return "";

      const relativeUrl = `/api/action?endpoint=${encodeURIComponent(endpoint)}`;

      if (absolute && typeof window !== "undefined") {
        return `${window.location.origin}${relativeUrl}`;
      }

      return relativeUrl;
    },
    [getDownloadPath]
  );

  return {
    getActionProxyUrl,
  };
}

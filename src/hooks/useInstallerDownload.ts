import { useCallback, useState } from "react";

import useSnackbar from "src/hooks/useSnackbar";

type DownloadState = {
  /** Whether a download is currently in progress */
  isDownloading: boolean;
  /** The instance ID currently being downloaded (for multi-row UIs) */
  activeInstanceId: string | null;
};

/**
 * Installer download hook that delegates to the **browser's native download manager**.
 *
 * How it works:
 * 1. Builds a GET URL: `/api/download-installer?downloadPath=...`
 * 2. Opens it via a hidden `<a>` tag click — this triggers the browser download bar
 * 3. The browser handles progress, pause/resume, and file saving automatically
 *
 * Auth is read from the "token" cookie on the server side, so no
 * Authorization header is needed — the cookie is sent automatically
 * with the browser navigation request.
 */
export default function useInstallerDownload() {
  const [state, setState] = useState<DownloadState>({
    isDownloading: false,
    activeInstanceId: null,
  });

  const snackbar = useSnackbar();

  const download = useCallback(
    (downloadURL: string, instanceId?: string) => {
      if (!downloadURL || state.isDownloading) return;

      // Parse the URL to extract just the path (don't send full URL to server)
      let downloadPath: string;
      try {
        const url = new URL(downloadURL);
        downloadPath = url.pathname + url.search;
      } catch {
        downloadPath = downloadURL;
      }

      setState({
        isDownloading: true,
        activeInstanceId: instanceId ?? null,
      });

      try {
        // Use instanceId as the download filename (e.g. "instance-abc123.tar.gz")
        const filename = instanceId ? `${instanceId}.tar.gz` : "installer.tar.gz";

        // Build a GET URL that the browser navigates to directly
        const params = new URLSearchParams({ downloadPath, filename });
        const href = `/api/download-installer?${params.toString()}`;

        // Use a hidden <a> tag to trigger the browser's native download manager
        // without navigating away from the current page. The server responds with
        // Content-Disposition: attachment, so the browser shows the download in
        // its download bar/panel with progress, pause, resume.
        const a = document.createElement("a");
        a.href = href;
        a.download = filename;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        snackbar.showSuccess("Installer download started");
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        console.error("Failed to start installer download:", message);
        snackbar.showError("Failed to download installer. Please try again.");
      } finally {
        // Reset state after a short delay (the browser takes over from here)
        setTimeout(() => {
          setState({
            isDownloading: false,
            activeInstanceId: null,
          });
        }, 2500);
      }
    },
    [state.isDownloading, snackbar]
  );

  return {
    ...state,
    download,
  };
}

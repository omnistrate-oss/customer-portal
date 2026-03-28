import { useCallback, useRef, useState } from "react";

import useSnackbar from "src/hooks/useSnackbar";
import { saveBlob } from "src/utils/saveBlob";

type DownloadState = {
  /** Whether a download is currently in progress */
  isDownloading: boolean;
  /** Download progress from 0 to 100, or null if content-length is unknown */
  progress: number | null;
  /** The instance ID currently being downloaded (for multi-row UIs) */
  activeInstanceId: string | null;
};

/**
 * Fast installer download hook using the native `fetch()` API with streaming.
 *
 * Why this is faster than axios:
 * - fetch() streams the response natively — no transform pipeline overhead
 * - ReadableStream lets us read chunks directly into an ArrayBuffer
 * - AbortController allows cancelling stuck downloads instantly
 * - Progress tracking gives the user real-time feedback
 */
export default function useInstallerDownload() {
  const [state, setState] = useState<DownloadState>({
    isDownloading: false,
    progress: null,
    activeInstanceId: null,
  });

  const abortRef = useRef<AbortController | null>(null);
  const snackbar = useSnackbar();

  const download = useCallback(
    async (downloadURL: string, instanceId?: string) => {
      if (!downloadURL || state.isDownloading) return;

      // Parse the URL to extract just the path (don't send full URL to server)
      let downloadPath: string;
      try {
        const url = new URL(downloadURL);
        downloadPath = url.pathname + url.search;
      } catch {
        downloadPath = downloadURL;
      }

      // Allow cancellation
      abortRef.current = new AbortController();

      setState({
        isDownloading: true,
        progress: 0,
        activeInstanceId: instanceId ?? null,
      });

      try {
        const response = await fetch("/api/download-installer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ downloadPath }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || `Download failed (${response.status})`);
        }

        // --- Stream the body with progress tracking ---
        const contentLength = Number(response.headers.get("Content-Length"));
        const hasLength = contentLength > 0;
        const reader = response.body?.getReader();

        if (!reader) {
          throw new Error("ReadableStream not supported in this browser");
        }

        const chunks: ArrayBuffer[] = [];
        let receivedBytes = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          chunks.push(value.buffer as ArrayBuffer);
          receivedBytes += value.length;

          if (hasLength) {
            setState((prev) => ({
              ...prev,
              progress: Math.round((receivedBytes / contentLength) * 100),
            }));
          }
        }

        // Build the blob from chunks (one allocation, no intermediate buffers)
        const contentType = response.headers.get("Content-Type") || "application/octet-stream";
        const blob = new Blob(chunks, { type: contentType });

        // Extract filename from Content-Disposition header
        const contentDisposition = response.headers.get("Content-Disposition");
        let filename = "installer";
        if (contentDisposition) {
          const match = contentDisposition.match(/filename[^;=\n]*=(['"]?)([^'"\n]*)\1/);
          if (match?.[2]) {
            filename = match[2];
          }
        }

        saveBlob(blob, filename);
        snackbar.showSuccess("Installer downloaded successfully");
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") {
          snackbar.showError("Download cancelled");
          return;
        }
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        console.error("Failed to download installer:", message);
        snackbar.showError("Failed to download installer. Please try again.");
      } finally {
        abortRef.current = null;
        setState({
          isDownloading: false,
          progress: null,
          activeInstanceId: null,
        });
      }
    },
    [state.isDownloading, snackbar]
  );

  /** Cancel an in-progress download */
  const cancelDownload = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    ...state,
    download,
    cancelDownload,
  };
}

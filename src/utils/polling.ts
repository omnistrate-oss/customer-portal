export const POLL_INTERVAL_MS = 5_000;
export const POLL_BACKOFF_THRESHOLD_MS = 10 * 60 * 1000;
export const POLL_BACKOFF_INTERVAL_MS = 10_000;

export const getPollingInterval = (elapsedMs: number) =>
  elapsedMs >= POLL_BACKOFF_THRESHOLD_MS ? POLL_BACKOFF_INTERVAL_MS : POLL_INTERVAL_MS;

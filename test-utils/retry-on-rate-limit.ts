import { isReplayMode } from "./har-mode";

/**
 * Re-sends a request while the backend answers 429. The dev backend rate-limits instance
 * create/delete, and parallel specs plus global teardown hit those endpoints in bursts.
 * Waits 10s, 20s, then 30s, so a worst case adds one minute to the caller. Replay serves the
 * recorded 429s, so it retries without waiting.
 */
export const retryOnRateLimit = async <T extends { status(): number; url(): string }>(
  send: () => Promise<T>,
  attempts = 4
): Promise<T> => {
  for (let attempt = 1; ; attempt++) {
    const response = await send();
    if (response.status() !== 429 || attempt === attempts) return response;

    const delayMs = isReplayMode() ? 0 : 10_000 * attempt;
    console.warn(`429 Too Many Requests from ${response.url()}, retrying in ${delayMs / 1000}s`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
};

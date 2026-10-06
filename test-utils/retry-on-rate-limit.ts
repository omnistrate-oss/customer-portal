import type { APIResponse } from "@playwright/test";

/**
 * Re-sends a request while the backend answers 429. The dev backend rate-limits instance
 * create/delete, and parallel specs plus global teardown hit those endpoints in bursts.
 * Waits 10s, 20s, then 30s, so a worst case adds one minute to the caller.
 */
export const retryOnRateLimit = async (send: () => Promise<APIResponse>, attempts = 4): Promise<APIResponse> => {
  for (let attempt = 1; ; attempt++) {
    const response = await send();
    if (response.status() !== 429 || attempt === attempts) return response;

    console.warn(`429 Too Many Requests from ${response.url()}, retrying in ${10 * attempt}s`);
    await new Promise((resolve) => setTimeout(resolve, 10_000 * attempt));
  }
};

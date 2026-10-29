import { sanitizeUrl } from "../scripts/har-security.mjs";

export const normalizeHarReplayUrl = (url) => {
  const parsed = new URL(sanitizeUrl(url));
  return parsed.pathname + parsed.search;
};

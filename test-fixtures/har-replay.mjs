import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

import { assertSafeHar, sanitizeUrl } from "../scripts/har-security.mjs";

export const normalizeHarReplayUrl = (url) => {
  const parsed = new URL(sanitizeUrl(url));
  return parsed.pathname + parsed.search;
};

export const readRecordedServiceOffering = (gzPath, serviceNamePrefix) => {
  try {
    if (typeof serviceNamePrefix !== "string" || !serviceNamePrefix) throw new Error();
    const decoder = new TextDecoder("utf-8", { fatal: true });
    const har = JSON.parse(decoder.decode(gunzipSync(readFileSync(gzPath))));
    assertSafeHar(har);
    const referencedIds = new Set();
    const offerings = [];
    for (const entry of har.log.entries) {
      const url = new URL(entry.request.url);
      for (const id of url.searchParams.getAll("serviceId")) referencedIds.add(id);
      const endpoint = url.searchParams.get("endpoint") || url.pathname;
      const resourceMatch = endpoint.match(/^\/2022-09-01-00\/service-offering\/([^/]+)\/resource\//);
      if (resourceMatch) referencedIds.add(decodeURIComponent(resourceMatch[1]));
      if (endpoint !== "/2022-09-01-00/service-offering" || entry.response.status !== 200) continue;
      const content = entry.response.content;
      if (typeof content.text !== "string") throw new Error();
      if (content.encoding && content.encoding !== "base64") throw new Error();
      const text = content.encoding === "base64" ? decoder.decode(Buffer.from(content.text, "base64")) : content.text;
      const list = JSON.parse(text);
      if (!Array.isArray(list.services)) throw new Error();
      for (const service of list.services) {
        if (!Array.isArray(service.offerings)) throw new Error();
        for (const offering of service.offerings) offerings.push({ ...service, ...offering });
      }
    }
    const candidates = new Map();
    for (const offering of offerings) {
      if (
        !referencedIds.has(offering.serviceId) ||
        typeof offering.serviceName !== "string" ||
        !offering.serviceName.startsWith(serviceNamePrefix)
      ) {
        continue;
      }
      if (typeof offering.serviceId !== "string" || !/^[a-zA-Z0-9_-]+$/.test(offering.serviceId)) throw new Error();
      const previousName = candidates.get(offering.serviceId);
      if (previousName !== undefined && previousName !== offering.serviceName) throw new Error();
      candidates.set(offering.serviceId, offering.serviceName);
    }
    if (candidates.size !== 1) throw new Error();
    const [serviceId, serviceName] = candidates.entries().next().value;
    return { serviceId, serviceName };
  } catch {
    throw new Error("Unable to resolve a unique recorded product for replay");
  }
};

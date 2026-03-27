/**
 * Allowlist of permitted method + endpoint patterns for the /api/action proxy.
 *
 * Only requests whose HTTP method and resolved path match one of these entries
 * are forwarded to the Omnistrate backend. Everything else is rejected with 403.
 *
 * Pattern syntax:
 *   - Static segments match literally    → "/2022-09-01-00/subscription"
 *   - ":param" matches exactly one       → "/2022-09-01-00/subscription/:id"
 *     non-empty path segment (i.e. [^/]+)
 *
 * When adding a new backend call in the frontend, add the corresponding entry here.
 */

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface AllowedRoute {
  method: HttpMethod;
  pattern: string;
}

const allowedRoutes: AllowedRoute[] = [
  // ─── Subscriptions ──────────────────────────────────────────────────
  { method: "GET", pattern: "/2022-09-01-00/subscription" },
  { method: "GET", pattern: "/2022-09-01-00/subscription/:id" },
  { method: "POST", pattern: "/2022-09-01-00/subscription" },
  { method: "DELETE", pattern: "/2022-09-01-00/subscription/:id" },

  // ─── Subscription Requests ──────────────────────────────────────────
  { method: "GET", pattern: "/2022-09-01-00/subscription/request" },
  { method: "GET", pattern: "/2022-09-01-00/subscription/request/:id" },
  { method: "POST", pattern: "/2022-09-01-00/subscription/request" },

  // ─── Service Offerings ──────────────────────────────────────────────
  { method: "GET", pattern: "/2022-09-01-00/service-offering" },
  { method: "GET", pattern: "/2022-09-01-00/service-offering/:serviceId" },
  {
    method: "GET",
    pattern:
      "/2022-09-01-00/service-offering/:serviceId/resource/:resourceId/instance/:instanceId",
  },

  // ─── Service / Product Tier ─────────────────────────────────────────
  {
    method: "GET",
    pattern:
      "/2022-09-01-00/service/:serviceId/service-api/:serviceApiId/swagger_spec",
  },
  {
    method: "GET",
    pattern:
      "/2022-09-01-00/service/:serviceId/productTier/:productTierId/customer-version-set",
  },

  // ─── Regions & Availability Zones ───────────────────────────────────
  {
    method: "GET",
    pattern: "/2022-09-01-00/region/cloudprovider/:cloudProviderName",
  },
  { method: "GET", pattern: "/2022-09-01-00/region/:regionId" },
  {
    method: "GET",
    pattern:
      "/2022-09-01-00/availability-zone/region/code/:regionCode/cloud-provider/:cloudProviderName",
  },

  // ─── User & Auth ───────────────────────────────────────────────────
  { method: "GET", pattern: "/2022-09-01-00/user" },
  { method: "PATCH", pattern: "/2022-09-01-00/user/:id" },
  { method: "POST", pattern: "/2022-09-01-00/logout" },
  { method: "POST", pattern: "/2022-09-01-00/validate-token" },
  { method: "POST", pattern: "/2022-09-01-00/change-password" },
  { method: "POST", pattern: "/2022-09-01-00/update-password" },
  { method: "DELETE", pattern: "/2022-09-01-00/customer-delete-user" },

  // ─── Account Config ─────────────────────────────────────────────────
  { method: "GET", pattern: "/2022-09-01-00/accountconfig/:id" },

  // ─── Resource Instance — top-level ──────────────────────────────────
  { method: "GET", pattern: "/2022-09-01-00/resource-instance" },
  { method: "GET", pattern: "/2022-09-01-00/resource-instance/usage" },
  {
    method: "GET",
    pattern: "/2022-09-01-00/resource-instance/usage-per-day",
  },
  {
    method: "GET",
    pattern: "/2022-09-01-00/resource-instance/billing-status",
  },
  {
    method: "GET",
    pattern: "/2022-09-01-00/resource-instance/billing-details",
  },
  { method: "GET", pattern: "/2022-09-01-00/resource-instance/health" },
  {
    method: "GET",
    pattern: "/2022-09-01-00/resource-instance/subscription-users",
  },

  // ─── Resource Instance — audit events ───────────────────────────────
  {
    method: "GET",
    pattern: "/2022-09-01-00/resource-instance/audit-events",
  },
  {
    method: "GET",
    pattern: "/2022-09-01-00/resource-instance/audit-events/:eventId",
  },
  {
    method: "GET",
    pattern: "/2022-09-01-00/resource-instance/:instanceId/audit-events",
  },

  // ─── Resource Instance — snapshots ──────────────────────────────────
  { method: "GET", pattern: "/2022-09-01-00/resource-instance/snapshot" },
  {
    method: "GET",
    pattern: "/2022-09-01-00/resource-instance/snapshot/:id",
  },
  {
    method: "POST",
    pattern: "/2022-09-01-00/resource-instance/snapshot",
  },
  {
    method: "POST",
    pattern: "/2022-09-01-00/resource-instance/snapshot/:snapshotId/restore",
  },
  {
    method: "POST",
    pattern: "/2022-09-01-00/resource-instance/snapshot/:sourceSnapshotId",
  },
  {
    method: "DELETE",
    pattern: "/2022-09-01-00/resource-instance/snapshot/:id",
  },

  // ─── Resource Instance — invoices ───────────────────────────────────
  { method: "GET", pattern: "/2022-09-01-00/resource-instance/invoice" },

  // ─── Resource Instance — custom networks ────────────────────────────
  {
    method: "GET",
    pattern: "/2022-09-01-00/resource-instance/custom-network",
  },
  {
    method: "GET",
    pattern: "/2022-09-01-00/resource-instance/custom-network/:id",
  },
  {
    method: "POST",
    pattern: "/2022-09-01-00/resource-instance/custom-network",
  },
  {
    method: "PATCH",
    pattern: "/2022-09-01-00/resource-instance/custom-network/:id",
  },
  {
    method: "DELETE",
    pattern: "/2022-09-01-00/resource-instance/custom-network/:id",
  },

  // ─── Resource Instance — account config ─────────────────────────────
  {
    method: "POST",
    pattern: "/2022-09-01-00/resource-instance/account-config/:id",
  },

  // ─── Resource Instance — subscription users ─────────────────────────
  {
    method: "POST",
    pattern:
      "/2022-09-01-00/resource-instance/subscription/:subscriptionId/invite-user",
  },
  {
    method: "DELETE",
    pattern:
      "/2022-09-01-00/resource-instance/subscription/:subscriptionId/revoke-user-role",
  },

  // ─── Resource Instance — version upgrade ────────────────────────────
  {
    method: "POST",
    pattern: "/2022-09-01-00/resource-instance/:id/version-upgrade",
  },

  // ─── Resource Instance — deployment cell dashboard ──────────────────
  {
    method: "POST",
    pattern:
      "/2022-09-01-00/resource-instance/:id/deployment-cell-dashboard/token",
  },

  // ─── Resource Instance — fully-qualified (7-segment) paths ──────────
  //
  // Pattern: /resource-instance/:sp/:sk/:sav/:sek/:smk/:ptk/:rk[/:id[/action]]
  //
  // List / Create
  {
    method: "GET",
    pattern:
      "/2022-09-01-00/resource-instance/:sp/:sk/:sav/:sek/:smk/:ptk/:rk",
  },
  {
    method: "POST",
    pattern:
      "/2022-09-01-00/resource-instance/:sp/:sk/:sav/:sek/:smk/:ptk/:rk",
  },
  // Describe / Update / Delete
  {
    method: "GET",
    pattern:
      "/2022-09-01-00/resource-instance/:sp/:sk/:sav/:sek/:smk/:ptk/:rk/:id",
  },
  {
    method: "PUT",
    pattern:
      "/2022-09-01-00/resource-instance/:sp/:sk/:sav/:sek/:smk/:ptk/:rk/:id",
  },
  {
    method: "PATCH",
    pattern:
      "/2022-09-01-00/resource-instance/:sp/:sk/:sav/:sek/:smk/:ptk/:rk/:id",
  },
  {
    method: "DELETE",
    pattern:
      "/2022-09-01-00/resource-instance/:sp/:sk/:sav/:sek/:smk/:ptk/:rk/:id",
  },
  // Instance actions
  {
    method: "POST",
    pattern:
      "/2022-09-01-00/resource-instance/:sp/:sk/:sav/:sek/:smk/:ptk/:rk/:id/start",
  },
  {
    method: "POST",
    pattern:
      "/2022-09-01-00/resource-instance/:sp/:sk/:sav/:sek/:smk/:ptk/:rk/:id/stop",
  },
  {
    method: "POST",
    pattern:
      "/2022-09-01-00/resource-instance/:sp/:sk/:sav/:sek/:smk/:ptk/:rk/:id/restart",
  },
  {
    method: "POST",
    pattern:
      "/2022-09-01-00/resource-instance/:sp/:sk/:sav/:sek/:smk/:ptk/:rk/:id/failover",
  },
  {
    method: "POST",
    pattern:
      "/2022-09-01-00/resource-instance/:sp/:sk/:sav/:sek/:smk/:ptk/:rk/:id/restore",
  },
  {
    method: "POST",
    pattern:
      "/2022-09-01-00/resource-instance/:sp/:sk/:sav/:sek/:smk/:ptk/:rk/:id/custom-dns",
  },
  {
    method: "DELETE",
    pattern:
      "/2022-09-01-00/resource-instance/:sp/:sk/:sav/:sek/:smk/:ptk/:rk/:id/custom-dns",
  },
  {
    method: "POST",
    pattern:
      "/2022-09-01-00/resource-instance/:sp/:sk/:sav/:sek/:smk/:ptk/:rk/:id/add-capacity",
  },
  {
    method: "POST",
    pattern:
      "/2022-09-01-00/resource-instance/:sp/:sk/:sav/:sek/:smk/:ptk/:rk/:id/remove-capacity",
  },
  {
    method: "POST",
    pattern:
      "/2022-09-01-00/resource-instance/:sp/:sk/:sav/:sek/:smk/:ptk/:rk/:id/copy-snapshot",
  },
  // Instance metadata
  {
    method: "PATCH",
    pattern:
      "/2022-09-01-00/resource-instance/:sp/:sk/:sav/:sek/:smk/:ptk/:rk/:id/metadata",
  },
  // Instance snapshots (per-instance)
  {
    method: "GET",
    pattern:
      "/2022-09-01-00/resource-instance/:sp/:sk/:sav/:sek/:smk/:ptk/:rk/:id/snapshot",
  },
  {
    method: "POST",
    pattern:
      "/2022-09-01-00/resource-instance/:sp/:sk/:sav/:sek/:smk/:ptk/:rk/snapshot/:snapshotId/restore",
  },
  // Terraform / setup kit
  {
    method: "GET",
    pattern:
      "/2022-09-01-00/resource-instance/:sp/:sk/:sav/:sek/:smk/setup-kit/:cloudProvider",
  },
  // Audit events (per product-tier)
  {
    method: "GET",
    pattern:
      "/2022-09-01-00/resource-instance/:sp/:sk/:sav/:sek/:smk/:ptk/audit-events",
  },
];

// ── Pattern → RegExp cache ────────────────────────────────────────────
const regexCache = new Map<string, RegExp>();

function patternToRegex(pattern: string): RegExp {
  const cached = regexCache.get(pattern);
  if (cached) return cached;

  // Escape regex-special characters in the static parts, then replace :param tokens
  const regexStr = pattern
    .split("/")
    .map((segment) => (segment.startsWith(":") ? "[^/]+" : escapeRegex(segment)))
    .join("/");

  const regex = new RegExp(`^${regexStr}$`);
  regexCache.set(pattern, regex);
  return regex;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Returns true if the given method + endpoint combination is in the allowlist.
 *
 * The endpoint is the value from the request body sent to /api/action,
 * e.g. "/2022-09-01-00/resource-instance" — it may include a query string
 * which is stripped before matching.
 */
export function normalizeEndpoint(endpoint: string): string {
  // Strip query string if present (some axios calls embed query params in the URL)
  const pathOnly = endpoint.split("?")[0];

  // Remove trailing slash for consistency
  const normalized = pathOnly.endsWith("/") && pathOnly.length > 1
    ? pathOnly.slice(0, -1)
    : pathOnly;

  return normalized;
}

export function isAllowedRoute(method: string, endpoint: string): boolean {
  const upperMethod = method.toUpperCase();

  const normalizedPath = normalizeEndpoint(endpoint);

  // Reject percent-encoded path separators to prevent allowlist bypass
  if (/%2f|%5c/i.test(normalizedPath)) {
    return false;
  }

  // Reject dot-segments that could be used for path traversal
  const segments = normalizedPath.split("/");
  if (segments.some((s) => s === "." || s === "..")) {
    return false;
  }

  for (const route of allowedRoutes) {
    if (route.method !== upperMethod) continue;

    const regex = patternToRegex(route.pattern);
    if (regex.test(normalizedPath)) {
      return true;
    }
  }

  return false;
}

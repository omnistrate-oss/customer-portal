export type EnvKey = "dev" | "prod";

export type EnvConfig = {
  label: string;
  apiBase: string;
  serviceId: string;
  environmentId: string;
  productTierId: string;
  serviceApiId: string;
  resourceId: string;
  imageParamId: string;
};

export const ENV_CONFIG: Record<EnvKey, EnvConfig> = {
  dev: {
    label: "Dev (api.omnistrate.dev)",
    apiBase: "https://api.omnistrate.dev/2022-09-01-00",
    serviceId: "s-Bi4CBYttJK",
    environmentId: "se-wwULjVtjDK",
    productTierId: "pt-Ce6GPOO0wq",
    serviceApiId: "sa-MsgYlU7Zpc",
    resourceId: "r-L4YLhKOvzn",
    imageParamId: "ip-LhT68aVZ8e",
  },
  prod: {
    label: "Prod (api.omnistrate.cloud)",
    apiBase: "https://api.omnistrate.cloud/2022-09-01-00",
    serviceId: "s-kW8TlWL8bR",
    environmentId: "se-Co9dDNYI20",
    productTierId: "pt-HPbZWmY5na",
    serviceApiId: "sa-3suwixrted",
    resourceId: "r-vjIOC6lJRK",
    imageParamId: "ip-Pj4KSTecAZ",
  },
};

export const IMAGE_PREFIX = "omnistrate-oss/customer-portal";
export const UPGRADE_POLL_INTERVAL_MS = 20000;
export const MODIFY_DELAY_MS = 1500;
export const MAX_CONCURRENT_UPGRADES = 25;

export type InputParameter = {
  id: string;
  serviceId: string;
  resourceId: string;
  key: string;
  name: string;
  type: string;
  defaultValue: string;
  description: string;
  required: boolean;
  isList?: boolean;
  hasOptions?: boolean;
  modifiable: boolean;
  tabIndex?: number;
  limits?: Record<string, unknown>;
  outputParamId?: string;
  export?: boolean;
  scope?: { cloudProviders: string[] };
};

export type VersionSet = {
  name: string;
  version: string;
  type: string;
  status: string;
  instanceCount?: number;
  releasedAt?: string;
};

export type InstanceParams = {
  imageName?: string;
  [k: string]: unknown;
};

export type Instance = {
  consumptionResourceInstanceResult?: {
    id?: string;
    status?: string;
    result_params?: InstanceParams;
    launch_input_params?: InstanceParams;
  };
  resourceVersionSummaries?: { version?: string; latestVersion?: string }[];
  tierVersion?: string;
};

export type UpgradePath = {
  upgradePathId: string;
  sourceVersion: string;
  targetVersion: string;
  status: string;
  totalCount: number;
  completedCount: number;
  failedCount: number;
  inProgressCount: number;
  pendingCount: number;
  scheduledCount?: number;
  skippedCount?: number;
};

export function sleep(ms: number): Promise<void> {
  return new Promise(function (r) {
    setTimeout(r, ms);
  });
}

export class ApiError extends Error {
  status: number;
  retryAfterMs?: number;
  constructor(message: string, status: number, retryAfterMs?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

export function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const dateMs = Date.parse(header);
  if (!Number.isNaN(dateMs)) return Math.max(0, dateMs - Date.now());
  return undefined;
}

export async function apiRequest<T>(method: string, url: string, token: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(function () {
      return "";
    });
    const retryAfterMs = parseRetryAfter(res.headers.get("retry-after"));
    throw new ApiError(`${method} ${url} → ${res.status} ${res.statusText}\n${text}`, res.status, retryAfterMs);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export async function withBackoffRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  const maxAttempts = 6;
  const baseDelayMs = 2000;
  const maxDelayMs = 30000;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const retryable = err instanceof ApiError && (err.status === 429 || err.status >= 500);
      if (!retryable || attempt === maxAttempts) throw err;
      const exp = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
      const jitter = Math.floor(Math.random() * 500);
      const wait = (err as ApiError).retryAfterMs ?? exp + jitter;
      const status = (err as ApiError).status;
      console.log(`    ! ${label}: ${status}, retrying in ${Math.round(wait / 1000)}s (attempt ${attempt}/${maxAttempts - 1})`);
      await sleep(wait);
    }
  }
  throw new Error("unreachable");
}

export async function signIn(apiBase: string, email: string, pw: string): Promise<string> {
  const res = await fetch(`${apiBase}/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email, password: pw }),
  });
  if (!res.ok) {
    const text = await res.text().catch(function () {
      return "";
    });
    throw new Error(`Signin failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { jwtToken?: string; token?: string };
  const token = data.jwtToken || data.token;
  if (!token) throw new Error("Signin response did not contain a token");
  return token;
}

export async function fetchImageParam(cfg: EnvConfig, token: string): Promise<InputParameter> {
  const baseUrl = `${cfg.apiBase}/service/${cfg.serviceId}/resource/${cfg.resourceId}/input-parameter`;
  let nextPageToken: string | undefined = undefined;
  do {
    const url = nextPageToken ? `${baseUrl}?nextPageToken=${encodeURIComponent(nextPageToken)}` : baseUrl;
    const data = await apiRequest<{ inputParameters: InputParameter[]; nextPageToken?: string }>("GET", url, token);
    const param = (data.inputParameters || []).find(function (p) {
      return p.id === cfg.imageParamId;
    });
    if (param) return param;
    nextPageToken = data.nextPageToken;
  } while (nextPageToken);
  throw new Error(`imageName parameter ${cfg.imageParamId} not found`);
}

export async function patchImageParam(
  cfg: EnvConfig,
  token: string,
  current: InputParameter,
  newImageName: string
): Promise<void> {
  const body: InputParameter = Object.assign({}, current, { defaultValue: newImageName });
  await apiRequest("PATCH", `${cfg.apiBase}/service/${cfg.serviceId}/input-parameter/${cfg.imageParamId}`, token, body);
}

export async function releaseVersion(cfg: EnvConfig, token: string, versionSetName: string): Promise<void> {
  await apiRequest("POST", `${cfg.apiBase}/service/${cfg.serviceId}/service-api/${cfg.serviceApiId}/release`, token, {
    isPreferred: true,
    versionSetName: versionSetName,
    versionSetType: "Major",
    productTierId: cfg.productTierId,
  });
}

export async function listVersionSets(cfg: EnvConfig, token: string): Promise<VersionSet[]> {
  const data = await apiRequest<{ tierVersionSets: VersionSet[] }>(
    "GET",
    `${cfg.apiBase}/service/${cfg.serviceId}/productTier/${cfg.productTierId}/version-set`,
    token
  );
  return data.tierVersionSets || [];
}

export async function listInstancesByVersion(cfg: EnvConfig, token: string, tierVersion: string): Promise<Instance[]> {
  const url =
    `${cfg.apiBase}/fleet/service/${cfg.serviceId}/environment/${cfg.environmentId}/instances` +
    `?ProductTierId=${cfg.productTierId}` +
    `&ProductTierVersion=${encodeURIComponent(tierVersion)}` +
    `&Filter=excludeCloudAccounts` +
    `&excludeNetworkTopology=true` +
    `&excludeHAStatus=true` +
    `&excludeIntegrations=true`;
  const data = await apiRequest<{ resourceInstances: Instance[] }>("GET", url, token);
  return data.resourceInstances || [];
}

export async function listAllInstances(cfg: EnvConfig, token: string): Promise<Instance[]> {
  const url =
    `${cfg.apiBase}/fleet/service/${cfg.serviceId}/environment/${cfg.environmentId}/instances` +
    `?ProductTierId=${cfg.productTierId}` +
    `&Filter=excludeCloudAccounts`;
  const data = await apiRequest<{ resourceInstances: Instance[] }>("GET", url, token);
  return data.resourceInstances || [];
}

export async function createUpgradePath(
  cfg: EnvConfig,
  token: string,
  sourceVersion: string,
  targetVersion: string,
  instanceIds: string[]
): Promise<UpgradePath> {
  return apiRequest<UpgradePath>(
    "POST",
    `${cfg.apiBase}/fleet/service/${cfg.serviceId}/productTier/${cfg.productTierId}/upgrade-path`,
    token,
    {
      sourceVersion: sourceVersion,
      targetVersion: targetVersion,
      upgradeFilters: { INSTANCE_IDS: instanceIds },
      notifyCustomer: true,
      maxConcurrentUpgrades: MAX_CONCURRENT_UPGRADES,
    }
  );
}

export async function getUpgradePath(cfg: EnvConfig, token: string, upgradePathId: string): Promise<UpgradePath> {
  return apiRequest<UpgradePath>(
    "GET",
    `${cfg.apiBase}/fleet/service/${cfg.serviceId}/productTier/${cfg.productTierId}/upgrade-path/${upgradePathId}`,
    token
  );
}

export async function modifyInstance(
  cfg: EnvConfig,
  token: string,
  instanceId: string,
  newImageName: string
): Promise<void> {
  await apiRequest(
    "PATCH",
    `${cfg.apiBase}/fleet/service/${cfg.serviceId}/environment/${cfg.environmentId}/instance/${instanceId}`,
    token,
    {
      requestParams: { imageName: newImageName },
      resourceId: cfg.resourceId,
    }
  );
}

export function formatProgress(u: UpgradePath): string {
  const pct = u.totalCount > 0 ? Math.round((u.completedCount / u.totalCount) * 100) : 0;
  return (
    `  [${u.status}] ${u.completedCount}/${u.totalCount} (${pct}%)  ` +
    `inProgress=${u.inProgressCount} pending=${u.pendingCount} failed=${u.failedCount}`
  );
}

export async function waitForUpgrade(cfg: EnvConfig, token: string, upgradePathId: string): Promise<UpgradePath> {
  console.log(`\n  polling upgrade-path every ${UPGRADE_POLL_INTERVAL_MS / 1000}s...`);
  const terminal = ["COMPLETE", "COMPLETED", "FAILED", "CANCELLED"];
  while (true) {
    const u = await withBackoffRetry(function () {
      return getUpgradePath(cfg, token, upgradePathId);
    }, "getUpgradePath");
    console.log(formatProgress(u));
    if (terminal.indexOf(u.status.toUpperCase()) !== -1) return u;
    await sleep(UPGRADE_POLL_INTERVAL_MS);
  }
}

export function getInstanceImageName(inst: Instance): string | undefined {
  const cri = inst.consumptionResourceInstanceResult;
  if (!cri) return undefined;
  const result = cri.result_params;
  if (result && typeof result === "object" && Object.keys(result).length > 0 && typeof result.imageName === "string") {
    return result.imageName;
  }
  const launch = cri.launch_input_params;
  if (launch && typeof launch === "object" && typeof launch.imageName === "string") {
    return launch.imageName;
  }
  return undefined;
}

export function groupByImage(instances: Instance[]): Map<string, Instance[]> {
  const groups = new Map<string, Instance[]>();
  for (const inst of instances) {
    const img = getInstanceImageName(inst) || "(no imageName)";
    if (!groups.has(img)) groups.set(img, []);
    (groups.get(img) as Instance[]).push(inst);
  }
  return groups;
}

export function parseEnvKey(value: string | undefined): EnvKey {
  if (value !== "dev" && value !== "prod") {
    throw new Error(`OMNI_ENV must be "dev" or "prod", got: ${value ?? "(unset)"}`);
  }
  return value;
}

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`Missing required env: ${name}`);
  return v.trim();
}

export function envFlag(name: string): boolean {
  const v = (process.env[name] || "").trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

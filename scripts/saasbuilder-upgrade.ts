import { checkbox, confirm, input, password, select } from "@inquirer/prompts";

type EnvKey = "dev" | "prod";

type EnvConfig = {
  label: string;
  apiBase: string;
  serviceId: string;
  environmentId: string;
  productTierId: string;
  serviceApiId: string;
  resourceId: string;
  imageParamId: string;
};

const ENV_CONFIG: Record<EnvKey, EnvConfig> = {
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

const IMAGE_PREFIX = "omnistrate-oss/customer-portal";
const UPGRADE_POLL_INTERVAL_MS = 20000;
const MODIFY_DELAY_MS = 1500;

type InputParameter = {
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

type VersionSet = {
  name: string;
  version: string;
  type: string;
  status: string;
  instanceCount?: number;
  releasedAt?: string;
};

type Instance = {
  consumptionResourceInstanceResult?: {
    id?: string;
    status?: string;
  };
  input_params?: {
    imageName?: string;
    [k: string]: unknown;
  };
  resourceVersionSummaries?: { version?: string; latestVersion?: string }[];
  tierVersion?: string;
};

type UpgradePath = {
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

function sleep(ms: number): Promise<void> {
  return new Promise(function (r) {
    setTimeout(r, ms);
  });
}

class ApiError extends Error {
  status: number;
  retryAfterMs?: number;
  constructor(message: string, status: number, retryAfterMs?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const dateMs = Date.parse(header);
  if (!Number.isNaN(dateMs)) return Math.max(0, dateMs - Date.now());
  return undefined;
}

async function apiRequest<T>(method: string, url: string, token: string, body?: unknown): Promise<T> {
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

async function withBackoffRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
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

async function signIn(apiBase: string, email: string, pw: string): Promise<string> {
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

async function loginWithRetry(apiBase: string): Promise<string> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const email = (await input({ message: "Omnistrate email:" })).trim();
    const pw = await password({ message: "Omnistrate password:", mask: "*" });
    try {
      const token = await signIn(apiBase, email, pw);
      console.log("  signed in\n");
      return token;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  login failed (${attempt}/3): ${msg}\n`);
    }
  }
  throw new Error("Unable to sign in after 3 attempts");
}

async function fetchImageParam(cfg: EnvConfig, token: string): Promise<InputParameter> {
  const data = await apiRequest<{ inputParameters: InputParameter[] }>(
    "GET",
    `${cfg.apiBase}/service/${cfg.serviceId}/resource/${cfg.resourceId}/input-parameter`,
    token
  );
  const param = data.inputParameters.find(function (p) {
    return p.id === cfg.imageParamId;
  });
  if (!param) throw new Error(`imageName parameter ${cfg.imageParamId} not found`);
  return param;
}

async function patchImageParam(
  cfg: EnvConfig,
  token: string,
  current: InputParameter,
  newImageName: string
): Promise<void> {
  const body: InputParameter = Object.assign({}, current, { defaultValue: newImageName });
  await apiRequest("PATCH", `${cfg.apiBase}/service/${cfg.serviceId}/input-parameter/${cfg.imageParamId}`, token, body);
}

async function releaseVersion(cfg: EnvConfig, token: string, versionSetName: string): Promise<void> {
  await apiRequest("POST", `${cfg.apiBase}/service/${cfg.serviceId}/service-api/${cfg.serviceApiId}/release`, token, {
    isPreferred: true,
    versionSetName: versionSetName,
    versionSetType: "Major",
    productTierId: cfg.productTierId,
  });
}

async function listVersionSets(cfg: EnvConfig, token: string): Promise<VersionSet[]> {
  const data = await apiRequest<{ tierVersionSets: VersionSet[] }>(
    "GET",
    `${cfg.apiBase}/service/${cfg.serviceId}/productTier/${cfg.productTierId}/version-set`,
    token
  );
  return data.tierVersionSets || [];
}

async function listInstancesByVersion(cfg: EnvConfig, token: string, tierVersion: string): Promise<Instance[]> {
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

async function listAllInstances(cfg: EnvConfig, token: string): Promise<Instance[]> {
  const url =
    `${cfg.apiBase}/fleet/service/${cfg.serviceId}/environment/${cfg.environmentId}/instances` +
    `?ProductTierId=${cfg.productTierId}` +
    `&Filter=excludeCloudAccounts` +
    `&ExcludeDetail=true`;
  const data = await apiRequest<{ resourceInstances: Instance[] }>("GET", url, token);
  return data.resourceInstances || [];
}

async function createUpgradePath(
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
      maxConcurrentUpgrades: 25,
    }
  );
}

async function getUpgradePath(cfg: EnvConfig, token: string, upgradePathId: string): Promise<UpgradePath> {
  return apiRequest<UpgradePath>(
    "GET",
    `${cfg.apiBase}/fleet/service/${cfg.serviceId}/productTier/${cfg.productTierId}/upgrade-path/${upgradePathId}`,
    token
  );
}

async function modifyInstance(cfg: EnvConfig, token: string, instanceId: string, newImageName: string): Promise<void> {
  await apiRequest(
    "PATCH",
    `${cfg.apiBase}/fleet/service/${cfg.serviceId}/environment/${cfg.environmentId}/instance/${instanceId}`,
    token,
    {
      requestParams: { imageName: newImageName },
      resourceId: cfg.resourceId,
      customTags: [],
    }
  );
}

function formatProgress(u: UpgradePath): string {
  const pct = u.totalCount > 0 ? Math.round((u.completedCount / u.totalCount) * 100) : 0;
  return (
    `  [${u.status}] ${u.completedCount}/${u.totalCount} (${pct}%)  ` +
    `inProgress=${u.inProgressCount} pending=${u.pendingCount} failed=${u.failedCount}`
  );
}

async function waitForUpgrade(cfg: EnvConfig, token: string, upgradePathId: string): Promise<UpgradePath> {
  console.log(`\n  polling ${upgradePathId} every ${UPGRADE_POLL_INTERVAL_MS / 1000}s...`);
  const terminal = ["COMPLETE", "COMPLETED", "FAILED", "CANCELLED"];
  while (true) {
    const u = await getUpgradePath(cfg, token, upgradePathId);
    console.log(formatProgress(u));
    if (terminal.indexOf(u.status.toUpperCase()) !== -1) return u;
    await sleep(UPGRADE_POLL_INTERVAL_MS);
  }
}

function groupByImage(instances: Instance[]): Map<string, Instance[]> {
  const groups = new Map<string, Instance[]>();
  for (const inst of instances) {
    const img = inst.input_params && inst.input_params.imageName ? inst.input_params.imageName : "(no imageName)";
    if (!groups.has(img)) groups.set(img, []);
    (groups.get(img) as Instance[]).push(inst);
  }
  return groups;
}

async function main() {
  console.log("\nSaaSBuilder Upgrade Tool\n");

  const envKey = await select<EnvKey>({
    message: "Which environment?",
    choices: [
      { name: ENV_CONFIG.dev.label, value: "dev" },
      { name: ENV_CONFIG.prod.label, value: "prod" },
    ],
  });
  const cfg = ENV_CONFIG[envKey];

  console.log(`\nSigning in to ${cfg.apiBase}`);
  const token = await loginWithRetry(cfg.apiBase);

  const version = (
    await input({
      message: "New image tag (e.g. 0.3.116):",
      validate: function (v) {
        return v.trim() ? true : "Required";
      },
    })
  ).trim();
  const newImage = `${IMAGE_PREFIX}:${version}`;
  const versionSetName = `Image v${version}`;

  console.log(`\nStep 1: update imageName default to '${newImage}'`);
  if (
    await confirm({
      message: `PATCH imageName param to '${newImage}'?`,
      default: true,
    })
  ) {
    const current = await fetchImageParam(cfg, token);
    console.log(`  current default: ${current.defaultValue}`);
    await patchImageParam(cfg, token, current, newImage);
    console.log("  updated");
  } else {
    console.log("  skipped");
  }

  console.log(`\nStep 2: release new version set '${versionSetName}'`);
  if (
    await confirm({
      message: `POST release with name '${versionSetName}' (Major, preferred)?`,
      default: true,
    })
  ) {
    await releaseVersion(cfg, token, versionSetName);
    console.log("  released");
  } else {
    console.log("  skipped");
  }

  console.log("\nStep 3: pick a source version to upgrade instances from");
  const versions = await listVersionSets(cfg, token);
  if (versions.length === 0) {
    console.log("  no version sets found");
    return;
  }
  const sourceVersion = await select<string>({
    message: "Source version (upgrade FROM):",
    choices: versions.map(function (v) {
      const count = typeof v.instanceCount === "number" ? v.instanceCount : 0;
      return {
        name: `${v.name}  —  v${v.version}  [${v.status}]  instances=${count}`,
        value: v.version,
      };
    }),
  });

  const releasedMatch = versions.find(function (v) {
    return v.name === versionSetName;
  });
  const targetChoice = await select<string>({
    message: "Target version (upgrade TO):",
    choices: versions
      .filter(function (v) {
        return v.version !== sourceVersion;
      })
      .map(function (v) {
        return {
          name: `${v.name}  —  v${v.version}  [${v.status}]`,
          value: v.version,
        };
      }),
    default: releasedMatch && releasedMatch.version !== sourceVersion ? releasedMatch.version : undefined,
  });

  console.log(`\nStep 4: list RUNNING instances on v${sourceVersion}`);
  const sourceInstances = await listInstancesByVersion(cfg, token, sourceVersion);
  const running = sourceInstances.filter(function (i) {
    const cri = i.consumptionResourceInstanceResult;
    return !!cri && cri.status === "RUNNING" && !!cri.id;
  });
  console.log(`  found ${sourceInstances.length} total, ${running.length} RUNNING (upgrading only RUNNING)`);

  let upgradePath: UpgradePath | null = null;
  if (running.length === 0) {
    console.log("  no RUNNING instances to upgrade; skipping upgrade step");
  } else {
    const ids = running.map(function (i) {
      return (i.consumptionResourceInstanceResult as { id: string }).id;
    });
    for (const id of ids) console.log(`    - ${id}`);
    if (
      await confirm({
        message: `Create upgrade-path v${sourceVersion} → v${targetChoice} for ${ids.length} instance(s)?`,
        default: true,
      })
    ) {
      upgradePath = await createUpgradePath(cfg, token, sourceVersion, targetChoice, ids);
      console.log(`  created upgradePathId=${upgradePath.upgradePathId}`);
      upgradePath = await waitForUpgrade(cfg, token, upgradePath.upgradePathId);
      const upper = upgradePath.status.toUpperCase();
      if (upper !== "COMPLETE" && upper !== "COMPLETED") {
        const go = await confirm({
          message: `Upgrade finished as ${upgradePath.status}. Continue to modify step anyway?`,
          default: false,
        });
        if (!go) {
          console.log("  aborting");
          return;
        }
      } else {
        console.log("  upgrade complete");
      }
    } else {
      console.log("  skipped upgrade");
    }
  }

  console.log("\nStep 5: modify instances (update imageName input param)");
  if (
    !(await confirm({
      message: "Proceed to modify-instances step?",
      default: true,
    }))
  ) {
    console.log("  done (stopped before modify)");
    return;
  }

  const all = await listAllInstances(cfg, token);
  const groups = groupByImage(all);
  const groupEntries = Array.from(groups.entries()).sort(function (a, b) {
    return b[1].length - a[1].length;
  });
  console.log("\n  image groups:");
  for (const entry of groupEntries) {
    const img = entry[0];
    const insts = entry[1];
    console.log(`    ${insts.length.toString().padStart(3)}  ${img}`);
  }

  const selectedImages = await checkbox<string>({
    message: `Select image groups to modify to '${newImage}':`,
    choices: groupEntries.map(function (entry) {
      const img = entry[0];
      const insts = entry[1];
      return {
        name: `${img}  (${insts.length} instance${insts.length === 1 ? "" : "s"})`,
        value: img,
        disabled: img === newImage ? "already on target image" : false,
      };
    }),
    required: true,
  });

  const toModify: Instance[] = [];
  for (const img of selectedImages) {
    const list = groups.get(img);
    if (list) for (const inst of list) toModify.push(inst);
  }
  const modifiableIds: string[] = [];
  for (const inst of toModify) {
    const cri = inst.consumptionResourceInstanceResult;
    if (cri && cri.id) modifiableIds.push(cri.id);
  }

  console.log(`\n  will modify ${modifiableIds.length} instance(s) to '${newImage}'`);
  if (
    !(await confirm({
      message: `Modify ${modifiableIds.length} instance(s)?`,
      default: true,
    }))
  ) {
    console.log("  aborted");
    return;
  }

  let ok = 0;
  let failed = 0;
  for (const id of modifiableIds) {
    try {
      await withBackoffRetry(function () {
        return modifyInstance(cfg, token, id, newImage);
      }, id);
      ok++;
      console.log(`    \u2713 ${id}`);
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message.split("\n")[0] : String(err);
      console.error(`    \u2717 ${id}: ${msg}`);
    }
    await sleep(MODIFY_DELAY_MS);
  }

  console.log(`\nDone. modified=${ok} failed=${failed}`);
}

main().catch(function (err) {
  const name = err && typeof err === "object" && "name" in err ? (err as { name?: string }).name : undefined;
  if (name === "ExitPromptError") {
    console.log("\nCancelled.");
    process.exit(130);
  }
  const msg = err instanceof Error ? err.message : String(err);
  console.error("\nError:", msg);
  process.exit(1);
});

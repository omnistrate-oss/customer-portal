# SaaSBuilder Upgrade Tool

Rolls a new `customer-portal` image across SaaSBuilder fleet instances on Omnistrate Dev or Prod. Two run modes:

- **Local interactive** (`yarn upgrade:instances`) — original prompt-driven CLI for a single operator at a terminal.
- **GitHub Actions** (`SaaSBuilder Upgrade — Prepare` and `SaaSBuilder Upgrade — Execute` workflows) — two-stage non-interactive run with credentials from secrets, Mattermost notifications, and a 4 h timeout.

Both modes call the same underlying library (`scripts/saasbuilder-upgrade/lib.ts`), so behavior is identical.

## What it does

For the chosen environment (Dev or Prod), the tool walks five steps:

1. **Update default image** — `PATCH`es the `imageName` input-parameter so new instances launch on the new tag.
2. **Release a new version set** — `POST /service-api/{saId}/release` with `versionSetName = "Image v<tag>"`, type `Major`, marked preferred.
3. **Pick source + target versions** — Lists all version sets and asks which version to upgrade FROM and TO. Defaults the target to the version set just released.
4. **Upgrade running instances** — Lists instances on the source version, filters to `RUNNING`, creates an upgrade-path, polls every 20 s until the upgrade reaches `COMPLETE` / `FAILED` / `CANCELLED`. Each poll is wrapped in exponential-backoff retry so a single 429/5xx during the multi-hour wait does not abort the run.
5. **Modify instances** — Lists every fleet instance, groups by current `imageName`, lets the operator pick which groups to update, then `PATCH`es each selected instance to the new image with a 1.5 s delay. Per-instance failures are reported but do not abort the rest of the run.

## Prerequisites

- The new `omnistrate-oss/customer-portal:<tag>` image has already been released and pushed (see the [customer-portal releases page](https://github.com/omnistrate-oss/customer-portal/releases)).
- The credentials in use have **fleet-admin** permissions on the target Omnistrate environment — Steps 4 and 5 hit internal `/fleet/...` endpoints (`inventory-api`).
- Dependencies installed: `yarn install`.

## Mode 1: Local interactive

```bash
yarn upgrade:instances
```

You will be asked, in order:

1. `Dev` or `Prod`
2. Omnistrate email + password (password masked, held in memory only)
3. New image tag (e.g. `0.3.116`)
4. Confirm each step

If login fails, the prompt retries up to 3 times.

## Mode 2: GitHub Actions (recommended for production rollouts)

Two `workflow_dispatch` workflows run as a chain. The pause between them is the operator clicking "Run workflow" on the second one — that's the mid-flow input.

### Required GitHub Secrets

| Secret | Used by | Purpose |
| --- | --- | --- |
| `OMNISTRATE_DEV_EMAIL` / `OMNISTRATE_DEV_PASSWORD` | both workflows when `environment=dev` | Sign in to `api.omnistrate.dev` |
| `OMNISTRATE_PROD_EMAIL` / `OMNISTRATE_PROD_PASSWORD` | both workflows when `environment=prod` | Sign in to `api.omnistrate.cloud` |
| `MATTERMOST_UI_TEAM_WEBHOOK` | both workflows | Send `@channel` notifications |

The `dev` / `prod` choice is the operator's `workflow_dispatch` input — picking it from the dropdown and clicking "Run workflow" is the human approval. No GitHub Environments needed.

### Stage 1 — `SaaSBuilder Upgrade — Prepare`

**Inputs:**

- `environment` — `dev` or `prod`
- `image_tag` — e.g. `0.3.116`
- `skip_patch_default` — boolean, skip Step 1
- `skip_release` — boolean, skip Step 2

**What it does:** runs Steps 1 and 2, then lists every version set and image group. Posts a Mattermost message tagging `@channel` and uploads `upgrade-prepare-summary.json` as an artifact. The run summary contains a copy-pasteable block of suggested inputs for the Execute workflow.

### Stage 2 — `SaaSBuilder Upgrade — Execute`

**Inputs** (copy from the Prepare run summary):

- `environment` — same as Prepare
- `image_tag` — same as Prepare
- `source_version` — the version to upgrade FROM
- `target_version` — the version to upgrade TO (typically equals `image_tag`)
- `image_groups_json` — JSON array of image strings to PATCH in Step 5, e.g. `["omnistrate-oss/customer-portal:0.3.115"]`
- `skip_upgrade_path` — boolean, skip Step 4
- `skip_modify` — boolean, skip Step 5
- `continue_on_upgrade_failure` — boolean, run Step 5 even if Step 4 ends `FAILED`/`CANCELLED`

**What it does:** runs Steps 4 and 5. Posts a "starting" Mattermost ping, then a final ping with success/failure status and the modified/failed counts. Uploads `upgrade-execute-summary.json` as an artifact.

**Timeout:** 4 hours (`timeout-minutes: 240`). The only expected failure mode is hitting this timeout; if a regular rollout starts to approach it, raise to 360 (the GitHub-hosted runner maximum).

### Public-repo data hygiene

This repo is public, which means **Actions logs, uploaded artifacts, and step summaries are world-readable**. To avoid systematically publishing the customer roster every rollout, the CI entrypoints redact:

- Per-instance success/failure log lines show `${i+1}/${total}` progress, **not** the instance ID.
- `upgrade-prepare-summary.json` lists `imageGroups` as `{ image, count }` only — no `instanceIds[]`.
- `upgrade-execute-summary.json` reports `failureReasons` as `{ reason, count }` aggregations and omits the upgrade-path ID.
- API errors are sanitized to the HTTP status (e.g. `HTTP 503`) before they hit logs or artifacts; the full URL (which contains the instance ID) and response body are dropped.

When investigating a failed rollout, use the credentials directly to re-query the API for specific instance IDs — the counts in the summary tell you what to look for. The local `yarn upgrade:instances` flow is unchanged and still prints full IDs (only your terminal sees them).

### Failure handling

The script is engineered so that **only timeouts and hard configuration errors fail the workflow**:

- Transient API errors (429 / 5xx) → exponential-backoff retry, up to 6 attempts honoring `Retry-After`.
- Per-instance modify failure → counted in the summary, does not abort the rest.
- Upgrade-path ending `FAILED`/`CANCELLED` → reported in the summary; Step 5 is skipped unless `continue_on_upgrade_failure=true`.
- Bad credentials, malformed inputs, missing image parameter → hard fail (the operator must fix and re-run).

## Notes

- Service, product-tier, resource, and image-parameter IDs for Dev and Prod are hard-coded at the top of `scripts/saasbuilder-upgrade/lib.ts`. Update them there if the underlying service changes.
- The `concurrency` group `saasbuilder-upgrade-${{ inputs.environment }}` prevents two upgrades from running against the same environment simultaneously.
- API surface split (cross-checked against `omnistrate-cloud-ui/types/{external,internal}/schema.ts`):
  - **External** (`/2022-09-01-00/...`): `signin`, `service/.../input-parameter` (GET, PATCH), `service-api/.../release`, `productTier/.../version-set`.
  - **Internal / fleet-only** (`/fleet/...`): `instances` list, `upgrade-path` POST/GET, fleet-instance PATCH. These require fleet-admin role.

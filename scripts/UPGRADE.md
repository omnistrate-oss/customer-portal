# SaaSBuilder Upgrade Tool

Interactive CLI that rolls a new `customer-portal` image across SaaSBuilder fleet instances on Omnistrate Dev or Prod.

## What it does

For the chosen environment (Dev or Prod), it walks through six steps end-to-end:

1. **Sign in** — Prompts for your Omnistrate email and password (password is masked). No credentials are read from env vars or disk.
2. **Update default image** — `PATCH`es the `imageName` input-parameter so new instances launch on the new tag.
3. **Release a new version set** — `POST /service-api/{saId}/release` with `versionSetName = "Image v<tag>"`, type `Major`, marked preferred.
4. **Pick source + target versions** — Lists all version sets, then asks which version you want to upgrade FROM and TO. Defaults the target to the version set you just released.
5. **Upgrade running instances** — Lists instances on the source version, filters to `RUNNING` only, creates an upgrade-path, then polls status every 20 s until the upgrade is `COMPLETE` (or `FAILED` / `CANCELLED`), printing progress (`completed / total`, percent, in-progress, failed).
6. **Modify instances** — Lists every fleet instance, groups them by current `imageName`, lets you multi-select which groups to update, then `PATCH`es each selected instance to the new image with a 1.5 s delay between calls.

Every state-changing step is gated behind a confirmation prompt, so you can skip any step or abort at any point.

## Prerequisites

- You've already released and pushed the new `omnistrate-oss/customer-portal:<tag>` image (e.g. via the [customer-portal releases page](https://github.com/omnistrate-oss/customer-portal/releases)).
- You have login credentials for the relevant Omnistrate account (`api.omnistrate.dev` for Dev, `api.omnistrate.cloud` for Prod).
- Dependencies are installed: `yarn install`.

## Run

```bash
yarn upgrade:instances
```

You will be asked, in order:

1. `Dev` or `Prod`
2. Omnistrate email + password
3. New image tag (e.g. `0.3.116`) — the full image name is built as `omnistrate-oss/customer-portal:<tag>` and the version-set name as `Image v<tag>`
4. Confirm each step: update default image → release version → pick source/target → upgrade → modify

## Notes

- Service, product-tier, resource, and image-parameter IDs for Dev and Prod are hard-coded at the top of `saasbuilder-upgrade.ts`. Update them there if the underlying service changes.
- Credentials stay in memory for the session only — nothing is written to disk.
- If login fails, you get up to 3 retries before the script exits.
- If the upgrade finishes in a non-complete state (e.g. `FAILED`), the script asks whether to continue to the modify step.
- The checkbox disables the group already on the target image so you can't modify it onto itself.

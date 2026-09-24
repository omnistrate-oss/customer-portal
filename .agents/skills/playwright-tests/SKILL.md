---
name: playwright-tests
description: Use when writing, running, recording or reviewing customer portal tests — Playwright specs under tests/, page objects in page-objects/, fixtures in test-fixtures/ and test-utils/, the HAR record/replay fixture (test-fixtures/har-test), ApiFixture, yarn record, yarn test:record and yarn test:replay, the tests/fixtures/hars submodule pointer, Playwright projects and discovery, test IDs, waits, backend soft failures, and CI test failures. There is no unit-test runner in this repo; Playwright is the only test tool.
---

# Playwright tests

Playwright 1.60 is the only test tool. There is no Jest or Vitest and no unit-test script; cover behavior with Playwright specs and keep logic you want to test in small functions that a spec exercises through the UI. The long-form guide is `tests/GUIDE.md`.

## 1. Commands

| Command                                          | What it does                                                                                                                                                                                                   |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `yarn playwright test`                           | Runs against the live backend (HAR mode `off`); starts `yarn dev:test` on port 3000 unless a server is already running                                                                                         |
| `yarn test:replay`                               | `HAR_MODE=replay`: serves recorded `/api/*` responses from the HAR files; what CI runs                                                                                                                         |
| `yarn test:record`                               | `HAR_MODE=record`: runs live and writes HAR files into `tests/fixtures/hars`                                                                                                                                   |
| `yarn record`                                    | Interactive recorder (`scripts/record-hars.ts`): prepares the HAR submodule, records, then commits and pushes the HARs to the HAR repository. Flags: `-f <spec files>`, `-m <modules>`, `--all`, `--skip-push` |
| `yarn playwright test tests/auth/signin.spec.ts` | One spec; add `--project=<name>`, `--ui` or `--headed` as needed                                                                                                                                               |
| `yarn playwright show-report`                    | Opens the last HTML report                                                                                                                                                                                     |
| `yarn check:playwright-discovery`                | Fails when a spec is not run by any project in `playwright.config.ts`                                                                                                                                          |

Local runs read `.env.local`: `PROVIDER_EMAIL`, `PROVIDER_PASSWORD`, `USER_EMAIL`, `USER_PASSWORD`, `YOUR_SAAS_DOMAIN_URL`, `NEXT_PUBLIC_BACKEND_BASE_DOMAIN`, `ENVIRONMENT_TYPE`, `MAIL_USER_EMAIL`, `MAIL_USER_PASSWORD`, and `BYOA_AWS_ACCOUNT_ID` for the BYOA spec. Install the browser once with `yarn playwright install --with-deps chromium`.

## 2. Where specs live and how they run

| Project            | Specs                      | Notes                                                                      |
| ------------------ | -------------------------- | -------------------------------------------------------------------------- |
| `auth-tests`       | `tests/auth/`              | Signed out                                                                 |
| `user-setup`       | `tests/user-setup.spec.ts` | Signs in through the UI and saves the session to playwright/auth/user.json |
| `deployment-tests` | `tests/deployments/`       | Uses that session (`storageState`) and depends on `user-setup`             |

- A spec anywhere else runs in no project, and `yarn check:playwright-discovery` fails. Put signed-in specs under `tests/deployments/<area>/` unless you have a reason for a new project.
- A new top-level folder needs a project in `playwright.config.ts` (with `storageState` and `dependencies: ["user-setup"]` when signed in) and an entry in `MODULE_TO_PROJECT` in `scripts/record-hars.ts`, or `yarn record -m <folder>` looks for a project with the folder's name.
- `test-fixtures/global-setup.ts` signs in and creates the test services from `constants/yaml-templates.ts` (in replay it loads the recorded state from the `global-setup` fixture instead); `test-fixtures/global-teardown.ts` deletes their instances, subscriptions and services. Teardown runs in every mode.

## 3. Always import from the HAR fixture

```ts
import { expect, test } from "test-fixtures/har-test";
```

Never import `test` or `expect` from `@playwright/test` in a spec `[no-playwright-test-import]`; the fixture's `context` is what records and replays. Page objects may import types such as `Page` and `Locator` from `@playwright/test`.

## 4. How HAR record and replay work

| Mode            | Set by                            | Behavior                                                                                                                             |
| --------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `off` (default) | nothing                           | Live backend                                                                                                                         |
| `record`        | `yarn test:record`, `yarn record` | Live backend; after each test, its `/api/*` traffic is saved to `tests/fixtures/hars/<project>/<spec-file-name>/<title-path>.har.gz` |
| `replay`        | `yarn test:replay`, CI            | Each `/api/*` request is answered from that test's HAR file                                                                          |

Details that matter when a test fails:

- Recording skips the auth routes (`/api/signin`, `/api/refresh-token`, `/api/logout` and friends), strips `Authorization`, `Cookie` and `Set-Cookie` headers, and redacts JSON request fields whose names look like a password, secret, token, API key, access key, private key or credential. Skipped tests save no HAR.
- Replay matches on method plus path and query string, ignoring host and port. Entries are served once each in recorded order; after that, the last response for the same request repeats, which covers polling.
- A request with no matching entry is aborted and logs `[HAR REPLAY] No matching HAR entry found`. The test then fails on whatever waited for that response. Re-record rather than weakening the assertion.
- A test with no HAR file is **skipped, not failed**. There is no separate strict-replay switch in this repo, so check the report for unexpected skips after adding or renaming tests.
- The file name comes from the spec file name and the full title path. Renaming a spec, a `describe` or a test orphans its HAR; re-record after renaming.
- `user-setup` and `tests/auth/signin.spec.ts` always run live, because their tokens expire after a day.
- Requests your test makes directly (for example creating an instance with `UserAPIClient` in a hook) are not in the browser HAR. Wrap them in `ApiFixture.getOrCreate` from `test-fixtures/api-fixture.ts` so replay reuses the recorded IDs, and skip live-only cleanup in replay:

```ts
const instanceFixture = new ApiFixture("operational-tests");
instance = await instanceFixture.getOrCreate("postgres-instance", () => apiClient.createInstance(/* … */));

test.afterAll(async () => {
  if (isReplayMode()) return;
  await apiClient.deleteResourceInstance(/* … */);
});
```

`isReplayMode` and `isRecordMode` come from `test-utils/har-mode.ts` (also re-exported by `test-fixtures/api-fixture.ts`).

## 5. Recording and the HAR submodule

HAR files live in a separate repository with restricted access, mounted as a git submodule at `tests/fixtures/hars` (see `.gitmodules`). CI checks out the commit this repo pins, not the HAR repository's latest commit.

1. Commit or stash your work and rebase on `origin/master`; `yarn record` refuses to run with local changes on a branch that is behind.
2. Run `yarn record -f tests/deployments/<area>/<name>.spec.ts` (or pick files interactively). It resets the submodule to the HAR repository's `master` when it is behind (discarding local HAR changes), records with the `user-setup` project included, and commits and pushes the new HARs to the HAR repository.
3. Bump the pointer in this repo, in the same PR as the test:

```bash
git add tests/fixtures/hars
git commit -m "test: record HARs for <feature>"
```

4. Run `yarn test:replay` for your spec and confirm it passes with no skips.

Without step 3, CI replays the old pin, finds no HAR for the new test, and silently skips it. Watch the reverse too: an unrelated submodule change in your diff can move the pin backwards.

Recording needs real credentials and push access to the HAR repository, so outside contributors ask a maintainer to record. A weekday workflow (`.github/workflows/playwright-recorder.yml`) re-records every spec and pushes to the HAR repository, but it never bumps the pin here.

## 6. Writing a spec

```ts
import { expect, test } from "test-fixtures/har-test";
import { CustomNetworksPage } from "page-objects/custom-networks-page";

test.describe.configure({ mode: "serial" });

test.describe("Customer Networks", () => {
  let customNetworksPage: CustomNetworksPage;

  test.beforeEach(async ({ page }) => {
    customNetworksPage = new CustomNetworksPage(page);
    await customNetworksPage.navigate();
  });

  test("shows the list and disables Modify without a selection", async ({ page }) => {
    await expect(page.getByTestId("create-button")).toBeEnabled();
    await expect(page.getByTestId("modify-button")).toBeDisabled();
  });
});
```

- Use `test.describe.configure({ mode: "serial" })` when tests build on each other (create, verify, delete), as every existing suite does.
- One page object per page in `page-objects/<page>-page.ts`: a class holding `page`, `dataTestIds`, `pageElements` (expected copy) and actions such as `navigate()`. Build URLs from `PageURLs` in `page-objects/pages.ts`, which uses `src/utils/routes.ts`.
- Select by test ID first (`page.getByTestId`), then by role and accessible name. Avoid CSS classes such as `.MuiPopover-paper` and text that the provider can rebrand.
- Test IDs are kebab-case `data-testid` values (`dataTestId` in a `FormConfiguration`). When the app and a page object share them, put them in `src/constants/testIds/<page>.ts` and import that in both places; app code cannot import from `page-objects/`.
- Cover the negative path too: validation errors, disabled actions and their tooltip reason, empty states.
- Skip tests that cannot apply to the environment with a reason, as the reset-password spec does: `test.skip(process.env.ENVIRONMENT_TYPE !== "PROD", "...")`.

## 7. Waiting

- Wait on conditions: web-first assertions (`await expect(locator).toBeVisible()`, `toHaveText`, `toBeEnabled`) or a response registered before the action that triggers it:

```ts
const [response] = await Promise.all([
  page.waitForResponse((r) => r.url().includes("/api/action?endpoint=%2F2022-09-01-00%2Fresource-instance")),
  page.getByTestId("refresh-button").click(),
]);
```

- No `page.waitForTimeout` `[no-wait-for-timeout]` and no `.only` `[no-focused-tests]`; CI also sets `forbidOnly`. Seven older files still use `waitForTimeout` and are allowlisted.
- To poll backend state, use `expect.poll` or `expect(...).toPass()` with a short interval in replay and a long one live (`page-objects/instances-page.ts` uses 300 ms in replay and 15 s live).

## 8. Backend flakiness: skip, don't fail

Instance lifecycle tests depend on real infrastructure. Page objects throw `BackendError` when an instance ends in `Failed` or times out.

- Call `registerSoftFailureRecorder()` from `test-utils/soft-failure-tracker.ts` at the top of the spec module.
- Wrap backend-dependent setup with a `BackendSetupGuard` from `test-utils/backend-error.ts`: call `guard.handleError(error)` in the hook's catch block and `test.skip(guard.setupFailed, ...)` in `beforeEach`.
- Wrap waits inside a test with `skipOnBackendError(test, async () => ...)`.
- Skipped tests are listed in backend-failures.json under `tests/` and in the CI job summary; the recorder does not commit their HARs.
- Assertion failures and missing elements still fail. Never catch them to make a test pass.

Reference: `tests/deployments/instances/operational-tests.spec.ts`.

## 9. Timeouts, retries and workers (`playwright.config.ts`)

| Mode   | Test timeout | Retries            | Workers            |
| ------ | ------------ | ------------------ | ------------------ |
| replay | 60 s         | 0                  | 1 in CI, 3 locally |
| record | 12 min       | 2 in CI, 1 locally | 2                  |
| off    | 12 min       | 2 in CI, 1 locally | 1 in CI, 2 locally |

Actions time out after 30 s. Traces are kept on the first retry. Long lifecycle suites raise their own limit, for example `tests/deployments/instances/helm-instance.spec.ts` sets 20 minutes.

## 10. CI

`.github/workflows/playwright.yml` runs on every non-draft PR to `master`: it checks out the pinned HAR submodule, builds and starts the server on port 8080, and runs `yarn test:replay`. The HTML report is uploaded as an artifact.

## 11. Checklist

- [ ] Spec under a folder a project runs; `yarn check:playwright-discovery` passes.
- [ ] `test` and `expect` come from `test-fixtures/har-test`; direct API calls go through `ApiFixture`; live-only cleanup is skipped in replay.
- [ ] Page object and shared test IDs added; selectors use test IDs or roles.
- [ ] No `waitForTimeout`, no `.only`, no swallowed assertion errors.
- [ ] HARs recorded with `yarn record`, `tests/fixtures/hars` pointer bumped in the same PR, and `yarn test:replay` passes with no unexpected skips.

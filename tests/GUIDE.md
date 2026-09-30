# Playwright E2E Test Guide — Customer Portal

## How It Works

Playwright is the only test tool in this repository; there is no unit-test runner. Specs drive the portal in Chromium and can run in three HAR modes, selected with the `HAR_MODE` environment variable:

| Mode            | Command                           | Backend                                              | Used by                                                 |
| --------------- | --------------------------------- | ---------------------------------------------------- | ------------------------------------------------------- |
| `off` (default) | `yarn playwright test`            | Live                                                 | Local development                                       |
| `record`        | `yarn test:record`, `yarn record` | Live; each test's `/api/*` traffic is saved to a HAR | Recording new or changed tests, weekday re-recording    |
| `replay`        | `yarn test:replay`                | Recorded responses from `tests/fixtures/hars`        | Every non-draft PR (`.github/workflows/playwright.yml`) |

Settings from `playwright.config.ts`:

| Mode   | Test timeout | Retries            | Workers            |
| ------ | ------------ | ------------------ | ------------------ |
| replay | 60 s         | 0                  | 1 in CI, 3 locally |
| record | 12 min       | 2 in CI, 1 locally | 2                  |
| off    | 12 min       | 2 in CI, 1 locally | 1 in CI, 2 locally |

Actions time out after 30 s, traces are kept on the first retry, and `test.only` fails in CI (`forbidOnly`).

## Directory Structure

```
tests/
  auth/                    # auth-tests project: sign-in and reset-password pages (signed out)
  deployments/             # deployment-tests project (signed in)
    instances/             # Instance lifecycle, operations, Helm, BYOA
  fixtures/hars/           # Git submodule with the recorded HAR files and API fixtures
  user-setup.spec.ts       # user-setup project: signs in and saves the storage state
  GUIDE.md                 # This file
test-fixtures/
  har-test.ts              # `test` and `expect` with HAR record/replay (import these in specs)
  api-fixture.ts           # ApiFixture: saves direct API results so replay can reuse them
  global-setup.ts          # Auth and test services (record/off), saved state (replay)
  global-teardown.ts       # Cleanup: instances, cloud accounts, subscriptions, services
  utils/                   # Tab-level helpers for the instance details page
test-utils/
  har-mode.ts              # isRecordMode() and isReplayMode()
  global-state-manager.ts  # State shared across test files
  provider-api-client.ts   # Provider-side API calls
  user-api-client.ts       # Customer-side API calls
  backend-error.ts         # BackendError, BackendSetupGuard, skipOnBackendError
  soft-failure-tracker.ts  # Records backend soft failures to JSON for CI reporting
page-objects/              # Page object models
scripts/record-hars.ts     # `yarn record`
```

## Getting Started

### Prerequisites

1. Create `.env.local` in the repository root (it is gitignored; there is no example file):

   ```
   PROVIDER_EMAIL=...
   PROVIDER_PASSWORD=...
   USER_EMAIL=...
   USER_PASSWORD=...
   MAIL_USER_EMAIL=...
   MAIL_USER_PASSWORD=...
   NEXT_PUBLIC_BACKEND_BASE_DOMAIN=<backend API base URL>
   YOUR_SAAS_DOMAIN_URL=http://localhost:3000
   ENVIRONMENT_TYPE=DEV
   ```

   `BYOA_AWS_ACCOUNT_ID` is needed for the BYOA spec. Set `DISABLE_PASSWORD_LOGIN=true` only when the portal under test has password login turned off.

2. Install the browser:

   ```bash
   yarn playwright install --with-deps chromium
   ```

3. For replay, check out the HAR submodule (this needs read access to the HAR repository):

   ```bash
   git submodule update --init tests/fixtures/hars
   ```

### Running tests

```bash
# Live backend. Starts `yarn dev:test` on port 3000 unless a server is already running.
yarn playwright test

# Replay recorded responses, as CI does
yarn test:replay

# One spec, one project, UI mode, last report
yarn playwright test tests/deployments/instances/basic-tests.spec.ts
yarn playwright test --project=auth-tests
yarn playwright test --ui
yarn playwright show-report

# Every spec must belong to a project
yarn check:playwright-discovery
```

> **Important:** Locally, the `webServer` in `playwright.config.ts` runs `yarn dev:test` (`node server.js`), not `yarn dev`. `yarn dev` uses `nodemon`, which restarts the server when `playwright-report/` and `test-results/` are written. In CI there is no `webServer`: the workflow builds the app, starts it on port 8080 and sets `YOUR_SAAS_DOMAIN_URL`.

## HAR Record and Replay

### Always import from the HAR fixture

```ts
import { expect, test } from "test-fixtures/har-test";
```

The fixture replaces Playwright's browser `context`, which is what records and replays. A spec that imports `test` from `@playwright/test` bypasses it; lint rejects that (`[no-playwright-test-import]`). Page objects may still import types such as `Page` and `Locator` from `@playwright/test`.

### What recording saves

- One gzipped HAR per test: `tests/fixtures/hars/<project>/<spec-file-name>/<title-path>.har.gz`. The title path includes the spec path, every `describe` title and the test title, so renaming any of them orphans the recording.
- Only `/api/*` requests are captured, and the auth routes (`/api/signin`, `/api/signup`, `/api/refresh-token`, `/api/sign-in-with-idp`, `/api/logout`, `/api/reset-password`, `/api/change-password`) are skipped.
- `Authorization`, `Cookie` and `Set-Cookie` headers are removed, and JSON request fields whose names look like a password, secret, token, API key, access key, private key or credential are replaced with `[REDACTED]`.
- Failed network entries are dropped. After each test the fixture waits for the network to go idle plus four seconds, so refetches triggered by a mutation are captured.
- A skipped test saves nothing, and an existing HAR for a test is replaced the first time that test runs in record mode.

### How replay answers requests

- Every `/api/*` request is matched on method plus path and query string; host and port are ignored, so HARs recorded on port 3000 replay on port 8080.
- Entries are served once each, in recorded order. When a request has no unused entry left, the last response for the same method and URL is served again, which covers polling.
- A request with no recorded response at all is aborted, and the console shows `[HAR REPLAY] No matching HAR entry found for <method> <url>`. The test then fails on whatever waited for that data.
- The auth routes listed above always reach the real Next.js API routes, so replay still needs valid user credentials.
- A test without a HAR file is **skipped** with `[HAR REPLAY] No HAR file recorded for this test`. There is no strict-replay option in this repository, so check the report for unexpected skips.
- The `user-setup` project and `tests/auth/signin.spec.ts` always run live (HAR mode `off`): their recordings would contain tokens that expire after a day.

### Direct API calls: `ApiFixture`

Requests a spec makes itself, for example creating an instance with `UserAPIClient` before the UI test, are not part of the browser HAR. Wrap them in `ApiFixture` (`test-fixtures/api-fixture.ts`) so replay reuses the IDs the HAR responses refer to:

```ts
import { ApiFixture, isReplayMode } from "test-fixtures/api-fixture";

const instanceFixture = new ApiFixture("operational-tests");

// Record and off modes call the factory and save the result;
// replay returns the saved value, or throws if the key was never recorded.
instance = await instanceFixture.getOrCreate("postgres-instance", () => apiClient.createInstance(/* ... */));

test.afterAll(async () => {
  if (isReplayMode()) return; // nothing was created in replay
  // clean up the live resource here
});
```

Fixtures are stored as `tests/fixtures/hars/fixtures/<name>.fixture.json.gz`. Because `getOrCreate` also writes them in `off` mode, a live local run can leave changes in the submodule; discard them unless you are recording. `tests/deployments/instances/operational-tests.spec.ts` is the reference.

### Global setup in each mode

- **record** and **off**: `test-fixtures/global-setup.ts` signs in as the provider and the user and creates three test services from `constants/yaml-templates.ts`, named with the run's timestamp. In record mode it also saves the `date`, `serviceOfferings` and `subscriptions` fields of the global state (never tokens) to the `global-setup` fixture.
- **replay**: it restores that saved state instead and, when `PROVIDER_EMAIL` and `PROVIDER_PASSWORD` are set, signs in again to refresh the provider token.
- `test-fixtures/global-teardown.ts` runs in every mode (see [Global setup / teardown](#global-setup--teardown)).

### Recording with `yarn record`

`yarn record` runs `scripts/record-hars.ts`:

```bash
yarn record                                                # interactive: pick all, modules or files
yarn record -f tests/deployments/instances/basic-tests.spec.ts
yarn record -m auth,deployments                            # modules are folders under tests/
yarn record --all --skip-push                              # record everything, push nothing
```

The script:

1. Refuses to run if you have uncommitted changes on a branch that is behind `origin/master`.
2. Initializes `tests/fixtures/hars` and, if the HAR repository's `master` has moved, resets the submodule to it, discarding local HAR changes. If it has not moved, earlier local recordings are kept.
3. Runs `yarn playwright test` with `HAR_MODE=record`, adding the `user-setup` project whenever a signed-in module or file is selected. It stops if any test fails.
4. Unless `--skip-push` is set, commits the changes in the submodule as `chore: update HAR files (<date>)` and pushes them to the HAR repository's `master`.

`yarn test:record` records every spec into the submodule without committing or pushing anything.

Recording needs the credentials above and push access to the HAR repository. Contributors without access ask a maintainer to record.

### Bump the submodule pointer in the same PR

CI (`.github/workflows/playwright.yml`) checks out the HAR commit that this repository pins, not the latest commit in the HAR repository. After recording:

```bash
git status                     # shows: modified: tests/fixtures/hars (new commits)
git add tests/fixtures/hars
git commit -m "test: record HARs for <feature>"
yarn test:replay               # confirm the new tests pass and are not skipped
```

Without the bump, CI replays the old pin, finds no HAR for the new tests and skips them. Also check that your PR does not move the pointer to an older commit by accident. In `git submodule status`, a leading `+` means your checkout differs from the pinned commit.

A weekday workflow (`.github/workflows/playwright-recorder.yml`) re-records every spec against a production build and pushes the result to the HAR repository. It never changes the pointer in this repository, and it leaves out the HARs of specs that hit backend soft failures.

### Replay troubleshooting

| Symptom                                                       | Cause                                                                             | Fix                                                                                       |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Test skipped: `No HAR file recorded for this test`            | Never recorded, renamed since recording, or the pointer was not bumped            | Record with `yarn record -f <spec>`, then bump `tests/fixtures/hars`                      |
| `No matching HAR entry found for GET <url>`, then a timeout   | The UI now makes a request the recording does not have (new call, new parameters) | Re-record the spec; do not loosen the assertion                                           |
| `[ApiFixture] Missing key "<key>" ... Re-run in record mode.` | A new `getOrCreate` key has no recorded value                                     | Record the spec                                                                           |
| Passes locally in replay, fails or skips in CI                | Your local submodule checkout is not the pinned commit                            | Bump the pointer, or `git submodule update tests/fixtures/hars` to test the pinned commit |
| Auth failures in replay                                       | Auth routes are always live                                                       | Check `USER_EMAIL`, `USER_PASSWORD` and the provider credentials in `.env.local`          |

## Writing a New Test

### 1. Create the page object (if needed)

```ts
// page-objects/my-page.ts
import { Page } from "@playwright/test";

import { PageURLs } from "./pages";

export class MyPage {
  page: Page;

  dataTestIds = {
    createButton: "create-button",
  };

  pageElements = {
    heading: "My Page",
  };

  constructor(page: Page) {
    this.page = page;
  }

  async navigate() {
    await this.page.goto(PageURLs.instances);
  }
}
```

Build URLs in `page-objects/pages.ts` from the route helpers in `src/utils/routes.ts`. When the app and a page object share test IDs, keep them in `src/constants/testIds/` and import them in both places; app code must not import from `page-objects/`.

### 2. Create the spec file

```ts
// tests/deployments/my-feature/my-feature.spec.ts
import { expect, test } from "test-fixtures/har-test";
import { MyPage } from "page-objects/my-page";

test.describe.configure({ mode: "serial" });

test.describe("My Feature", () => {
  let myPage: MyPage;

  test.beforeEach(async ({ page }) => {
    myPage = new MyPage(page);
    await myPage.navigate();
  });

  test("shows the page", async ({ page }) => {
    await expect(page.getByTestId(myPage.dataTestIds.createButton)).toBeVisible();
  });
});
```

Signed-in specs go under `tests/deployments/`, which already runs with the saved session. Signed-out page specs go under `tests/auth/`.

### 3. Register a project (only for a new top-level directory)

A spec outside `tests/auth/`, `tests/deployments/` and `tests/user-setup.spec.ts` runs in no project, and `yarn check:playwright-discovery` fails. For a new top-level directory, add a project to `playwright.config.ts`:

```ts
{
  name: "my-feature-tests",
  testDir: "./tests/my-feature",
  use: {
    ...devices["Desktop Chrome"],
    storageState: path.resolve("./playwright/auth/user.json"),
  },
  dependencies: ["user-setup"],
},
```

Then add the directory to `MODULE_TO_PROJECT` in `scripts/record-hars.ts` so `yarn record -m my-feature` finds the project. The project name also becomes the first folder of the HAR path.

### 4. Record, bump, replay

Record the new spec with `yarn record -f <spec>`, bump `tests/fixtures/hars` in the same PR, and run `yarn test:replay` (see [HAR Record and Replay](#har-record-and-replay)).

## Test Conventions

### Serial execution

Suites whose tests build on each other (create, verify, delete) declare:

```ts
test.describe.configure({ mode: "serial" });
```

Every suite under `tests/deployments/` does.

### Selectors and waits

- Select by test ID (`page.getByTestId`), then by role and accessible name. Test IDs are kebab-case `data-testid` values.
- Wait for conditions: web-first assertions such as `await expect(locator).toBeVisible()`, or `page.waitForResponse(...)` registered before the action that triggers the request.
- No `page.waitForTimeout` (`[no-wait-for-timeout]`) and no `.only` (`[no-focused-tests]`). Older files that still use `waitForTimeout` are allowlisted in `eslint.migration-allowlists.cjs`; do not add new ones.
- To poll backend state, use `expect.poll` or `expect(...).toPass()`. The instances page object polls every 300 ms in replay and every 15 s live.

### Global setup / teardown

- **`global-setup.ts`** authenticates the provider and the user and creates the test services `SaaSBuilder Postgres DT - <timestamp>`, `SaaSBuilder Postgres DT BYOA - <timestamp>` and `SaaSBuilder Redis Helm - <timestamp>` (record and off modes; replay restores saved state, see above).
- **`global-teardown.ts`** runs in every mode, including replay, and cleans up in order:
  1. Delete all regular instances (waits up to 10 minutes)
  2. Delete all cloud account instances (waits up to 10 minutes)
  3. Delete the subscriptions of each service environment
  4. Delete `SaaSBuilder *` services created by the current run or more than 2 hours old

### User setup

`tests/user-setup.spec.ts` runs as the `user-setup` project, always live. It signs in through the browser, reads the `omnistrate_token` cookie from the browser context (Playwright can read httpOnly cookies), captures the subscriptions from the first subscription request, and saves the storage state to playwright/auth/user.json. It then loads the service offerings with `UserAPIClient.listServiceOffering()`, which keeps only `SaaSBuilder` services from the current run or created in the last 2 hours. The `deployment-tests` project depends on it.

### State management

Use `GlobalStateManager` to share state across test files:

```ts
import { GlobalStateManager } from "test-utils/global-state-manager";

const date = GlobalStateManager.getDate(); // Timestamp from global setup
const token = GlobalStateManager.getToken("provider"); // or "user"
const offerings = GlobalStateManager.getServiceOfferings();
const subscriptions = GlobalStateManager.getSubscriptions();
```

State is written to global-state.json in the test-results folder.

## Silent Failing for Infrastructure-Based Tests

Tests that depend on backend infrastructure (instance creation, status transitions) should **skip** instead of **fail** when the backend doesn't cooperate. This prevents false negatives from infrastructure issues unrelated to UI code.

**Applies to:** tests waiting for instance or upgrade status, and tests creating infrastructure resources.
**Does NOT apply to:** page structure tests, auth tests, or anything that doesn't depend on backend state.

### Setup

```ts
import { expect, test } from "test-fixtures/har-test";
import { BackendSetupGuard, skipOnBackendError } from "test-utils/backend-error";
import { registerSoftFailureRecorder } from "test-utils/soft-failure-tracker";

registerSoftFailureRecorder(); // each worker process must register the recorder

const guard = new BackendSetupGuard("deployments/instances/my-test.spec.ts");

test.describe.configure({ mode: "serial" });

test.describe("My Infra Test", () => {
  test.beforeAll(async () => {
    try {
      // create backend resources (wrap direct API calls in ApiFixture)
    } catch (error) {
      guard.handleError(error); // records BackendError and marks the suite; rethrows anything else
    }
  });

  test.beforeEach(async () => {
    // Skip all tests if setup failed due to backend issues
    test.skip(guard.setupFailed, `Skipping: ${guard.failureMessage}`);
  });

  test("waits for backend state", async ({ page }) => {
    await skipOnBackendError(test, async () => {
      await instancesPage.waitForStatus(instanceId, "Running", logPrefix);
    });
  });
});
```

### How it works

- **`BackendError`** is thrown by page objects (`InstancesPage.waitForStatus`, `CloudAccountsPage.waitForStatus`) when an instance reaches `Failed` status or times out.
- **`BackendSetupGuard`** catches `BackendError` in `beforeAll`/`beforeEach` setup and marks the suite for skipping. Non-backend errors (assertions, missing elements) still fail normally.
- **`skipOnBackendError(test, fn)`** wraps individual test bodies — it catches `BackendError` and calls `test.skip()`.
- **The soft failure tracker** records every skip to backend-failures.json in the `tests` folder. Global setup deletes the file at the start of each run.

### CI behavior

When backend soft failures occur during a PR run (`.github/workflows/playwright.yml`):

1. Failures are recorded to backend-failures.json in the `tests` folder
2. A summary is added to the GitHub Actions job summary
3. The failure report is uploaded as an artifact
4. **Tests are marked as skipped, not failed** — they don't block merges

During weekday re-recording (`.github/workflows/playwright-recorder.yml`), the HAR files of specs with soft failures are left out of the commit, so replay keeps the last good recording.

## Common Pitfalls

**Server restarts during tests** — Use `yarn dev:test` (not `yarn dev`). The `nodemon` watcher in `yarn dev` sees `playwright-report/` and `test-results/` changes and restarts the server mid-test.

**Global setup fails with "Missing provider credentials in environment variables"** (or "Missing user credentials") — Ensure `.env.local` has `PROVIDER_EMAIL`, `PROVIDER_PASSWORD`, `USER_EMAIL` and `USER_PASSWORD` set. Replay also needs the user credentials, because sign-in is always live.

**Replay stops in global setup with `[ApiFixture] Missing key "globalState"`** — The HAR submodule is not checked out, so the saved global state is missing. Run `git submodule update --init tests/fixtures/hars`.

**Every test is skipped in replay** — The tests were never recorded, or your checkout of `tests/fixtures/hars` does not contain their HAR files (see [Replay troubleshooting](#replay-troubleshooting)).

**Instance creation times out** — The default `waitForStatus` timeout is 10 minutes, and `tests/deployments/instances/helm-instance.spec.ts` raises its test timeout to 20 minutes. In replay each test has 60 seconds; a replayed test that still polls for minutes is missing responses, so re-record it. If live runs keep timing out, the backend may be degraded; this is caught as a `BackendError` and skipped.

**Service offering not found in user-setup** — `UserAPIClient.listServiceOffering()` (`test-utils/user-api-client.ts`) keeps only `SaaSBuilder` services whose name contains the current `date` stamp or that are less than 2 hours old. If `global-setup` failed to create services, this fails.

**Stale services accumulating** — `global-teardown` deletes all `SaaSBuilder *` services older than 2 hours as a safety net, even if they weren't created by the current run.

**Local HAR changes disappeared** — `yarn record` resets the submodule to the HAR repository's `master` when that branch has moved, discarding unpushed local recordings. Push (or copy) recordings you want to keep before recording again.

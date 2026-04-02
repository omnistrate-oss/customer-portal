# Playwright E2E Test Guide — SaaSBuilder

## How It Works

Tests run **live against the real backend** on every non-draft PR. There is no HAR record/replay — each run exercises the actual Omnistrate API.

| Environment | Command | Workers | Retries |
|-------------|---------|---------|---------|
| **Local** | `yarn playwright test` | 3 | 0 |
| **CI** | `yarn playwright test` (via `playwright.yml`) | 1 | 2 |

## Directory Structure

```
tests/
  auth/                  # Auth page tests (signin, reset-password)
  deployments/           # Deployment lifecycle tests
    instances/           # Instance CRUD, operations, Helm, BYOA
  user-setup.spec.ts     # Playwright setup — authenticates user, saves storage state
  GUIDE.md               # This file
test-fixtures/
  global-setup.ts        # Auth + service creation (runs before all tests)
  global-teardown.ts     # Cleanup: instances → subscriptions → services
  utils/                 # Tab-level test helpers for instance details
test-utils/
  global-state-manager.ts  # Persistent state across test files
  provider-api-client.ts   # Provider-side API calls
  user-api-client.ts       # User-side API calls
  backend-error.ts         # BackendError + BackendSetupGuard + skipOnBackendError
  soft-failure-tracker.ts  # Records backend failures to JSON (for CI reporting)
page-objects/              # Page object models
```

## Getting Started

### Prerequisites

1. Copy `.env.local.example` to `.env.local` and fill in credentials:
   ```
   PROVIDER_EMAIL=...
   PROVIDER_PASSWORD=...
   USER_EMAIL=...
   USER_PASSWORD=...
   NEXT_PUBLIC_BACKEND_BASE_DOMAIN=https://api.omnistrate.dev
   YOUR_SAAS_DOMAIN_URL=http://localhost:3000
   ENVIRONMENT_TYPE=DEV
   ```

2. Install Playwright browsers:
   ```bash
   yarn playwright install --with-deps
   ```

### Running tests

```bash
# Starts the dev server (via webServer config) and runs all tests
yarn playwright test

# Run a specific test file
yarn playwright test tests/deployments/instances/basic-tests.spec.ts

# Run with UI mode
yarn playwright test --ui

# View the last test report
yarn playwright show-report
```

> **Important:** Tests use `yarn dev:test` (not `yarn dev`) for the webServer. This runs `node server.js` directly instead of `nodemon`, preventing restarts when `playwright-report/` and `test-results/` are written.

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

  constructor(page: Page) {
    this.page = page;
  }

  async navigate() {
    await this.page.goto(PageURLs.instances);
  }
}
```

### 2. Create the spec file

```ts
// tests/my-feature/my-feature.spec.ts
import test, { expect } from "@playwright/test";
import { MyPage } from "page-objects/my-page";

test.describe.configure({ mode: "serial" });

test.describe("My Feature", () => {
  let myPage: MyPage;

  test.beforeEach(async ({ page }) => {
    myPage = new MyPage(page);
    await myPage.navigate();
    await page.waitForLoadState("networkidle");
  });

  test("shows the page", async ({ page }) => {
    await expect(page.getByTestId("page-title")).toBeVisible();
  });
});
```

### 3. Register the project in `playwright.config.ts` (if new directory)

If the test lives under a new top-level directory in `tests/`, add a project:

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

## Test Conventions

### Serial execution

Every `test.describe` block must include:

```ts
test.describe.configure({ mode: "serial" });
```

Tests within a suite depend on each other (e.g., create → verify → delete).

### Global setup / teardown

- **`global-setup.ts`** authenticates provider + user and creates test services (`SaaSBuilder Postgres DT`, `SaaSBuilder Supabase DT BYOA`, `SaaSBuilder Redis Helm`).
- **`global-teardown.ts`** cleans up in order:
  1. Delete all regular instances (wait up to 10 min)
  2. Delete all cloud account instances (wait up to 10 min)
  3. Delete subscriptions for each service/environment
  4. Delete `SaaSBuilder *` services (current test + stale ones older than 2 hours)

### User setup

`tests/user-setup.spec.ts` runs as a Playwright setup project. It signs in via the browser, captures the JWT token and storage state, and fetches service offerings and subscriptions. All other test projects depend on it.

### State management

Use `GlobalStateManager` to share state across test files:

```ts
import { GlobalStateManager } from "test-utils/global-state-manager";

const date = GlobalStateManager.getDate();              // Timestamp from global setup
const token = GlobalStateManager.getToken("provider");  // or "user"
const offerings = GlobalStateManager.getServiceOfferings();
const subscriptions = GlobalStateManager.getSubscriptions();
```

State is persisted to `test-results/global-state.json`.

## Silent Failing for Infrastructure-Based Tests

Tests that depend on backend infrastructure (instance creation, status transitions) should **skip** instead of **fail** when the backend doesn't cooperate. This prevents false negatives from infra issues unrelated to UI code.

**Applies to:** tests waiting for instance/upgrade status, creating infrastructure resources.
**Does NOT apply to:** simple page structure tests, auth tests, or anything that doesn't depend on backend state.

### Setup

```ts
import test from "@playwright/test";
import { BackendSetupGuard, skipOnBackendError } from "test-utils/backend-error";

const guard = new BackendSetupGuard("deployments/instances/my-test.spec.ts");

test.describe.configure({ mode: "serial" });

test.describe("My Infra Test", () => {
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
- **`skipOnBackendError(test, fn)`** wraps individual test bodies — catches `BackendError` and calls `test.skip()`.
- **Soft failure tracker** records all skipped tests to `tests/backend-failures.json`, which CI surfaces in the job summary.

### CI behavior

When backend soft failures occur:
1. Failures are recorded to `tests/backend-failures.json`
2. A summary is added to the GitHub Actions job summary
3. The failure report is uploaded as an artifact
4. **Tests are marked as skipped, not failed** — they don't block merges

## Common Pitfalls

**Server restarts during tests** — Use `yarn dev:test` (not `yarn dev`). The `nodemon` watcher in `yarn dev` sees `playwright-report/` and `test-results/` changes and restarts the server mid-test.

**Global setup fails with "Missing credentials"** — Ensure `.env.local` has `PROVIDER_EMAIL`, `PROVIDER_PASSWORD`, `USER_EMAIL`, and `USER_PASSWORD` set.

**Instance creation times out** — The default `waitForStatus` timeout is 10 minutes. Helm instances use 20 minutes. If consistently timing out, the backend may be degraded — this will be caught as a `BackendError` and skipped.

**Service offering not found in user-setup** — `user-setup.spec.ts` filters offerings by `SaaSBuilder` prefix and the current `date` stamp or recency (< 2 hours). If `global-setup` failed to create services, this will fail.

**Stale services accumulating** — `global-teardown` deletes all `SaaSBuilder *` services older than 2 hours as a safety net, even if they weren't created by the current test run.

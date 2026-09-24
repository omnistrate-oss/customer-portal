---
applyTo: "tests/**,test-fixtures/**,test-utils/**,page-objects/**"
---

# Test review checklist

Lint already rejects `test` or `expect` imported from `@playwright/test` in a spec, `.only` and `waitForTimeout`, and CI fails specs that the Playwright project doesn't run. Flag an attempt to get around them, such as a new allowlist entry or an `eslint-disable`, as a **Blocker**.

CI runs Playwright in HAR replay: browser API responses come from the `tests/fixtures/hars` submodule at the commit the pull request pins.

- Flag UI steps that create prerequisites which aren't the feature under test. Use API helpers for setup; the UI is only for the feature being tested.
- Flag direct API calls whose results the browser uses (IDs, names, dates) without the fixture helpers in `test-fixtures/api-fixture.ts`. In replay they don't return the recorded values.
- Flag selectors built from text, CSS classes or DOM structure where a test ID could be added. Test IDs are constants in `src/constants/testIds/`, used by the component and a page object in `page-objects/`.
- Flag `page.waitForResponse` registered after the action that triggers the request. Use `Promise.all([page.waitForResponse(...), action()])`, because replay answers instantly.
- Flag assertions on data the backend fills in asynchronously without first waiting for the resource's ready state.
- Flag positive-only coverage: no validation errors, no permission-disabled actions, no empty or error states.
- Flag tests skipped in replay mode; pull request CI runs only replay, so they never run.
- Flag new or renamed specs and tests without a `tests/fixtures/hars` pointer bump to a commit that contains their HARs.
- Flag utilities that return a single field instead of the full response, and polling that treats an error or missing data as success.
- Flag real credentials, tokens or personal data in test data or fixtures. This repository is public.

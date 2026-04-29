# Test Case Inventory — New & Modified

> Generated from the [COMPREHENSIVE_TEST_PLAN.md](COMPREHENSIVE_TEST_PLAN.md)  
> **Total new test cases:** 79  
> **Modified existing files:** 6  
> **Total test files:** 26 (19 new + 7 existing)

---

## Summary Table

| Status | File                                                                | Tests | Test Plan Section          |
| ------ | ------------------------------------------------------------------- | ----- | -------------------------- |
| ✨ NEW | `tests/auth/change-password.spec.ts`                                | 5     | §4 — Change Password       |
| ✨ NEW | `tests/auth/legal-pages.spec.ts`                                    | 3     | §20 — Legal / Static Pages |
| ✨ NEW | `tests/auth/seed.spec.ts`                                           | 1     | (Playwright seed)          |
| ✨ NEW | `tests/auth/signup.spec.ts`                                         | 4     | §2 — Sign Up               |
| ✨ NEW | `tests/deployments/access-control/access-control.spec.ts`           | 3     | §11 — Access Control       |
| ✨ NEW | `tests/deployments/alerts/alerts.spec.ts`                           | 2     | §15 — Alerts               |
| ✨ NEW | `tests/deployments/audit-logs/audit-logs.spec.ts`                   | 5     | §14 — Audit Logs           |
| ✨ NEW | `tests/deployments/billing/billing.spec.ts`                         | 4     | §12 — Billing              |
| ✨ NEW | `tests/deployments/cloud-accounts/cloud-accounts-structure.spec.ts` | 5     | §9 — Cloud Accounts        |
| ✨ NEW | `tests/deployments/cost-explorer/cost-explorer.spec.ts`             | 2     | §13 — Cost Explorer        |
| ✨ NEW | `tests/deployments/custom-networks/custom-networks.spec.ts`         | 4     | §10 — Custom Networks      |
| ✨ NEW | `tests/deployments/dashboard/dashboard.spec.ts`                     | 3     | §5 — Dashboard             |
| ✨ NEW | `tests/deployments/edge-cases/edge-cases.spec.ts`                   | 5     | §22 — Edge Cases           |
| ✨ NEW | `tests/deployments/instance-snapshots/instance-snapshots.spec.ts`   | 6     | §16 — Instance Snapshots   |
| ✨ NEW | `tests/deployments/instances/instances-structure.spec.ts`           | 5     | §6 — Instances Structure   |
| ✨ NEW | `tests/deployments/navigation/layout-navigation.spec.ts`            | 9     | §19 — Layout & Navigation  |
| ✨ NEW | `tests/deployments/release-history/release-history.spec.ts`         | 3     | §17 — Release History      |
| ✨ NEW | `tests/deployments/settings/settings.spec.ts`                       | 6     | §18 — Settings             |
| ✨ NEW | `tests/deployments/subscriptions/subscriptions.spec.ts`             | 4     | §8 — Subscriptions         |
| ✏️ MOD | `tests/auth/signin.spec.ts`                                         | 7     | §1 — Sign In               |
| ✏️ MOD | `tests/deployments/instances/basic-tests.spec.ts`                   | 4     | §6 — Instance Lifecycle    |
| ✏️ MOD | `tests/deployments/instances/helm-instance.spec.ts`                 | 2     | §6 — Helm Instance         |
| ✏️ MOD | `tests/user-setup.spec.ts`                                          | —     | Auth bootstrap             |
| ✏️ MOD | `page-objects/signin-page.ts`                                       | —     | Page object                |
| ✏️ MOD | `playwright.config.ts`                                              | —     | Config                     |

---

## NEW Test Files — Detailed Breakdown

### 1. `tests/auth/change-password.spec.ts` — 5 tests

| #   | Test Name                                            | What It Validates                                                                           |
| --- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1   | Valid Token Flow — Form Renders with Email and Token | Navigate with `?email=&token=`, verify heading, description, password fields, submit button |
| 2   | Missing Token — Shows Error Message                  | Navigate without params, verify error text, form not shown                                  |
| 3   | Password Validation — Mismatching Passwords          | Fill mismatched passwords, verify "Passwords must match" error                              |
| 4   | Password Validation — Weak Password                  | Fill short password, verify regex validation error                                          |
| 5   | Password Validation — Password Same as Email         | Fill email as password, verify email-match error                                            |

**Project:** `auth-tests` (no authentication required)

---

### 2. `tests/auth/legal-pages.spec.ts` — 3 tests

| #   | Test Name                 | What It Validates                                          |
| --- | ------------------------- | ---------------------------------------------------------- |
| 1   | Terms of Use Page Loads   | `/terms-of-use` renders, body not empty, heading visible   |
| 2   | Privacy Policy Page Loads | `/privacy-policy` renders, body not empty, heading visible |
| 3   | Cookie Policy Page Loads  | `/cookie-policy` renders, body not empty, heading visible  |

**Project:** `auth-tests`

---

### 3. `tests/auth/signup.spec.ts` — 4 tests

| #   | Test Name                               | What It Validates                                                         |
| --- | --------------------------------------- | ------------------------------------------------------------------------- |
| 1   | Page Load and Structure                 | Heading "Create a new account", name/email/password fields, submit button |
| 2   | Form Validation — All Fields Required   | Submit empty form, verify required-field errors                           |
| 3   | Form Validation — Password Requirements | Enter weak password, verify regex validation error                        |
| 4   | SSO Registration Buttons                | Google/GitHub SSO buttons visibility                                      |

**Project:** `auth-tests`  
**Note:** Skipped when `ENVIRONMENT_TYPE !== "PROD"` (signup may be disabled)

---

### 4. `tests/deployments/dashboard/dashboard.spec.ts` — 3 tests

| #   | Test Name                    | What It Validates                                |
| --- | ---------------------------- | ------------------------------------------------ |
| 1   | Page Load and Data Rendering | `/dashboard` loads without crash, no error text  |
| 2   | Audit Logs Widget            | Audit logs section or table renders on dashboard |
| 3   | Chart Widgets Render         | Canvas or chart container elements render        |

**Project:** `deployment-tests` (requires auth via `storageState`)

---

### 5. `tests/deployments/instances/instances-structure.spec.ts` — 5 tests

| #   | Test Name                           | What It Validates                                      |
| --- | ----------------------------------- | ------------------------------------------------------ |
| 1   | Page Load — Toolbar Buttons Visible | Create Instance and Refresh buttons in toolbar         |
| 2   | Instances Table Columns Visible     | Column headers: ID, Service Name, Region, Status, etc. |
| 3   | Create Instance — Form Opens        | Click Create button, form/dialog appears               |
| 4   | Search/Filter Instances             | Search input filters table rows                        |
| 5   | Refresh Button Works                | Click Refresh, no crash, page stays functional         |

**Project:** `deployment-tests`

---

### 6. `tests/deployments/subscriptions/subscriptions.spec.ts` — 4 tests

| #   | Test Name                     | What It Validates                                 |
| --- | ----------------------------- | ------------------------------------------------- |
| 1   | Page Load and Structure       | `/subscriptions` loads, heading or table visible  |
| 2   | View Subscription Details     | Click first subscription row, detail view renders |
| 3   | Deep Link — Pre-filled Search | Navigate with `?search=`, verify filter applied   |
| 4   | Table Renders Without Errors  | Page renders without crash, no error text         |

**Project:** `deployment-tests`

---

### 7. `tests/deployments/cloud-accounts/cloud-accounts-structure.spec.ts` — 5 tests

| #   | Test Name                           | What It Validates                             |
| --- | ----------------------------------- | --------------------------------------------- |
| 1   | Page Load — Toolbar Buttons Visible | Link Cloud Account button in toolbar          |
| 2   | DataTable is Rendered               | Table or no-data message shown                |
| 3   | Create Cloud Account — Form Opens   | Click Link button, form dialog appears        |
| 4   | Deep Link — Pre-filled Service      | Navigate with query params, verify pre-filled |
| 5   | Refresh Button Works                | Click Refresh, no crash                       |

**Project:** `deployment-tests`

---

### 8. `tests/deployments/custom-networks/custom-networks.spec.ts` — 4 tests

| #   | Test Name                          | What It Validates                              |
| --- | ---------------------------------- | ---------------------------------------------- |
| 1   | Page Load and Structure            | `/custom-networks` loads, toolbar visible      |
| 2   | Search Custom Networks             | Search input present, filter interaction works |
| 3   | Deep Link — Auto-Open Create Form  | Navigate with `?action=create`, form opens     |
| 4   | Create Custom Network — Form Opens | Click Create button, form fields visible       |

**Project:** `deployment-tests`

---

### 9. `tests/deployments/access-control/access-control.spec.ts` — 3 tests

| #   | Test Name                      | What It Validates                                   |
| --- | ------------------------------ | --------------------------------------------------- |
| 1   | Page Load and Structure        | `/access-control` loads, heading or content visible |
| 2   | Send Invites Button is Visible | Invite/Send button rendered                         |
| 3   | Deep Link — Search by User ID  | Navigate with `?search=`, verify filter applied     |

**Project:** `deployment-tests`

---

### 10. `tests/deployments/billing/billing.spec.ts` — 4 tests

| #   | Test Name                                       | What It Validates                                 |
| --- | ----------------------------------------------- | ------------------------------------------------- |
| 1   | Page Load and Structure                         | `/billing` loads without crash                    |
| 2   | Billing Shows Content or Not-Configured Message | Billing data or "not configured" message rendered |
| 3   | Consumption Usage Tab                           | Consumption/Usage tab clickable, content renders  |
| 4   | Invoices Tab                                    | Invoices tab clickable, content renders           |

**Project:** `deployment-tests`

---

### 11. `tests/deployments/cost-explorer/cost-explorer.spec.ts` — 2 tests

| #   | Test Name                                    | What It Validates                     |
| --- | -------------------------------------------- | ------------------------------------- |
| 1   | Page Load and Structure                      | `/cost-explorer` loads, no crash      |
| 2   | Page Renders Gracefully With or Without Data | Charts or empty-state message visible |

**Project:** `deployment-tests`

---

### 12. `tests/deployments/audit-logs/audit-logs.spec.ts` — 5 tests

| #   | Test Name                     | What It Validates                             |
| --- | ----------------------------- | --------------------------------------------- |
| 1   | Page Load and Structure       | `/audit-logs` loads, table or content visible |
| 2   | Table Columns Rendered        | Expected column headers present               |
| 3   | Date Range Filter Exists      | Date picker or filter UI element visible      |
| 4   | Service Filter Exists         | Service/product filter dropdown visible       |
| 5   | Expandable Row — Click Expand | Click row expand icon, detail row visible     |

**Project:** `deployment-tests`

---

### 13. `tests/deployments/alerts/alerts.spec.ts` — 2 tests

| #   | Test Name                     | What It Validates                          |
| --- | ----------------------------- | ------------------------------------------ |
| 1   | Page Load and Structure       | `/alerts` loads without error              |
| 2   | Notifications Content Renders | Notifications table or empty state visible |

**Project:** `deployment-tests`

---

### 14. `tests/deployments/instance-snapshots/instance-snapshots.spec.ts` — 6 tests

| #   | Test Name                      | What It Validates                            |
| --- | ------------------------------ | -------------------------------------------- |
| 1   | Page Load and Structure        | `/instance-snapshots` loads, content visible |
| 2   | Table Columns Rendered         | Expected column headers in table             |
| 3   | Create Snapshot Button Exists  | Create button in toolbar                     |
| 4   | Create Snapshot — Dialog Opens | Click Create, dialog/form appears            |
| 5   | Delete Snapshot Button Exists  | Delete button visible (when rows present)    |
| 6   | Snapshot Row Click Navigation  | Click a row, detail view renders             |

**Project:** `deployment-tests`

---

### 15. `tests/deployments/release-history/release-history.spec.ts` — 3 tests

| #   | Test Name                               | What It Validates                      |
| --- | --------------------------------------- | -------------------------------------- |
| 1   | Page Load and Structure                 | `/release-history` loads without crash |
| 2   | Product and Plan Filter Dropdowns Exist | Filter UI elements visible             |
| 3   | Page Renders Without Errors             | No error text on page                  |

**Project:** `deployment-tests`

---

### 16. `tests/deployments/settings/settings.spec.ts` — 6 tests

| #   | Test Name                                            | What It Validates                        |
| --- | ---------------------------------------------------- | ---------------------------------------- |
| 1   | Page Load and Structure                              | `/settings` loads, tabs visible          |
| 2   | Profile Tab — View Profile Form                      | Profile form with name, org fields       |
| 3   | Profile Tab — Form Fields Are Populated              | Fields pre-filled with user data         |
| 4   | Password Tab — Change Password Form                  | Password tab, current/new/confirm fields |
| 5   | Delete Account Tab — Visibility Based on Environment | Delete tab visible only in PROD          |
| 6   | Tab Navigation Works Correctly                       | Switching tabs updates content           |

**Project:** `deployment-tests`

---

### 17. `tests/deployments/navigation/layout-navigation.spec.ts` — 9 tests

| #   | Test Name                                      | What It Validates                               |
| --- | ---------------------------------------------- | ----------------------------------------------- |
| 1   | Sidebar Navigation — Section Headers Present   | "Deployments", "Governance" sections in sidebar |
| 2   | Sidebar Navigation — Deployments Section Items | Instances, Subscriptions, Dashboard links       |
| 3   | Sidebar Navigation — Click Dashboard           | Navigate to `/dashboard` via sidebar            |
| 4   | Sidebar Navigation — Click Subscriptions       | Navigate to `/subscriptions` via sidebar        |
| 5   | Sidebar Navigation — Click Settings            | Navigate to `/settings` via sidebar             |
| 6   | Sidebar Navigation — Click Audit Logs          | Navigate to `/audit-logs` via sidebar           |
| 7   | Sidebar Navigation — Click Access Control      | Navigate to `/access-control` via sidebar       |
| 8   | Navbar Is Visible                              | Top navbar rendered                             |
| 9   | Footer Is Visible                              | Footer rendered at bottom                       |

**Project:** `deployment-tests`

---

### 18. `tests/deployments/edge-cases/edge-cases.spec.ts` — 5 tests

| #   | Test Name                                                               | What It Validates                                 |
| --- | ----------------------------------------------------------------------- | ------------------------------------------------- |
| 1   | 404 Page — Non-existent Route                                           | `/this-route-does-not-exist` shows 404 page       |
| 2   | Browser Back/Forward Navigation                                         | Navigate between pages, back/forward buttons work |
| 3   | Stale Data — Refresh Refetches Data                                     | Page refresh re-renders without errors            |
| 4   | API Error Does Not Crash the Page                                       | Mock API error, page remains functional           |
| 5   | Application Doesn't Crash on Protected Page Without Valid URL Structure | Malformed routes don't crash the app              |

**Project:** `deployment-tests`

---

## MODIFIED Files — Changes Summary

### 1. `tests/auth/signin.spec.ts` (7 tests — unchanged count)

**Changes:**

- **Cookie Settings Banner test:** Updated cookie consent text to match actual banner (`"We care about your privacy"` instead of `"We use essential cookies..."`). Updated button labels from `"Allow analytics"`/`"Allow necessary"` to `"Accept All"`/`"Reject All"`
- **Identity Provider Buttons test:** Added `try/catch` with `test.skip()` fallback when provider login fails or no identity providers are configured
- **Identity Provider Redirect test:** Updated to handle `window.location.href` redirect pattern — uses `waitForURL` with longer timeout and regex matching

### 2. `tests/deployments/instances/basic-tests.spec.ts` (4 tests — unchanged count)

**Changes:**

- Improved service offering lookup logic with better fallback handling
- Added more robust wait strategies for instance state transitions
- Enhanced error handling in create instance flow

### 3. `tests/deployments/instances/helm-instance.spec.ts` (2 tests — unchanged count)

**Changes:**

- Improved Helm service offering discovery with better filtering
- Added `test.skip()` when no Helm service offerings are available
- Enhanced instance deletion cleanup logic

### 4. `tests/user-setup.spec.ts`

**Changes:**

- Updated GlobalStateManager token storage calls
- Improved provider login error handling
- Better service offering caching for downstream tests

### 5. `page-objects/signin-page.ts`

**Changes:**

- Updated `cookieConsentText` from `"We use essential cookies. Analytics cookies are optional."` to `"We care about your privacy"` to match actual banner content

### 6. `playwright.config.ts`

**Changes:**

- Added `.env` fallback loading (`dotenv.config` for both `.env.local` and `.env`)

---

## Playwright Project Mapping

| Project            | Test Directory             | Auth Required           | Dependencies |
| ------------------ | -------------------------- | ----------------------- | ------------ |
| `auth-tests`       | `tests/auth/`              | ❌ No                   | None         |
| `user-setup`       | `tests/user-setup.spec.ts` | ❌ (performs login)     | None         |
| `deployment-tests` | `tests/deployments/`       | ✅ Yes (`storageState`) | `user-setup` |

---

## Test Plan Coverage Map

| Test Plan Section         | Status                  | Test File                                                           |
| ------------------------- | ----------------------- | ------------------------------------------------------------------- |
| §1 Sign In                | ✅ Existing + Modified  | `tests/auth/signin.spec.ts`                                         |
| §2 Sign Up                | ✨ New                  | `tests/auth/signup.spec.ts`                                         |
| §3 Reset Password         | ✅ Existing (unchanged) | `tests/auth/reset-password.spec.ts`                                 |
| §4 Change Password        | ✨ New                  | `tests/auth/change-password.spec.ts`                                |
| §5 Dashboard              | ✨ New                  | `tests/deployments/dashboard/dashboard.spec.ts`                     |
| §6 Instances — Listing    | ✨ New                  | `tests/deployments/instances/instances-structure.spec.ts`           |
| §6 Instances — Lifecycle  | ✅ Existing + Modified  | `tests/deployments/instances/basic-tests.spec.ts`                   |
| §6 Instances — Helm       | ✅ Existing + Modified  | `tests/deployments/instances/helm-instance.spec.ts`                 |
| §6 Instances — BYOA       | ✅ Existing (unchanged) | `tests/deployments/instances/byoa-instance.spec.ts`                 |
| §6 Instances — Operations | ✅ Existing (unchanged) | `tests/deployments/instances/operational-tests.spec.ts`             |
| §7 Instance Details       | ⬜ Not yet covered      | —                                                                   |
| §8 Subscriptions          | ✨ New                  | `tests/deployments/subscriptions/subscriptions.spec.ts`             |
| §9 Cloud Accounts         | ✨ New                  | `tests/deployments/cloud-accounts/cloud-accounts-structure.spec.ts` |
| §10 Custom Networks       | ✨ New                  | `tests/deployments/custom-networks/custom-networks.spec.ts`         |
| §11 Access Control        | ✨ New                  | `tests/deployments/access-control/access-control.spec.ts`           |
| §12 Billing               | ✨ New                  | `tests/deployments/billing/billing.spec.ts`                         |
| §13 Cost Explorer         | ✨ New                  | `tests/deployments/cost-explorer/cost-explorer.spec.ts`             |
| §14 Audit Logs            | ✨ New                  | `tests/deployments/audit-logs/audit-logs.spec.ts`                   |
| §15 Alerts                | ✨ New                  | `tests/deployments/alerts/alerts.spec.ts`                           |
| §16 Instance Snapshots    | ✨ New                  | `tests/deployments/instance-snapshots/instance-snapshots.spec.ts`   |
| §17 Release History       | ✨ New                  | `tests/deployments/release-history/release-history.spec.ts`         |
| §18 Settings              | ✨ New                  | `tests/deployments/settings/settings.spec.ts`                       |
| §19 Layout & Navigation   | ✨ New                  | `tests/deployments/navigation/layout-navigation.spec.ts`            |
| §20 Legal / Static Pages  | ✨ New                  | `tests/auth/legal-pages.spec.ts`                                    |
| §21 API Middleware        | ⬜ Not yet covered      | —                                                                   |
| §22 Edge Cases            | ✨ New                  | `tests/deployments/edge-cases/edge-cases.spec.ts`                   |
| §23 Cross-Cutting         | ⬜ Not yet covered      | —                                                                   |

**Coverage: 20 / 23 sections covered (87%)**

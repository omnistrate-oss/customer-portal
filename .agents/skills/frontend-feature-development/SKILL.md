---
name: frontend-feature-development
description: Use when building, changing or reviewing a customer portal feature end to end — a new page or route under app/(dashboard) or app/(public), a component, hook or backend call for an existing page, where a file goes, import paths and aliases, API types, RBAC-gated actions, success and error messages, provider branding (white-label), or preparing a pull request. Start here; it links to the ui-and-styling, forms, data-fetching, icons and playwright-tests skills.
---

# Frontend feature development

The customer portal is a white-label, self-hostable app. SaaS providers deploy it, often from a fork, for their own customers, so every screen an end customer sees is branded as the provider. Keep that in mind for every string, color and link.

Stack: Next.js 16 App Router (plus `pages/api` routes), React 19, MUI 5, TanStack Query 5 through `openapi-react-query`, Formik 2 with Yup 0.32, Tailwind CSS 3, Playwright with HAR record/replay. `tsconfig.json` sets `strict: false` with `strictNullChecks: true`.

Related skills: `.agents/skills/ui-and-styling/SKILL.md`, `.agents/skills/forms/SKILL.md`, `.agents/skills/data-fetching/SKILL.md`, `.agents/skills/icons/SKILL.md`, `.agents/skills/playwright-tests/SKILL.md`. Lint guardrails are named in brackets, for example `[no-axios]`; the message of a failing lint rule starts with that name.

## 1. Start from a route that already works

Read the closest existing route end to end before writing code. Copy its structure, not its legacy parts.

| Route                                 | Read it for                                                                                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/(dashboard)/custom-networks/`    | `DataTable` with a header component, create/modify form in `FullScreenDrawer`, `$api` mutations, type-to-confirm delete, buttons disabled with a reason |
| `app/(dashboard)/instance-snapshots/` | List plus detail route (`[snapshotId]/page.tsx`), `$api` for every query and mutation, `ConfirmationDialog`, `TextConfirmationDialog`                   |
| `app/(dashboard)/access-control/`     | RBAC with `isOperationAllowedByRBAC` and `disabledMessage`, Yup schema in `utils.ts`, `$api` hooks in `hooks/`                                          |

Do not copy these legacy parts even from good routes: the axios call `deleteCustomNetwork` from `src/api/customNetworks.ts`, hex colors such as `border-[#EAECF0]`, and raw MUI `CircularProgress`.

## 2. Where code goes

| Path                             | What lives there                                                                                                                                     |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/(dashboard)/<route>/`       | A signed-in page: `page.tsx` plus route-only `components/`, `hooks/`, `utils.ts` (or `utils/`), `constants.tsx`, `types.ts`                          |
| `app/(dashboard)/components/`    | Dashboard pieces shared by several routes: `Layout/` (`PageContainer`, `PageTitle`, `Navbar`, `Sidebar`), `FullScreenDrawer/`, `CloudProviderRadio/` |
| `app/(public)/`                  | Signed-out pages: sign in, sign up, reset and change password, token validation, policy pages                                                        |
| `src/components/`                | Shared UI library: `Button`, `Typography`, `FormElementsv2`, `DataTable`, dialogs, chips                                                             |
| `components/` (repo root)        | Three files only: `components/ActionMenu.tsx`, `components/GlobalProviderError.tsx`, `components/ui/chart.tsx`                                       |
| `src/hooks/`, `src/hooks/query/` | Hooks shared across routes (`useSnackbar`, `useEnvironmentType`, `useSubscriptions`)                                                                 |
| `src/api/`                       | `$api` (`src/api/query.ts`), the fetch client (`src/api/client.ts`), legacy axios wrappers                                                           |
| `src/types/`                     | Generated `src/types/schema.ts` plus per-feature type aliases                                                                                        |
| `src/utils/`                     | Helpers: `src/utils/routes.ts`, RBAC, `src/utils/getSafeExternalURL.ts`, formatting                                                                  |
| `src/constants/`                 | App constants: `src/constants/pageTitleMap.ts`, `src/constants/testIds/`, status chip palettes                                                       |
| `src/providers/`, `src/context/` | App-wide context: provider org details, global data, error handlers, environment type                                                                |
| `src/server/`                    | Server-only code for API routes, server components and `server.js`; never import it from a `"use client"` file                                       |
| `pages/api/`                     | Next.js API routes only (backend for frontend); there are no UI pages under `pages/`                                                                 |
| `lib/utils.ts`                   | `cn()` (clsx plus tailwind-merge)                                                                                                                    |
| `constants/` (repo root)         | YAML service templates for the Playwright setup, not app constants                                                                                   |
| `styles/`                        | MUI theme (`styles/theme.js`) and global CSS                                                                                                         |

- Put code in the route folder first. Move it to `app/(dashboard)/components/` when a second route needs it, and to `src/components/` only when it is a generic UI building block.
- Every dashboard page is a client component (`"use client"`). Only `app/layout.tsx`, `app/(dashboard)/layout.tsx` and the sign-in, sign-up and reset-password pages render on the server.
- `app/(dashboard)/layout.tsx` already renders `Navbar`, `Sidebar`, `Footer` and `GlobalDataProvider`. A page renders `PageContainer`, `PageTitle` and its content.
- `useGlobalData()` (`src/providers/GlobalDataProvider.tsx`) already holds subscriptions, subscription requests and service offerings. Read them from there instead of fetching them again.

## 3. Import paths and the alias trap

| Import prefix         | Resolves to        | Use it for                                                           |
| --------------------- | ------------------ | -------------------------------------------------------------------- |
| `src/<path>`          | `src/`             | Everything under `src/`; the most common form (about 1,500 imports)  |
| `components/<path>`   | `src/components/`  | Same files as `src/components/<path>`; 274 imports use this form     |
| `@/components/<path>` | root `components/` | Only `ActionMenu`, `GlobalProviderError` and `ui/chart`              |
| `app/<path>`          | `app/`             | Importing from a route folder, for example a hook another route owns |
| `lib/<path>`          | `lib/`             | `cn()`                                                               |
| `constants/<path>`    | root `constants/`  | YAML templates only; app constants are `src/constants/<path>`        |
| `public/<path>`       | `public/`          | Static images                                                        |

The trap: `components/<path>` and `@/components/<path>` point at different folders, and `constants/<path>` is not `src/constants/`.

```ts
import Button from "components/Button/Button"; // src/components/Button/Button.jsx
import ActionMenu from "@/components/ActionMenu"; // components/ActionMenu.tsx at the repo root
import ActionMenu from "components/ActionMenu"; // fails: there is no src/components/ActionMenu
import Button from "@/components/Button/Button"; // fails: there is no root components/Button
import { PAGE_TITLE_MAP } from "constants/pageTitleMap"; // fails: root constants/ only holds YAML templates
```

Write new imports as `src/<path>`; it cannot be misread. The `hooks/*` and `utils/*` aliases exist in `tsconfig.json` but nothing uses them. Production code must not import from `tests/`, `test-fixtures/`, `test-utils/` or `page-objects/` (lint error); shared test IDs live in `src/constants/testIds/`.

## 4. Types: generated schema, then `src/types/`, then feature code

- `src/types/schema.ts` is the only generated schema (about 113,000 lines, built from the external API spec by `yarn update-api-types`). There is no internal schema. Never edit it by hand.
- Regenerated API types go in their own pull request. If your endpoint is missing from the schema, stop and ask for that separate PR instead of regenerating inside a feature PR.
- Feature code imports aliases from `src/types/<feature>.ts`, never from the schema:

```ts
// src/types/customNetwork.ts
import type { components, paths } from "./schema";

export type CustomNetwork = components["schemas"]["CustomNetwork"];
export type ListCustomNetworksSuccessResponse =
  paths["/2022-09-01-00/resource-instance/custom-network"]["get"]["responses"]["200"]["content"]["application/json"];
```

- Refine a loose field with `Omit<Base, "field"> & { field: Narrower }` instead of redeclaring the whole shape.
- Route-only types (props, form values, tab names) go in the route's `types.ts`.
- `src/api/client.ts` is the one file that needs `paths` directly; three other files import the schema today. Do not add more.

## 5. Checklists for common changes

New signed-in page:

1. Create `app/(dashboard)/<route>/page.tsx` with `PageContainer` and `PageTitle`. Take the title icon from `src/icons` (see `.agents/skills/icons/SKILL.md`).
2. Add a getter to `src/utils/routes.ts` and use it everywhere instead of string paths.
3. Add the path to `PAGE_TITLE_MAP` in `src/constants/pageTitleMap.ts`, built with a getter from `src/utils/routes.ts`. The map sets the browser tab title and is the allowlist for post-sign-in redirects (`proxy.js`, `src/utils/route/checkRouteValidity.ts`). The Alerts entry uses the legacy getter from `src/utils/route/access/accessRoute.js` and produces a wrong key; do not copy it.
4. Add a menu entry in `app/(dashboard)/components/Layout/Sidebar.tsx` if customers reach the page from the sidebar.
5. Leave `proxy.js` alone. Its matcher already requires a valid session on every path it does not exclude.
6. Add Playwright coverage (`.agents/skills/playwright-tests/SKILL.md`).

New backend call:

1. Use `$api` (`.agents/skills/data-fetching/SKILL.md`).
2. Add the method and path to `src/server/utils/allowedRoutes.ts`. The `/api/action` proxy answers 403 "Forbidden" for anything not listed.
3. Import request and response types from `src/types/<feature>.ts`.

## 6. Permissions (RBAC): disable with a reason, never hide

| Helper                                                                                                         | Use                                                               |
| -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `getEnumFromUserRoleString(subscription?.roleType)` from `src/utils/isAllowedByRBAC.js`                        | Converts the subscription role string to a role enum              |
| `isOperationAllowedByRBAC(operationEnum.X, role, viewEnum.Y, { consumptionSubscriptionAdminRBAC })`            | Whether the role may perform the operation                        |
| `isSubscriptionWriteRole`, `isManageableSubscriptionRole` from `src/utils/consumptionSubscriptionAdminRBAC.ts` | Subscription-level write and manage checks                        |
| `useFeatureFlags()` from `src/hooks/useFeatureFlags.ts`                                                        | Provider feature flags such as `consumptionSubscriptionAdminRBAC` |

Render the action disabled and say why:

```tsx
const role = getEnumFromUserRoleString(subscription?.roleType);
const canDelete = isOperationAllowedByRBAC(operationEnum.Delete, role, viewEnum.Access_Resources);

<Button
  variant="outlined"
  disabled={!instance || !canDelete}
  disabledMessage={!instance ? "Please select an instance" : !canDelete ? "Unauthorized to delete instances" : ""}
  onClick={openDeleteDialog}
>
  Delete
</Button>;
```

- `Button` wraps a disabled button in a `Tooltip` when `disabledMessage` is set. `ActionMenu` items take `isDisabled` and `disabledMessage`. Examples: `app/(dashboard)/instances/components/InstanceActionMenu.tsx`, `app/(dashboard)/access-control/page.tsx`.
- Hide only what the provider has not enabled for anyone (the sidebar hides Billing when billing is off). A permission gap is always a disabled control with a reason.
- The backend enforces permissions. The UI check exists so customers understand why they cannot act.

## 7. Success and error messages

How errors reach customers today:

- Every `$api` request goes through `src/api/client.ts`. A 401, or a 400 saying the token is missing, triggers one silent refresh through `/api/refresh-token` and a retry; if that fails the user is signed out. Never handle 401 in feature code.
- Any other 4xx or 5xx opens the global error snackbar (`src/providers/GlobalErrorHandler.tsx`) with the backend's `message` field, or "Something went wrong please try again later". Legacy axios calls get the same from `src/providers/AxiosGlobalErrorHandler.tsx`.
- To handle a failure yourself, send the `x-ignore-global-error` header on that request and show your own copy.

Rules:

- Success: `const snackbar = useSnackbar();` from `src/hooks/useSnackbar.js`, then `snackbar.showSuccess("Customer Network created successfully")` in the mutation's `onSuccess`.
- Copy you write is fixed, friendly text. Never put `error.message`, `String(error)`, `error.response.data`, status codes, JSON, stack traces or request IDs into JSX, dialogs or snackbar text.
- There is no error sanitizer in this repo. To reword known backend messages, map them to copy with a generic default, as `app/(dashboard)/billing/utils/getBillingDetailsErrorMessage.ts` does.
- Send customers to the provider's support address, `orgSupportEmail` from `useProviderOrgDetails()` (see `app/error.tsx`), never to a hard-coded address.

## 8. White-label rules

No lint rule checks branding; reviewers do.

| Do                                                                                                                                                                             | Don't                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Show the provider's name, logo and support email from `useProviderOrgDetails()` in `src/providers/ProviderOrgDetailsProvider.tsx` (`orgName`, `orgLogoURL`, `orgSupportEmail`) | Write "Omnistrate", "SaaS Builder" or any vendor name in customer-facing text, titles, alt text or emails |
| Take colors from the theme and tokens (`.agents/skills/ui-and-styling/SKILL.md`)                                                                                               | Hard-code a brand hex such as `#5925DC` or `#7F56D9`                                                      |
| Pass provider or backend URLs through `getSafeExternalURL` (`src/utils/getSafeExternalURL.ts`); it returns `""` unless the URL is https (http is allowed outside production)   | Put raw API values into `href`, `src` or an iframe                                                        |
| Sanitize provider or backend HTML with `DOMPurify.sanitize` from `isomorphic-dompurify` before `dangerouslySetInnerHTML`                                                       | Render backend HTML as-is                                                                                 |
| Leave third-party scripts, SDKs and the CSP in `next.config.js` alone unless a maintainer asked                                                                                | Add analytics, chat or tracking code; every fork inherits it                                              |

Known exceptions, not patterns: the default `metadata` title in `app/layout.tsx`, and the non-production sign-in help in `app/(public)/(main-image)/signin/components/NonProdLoginInstructions.tsx`, which only the provider's own team sees.

Customer-facing vocabulary (from `src/constants/pageTitleMap.ts` and the sidebar):

| Use                                                                                              | Notes                                                                 |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Instances, Instance Snapshots, Customer Networks, Cloud Accounts                                 | "Deployments" menu; the Customer Networks route is `/custom-networks` |
| Access Control, Audit Logs, Alerts                                                               | "Governance Hub" menu                                                 |
| Settings (tab title "Profile Settings"), Billing, Payment Settings, Cost Explorer, Subscriptions | "Account Management" menu                                             |
| Dashboard, Release History                                                                       | Top level                                                             |
| Product, Subscription Plan (or Plan), Subscription, Instance                                     | Labels and columns, for example "Product Name", "Instance ID"         |

## 9. Security basics

- Auth tokens live in httpOnly cookies that the `pages/api` auth routes set. Browser code never reads, stores or logs a token. `omnistrate_logged_in` is the only auth cookie client code may read, and only as a signed-in hint.
- Never write tokens, credentials, payment data or personal data to `localStorage`, `sessionStorage` or a query string.
- Validate redirect targets with `checkRouteValidity` from `src/utils/route/checkRouteValidity.ts`; never `router.push` a query parameter as-is.
- A new `pages/api/` route that uses the provider's credentials must first check the customer's own session and access, as `pages/api/product-tier-custom-metrics.ts` does.

## 10. What lint and CI check

The Verify workflow (`.github/workflows/verify.yml`) runs `yarn lint`, `yarn typecheck`, `yarn check:guardrails` and `yarn check:playwright-discovery` on every pull request. ESLint is configured in `.eslintrc.cjs`.

| Rules                                                                                                                                                                                        | What they stop                                                                                                                                               | Details in       |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| `[no-raw-mui]`, `react/forbid-elements`                                                                                                                                                      | Raw MUI components that have a wrapper; raw `button`, `select`, `input`, `textarea` and `table` outside `src/components/` and root `components/`             | ui-and-styling   |
| `[no-hex-colors]`, `[no-text-font-override]`, `[no-css-modules]`, `[no-auth-shell-components]`                                                                                               | Hex colors, `Text` font overrides, CSS modules, `NonDashboardComponents` outside `app/(public)/` and `app/not-found.tsx`                                     | ui-and-styling   |
| `[no-react-icons]`                                                                                                                                                                           | `react-icons` imports (the guardrail script also rejects new files in `src/components/Icons/`)                                                               | icons            |
| `[no-axios]`, `[no-raw-fetch]`, `[no-mutate-in-effect]`, `react-hooks/set-state-in-effect`                                                                                                   | Legacy transports, `fetch` outside `src/api/` and `pages/api/`, writes and state syncing from effects                                                        | data-fetching    |
| `[formik-requires-yup]`                                                                                                                                                                      | Formik forms without a Yup schema                                                                                                                            | forms            |
| `[no-focused-tests]`, `[no-wait-for-timeout]`, `[no-playwright-test-import]`                                                                                                                 | `.only`, fixed sleeps, specs that bypass the HAR fixture                                                                                                     | playwright-tests |
| `react/jsx-no-leaked-render`, `react/function-component-definition`, `react/no-danger`, `@typescript-eslint/consistent-type-definitions`, `@typescript-eslint/no-explicit-any`, `no-console` | `&&` with non-booleans, non-arrow components, unreviewed HTML injection, `interface` instead of `type`, `any`, `console` calls other than `warn` and `error` | ui-and-styling   |

`yarn check:guardrails --base origin/master` also fails when a backticked repo path in these guides does not exist, an allowlist in `eslint.migration-allowlists.cjs` grows, a change adds an `eslint-disable` for a guarded rule, a changed file is not Prettier-formatted, or agent and IDE artifacts are committed. Format only the files you changed (`yarn prettier --write <files>`).

## 11. Pull request checklist

- [ ] One concern per PR: no regenerated `src/types/schema.ts`, no drive-by refactors, no formatting of files you did not change.
- [ ] Started from an existing route; reused `src/components/` wrappers instead of adding a near-duplicate.
- [ ] Backend calls use `$api`; new endpoints are in `src/server/utils/allowedRoutes.ts`; types come from `src/types/`.
- [ ] Customer-facing text uses the provider's branding and the vocabulary above, and never shows raw error text.
- [ ] Permission-restricted actions are disabled with a `disabledMessage`, not hidden.
- [ ] No hex colors, no Tailwind arbitrary hex, no `fontSize`, `fontWeight` or `lineHeight` overrides on `Text`.
- [ ] Playwright coverage for the new behavior, with HAR files recorded and the `tests/fixtures/hars` pointer bumped.
- [ ] `yarn lint`, `yarn typecheck`, `yarn check:guardrails --base origin/master`, `yarn check:playwright-discovery` and `yarn build` pass.
- [ ] Before and after screenshots for UI changes.
- [ ] No new entries in `eslint.migration-allowlists.cjs` and no `eslint-disable` for a guardrail rule. When you fix an allowlisted file, delete its entry.

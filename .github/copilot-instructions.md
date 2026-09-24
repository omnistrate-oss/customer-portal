# Code review instructions: Customer Portal

You are reviewing pull requests for the customer portal: a white-label, self-hostable Next.js 16 App Router app (React 19, MUI 5, TypeScript, TanStack Query through `openapi-react-query`, Formik + Yup, Playwright with HAR replay). SaaS providers deploy it, often from a fork, for their own customers, so every screen carries the provider's brand. Many pull requests are written with AI coding agents that rebuild what the repository already has, so hold every change to the patterns below. The authoring guidance is `AGENTS.md` plus `.agents/skills/`; this file is the review checklist, and `.github/instructions/` has path-specific ones. The organization's security checklist at the end applies as well.

## How to review

- Put correctness and customer impact first, then the checks below.
- Label every comment **Blocker** (security, data loss, broken behavior, a bypassed guardrail, a white-label leak), **Should fix** or **Nit**.
- Be concrete: the file and line, the fix, and the existing component or helper to use, by path.
- Comment once per problem and list the other places it occurs.
- Don't flag existing problems in lines the pull request didn't touch, unless it makes them worse.
- Read the description against the diff. Flag claims the diff contradicts, leftover agent-session text, and missing before/after screenshots for visible UI changes.

## Already enforced by lint and CI

The Verify workflow runs `yarn lint`, `yarn typecheck`, `yarn check:guardrails` and `yarn check:playwright-discovery`. Lint messages start with the guardrail name. Don't restate lint errors. Do flag any attempt to get around them: a new entry in `eslint.migration-allowlists.cjs`, an `eslint-disable` for a guarded rule, `// @ts-ignore` or `as unknown as` to silence a type error, `void someVar;` to silence the unused-variable rule, or a file renamed or moved to dodge a check. Each of these is a **Blocker**.

- **Components and styling:**
  - `[no-raw-mui]`: raw MUI where a wrapper exists
  - `react/forbid-elements`: raw `button`, `select`, `input`, `textarea`, `table`
  - `[no-hex-colors]`, `[no-css-modules]`
  - `[no-text-font-override]`
  - `[no-react-icons]`
  - `[no-auth-shell-components]`: `NonDashboardComponents` outside `app/(public)/`
- **Data:**
  - `[no-axios]`: new axios imports
  - `[no-raw-fetch]`: `fetch` outside `src/api/` and `pages/api/`
  - `[no-mutate-in-effect]`, `react-hooks/set-state-in-effect`
- **Forms and TypeScript:**
  - `[formik-requires-yup]`, `@typescript-eslint/no-explicit-any`
  - `@typescript-eslint/consistent-type-definitions`, `react/function-component-definition`
  - `react/jsx-no-leaked-render`, `no-console`, `react/no-danger`
- **Tests:**
  - `[no-focused-tests]`, `[no-wait-for-timeout]`, `[no-playwright-test-import]`
  - every spec runs in the Playwright project
- **Hygiene:** changed files are Prettier-formatted, and no agent or IDE artifacts are committed.

## White-label

These leaks ship to every provider's customers. Label them **Blocker**.

- **Vendor names:** "Omnistrate", "SaaS Builder" or any vendor name in customer-facing text, page titles, alt text, emails or error messages. The provider's name, logo and support email come from `useProviderOrgDetails()` (`src/providers/ProviderOrgDetailsProvider.tsx`).
- **Brand colors:** a hard-coded brand or accent color, such as a literal purple or a Tailwind arbitrary value like `border-[#EAECF0]`, instead of `theme.palette.primary` and the tokens in `src/themeConfig.ts`. Also flag third-party widgets (payment forms, charts) configured with literal brand colors.
- **Support contacts:** a hard-coded support address or URL instead of the provider's `orgSupportEmail`.
- **Third-party code:** new third-party scripts, SDKs, analytics or tracking. Every fork inherits them, so they need a maintainer's approval and a CSP review.

## Architecture and feature checks

Lint can't see these, so they need your judgment.

- **Hand-rolled replacements for shared components:**
  - tables and pagination instead of `DataTable` (`src/components/DataTable/DataTable`); new code doesn't use MUI `DataGrid`
  - dialogs instead of `TextConfirmationDialog` or `ConfirmationDialog`
  - drawers instead of `FullScreenDrawer` or `SideDrawerRight`
  - status pills instead of `StatusChip`
  - spinners instead of `LoadingSpinner` or the `CircularProgress` wrapper
  - banners, cards or text built from `Box` with font styles
  - a local copy of a shared component with small changes

  Name the component to use.
- **A parallel data layer:**
  - new axios wrappers or `fetch` helpers
  - hand-written query keys for `$api` hooks
  - hand-written API types that duplicate `src/types/schema.ts`
  - a new endpoint missing from `src/server/utils/allowedRoutes.ts` (the `/api/action` proxy answers 403)
- **Duplicated server state:** query data copied into state or context, derived values stored instead of computed, effects that sync props into state, and writes (mutations, default-setting calls) fired from render or effects instead of user actions.
- **Scope and size:**
  - a regenerated `src/types/schema.ts` mixed into a feature pull request (**Should fix**: split it)
  - unrelated refactors or reformatting
  - files over about 500 lines that should be split
- **Undeclared shared changes:** edits to `src/components/`, `src/api/`, `src/server/`, `pages/api/`, `proxy.js`, `next.config.js`, `tsconfig.json`, `package.json`, `.github/` or the `tests/fixtures/hars` pointer that the description doesn't mention.
- **Global side effects:** new queries or polling in the dashboard layout, `Navbar`, `Sidebar` or app-wide providers. `GlobalDataProvider` already loads subscriptions and service offerings.
- **Cross-route imports:** one route reaching into another route's internals. Shared code belongs in `app/(dashboard)/components/` or `src/`.
- **Import aliases:** `components/<path>` is `src/components/`; `@/components/<path>` is the root `components/` folder. Flag new imports that confuse the two, or that import app constants from the root `constants/` folder (Playwright YAML templates only).
- **RBAC:** new create, update, delete or control actions without `isOperationAllowedByRBAC`, and actions hidden instead of rendered disabled with a `disabledMessage`. The organization checklist below says the UI must "hide" actions the caller can't perform. In this repository that means the action must be unusable: disable it and show why, and hide only features the provider hasn't enabled for anyone.
- **Routes:**
  - string paths instead of a getter from `src/utils/routes.ts`
  - a new page missing from `PAGE_TITLE_MAP` in `src/constants/pageTitleMap.ts`, which is also the post-sign-in redirect allowlist
  - pages added under `pages/` (API routes only)
- **Server-only code:** `src/server/` imported from a `"use client"` file.
- **TypeScript quality:** `!` non-null assertions and casts that hide `undefined`, and props without types.
- **Icons:** feature-local SVG components, or SVGs in `public/` used as UI icons, instead of `src/icons/svg/` + `yarn icons:build`.

## Tests

- A new feature or behavior with no Playwright coverage, or only the happy path.
- Changed or added specs without a `tests/fixtures/hars` pointer bump to a commit that contains their HARs.
- A spec deleted or skipped with no reason in the description.

## Security and privacy

Flag these and explain the risk in one sentence. The organization checklist below adds more.

- **Error text:** raw backend messages, `error.message`, status codes, JSON or stack traces shown to customers. Error copy is fixed and friendly; known backend messages are mapped to copy with a generic default.
- **URLs:** provider or backend URLs used in `href`, `src` or an iframe without `getSafeExternalURL` (`src/utils/getSafeExternalURL.ts`), or redirects to a query parameter without `checkRouteValidity` (`src/utils/route/checkRouteValidity.ts`).
- **Tokens:** code that reads, stores or logs tokens. They live only in the httpOnly cookies that `pages/api` routes set.
- **New API routes:** a `pages/api/` route that acts with the provider's credentials without first checking the customer's own session and access.
- **Payment and personal data:** kept in state, storage, URLs or logs longer than the flow needs.

## Copy

- Fix grammar and spelling in customer-facing text. Flag confusing copy, and confirmation instructions that don't match the action.
- Use the portal's vocabulary from `src/constants/pageTitleMap.ts` and the sidebar, such as Instances, Customer Networks, Cloud Accounts, Subscriptions and Plan. Never use the SaaS provider's internal product terms.

<!-- security-checklist-managed -->

## Security Checklist

Apply this checklist to every code change. If a control is not applicable, briefly say why in the PR description.

### Authentication
- The browser is untrusted. Treat every value held in the client (user ID, org ID, role, feature flag) as a hint for UX only — the backend re-validates.
- Session tokens must be stored in `HttpOnly`, `SameSite=Lax` (or stricter) cookies, with `Secure` enabled in production or whenever the app is served over HTTPS. Do not put long-lived tokens in `localStorage` or `sessionStorage`.
- Never embed a long-lived API key, service account, or signing secret in client code or `NEXT_PUBLIC_*` env vars.
- Implement silent refresh through a server-side route, not by exposing refresh tokens to the browser.

### Authorization
- The UI must hide actions the caller cannot perform, but the server is the source of truth — never assume "if the button is hidden, the API is safe".
- Route guards (`proxy.js` via `export const config.matcher`, layouts) must enforce auth on every protected segment; default-deny for unknown roles.
- Cross-org / cross-instance navigation must re-fetch authorization context — do not reuse a previous tenant's permissions cache.

### Tenant Isolation
- The client may send tenant/resource identifiers for routing, but the **server must derive and enforce tenant membership from the authenticated session/token**. Never treat client-selected `orgID`/`instanceID` as proof of authorization.
- Caches (`SWR`, `react-query`, in-memory stores) must key on the active `orgID` so that switching tenants cannot leak data from a prior tenant.
- Avoid placing tenant-identifying data into `localStorage` keyed by a fixed name — namespace by tenant or clear on logout/switch.

### Input Validation & Output Encoding
- Validate forms on the client for UX, but treat server-side validation as authoritative.
- Never use `dangerouslySetInnerHTML` on untrusted input. If markdown rendering is required, sanitize with a vetted library (e.g., DOMPurify) and an allowlist.
- Escape values placed into URLs, query strings, and `href`/`src` attributes; reject `javascript:` / `data:` URIs from user input.
- Validate redirect targets against an allowlist before issuing a client-side or server-side redirect.

### CSRF & CORS
- State-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) must be protected by `SameSite` cookies and/or a CSRF token; never accept state changes via `GET`.
- Do not set `Access-Control-Allow-Origin: *` on any authenticated endpoint or proxy.

### Secrets Handling
- Differentiate `NEXT_PUBLIC_*` (shipped to browser) from server-only env vars. Anything secret must NOT be `NEXT_PUBLIC_*`.
- Never commit `.env*` files. Provide `.env.example` with placeholders only.
- Do not write secrets into HTML, JSON-LD, or inline `<script>` blobs.

### Logging Hygiene
- No `console.log` / `console.error` of tokens, full headers, full request bodies, or PII — neither in client code nor in server-side logs.
- Sanitize error messages shown to users; never surface raw stack traces, SQL errors, or upstream JSON to the UI.
- Telemetry events (analytics, RUM, error tracking) must scrub email, names, and free-text input before transmission.

### Dependencies
- Run `yarn npm audit` (or `yarn audit`, if that is the active workflow) on PRs that change `package.json`. Resolve high/critical findings or document the exception.
- Prefer first-party / well-maintained packages with TypeScript types. Justify any new dependency in the PR description.
- Pin GitHub Actions to commit SHAs, not tags.
- Review the bundle for unintentionally shipped server-only modules (e.g., `fs`, `crypto` polyfills pulling secrets-handling code into the client).

### Content Security
- The current CSP is already permissive in some places. Flag any change that further relaxes CSP, and prefer tightening directives over time — including reducing or removing `unsafe-inline` / `unsafe-eval` where feasible.
- Do not load untrusted third-party scripts. Any external script that must be loaded should be explicitly justified in the PR, reviewed for CSP impact, and use integrity protections such as SRI where applicable.

### What to do when unsure
- If a change introduces a new auth flow, a new cross-tenant boundary, a new HTML sink, or a new third-party domain, call it out explicitly in the PR description.
- Prefer adding a Playwright test that proves the security property (e.g., "user without role X cannot see element Y") over a comment claiming it.

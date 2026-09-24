# Customer Portal

Rules for everyone changing this repository, people and coding agents alike. This file stays short: the how-to lives in the skills listed below, and lint and CI enforce most rules. If this file and the code disagree, fix the file in the same pull request.

The portal is white-label and self-hostable. SaaS providers deploy it, often from a fork, for their own customers, so everything an end customer sees carries the provider's brand.

**Stack:** Next.js 16 App Router for the UI plus `pages/api` routes as the backend-for-frontend, React 19, MUI 5, TypeScript (`strictNullChecks`), TanStack Query 5 through `openapi-react-query`, Formik + Yup, Tailwind CSS in a few components, Playwright with HAR record/replay, Yarn 4. Install with `YARN_ENABLE_SCRIPTS=false yarn install` (see `README.md`). There is no unit-test runner.

## Non-negotiables

Lint messages start with the guardrail name, for example `[no-axios]`. Existing violations are grandfathered on shrink-only allowlists in `eslint.migration-allowlists.cjs`. New code must comply. Never add an allowlist entry or an `eslint-disable` for these rules: `yarn check:guardrails` rejects both in CI. If a rule blocks legitimate code, say so in the pull request instead.

1. **Shared components, not raw MUI or native elements.** Use the wrappers in `src/components/` (`[no-raw-mui]`, `react/forbid-elements`).
2. **Theme colors, never hex; no CSS modules.** The brand color comes only from `theme.palette.primary`, because each provider sets their own (`[no-hex-colors]`, `[no-css-modules]`).
3. **Typography from the `Text` scale.** Never override font size, weight or line height (`[no-text-font-override]`).
4. **Icons through `src/icons/`.** New SVGs go in `src/icons/svg/`, then run `yarn icons:build`. Add nothing to `src/components/Icons/`; no `react-icons` (`[no-react-icons]`, `check:guardrails`).
5. **API calls through `$api`** (`src/api/query.ts`), which goes through the `/api/action` proxy. Add every new method and path to `src/server/utils/allowedRoutes.ts`, or the proxy answers 403. axios is legacy: new code doesn't import it, and `fetch` belongs only in `src/api/` and `pages/api/` (`[no-axios]`, `[no-raw-fetch]`).
6. **Types flow from the generated schema.** `src/types/schema.ts` → `src/types/<feature>.ts` → feature code. Regenerate the schema in its own pull request.
7. **Server state stays in React Query.** Don't copy it into `useState` or context; no setState or mutations inside effects (`react-hooks/set-state-in-effect`, `[no-mutate-in-effect]`).
8. **Every Formik form has a Yup `validationSchema`** (`[formik-requires-yup]`).
9. **TypeScript:** no `any` (`@typescript-eslint/no-explicit-any`); `type` over `interface` (`@typescript-eslint/consistent-type-definitions`); arrow-function components (`react/function-component-definition`); explicit types for props, hooks and API data.
10. **The left side of a JSX `&&` is a boolean:** `{!!count && <X />}` (`react/jsx-no-leaked-render`).
11. **No `console.log`** (`no-console`). **No `dangerouslySetInnerHTML`** without `isomorphic-dompurify` (`react/no-danger`).
12. **White-label.** Never show "Omnistrate", "SaaS Builder" or another vendor name to end customers. Take the provider's name, logo and support email from `useProviderOrgDetails()` (review only; there is no lint rule).
13. **Permission-restricted actions are disabled with a reason** (`disabledMessage`), so they can't be used and the customer sees why. Never hide them, and never rely on a backend 403.
14. **Customers never see raw backend errors.** Show fixed, friendly copy.
15. **Tests that run:** Playwright specs import `test` and `expect` from `test-fixtures/har-test`, run in the project in `playwright.config.ts`, and ship with recorded HARs and a bumped `tests/fixtures/hars` pointer (`check:playwright-discovery`, test lint rules).
16. **Small pull requests with one concern.** Keep schema regeneration and unrelated refactors out of feature PRs. Call out changes to shared components, `src/api/`, `next.config.js`, `package.json` and workflows in the description.

## Where code goes

- A signed-in page is `app/(dashboard)/<route>/page.tsx`, with its route-only `components/`, `hooks/` and `utils.ts` next to it. Code shared by several routes goes in `app/(dashboard)/components/`; generic UI goes in `src/components/`.
- Signed-out pages live in `app/(public)/`. `pages/` holds only API routes, in `pages/api/`. Server-only code lives in `src/server/`; never import it from a `"use client"` file.
- **The alias trap:** `components/<path>` resolves to `src/components/`, while `@/components/<path>` resolves to the root `components/` folder, which has only three files. Root `constants/` holds Playwright YAML templates, not app constants (`src/constants/`). Write new imports as `src/<path>`.
- A new route needs a getter in `src/utils/routes.ts`, an entry in `PAGE_TITLE_MAP` in `src/constants/pageTitleMap.ts` (it is also the post-sign-in redirect allowlist) and, for the sidebar, `app/(dashboard)/components/Layout/Sidebar.tsx`.
- Test IDs live in `src/constants/testIds/`, page objects in `page-objects/`, and specs in `tests/`.

## Golden examples

Copy these before inventing anything, but not their legacy parts (axios calls, hex colors, raw MUI spinners):

- `app/(dashboard)/custom-networks/`: list, create and modify drawer, type-to-confirm delete, disabled buttons with reasons.
- `app/(dashboard)/instance-snapshots/`: list plus detail route, `$api` for every query and mutation.
- `app/(dashboard)/access-control/`: RBAC with `isOperationAllowedByRBAC` and `disabledMessage`, Yup schema in `utils.ts`.

## Skills

| When you are                                           | Read                                                   |
| ------------------------------------------------------ | ------------------------------------------------------ |
| building or changing a feature end to end              | `.agents/skills/frontend-feature-development/SKILL.md` |
| choosing components, colors, typography or layout      | `.agents/skills/ui-and-styling/SKILL.md`               |
| adding or changing an icon                             | `.agents/skills/icons/SKILL.md`                        |
| fetching or mutating data                              | `.agents/skills/data-fetching/SKILL.md`                |
| building a form                                        | `.agents/skills/forms/SKILL.md`                        |
| writing Playwright tests (reference: `tests/GUIDE.md`) | `.agents/skills/playwright-tests/SKILL.md`             |

## Definition of done

| Change                         | Also run or provide                                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Any                            | `yarn lint`, `yarn typecheck`, `yarn check:guardrails --base origin/master`, `yarn build`                                             |
| Visible UI                     | before/after screenshots in the pull request, after checking the page in a browser, including with a non-default provider brand color |
| Playwright                     | `yarn check:playwright-discovery`, `yarn record`, `yarn test:replay`, the `tests/fixtures/hars` pointer bump                          |
| Shared component or `src/api/` | a check of its main consumers, called out in the pull request                                                                         |

## Customer-facing vocabulary

Match the page titles in `src/constants/pageTitleMap.ts` and the sidebar: Dashboard, Instances, Instance Snapshots, Customer Networks, Cloud Accounts, Access Control, Audit Logs, Alerts, Subscriptions, Billing, Payment Settings, Cost Explorer, Release History, Profile Settings ("Settings" in the sidebar). In labels, say Product, Plan (or Subscription Plan), Subscription and Instance.

## Security and privacy

- **Auth:** tokens live in the httpOnly cookies `omnistrate_token` and `omnistrate_refresh_token`, which only the `pages/api` auth routes set (`src/server/utils/authCookieConstants.ts`; the refresh cookie lasts one day). Browser code never reads, stores or logs a token. `omnistrate_logged_in` is the only JavaScript-readable auth cookie: a signed-in hint the API client checks before protected requests. It never carries a secret.
- **Storage and URLs:** no tokens, credentials, payment data or personal data in `localStorage`, `sessionStorage`, query strings or logs.
- **External URLs:** pass provider or backend URLs through `getSafeExternalURL` (`src/utils/getSafeExternalURL.ts`) before using them in `href`, `src` or an iframe. It allows only https, plus http outside production.
- **Redirects:** check targets with `checkRouteValidity` (`src/utils/route/checkRouteValidity.ts`); never navigate to a query parameter as-is.
- **New `pages/api/` routes** that act with the provider's credentials must first check the customer's own session and access.
- **HTML:** sanitize with `isomorphic-dompurify` before `dangerouslySetInnerHTML`.
- **Dependencies and CSP:** new packages, SDKs, third-party scripts or CSP changes in `next.config.js` need a maintainer's review, because every fork inherits them. Install scripts stay disabled.

## Working agreements

- Asked a question or for a plan? Answer it. Don't edit code until you're told to implement.
- Stay inside the task: no drive-by refactors, and keep exported names and behavior stable unless the task changes them.
- Match the surrounding comment density. Write JSDoc only for exported hooks and utils whose behavior isn't obvious from the signature.
- `src/icons/` and `scripts/build-icons.mjs` are kept in sync with another codebase. Change them only through `yarn icons:build`, and mention any change to the generator in the pull request.
- When you learn something reusable, propose the guidance change in the pull request rather than editing guidance silently.

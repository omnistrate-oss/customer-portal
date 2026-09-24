---
name: data-fetching
description: Use when reading or writing backend data in the customer portal — calling an API endpoint, $api.useQuery, useMutation or queryOptions, the /api/action proxy and its endpoint allowlist, query keys, invalidateQueries or setQueryData, useQueries fan-out, polling, loading and error states, suppressing the global error snackbar, keeping server data out of useState or Redux, Next.js API routes under pages/api, or replacing legacy axios calls.
---

# Data fetching

All backend traffic from the browser goes through one typed client: `$api` from `src/api/query.ts`, which is `openapi-react-query` over the `openapi-fetch` client in `src/api/client.ts`, typed by `src/types/schema.ts`. No axios, no `fetch` in components, no new wrapper modules.

```ts
// src/api/query.ts
import createClient from "openapi-react-query";
import { apiClient } from "./client";

export const $api = createClient(apiClient);
```

Lint enforces part of this: `[no-axios]` (no new imports of `axios` or `src/axios`), `[no-raw-fetch]` (no `fetch()` outside `src/api/` and `pages/api/`), `[no-mutate-in-effect]`, and `react-hooks/set-state-in-effect`. Older files that break these rules are listed in `eslint.migration-allowlists.cjs`; never add an entry or an `eslint-disable`.

## 1. How a request travels

```text
component ── $api.useQuery("get", "/2022-09-01-00/subscription", …)
   │  openapi-fetch middleware in src/api/client.ts
   ▼
POST /api/action?endpoint=/2022-09-01-00/subscription
     body: { endpoint, method: "GET", data?, queryParams? }
   │  pages/api/action.js (Next.js API route on the portal's own server)
   ▼
backend at NEXT_PUBLIC_BACKEND_BASE_DOMAIN + Authorization: Bearer <token from the httpOnly cookie>
```

- The access token lives in the httpOnly `omnistrate_token` cookie, so browser code cannot read it. The proxy reads it on the server and adds the `Authorization` header. That keeps the token out of JavaScript and gives the app one place to handle auth.
- The proxy only forwards method and path pairs listed in `src/server/utils/allowedRoutes.ts` (patterns such as `/2022-09-01-00/subscription/:id`). Anything else gets 403 "Forbidden". **Adding a backend call means adding its allowlist entry in the same PR.**
- With no auth cookie on a protected endpoint the proxy returns 401, and the client refreshes the session through `/api/refresh-token` and retries once. If that fails, the user is signed out and sent to `/signin`. When the readable `omnistrate_logged_in` indicator cookie is missing, the client aborts protected requests before sending them and redirects to `/signin`.
- The proxy also adds the client IP and a `customer-portal/<version>` user agent, and checks new passwords for `/change-password` and `/update-password`.
- Paths that already start with `/api` (the portal's own Next.js routes) are not rewritten.

## 2. Queries

Argument order is `method, path, init, options`: `init` is the request (`params.path`, `params.query`, `body`, `headers`), `options` is React Query (`enabled`, `select`, `refetchInterval`, `staleTime`).

```ts
import { $api } from "src/api/query";

const useSnapshotDetail = ({ snapshotId }: { snapshotId: string }) =>
  $api.useQuery(
    "get",
    "/2022-09-01-00/resource-instance/snapshot/{id}",
    { params: { path: { id: snapshotId } } },
    { enabled: Boolean(snapshotId) }
  );
```

- Put the hook in the route's `hooks/` folder (`app/(dashboard)/instance-snapshots/hooks/useSnapshotDetail.ts`); move it to `src/hooks/query/` when several routes use it.
- Gate dependent queries with `enabled: Boolean(id)`. Shape data with `select` (`useCustomNetworks` returns `data.customNetworks`).
- Many list endpoints take `environmentType`; read it with `useEnvironmentType()` from `src/hooks/useEnvironmentType.ts`.
- Subscriptions, subscription requests and service offerings are already loaded by `useGlobalData()` in `src/providers/GlobalDataProvider.tsx`. Use that instead of another request.
- Query options placed in `init` do nothing and end up in the query key. `src/hooks/query/useAccountConfigByIds.ts` does this with `refetchInterval`; do not copy it.
- The shared `QueryClient` in `app/RootProviders.tsx` turns off retries and refetch on window focus. Opt in per query if you need either.
- Loading UI comes from the query (`isPending`, `isFetching`), not from extra `useState` flags.

## 3. Query keys and cache updates

`openapi-react-query` builds the key for you: `[method, path, init]`, or `[method, path]` when there is no `init`.

```ts
const queryClient = useQueryClient();

// Refetch every cached variant of an endpoint (prefix match), as ModifyVPCsDrawer does
void queryClient.invalidateQueries({ queryKey: ["get", "/2022-09-01-00/resource-instance"] });

// Exact key for setQueryData: build it the same way the hook does
const { queryKey } = $api.queryOptions("get", "/2022-09-01-00/resource-instance", {
  params: { query: { environmentType } },
});
queryClient.setQueryData(queryKey, (old) =>
  old ? { ...old, resourceInstances: old.resourceInstances?.filter((item) => item.id !== deletedId) } : old
);
```

- Prefer `invalidateQueries` (or the query's own `refetch`) after a mutation. Use `setQueryData` only when the response already contains the new state.
- `setQueryData` needs the exact key, including `init`. A partial key silently writes to a new cache entry.
- Do not invent string keys such as `["consumption-stripe-payment-methods", userId]` (`app/(dashboard)/payment-methods/hooks/usePaymentMethods.ts` is legacy).

## 4. Mutations

```ts
const snackbar = useSnackbar();
const createCustomNetwork = $api.useMutation("post", "/2022-09-01-00/resource-instance/custom-network", {
  onSuccess: () => {
    snackbar.showSuccess("Customer Network created successfully");
    void queryClient.invalidateQueries({ queryKey: ["get", "/2022-09-01-00/resource-instance/custom-network"] });
    onClose();
  },
});

// In a submit or click handler:
createCustomNetwork.mutate({ body: { name, cloudProviderName, cloudProviderRegion, cidr } });
```

- Trigger a mutation from an event handler (submit, click, confirm), never from `useEffect` or during render `[no-mutate-in-effect]`. Legacy examples of what not to do: `app/(dashboard)/billing/components/StripeDefaultPaymentMethodSummary.tsx` sets a default payment method from an effect, and `app/(dashboard)/payment-methods/components/AddPaymentMethodModal.tsx` creates a setup intent from an effect. A write that must follow an action belongs in that action's handler or in the previous mutation's `onSuccess`.
- Use `isPending` for the button's loading and disabled state.
- Use `mutateAsync` only where the caller must await the result (for example a dialog `onConfirm` that returns when done).
- Do not show backend error text yourself; the global snackbar already reports failures (section 6).

## 5. Fan-out: one request per item

Use `useQueries` with `$api.queryOptions` and `combine`, as `src/hooks/query/useAccountConfigByIds.ts` does (minus its misplaced options):

```ts
const accountConfigs = useQueries({
  queries: ids.map((id) =>
    $api.queryOptions("get", "/2022-09-01-00/accountconfig/{id}", { params: { path: { id } } }, { enabled: !!id })
  ),
  combine: (results) => ({
    data: Object.fromEntries(results.flatMap((r, i) => (r.data ? [[ids[i], r.data]] : []))),
    isPending: results.some((r) => r.isPending),
  }),
});
```

Never call `useQuery` in a loop, and never `Promise.all` many endpoints inside one `queryFn`: you lose per-item caching and error handling.

## 6. Errors

- Non-auth 4xx and 5xx responses open the global error snackbar (`src/providers/GlobalErrorHandler.tsx`) with the backend's `message` or a generic fallback. A few "billing not configured" messages are skipped on purpose.
- To handle a failure in place, send the header and render your own fixed copy:

```ts
$api.useQuery("get", "/2022-09-01-00/accountconfig/{id}", {
  params: { path: { id } },
  headers: { "x-ignore-global-error": true },
});
```

- Never render `error.message`, the response body or status codes to customers. Friendly-copy rules are in section 7 of `.agents/skills/frontend-feature-development/SKILL.md`.
- Never special-case 401; the client refreshes and signs out for you.

## 7. Keep server data in the query cache

- Do not copy query data into `useState`, Redux or context and then keep it in sync. Derive with `select` or `useMemo`. An effect that only calls a state setter with fetched data is flagged by `react-hooks/set-state-in-effect`.
- Formik initial values built from query data are fine; that is form state, not a cache.
- The Redux store (`src/redux-store.js`) holds user data from before React Query. Do not add slices for server data.
- Never cache tokens, credentials, payment data or unnecessary personal data in any client store.

## 8. Next.js API routes (`pages/api/`)

Add a route only when the browser cannot make the call itself, usually because it needs the provider's server-side credentials. The routes live in `pages/api/`; there are no App Router route handlers.

- Check the customer's session and access first. `pages/api/product-tier-custom-metrics.ts` is the reference: it rejects a missing auth cookie, verifies the requested subscriptions with the customer's own token, then calls the backend with provider credentials and returns generic error messages.
- Server helpers live in `src/server/`; never import them into client components. The existing ones call the backend through a server-side axios instance (`src/server/axios.js`) with the provider token. New server code must not add axios imports `[no-axios]`: use a typed `openapi-fetch` client (`createFetchClient<paths>({ baseUrl })`, as `pages/api/action.js` does), or `fetch` inside `pages/api/`.
- Call the route from a typed function in `src/api/` using `fetch` (the only client folder where `fetch` is allowed), wrap it in `useQuery` or `useMutation`, and start the key with the route path.

## 9. Legacy code: don't extend it

| Legacy                                                                                                                                                                                                                                                              | Status                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `src/axios.js` (client axios instance) and `src/providers/AxiosGlobalErrorHandler.tsx` (its interceptors)                                                                                                                                                           | 16 files still use the instance; no new importers |
| Axios wrapper modules in `src/api/`: `src/api/consumption.ts`, `src/api/customNetworks.ts`, `src/api/resourceInstance.ts`, `src/api/subscriptions.ts`, `src/api/users.ts` and others                                                                                | Do not add functions; call `$api` instead         |
| Direct `axios` calls to Next.js routes: `src/api/customer-user.js`, `src/api/cloudProvider.js`, `src/api/productTierCustomMetrics.ts`, and hooks in `app/(dashboard)/instances/hooks/useResources.ts` and `app/(dashboard)/release-history/hooks/useVersionSets.ts` | Do not copy                                       |

When you touch a legacy call, migrating it to `$api` is welcome as a separate small PR: same endpoint and parameters, and update every consumer of its old query key.

## 10. Checklist

- [ ] `$api` for every backend call; the endpoint is in `src/server/utils/allowedRoutes.ts`.
- [ ] Query options are in the fourth argument; `enabled` guards missing IDs.
- [ ] Mutations start from event handlers; `isPending` drives loading UI.
- [ ] Cache updates use generated keys; nothing server-side is mirrored into state.
- [ ] No raw error text in the UI; `x-ignore-global-error` only where you render your own copy.
- [ ] The regenerated `src/types/schema.ts`, if needed, is in its own PR.

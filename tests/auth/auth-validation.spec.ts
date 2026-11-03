import type { APIRequestContext } from "@playwright/test";
import { test as authTest } from "test-fixtures/auth-validation";
import {
  AUTH_TEST_CUSTOMER_ORG,
  AUTH_TEST_CUSTOMER_TOKEN,
  AUTH_TEST_PLAN_ID,
  AUTH_TEST_PROVIDER_ORG,
  AUTH_TEST_REFRESH_TOKEN,
  AUTH_TEST_SERVICE_ID,
  AUTH_TEST_SUBSCRIPTION_ID,
  type AuthValidationRequests,
  type AuthValidationScenario,
  type BackendReply,
  createAuthTestToken,
} from "test-fixtures/auth-validation-data";
import { expect } from "test-fixtures/har-test";

const routes = ["resources", "version-sets", "cloud-providers", "product-tier-custom-metrics"] as const;
const genericFailure = { message: "Something went wrong. Please retry" };
const unauthorized = { message: "Not authenticated" };
const sessionBody = { organizationID: AUTH_TEST_CUSTOMER_ORG, serviceProviderID: AUTH_TEST_PROVIDER_ORG };

const providerRequests = (requests: AuthValidationRequests) =>
  requests.backend.filter((entry) => entry.usesProviderToken);

const getProtectedRoute = async (
  request: APIRequestContext,
  url: string,
  route: (typeof routes)[number],
  token = AUTH_TEST_CUSTOMER_TOKEN
) =>
  request.get(`${url}/api/${route}`, {
    params: {
      serviceId: AUTH_TEST_SERVICE_ID,
      productTierId: AUTH_TEST_PLAN_ID,
      subscriptionIds: AUTH_TEST_SUBSCRIPTION_ID,
    },
    headers: { Cookie: `omnistrate_token=${token}; omnistrate_refresh_token=${AUTH_TEST_REFRESH_TOKEN}` },
    maxRedirects: 0,
  });

authTest.describe("Controlled provider API authentication", () => {
  for (const route of routes) {
    for (const malformed of [
      { name: "encoded newline", value: "invalid%0Acredential" },
      { name: "encoded carriage return", value: "invalid%0Dcredential" },
      { name: "encoded Unicode", value: "%E2%82%AC" },
    ]) {
      authTest(`${route}: ${malformed.name} makes no backend request`, async ({ authServer, request }) => {
        await authServer.configure(request, {});
        const response = await getProtectedRoute(request, authServer.url, route, malformed.value);
        expect(response.status()).toBe(401);
        expect(await response.json()).toEqual(unauthorized);
        expect((await authServer.requests(request)).backend).toEqual([]);
      });
    }
  }

  const failures: { name: string; reply: BackendReply; status: number; body: { message: string } }[] = [
    { name: "connection failure", reply: { kind: "disconnect" }, status: 500, body: genericFailure },
    { name: "timeout", reply: { kind: "timeout" }, status: 500, body: genericFailure },
    { name: "invalid JSON", reply: { kind: "invalid-json" }, status: 500, body: genericFailure },
    { name: "backend 401", reply: { kind: "json", status: 401, body: {} }, status: 401, body: unauthorized },
    { name: "backend 500", reply: { kind: "json", status: 500, body: {} }, status: 500, body: genericFailure },
    { name: "backend 503", reply: { kind: "json", status: 503, body: {} }, status: 503, body: genericFailure },
    { name: "unexpected 403", reply: { kind: "json", status: 403, body: {} }, status: 500, body: genericFailure },
    { name: "unexpected redirect", reply: { kind: "redirect" }, status: 500, body: genericFailure },
  ];

  for (const route of routes) {
    for (const stage of ["session", "user"] as const) {
      for (const failure of failures) {
        authTest(`${route}: ${stage} ${failure.name} returns ${failure.status}`, async ({ authServer, request }) => {
          await authServer.configure(request, { environment: "PROD", [stage]: failure.reply });
          const response = await getProtectedRoute(request, authServer.url, route);
          expect(response.status()).toBe(failure.status);
          expect(await response.json()).toEqual(failure.body);
          const calls = await authServer.requests(request);
          expect(calls.backend.map((entry) => entry.path)).toEqual(
            stage === "session" ? ["/auth/session"] : ["/auth/session", "/user"]
          );
          expect(calls.backend.every((entry) => entry.usesCustomerToken)).toBe(true);
          expect(providerRequests(calls)).toEqual([]);
        });
      }
    }
  }

  for (const environment of ["PROD", "DEV", "STAGING"] as const) {
    for (const route of routes) {
      authTest(
        `${route}: matching ${environment} organization permits provider lookup`,
        async ({ authServer, request }) => {
          await authServer.configure(request, { environment });
          const response = await getProtectedRoute(request, authServer.url, route);
          expect(response.status()).toBe(200);
          expect(response.headers()["cache-control"]).toBe("private, no-store");
          const body: unknown = await response.json();
          if (route === "resources") {
            expect(body).toEqual({
              resources: [{ customDNS: false, id: "r-auth-test", key: "auth-resource", name: "Auth resource" }],
            });
          } else if (route === "version-sets") {
            expect(body).toEqual([{ version: "1.0", name: "Test release" }]);
          } else if (route === "cloud-providers") {
            expect(body).toEqual([{ id: "cloud-auth-test" }]);
          } else {
            expect(body).toEqual({
              productTiers: {
                [AUTH_TEST_PLAN_ID]: {
                  serviceId: AUTH_TEST_SERVICE_ID,
                  productTierId: AUTH_TEST_PLAN_ID,
                  metrics: [{ name: "requests", aggregationFunction: "sum" }],
                },
              },
              unavailableProductTierIds: [],
            });
          }
          const calls = await authServer.requests(request);
          expect(calls.backend.slice(0, 2).map((entry) => entry.path)).toEqual(["/auth/session", "/user"]);
          expect(calls.backend.slice(0, 2).every((entry) => entry.usesCustomerToken)).toBe(true);
          expect(providerRequests(calls).length).toBeGreaterThan(0);
          const authorization = calls.backend.find((entry) =>
            route === "product-tier-custom-metrics"
              ? entry.path === `/subscription/${AUTH_TEST_SUBSCRIPTION_ID}`
              : entry.path === `/service-offering/${AUTH_TEST_SERVICE_ID}`
          );
          if (route !== "cloud-providers") expect(authorization?.usesCustomerToken).toBe(true);
        }
      );

      authTest(`${route}: mismatched ${environment} organization returns 403`, async ({ authServer, request }) => {
        const otherEnvironmentOrg = environment === "PROD" ? AUTH_TEST_PROVIDER_ORG : AUTH_TEST_CUSTOMER_ORG;
        await authServer.configure(request, {
          environment,
          user: { kind: "json", status: 200, body: { orgId: otherEnvironmentOrg } },
        });
        const response = await getProtectedRoute(request, authServer.url, route);
        expect(response.status()).toBe(403);
        expect(await response.json()).toEqual({ message: "Forbidden" });
        const calls = await authServer.requests(request);
        expect(calls.backend.map((entry) => entry.path)).toEqual(["/auth/session", "/user"]);
        expect(providerRequests(calls)).toEqual([]);
      });

      authTest(
        `${route}: equal organization IDs in ${environment} permit provider lookup when user matches`,
        async ({ authServer, request }) => {
          await authServer.configure(request, {
            environment,
            session: {
              kind: "json",
              status: 200,
              body: { ...sessionBody, serviceProviderID: AUTH_TEST_CUSTOMER_ORG },
            },
            user: { kind: "json", status: 200, body: { orgId: AUTH_TEST_CUSTOMER_ORG } },
          });
          const response = await getProtectedRoute(request, authServer.url, route);
          expect(response.status()).toBe(200);
          expect(response.headers()["cache-control"]).toBe("private, no-store");
          const calls = await authServer.requests(request);
          expect(calls.backend.slice(0, 2).map((entry) => entry.path)).toEqual(["/auth/session", "/user"]);
          expect(calls.backend.slice(0, 2).every((entry) => entry.usesCustomerToken)).toBe(true);
          expect(providerRequests(calls).length).toBeGreaterThan(0);
          const authorization = calls.backend.find((entry) =>
            route === "product-tier-custom-metrics"
              ? entry.path === `/subscription/${AUTH_TEST_SUBSCRIPTION_ID}`
              : entry.path === `/service-offering/${AUTH_TEST_SERVICE_ID}`
          );
          if (route !== "cloud-providers") expect(authorization?.usesCustomerToken).toBe(true);
        }
      );

      authTest(
        `${route}: equal organization IDs in ${environment} return 403 when user differs`,
        async ({ authServer, request }) => {
          await authServer.configure(request, {
            environment,
            session: {
              kind: "json",
              status: 200,
              body: { ...sessionBody, serviceProviderID: AUTH_TEST_CUSTOMER_ORG },
            },
            user: { kind: "json", status: 200, body: { orgId: AUTH_TEST_PROVIDER_ORG } },
          });
          const response = await getProtectedRoute(request, authServer.url, route);
          expect(response.status()).toBe(403);
          expect(await response.json()).toEqual({ message: "Forbidden" });
          const calls = await authServer.requests(request);
          expect(calls.backend.map((entry) => entry.path)).toEqual(["/auth/session", "/user"]);
          expect(calls.backend.every((entry) => entry.usesCustomerToken)).toBe(true);
          expect(providerRequests(calls)).toEqual([]);
        }
      );
    }
  }

  const invalidValues = [
    { name: "missing", value: undefined },
    { name: "null", value: null },
    { name: "empty", value: "" },
    { name: "whitespace", value: " " },
    { name: "number", value: 42 },
  ];
  for (const field of ["organizationID", "serviceProviderID", "orgId"] as const) {
    for (const invalid of invalidValues) {
      authTest(`${field}: ${invalid.name} value returns 401`, async ({ authServer, request }) => {
        const isUser = field === "orgId";
        await authServer.configure(request, {
          environment: "PROD",
          [isUser ? "user" : "session"]: {
            kind: "json",
            status: 200,
            body: { ...(isUser ? { orgId: AUTH_TEST_CUSTOMER_ORG } : sessionBody), [field]: invalid.value },
          },
        });
        const response = await getProtectedRoute(request, authServer.url, "cloud-providers");
        expect(response.status()).toBe(401);
        expect(await response.json()).toEqual(unauthorized);
        const calls = await authServer.requests(request);
        expect(calls.backend.map((entry) => entry.path)).toEqual(
          isUser ? ["/auth/session", "/user"] : ["/auth/session"]
        );
        expect(providerRequests(calls)).toEqual([]);
      });
    }
  }

  for (const rejection of ["expired", "revoked", "wrong signature"] as const) {
    for (const route of routes) {
      authTest(`${route}: ${rejection} JWT returns 401`, async ({ authServer, request }) => {
        await authServer.configure(request, { environment: "PROD" });
        const token =
          rejection === "expired"
            ? createAuthTestToken({ exp: Math.floor(Date.now() / 1000) - 60 })
            : rejection === "revoked"
              ? createAuthTestToken({ revoked: true })
              : createAuthTestToken({}, "different-synthetic-signing-key");
        const response = await getProtectedRoute(request, authServer.url, route, token);
        expect(response.status()).toBe(401);
        expect(await response.json()).toEqual(unauthorized);
        const calls = await authServer.requests(request);
        expect(calls.backend.map((entry) => entry.path)).toEqual(["/auth/session"]);
        expect(providerRequests(calls)).toEqual([]);
      });
    }
  }

  for (const route of ["resources", "version-sets"] as const) {
    for (const denial of ["plan absent", "offering forbidden"] as const) {
      authTest(`${route}: ${denial} preserves plan authorization`, async ({ authServer, request }) => {
        await authServer.configure(request, {
          offering: { kind: "json", status: denial === "plan absent" ? 200 : 403, body: { offerings: [] } },
        });
        const response = await getProtectedRoute(request, authServer.url, route);
        expect(response.status()).toBe(403);
        expect(await response.json()).toEqual({ message: "You don't have access to this plan" });
        const calls = await authServer.requests(request);
        expect(calls.backend.map((entry) => entry.path)).toEqual([
          "/auth/session",
          "/user",
          `/service-offering/${AUTH_TEST_SERVICE_ID}`,
        ]);
        expect(providerRequests(calls)).toEqual([]);
      });
    }
  }

  for (const status of [403, 404]) {
    authTest(`custom metrics: subscription ${status} preserves authorization`, async ({ authServer, request }) => {
      await authServer.configure(request, { subscription: { kind: "json", status, body: {} } });
      const response = await getProtectedRoute(request, authServer.url, "product-tier-custom-metrics");
      expect(response.status()).toBe(403);
      expect(await response.json()).toEqual({ message: "One or more subscriptions are not accessible" });
      const calls = await authServer.requests(request);
      expect(calls.backend.map((entry) => entry.path)).toEqual([
        "/auth/session",
        "/user",
        `/subscription/${AUTH_TEST_SUBSCRIPTION_ID}`,
      ]);
      expect(providerRequests(calls)).toEqual([]);
    });
  }
});

authTest.describe("Provider API browser refresh", () => {
  authTest.beforeEach(async ({ authServer, context }) => {
    await context.addCookies([
      { name: "omnistrate_token", value: AUTH_TEST_CUSTOMER_TOKEN, url: authServer.url, httpOnly: true },
      { name: "omnistrate_refresh_token", value: AUTH_TEST_REFRESH_TOKEN, url: authServer.url, httpOnly: true },
      { name: "omnistrate_logged_in", value: "true", url: authServer.url },
    ]);
  });

  authTest("401 refreshes once and retries with the refreshed cookie", async ({ authServer, request, page }) => {
    await authServer.configure(request, { rejectInitialSession: true });
    await page.goto(`${authServer.url}/auth-check`);
    await page.getByTestId("auth-request-button").click();
    await expect(page.getByTestId("auth-request-status")).toHaveText("Loaded releases");
    await expect(page).toHaveURL(`${authServer.url}/auth-check`);
    const calls = await authServer.requests(request);
    expect(calls.portal.filter((entry) => entry.path === "/api/refresh-token")).toHaveLength(1);
    expect(calls.portal.filter((entry) => entry.path === "/api/version-sets")).toHaveLength(2);
    expect(calls.portal.filter((entry) => entry.path === "/api/logout")).toEqual([]);
    const sessions = calls.backend.filter((entry) => entry.path === "/auth/session");
    expect(sessions.map((entry) => entry.usesRefreshedToken)).toEqual([false, true]);
    expect(calls.backend.find((entry) => entry.path === "/user")?.usesRefreshedToken).toBe(true);
    expect(providerRequests(calls).length).toBeGreaterThan(0);
  });

  authTest("failed refresh logs out and redirects to sign in", async ({ authServer, request, page, context }) => {
    await authServer.configure(request, { rejectInitialSession: true, refreshFails: true });
    await page.goto(`${authServer.url}/auth-check`);
    await page.getByTestId("auth-request-button").click();
    await expect(page).toHaveURL(`${authServer.url}/signin`);
    await expect(page.getByText("Sign in", { exact: true })).toBeVisible();
    const calls = await authServer.requests(request);
    expect(calls.portal.filter((entry) => entry.path === "/api/refresh-token")).toHaveLength(1);
    expect(calls.portal.filter((entry) => entry.path === "/api/logout")).toHaveLength(1);
    expect(calls.portal.filter((entry) => entry.path === "/api/version-sets")).toHaveLength(1);
    expect(providerRequests(calls)).toEqual([]);
    expect((await context.cookies()).filter((cookie) => cookie.name.startsWith("omnistrate_"))).toEqual([]);
  });

  for (const status of [403, 500, 503]) {
    authTest(`initial ${status} does not refresh or log out`, async ({ authServer, request, page, context }) => {
      const configuration: AuthValidationScenario =
        status === 403
          ? { user: { kind: "json", status: 200, body: { orgId: "org-other" } } }
          : { session: { kind: "json", status, body: {} } };
      await authServer.configure(request, configuration);
      await page.goto(`${authServer.url}/auth-check`);
      await page.getByTestId("auth-request-button").click();
      await expect(page.getByTestId("auth-request-status")).toHaveText("Request failed");
      await expect(page.getByRole("alert")).toContainText(status === 403 ? "Forbidden" : genericFailure.message);
      await expect(page).toHaveURL(`${authServer.url}/auth-check`);
      const calls = await authServer.requests(request);
      expect(calls.portal.filter((entry) => ["/api/refresh-token", "/api/logout"].includes(entry.path))).toEqual([]);
      expect(calls.portal.filter((entry) => entry.path === "/api/version-sets")).toHaveLength(1);
      expect(providerRequests(calls)).toEqual([]);
      expect((await context.cookies()).find((cookie) => cookie.name === "omnistrate_logged_in")?.value).toBe("true");
    });
  }
});

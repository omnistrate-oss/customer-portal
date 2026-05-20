import { expect, test } from "test-fixtures/har-test";

import { isAllowedRoute } from "../../../src/server/utils/allowedRoutes";

const actionURL = /\/api\/action/;

const stripeStub = `
window.Stripe = function () {
  return {
    _registerWrapper: function () {},
    elements: function () {
      return {
        _commonOptions: {},
        create: function () {
          return {
            mount: function () {},
            unmount: function () {},
            destroy: function () {},
            on: function () {},
            once: function () {},
            off: function () {},
            update: function () {}
          };
        },
        submit: function () {
          return Promise.resolve({});
        },
        update: function () {}
      };
    },
    confirmSetup: function () {
      return Promise.resolve({ setupIntent: { payment_method: "pm_new" } });
    }
  };
};
window.Stripe.version = "mock";
`;

test.describe("Billing payment methods", () => {
  test("allows Stripe payment method API proxy routes", () => {
    expect(isAllowedRoute("GET", "/2022-09-01-00/resource-instance/billing/stripe/config")).toBe(true);
    expect(isAllowedRoute("GET", "/2022-09-01-00/resource-instance/billing/stripe/payment-methods")).toBe(true);
    expect(isAllowedRoute("POST", "/2022-09-01-00/resource-instance/billing/stripe/payment-methods/setup-intent")).toBe(
      true
    );
    expect(isAllowedRoute("DELETE", "/2022-09-01-00/resource-instance/billing/stripe/payment-methods/pm_123")).toBe(
      true
    );
    expect(
      isAllowedRoute("POST", "/2022-09-01-00/resource-instance/billing/stripe/payment-methods/pm_123/default")
    ).toBe(true);
  });

  test("loads, sets default, and handles remove success and failure", async ({ page }) => {
    let setDefaultCalls = 0;
    let removeLastMethodFailures = 0;
    let paymentMethods = [
      {
        id: "pm_card",
        type: "card",
        displayName: "Visa ending 4242",
        brand: "visa",
        last4: "4242",
        expMonth: 12,
        expYear: 2030,
        isDefault: true,
      },
      {
        id: "pm_bank",
        type: "us_bank_account",
        displayName: "STRIPE TEST BANK ending 6789",
        bankName: "STRIPE TEST BANK",
        last4: "6789",
        isDefault: false,
      },
    ];

    await page.context().addCookies([
      {
        name: "omnistrate_token",
        value: "mock-customer-token",
        url: "http://localhost:3000",
        httpOnly: true,
      },
      {
        name: "omnistrate_refresh_token",
        value: "mock-customer-refresh-token",
        url: "http://localhost:3000",
        httpOnly: true,
      },
      {
        name: "omnistrate_logged_in",
        value: "true",
        url: "http://localhost:3000",
      },
    ]);
    await page.addInitScript(() => {
      document.cookie = "omnistrate_logged_in=true; path=/";
    });

    await page.route(/https:\/\/js\.stripe\.com\/v3.*/, async (route) => {
      await route.fulfill({
        contentType: "application/javascript",
        body: stripeStub,
      });
    });

    await page.route(actionURL, async (route) => {
      const request = route.request();
      const body = request.postDataJSON() as { endpoint: string; method: string };
      const endpoint = body.endpoint;
      const method = body.method;

      if (method === "GET" && endpoint.endsWith("/subscription")) {
        await route.fulfill({ json: { subscriptions: [] } });
        return;
      }

      if (method === "GET" && endpoint.endsWith("/subscription/request")) {
        await route.fulfill({ json: { subscriptionRequests: [] } });
        return;
      }

      if (method === "GET" && endpoint.endsWith("/service-offering")) {
        await route.fulfill({
          json: {
            services: [
              {
                serviceId: "s-test",
                serviceName: "Test Service",
                offerings: [{ productTierID: "pt-test", productTierName: "Test Plan" }],
              },
            ],
          },
        });
        return;
      }

      if (method === "GET" && endpoint.endsWith("/resource-instance/billing-status")) {
        await route.fulfill({ json: { enabled: true } });
        return;
      }

      if (method === "GET" && endpoint.endsWith("/resource-instance/billing-details")) {
        await route.fulfill({
          json: {
            paymentConfigured: paymentMethods.length > 0,
            billingProviders: [{ type: "STRIPE", name: "OmniBilling" }],
          },
        });
        return;
      }

      if (method === "GET" && endpoint.endsWith("/resource-instance/usage")) {
        await route.fulfill({
          json: {
            endTime: "2026-05-18T00:00:00Z",
            usage: [
              { dimension: "Memory GiB hours", total: 0 },
              { dimension: "Storage GiB hours", total: 0 },
              { dimension: "CPU core hours", total: 0 },
              { dimension: "Replica hours", total: 0 },
            ],
          },
        });
        return;
      }

      if (method === "GET" && endpoint.endsWith("/resource-instance/invoice")) {
        await route.fulfill({ json: { invoices: [] } });
        return;
      }

      if (method === "GET" && endpoint.endsWith("/resource-instance/billing/stripe/config")) {
        await route.fulfill({ json: { publishableKey: "pk_test_mock", stripeAccountId: "acct_mock" } });
        return;
      }

      if (method === "GET" && endpoint.endsWith("/resource-instance/billing/stripe/payment-methods")) {
        await route.fulfill({ json: { paymentMethods } });
        return;
      }

      if (method === "POST" && endpoint.endsWith("/resource-instance/billing/stripe/payment-methods/setup-intent")) {
        paymentMethods = [
          ...paymentMethods,
          {
            id: "pm_new",
            type: "card",
            displayName: "Mastercard ending 4444",
            brand: "mastercard",
            last4: "4444",
            expMonth: 10,
            expYear: 2031,
            isDefault: false,
          },
        ];
        await route.fulfill({ json: { clientSecret: "seti_mock_secret" } });
        return;
      }

      if (method === "POST" && endpoint.endsWith("/resource-instance/billing/stripe/payment-methods/pm_bank/default")) {
        setDefaultCalls += 1;
        paymentMethods = paymentMethods.map((method) => ({
          ...method,
          isDefault: method.id === "pm_bank",
        }));
        await route.fulfill({ status: 204 });
        return;
      }

      if (method === "DELETE" && endpoint.endsWith("/resource-instance/billing/stripe/payment-methods/pm_bank")) {
        paymentMethods = paymentMethods.filter((method) => method.id !== "pm_bank");
        paymentMethods = paymentMethods.map((paymentMethod, index) => ({
          ...paymentMethod,
          isDefault: index === 0,
        }));
        await route.fulfill({ status: 204 });
        return;
      }

      if (method === "DELETE" && endpoint.endsWith("/resource-instance/billing/stripe/payment-methods/pm_card")) {
        removeLastMethodFailures += 1;
        await route.fulfill({
          status: 409,
          json: { message: "cannot remove last payment method with current month usage" },
        });
        return;
      }

      await route.fulfill({ status: 404, json: { message: `Unhandled mock route: ${method} ${endpoint}` } });
    });

    await page.goto("/billing");

    await expect(page.getByRole("heading", { name: "Billing" })).toBeVisible();
    await expect(page.getByText("Visa ending 4242")).toBeVisible();
    await expect(page.getByText("STRIPE TEST BANK ending 6789")).toBeVisible();

    await page.getByRole("button", { name: "Set Default" }).click();
    await expect.poll(() => setDefaultCalls).toBe(1);
    await expect(page.getByText("Default", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Remove STRIPE TEST BANK ending 6789" }).click();
    await page.getByRole("button", { name: "Remove", exact: true }).click();
    await expect(page.getByRole("button", { name: "Remove STRIPE TEST BANK ending 6789" })).toBeHidden();
    await expect(page.getByText("Visa ending 4242")).toBeVisible();
    await expect(page.getByText("Default", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Remove Visa ending 4242" }).click();
    await page.getByRole("button", { name: "Remove", exact: true }).click();
    await expect.poll(() => removeLastMethodFailures).toBe(1);
    await expect(page.getByText("Add another payment method before removing this one")).toBeVisible();
    await page.getByRole("button", { name: "Close remove payment method dialog" }).click();

    await expect(page.getByRole("button", { name: "Add" })).toBeEnabled();
  });
});

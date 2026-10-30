import { expect, test } from "test-fixtures/har-test";

const fixtureToken = `unsigned.${Buffer.from(JSON.stringify({ exp: 4102444800 })).toString("base64url")}.fixture`;

// These rollout states have no existing customer fixtures in dev.
test.use({
  harMode: "off",
  storageState: {
    cookies: [
      {
        name: "omnistrate_token",
        value: fixtureToken,
        domain: "localhost",
        path: "/",
        expires: -1,
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
      },
      {
        name: "omnistrate_logged_in",
        value: "true",
        domain: "localhost",
        path: "/",
        expires: -1,
        httpOnly: false,
        secure: false,
        sameSite: "Lax",
      },
    ],
    origins: [],
  },
});

test.describe.configure({ mode: "serial" });
let mixed = false;
let legacyOnly = false;
let invoiceRequests = 0;
let stripeRequests = 0;
const providers = ["MARKETPLACE", "AWS_MARKETPLACE", "GCP_MARKETPLACE", "AZURE_MARKETPLACE"];
const stripeInvoiceURL = "https://invoice.stripe.com/i/test-invoice";
const byoBalanceURL = "https://billing.example.com/customer/balance";

test.beforeEach(async ({ page }) => {
  mixed = false;
  legacyOnly = false;
  invoiceRequests = 0;
  stripeRequests = 0;
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const payload: { endpoint?: string } = request.postDataJSON() ?? {};
    const endpoint = payload.endpoint ?? new URL(request.url()).pathname;
    let body: unknown;
    if (endpoint.endsWith("/billing-details"))
      body = {
        paymentConfigured: false,
        customPaymentPortalEnabled: false,
        billingProviders: (legacyOnly
          ? ["MARKETPLACE"]
          : mixed
            ? ["STRIPE", ...providers, "BRING_YOUR_OWN"]
            : providers
        ).map((type) => ({
          type,
          ...(type === "BRING_YOUR_OWN" ? { name: "External Billing", balanceDueLink: byoBalanceURL } : {}),
        })),
      };
    else if (endpoint.endsWith("/billing-status")) body = { enabled: true };
    else if (endpoint.endsWith("/resource-instance/invoice")) {
      invoiceRequests += 1;
      body = { invoices: [{ id: "inv-test", invoiceStatus: "open", totalAmount: 45, invoiceUrl: stripeInvoiceURL }] };
    } else if (endpoint.includes("/billing/stripe/")) {
      stripeRequests += 1;
      body = { paymentMethods: [] };
    } else if (endpoint.endsWith("/service-offering"))
      body = {
        services: [
          {
            serviceId: "s-test",
            serviceName: "Example Product",
            offerings: [{ productTierID: "pt-test", productTierName: "Example Plan" }],
          },
        ],
      };
    else if (endpoint.endsWith("/subscription/request")) body = { subscriptionRequests: [] };
    else if (endpoint.endsWith("/subscription"))
      body = {
        subscriptions: [
          {
            id: "sub-cloud",
            productTierId: "pt-test",
            serviceId: "s-test",
            productTierName: "Marketplace Plan",
            roleType: "root",
            paymentMethodConfigured: true,
            allowCreatesWhenPaymentNotConfigured: false,
          },
          ...(mixed
            ? [
                {
                  id: "sub-stripe",
                  productTierId: "pt-test",
                  serviceId: "s-test",
                  productTierName: "Stripe Plan",
                  roleType: "root",
                  paymentMethodConfigured: false,
                  allowCreatesWhenPaymentNotConfigured: false,
                },
              ]
            : []),
        ],
      };
    else if (endpoint.endsWith("/resource-instance"))
      body = {
        resourceInstances: [
          { id: "i-cloud", subscriptionId: "sub-cloud", status: "RUNNING" },
          ...(mixed ? [{ id: "i-stripe", subscriptionId: "sub-stripe", status: "RUNNING" }] : []),
        ],
      };
    else if (endpoint.endsWith("/user"))
      body = { id: "user-test", name: "Test Customer", roleType: "root", status: "ACTIVE" };
    else if (endpoint.endsWith("/usage")) body = { usage: [] };
    else if (endpoint.includes("product-tier-custom-metrics")) body = { productTiers: {} };
    else body = {};
    await route.fulfill({ json: body });
  });
});

test("marketplace payments stay external and do not require a Stripe payment method", async ({ page }, testInfo) => {
  await page.goto("/billing");
  await page.getByRole("button", { name: "Reject All", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Marketplace", exact: true })).toHaveCount(0);
  for (const provider of [
    { tab: "AWS Marketplace", label: "Open AWS billing", url: "https://console.aws.amazon.com/costmanagement/" },
    {
      tab: "Google Cloud Marketplace",
      label: "Open Google Cloud billing",
      url: "https://console.cloud.google.com/billing",
    },
    {
      tab: "Azure Marketplace",
      label: "Open Azure billing",
      url: "https://portal.azure.com/#view/Microsoft_Azure_GTM/ModernBillingMenuBlade",
    },
  ]) {
    await page.getByRole("tab", { name: provider.tab, exact: true }).click();
    await expect(page.getByText("Unavailable in this portal", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Pay outstanding balance" })).toHaveCount(0);
    const billingLink = page.getByRole("link", { name: provider.label, exact: true });
    await expect(billingLink).toHaveAttribute("href", provider.url);
    await expect(billingLink).toHaveAttribute("target", "_blank");
    await expect(billingLink).toHaveAttribute("rel", "noopener noreferrer");
    await expect(page.getByRole("link", { name: /Open (AWS|Google Cloud|Azure) billing/ })).toHaveCount(1);
    await billingLink.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: testInfo.outputPath(`customer-${provider.tab.replaceAll(" ", "-")}.png`),
      fullPage: true,
    });
  }
  await expect(page.getByTestId("payment-config-warning")).toHaveCount(0);
  expect(invoiceRequests).toBe(0);
  expect(stripeRequests).toBe(0);
  await page.goto("/payment-methods");
  await expect(page.getByRole("tab", { name: "Marketplace", exact: true })).toHaveCount(0);
  await page.getByRole("tab", { name: "Google Cloud Marketplace", exact: true }).click();
  await expect(page.getByText("Google Cloud Marketplace manages payment configuration for this account")).toBeVisible();
  await expect(page.getByRole("button", { name: "Configure", exact: true })).toHaveCount(0);
  expect(stripeRequests).toBe(0);
});

test("mixed billing isolates Stripe invoices and warns only for the unpaid subscription", async ({ page }) => {
  mixed = true;
  await page.goto("/billing");
  await expect(page.getByText("$45", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Pay outstanding balance", exact: true })).toHaveAttribute(
    "href",
    stripeInvoiceURL
  );
  await expect(page.getByTestId("payment-config-warning")).toContainText(
    "Stripe Plan subscription requires a payment method"
  );
  await expect(page.getByTestId("payment-config-warning")).not.toContainText("Marketplace Plan");
  const count = invoiceRequests;
  expect(count).toBeGreaterThan(0);
  await page.getByRole("tab", { name: "AWS Marketplace", exact: true }).click();
  await expect(page.getByText("Unavailable in this portal", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Pay outstanding balance" })).toHaveCount(0);
  expect(invoiceRequests).toBe(count);
  await page.getByRole("tab", { name: "External Billing", exact: true }).click();
  await expect(page.getByRole("link", { name: "Pay outstanding balance", exact: true })).toHaveAttribute(
    "href",
    byoBalanceURL
  );
  await expect(page.getByRole("link", { name: /Open (AWS|Google Cloud|Azure) billing/ })).toHaveCount(0);
  expect(invoiceRequests).toBe(count);
});

test("legacy-only customers retain marketplace billing and payment settings", async ({ page }) => {
  legacyOnly = true;
  await page.goto("/billing");
  await page.getByRole("button", { name: "Reject All", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Marketplace", exact: true })).toBeVisible();
  await expect(page.getByText("Unavailable in this portal", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Open (AWS|Google Cloud|Azure) billing/ })).toHaveCount(0);
  await expect(page.getByTestId("payment-config-warning")).toHaveCount(0);
  await page.goto("/payment-methods");
  await expect(page.getByRole("tab", { name: "Marketplace", exact: true })).toBeVisible();
  await expect(page.getByText("Marketplace manages payment configuration for this account")).toBeVisible();
  expect(invoiceRequests).toBe(0);
  expect(stripeRequests).toBe(0);
});

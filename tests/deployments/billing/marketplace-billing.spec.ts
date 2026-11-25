import { expect, test } from "test-fixtures/har-test";

import type {
  DescribeConsumptionBillingDetailsSuccessResponse,
  DescribeConsumptionBillingStatusResponse,
  GetCurrentConsumptionUsageSuccessResponse,
  ListConsumptionInvoicesSuccessResponse,
  ListConsumptionPaymentMethodsSuccessResponse,
} from "src/types/consumption";
import type { ProductTierCustomMetricsResponse } from "src/types/productTierCustomMetrics";
import type { ListAllResourceInstancesSuccessResponse, ResourceInstance } from "src/types/resourceInstance";
import type { ListServiceOfferingSuccessResponse } from "src/types/serviceOffering";
import type { ListSubscriptionsSuccessResponse, Subscription } from "src/types/subscription";
import type { ListSubscriptionRequestsSuccessResponse } from "src/types/subscriptionRequest";
import type { ProviderUser } from "src/types/users";

// These rollout states have no existing customer fixtures in dev.
test.use({ harMode: "off" });

test.describe.configure({ mode: "serial" });
let mixed = false;
let legacyOnly = false;
let invoiceRequests = 0;
let invoiceRequestProviders: Array<string | undefined> = [];
let stripeRequests = 0;
const providers = ["MARKETPLACE", "AWS_MARKETPLACE", "GCP_MARKETPLACE", "AZURE_MARKETPLACE"];
const stripeInvoiceURL = "https://invoice.stripe.com/i/test-invoice";
const byoBalanceURL = "https://billing.example.com/customer/balance";

const createSubscription = (id: string, productTierName: string, paymentMethodConfigured: boolean): Subscription => ({
  accountConfigIdentityId: "org-test",
  allowCreatesWhenPaymentNotConfigured: false,
  cloudProviderNames: [],
  createdAt: "2026-01-01T00:00:00Z",
  defaultSubscription: false,
  id,
  paymentMethodConfigured,
  productTierId: "pt-test",
  productTierName,
  roleType: "root",
  rootUserId: "user-test",
  serviceId: "s-test",
  serviceLogoURL: "",
  serviceName: "Example Product",
  serviceOrgId: "org-test",
  serviceOrgName: "Example Provider",
  status: "ACTIVE",
  subscriptionOwnerName: "Test Customer",
});

const createResourceInstance = (id: string, subscriptionId: string): ResourceInstance => ({
  id,
  subscriptionId,
  status: "RUNNING",
});

test.beforeEach(async ({ page }) => {
  mixed = false;
  legacyOnly = false;
  invoiceRequests = 0;
  invoiceRequestProviders = [];
  stripeRequests = 0;
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const payload: { endpoint?: string; queryParams?: Record<string, string> } = request.postDataJSON() ?? {};
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
      } satisfies DescribeConsumptionBillingDetailsSuccessResponse;
    else if (endpoint.endsWith("/billing-status"))
      body = { enabled: true } satisfies DescribeConsumptionBillingStatusResponse;
    else if (endpoint.endsWith("/resource-instance/invoice")) {
      invoiceRequests += 1;
      invoiceRequestProviders.push(payload.queryParams?.billingProvider);
      body = {
        invoices: [{ invoiceId: "inv-test", invoiceStatus: "open", totalAmount: 45, invoiceUrl: stripeInvoiceURL }],
      } satisfies ListConsumptionInvoicesSuccessResponse;
    } else if (endpoint.includes("/billing/stripe/")) {
      stripeRequests += 1;
      body = { paymentMethods: [] } satisfies ListConsumptionPaymentMethodsSuccessResponse;
    } else if (endpoint.endsWith("/service-offering"))
      body = {
        serviceIds: ["s-test"],
        services: [
          {
            createdAt: "2026-01-01T00:00:00Z",
            isDeprecated: false,
            serviceId: "s-test",
            serviceName: "Example Product",
            serviceDescription: "Example product used by the billing test",
            serviceOrgId: "org-test",
            serviceProviderId: "sp-test",
            serviceProviderName: "Example Provider",
            serviceURLKey: "example-product",
            offerings: [
              {
                AutoApproveSubscription: true,
                productTierDocumentation: "",
                productTierID: "pt-test",
                productTierName: "Example Plan",
                productTierPricing: {},
                productTierSupport: "",
                productTierType: "OMNISTRATE_DEDICATED_TENANCY",
                productTierURLKey: "example-plan",
                productTierVersion: "1.0",
                resourceParameters: [],
                serviceAPIID: "sa-test",
                serviceAPIVersion: "v1",
                serviceEnvironmentID: "se-test",
                serviceEnvironmentName: "Production",
                serviceEnvironmentType: "PROD",
                serviceEnvironmentURLKey: "prod",
                serviceEnvironmentVisibility: "PUBLIC",
                serviceLogoURL: "",
                serviceModelID: "sm-test",
                serviceModelName: "Hosted",
                serviceModelStatus: "READY",
                serviceModelType: "OMNISTRATE_HOSTED",
                serviceModelURLKey: "hosted",
              },
            ],
          },
        ],
      } satisfies ListServiceOfferingSuccessResponse;
    else if (endpoint.endsWith("/subscription/request"))
      body = { ids: [], subscriptionRequests: [] } satisfies ListSubscriptionRequestsSuccessResponse;
    else if (endpoint.endsWith("/subscription"))
      body = {
        ids: mixed ? ["sub-cloud", "sub-stripe"] : ["sub-cloud"],
        subscriptions: [
          createSubscription("sub-cloud", "Marketplace Plan", true),
          ...(mixed ? [createSubscription("sub-stripe", "Stripe Plan", false)] : []),
        ],
      } satisfies ListSubscriptionsSuccessResponse;
    else if (endpoint.endsWith("/resource-instance"))
      body = {
        resourceInstances: [
          createResourceInstance("i-cloud", "sub-cloud"),
          ...(mixed ? [createResourceInstance("i-stripe", "sub-stripe")] : []),
        ],
      } satisfies ListAllResourceInstancesSuccessResponse;
    else if (endpoint.endsWith("/user"))
      body = {
        id: "user-test",
        name: "Test Customer",
        roleType: "root",
        status: "ACTIVE",
      } satisfies ProviderUser;
    else if (endpoint.endsWith("/usage")) body = { usage: [] } satisfies GetCurrentConsumptionUsageSuccessResponse;
    else if (endpoint.includes("product-tier-custom-metrics"))
      body = { productTiers: {}, unavailableProductTierIds: [] } satisfies ProductTierCustomMetricsResponse;
    else body = {};
    await route.fulfill({ json: body });
  });
});

test("marketplace payments stay external and do not require a Stripe payment method", async ({ page }, testInfo) => {
  await page.goto("/billing");
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
  expect(invoiceRequestProviders.every((provider) => provider === "STRIPE")).toBe(true);
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

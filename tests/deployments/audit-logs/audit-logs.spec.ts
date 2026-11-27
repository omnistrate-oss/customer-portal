import { AuditLogsPage } from "page-objects/audit-logs-page";
import { PageURLs } from "page-objects/pages";
import { expect, test } from "test-fixtures/har-test";

import { auditLogsTestIds } from "src/constants/testIds/audit-logs";
import type { ListAllAuditEventsSuccessResponse } from "src/types/auditEvent";
import type { ListAllResourceInstancesSuccessResponse } from "src/types/resourceInstance";
import type { ListServiceOfferingSuccessResponse } from "src/types/serviceOffering";
import type { ListSubscriptionsSuccessResponse, Subscription } from "src/types/subscription";
import type { ListSubscriptionRequestsSuccessResponse } from "src/types/subscriptionRequest";
import type { ProviderUser } from "src/types/users";

import { createJITAuditEvent, createUnsupportedJITAuditEvent, jitFixtureDefinitions } from "./jit-audit-fixtures";

test.use({ harMode: "off" });

const ordinaryEvent = {
  cloudProvider: "aws",
  cloudProviderAccountId: "210987654321",
  environmentType: "PROD",
  eventSource: "Customer",
  id: "event-ordinary",
  message: "Instance deployment failed",
  region: "us-west-2",
  resourceInstanceId: "instance-example",
  resourceName: "Postgres",
  subscriptionId: "sub-example",
  time: "2026-11-26T11:00:00Z",
  userId: "user-customer",
  userName: "Example Customer",
  userAgent: "customer-portal/test",
  workflowFailures: [{ eventTime: "2026-11-26T11:00:00Z", message: "Synthetic deployment failure" }],
} satisfies ListAllAuditEventsSuccessResponse["events"][number];

const dashboardEvent = {
  ...ordinaryEvent,
  id: "event-dashboard",
  message: "Updated a synthetic instance configuration",
  workflowFailures: [],
} satisfies ListAllAuditEventsSuccessResponse["events"][number];

const paginationEvents = Array.from({ length: 4 }, (_, index) => ({
  ...ordinaryEvent,
  id: `event-pagination-${index + 1}`,
  message: `Pagination event ${index + 1}`,
  workflowFailures: [],
})) satisfies ListAllAuditEventsSuccessResponse["events"];

const subscription: Subscription = {
  accountConfigIdentityId: "org-example",
  allowCreatesWhenPaymentNotConfigured: false,
  cloudProviderNames: ["aws"],
  createdAt: "2026-01-01T00:00:00Z",
  defaultSubscription: false,
  id: "sub-example",
  paymentMethodConfigured: true,
  productTierId: "pt-example",
  productTierName: "Example Plan",
  roleType: "root",
  rootUserId: "user-customer",
  serviceId: "s-example",
  serviceLogoURL: "",
  serviceName: "Example Product",
  serviceOrgId: "org-example",
  serviceOrgName: "Example Provider",
  status: "ACTIVE",
  subscriptionOwnerName: "Example Customer",
};

const serviceOfferings = {
  serviceIds: ["s-example"],
  services: [
    {
      createdAt: "2026-01-01T00:00:00Z",
      isDeprecated: false,
      serviceId: "s-example",
      serviceName: "Example Product",
      serviceDescription: "Synthetic product for audit-log tests",
      serviceOrgId: "org-example",
      serviceProviderId: "sp-example",
      serviceProviderName: "Example Provider",
      serviceURLKey: "example-product",
      offerings: [
        {
          AutoApproveSubscription: true,
          productTierDocumentation: "",
          productTierID: "pt-example",
          productTierName: "Example Plan",
          productTierPricing: {},
          productTierSupport: "",
          productTierType: "OMNISTRATE_DEDICATED_TENANCY",
          productTierURLKey: "example-plan",
          productTierVersion: "1.0",
          resourceParameters: [],
          serviceAPIID: "sa-example",
          serviceAPIVersion: "v1",
          serviceEnvironmentID: "se-example",
          serviceEnvironmentName: "Production",
          serviceEnvironmentType: "PROD",
          serviceEnvironmentURLKey: "prod",
          serviceEnvironmentVisibility: "PUBLIC",
          serviceLogoURL: "",
          serviceModelID: "sm-example",
          serviceModelName: "Hosted",
          serviceModelStatus: "READY",
          serviceModelType: "OMNISTRATE_HOSTED",
          serviceModelURLKey: "hosted",
        },
      ],
    },
  ],
} satisfies ListServiceOfferingSuccessResponse;

test("renders ordinary and typed JIT audit events", async ({ page, context }) => {
  let auditQueryParams: Record<string, unknown> | undefined;
  let dashboardAuditQueryParams: Record<string, unknown> | undefined;
  const events = [
    ordinaryEvent,
    ...jitFixtureDefinitions.map(createJITAuditEvent),
    createUnsupportedJITAuditEvent(),
    ...paginationEvents,
  ];

  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const payload: { endpoint?: string; queryParams?: Record<string, unknown> } = request.postDataJSON() ?? {};
    const endpoint = payload.endpoint ?? new URL(request.url()).pathname;
    let body: unknown;

    if (endpoint.endsWith("/resource-instance/audit-events")) {
      const isDashboardRequest = payload.queryParams?.eventSourceTypes === "Customer";
      if (isDashboardRequest) dashboardAuditQueryParams = payload.queryParams;
      else auditQueryParams = payload.queryParams;

      const responseEvents = isDashboardRequest ? [dashboardEvent] : events;
      body = {
        events: responseEvents,
        ids: responseEvents.map((event) => event.id),
      } satisfies ListAllAuditEventsSuccessResponse;
    } else if (endpoint.endsWith("/resource-instance")) {
      body = { resourceInstances: [] } satisfies ListAllResourceInstancesSuccessResponse;
    } else if (endpoint.endsWith("/service-offering")) {
      body = serviceOfferings;
    } else if (endpoint.endsWith("/subscription/request")) {
      body = { ids: [], subscriptionRequests: [] } satisfies ListSubscriptionRequestsSuccessResponse;
    } else if (endpoint.endsWith("/subscription")) {
      body = { ids: [subscription.id], subscriptions: [subscription] } satisfies ListSubscriptionsSuccessResponse;
    } else if (endpoint.endsWith("/user")) {
      body = {
        id: "user-customer",
        name: "Example Customer",
        roleType: "root",
        status: "ACTIVE",
      } satisfies ProviderUser;
    } else {
      body = {};
    }

    await route.fulfill({ json: body });
  });

  const auditLogsPage = new AuditLogsPage(page);
  await auditLogsPage.navigate();

  await expect(page.getByRole("heading", { name: "Audit Logs" })).toBeVisible();
  await expect(page.getByRole("columnheader")).toHaveText([
    "",
    "Time",
    "Type",
    "Action",
    "Product",
    "Plan",
    "ID",
    "Message",
    "User",
    "Subscription Owner",
  ]);
  expect(auditQueryParams?.eventSourceTypes).toEqual(["Customer", "Infra", "Maintenance", "Operations"]);

  const ordinaryRow = auditLogsPage.rowWithMessage(ordinaryEvent.message);
  await expect(ordinaryRow).toContainText("Example Product");
  await expect(ordinaryRow).toContainText("Example Plan");
  await expect(ordinaryRow).toContainText("instance-example");
  await expect(ordinaryRow).toContainText("Example Customer");
  await ordinaryRow.getByRole("button", { name: "Copy message" }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(ordinaryEvent.message);

  for (const definition of jitFixtureDefinitions) {
    const row = auditLogsPage.rowWithMessage(`${definition.action} just-in-time access`);
    await expect(row).toContainText(definition.action);
    await expect(row).toContainText("account-123456789012");
    await expect(row).toContainText(definition.actor.kind === "system" ? "System" : definition.actor.userId);
  }

  const expiredRow = auditLogsPage.rowWithMessage("Expired just-in-time access");
  await expect(expiredRow.getByTestId(auditLogsTestIds.actionChip("Expired"))).toHaveCSS(
    "background-color",
    "rgb(248, 249, 252)"
  );

  const requestedRow = auditLogsPage.rowWithMessage("Requested just-in-time access");
  await expect(requestedRow.getByRole("link", { name: "user-provider-requester" })).toHaveCount(0);
  await requestedRow.getByRole("button", { name: "Copy account ID" }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("123456789012");

  const requestedDetails = await auditLogsPage.expandEvent("event-jit-requested");
  await expect(requestedDetails).toContainText("customer-production");
  await expect(requestedDetails).toContainText("Reader");
  await expect(requestedDetails).toContainText("Investigate a synthetic availability issue");

  const approvedDetails = await auditLogsPage.expandEvent("event-jit-approved");
  await expect(approvedDetails).toContainText("Manual");
  await expect(approvedDetails).toContainText("1 hour");
  await expect(approvedDetails).toContainText("2026-11-26 13:00:00 UTC");

  const revokedDetails = await auditLogsPage.expandEvent("event-jit-revoked");
  await expect(revokedDetails).toContainText("30 minutes");

  const expiredDetails = await auditLogsPage.expandEvent("event-jit-expired");
  await expect(expiredDetails).toContainText("1 hour");

  const unsupportedRow = auditLogsPage.rowWithMessage("Escalated just-in-time access");
  await expect(unsupportedRow.getByText("-", { exact: true })).toHaveCount(4);

  const ordinaryDetails = await auditLogsPage.expandEvent("event-ordinary");
  await expect(ordinaryDetails).toContainText("Postgres");
  await expect(ordinaryDetails).toContainText("customer-portal/test");
  await expect(ordinaryDetails).toContainText("Synthetic deployment failure");
  await ordinaryDetails.getByRole("button", { name: "Click to copy" }).first().click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(ordinaryEvent.message);

  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Page 2", { exact: true })).toBeVisible();
  await expect(auditLogsPage.rowWithMessage("Pagination event 4")).toBeVisible();

  await page.getByText("Filter by Type", { exact: true }).click();
  const operationsOption = page.getByRole("option", { name: /Operations/ });
  await expect(operationsOption).toBeVisible();
  await operationsOption.click();
  await page.keyboard.press("Escape");
  await expect.poll(() => auditQueryParams?.eventSourceTypes).toEqual(["Operations"]);
  await expect(page.getByText("Page 1", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /(Expand|Collapse) audit event event-ordinary/ })).toBeVisible();

  await page.goto(PageURLs.dashboard);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("columnheader")).toHaveText([
    "",
    "Time",
    "Product",
    "Plan",
    "ID",
    "Message",
    "User",
    "Subscription Owner",
  ]);
  expect(dashboardAuditQueryParams?.eventSourceTypes).toBe("Customer");
  expect(dashboardAuditQueryParams?.pageSize).toBe(5);

  const dashboardRow = auditLogsPage.rowWithMessage(dashboardEvent.message);
  await expect(dashboardRow).toContainText("Example Product");
  await expect(dashboardRow).toContainText("Example Plan");
  const dashboardDetails = await auditLogsPage.expandEvent(dashboardEvent.id);
  await expect(dashboardDetails).toContainText(dashboardEvent.message);
});

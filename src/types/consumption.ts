import type { components, paths } from "./schema";

export type GetCurrentConsumptionUsageSuccessResponse =
  paths["/2022-09-01-00/resource-instance/usage"]["get"]["responses"]["200"]["content"]["application/json"];

export type GetConsumptionUsagePerDaySuccessResponse =
  paths["/2022-09-01-00/resource-instance/usage-per-day"]["get"]["responses"]["200"]["content"]["application/json"];

export type DescribeConsumptionBillingStatusResponse =
  paths["/2022-09-01-00/resource-instance/billing-status"]["get"]["responses"]["200"]["content"]["application/json"];

export type ListConsumptionInvoicesSuccessResponse =
  paths["/2022-09-01-00/resource-instance/invoice"]["get"]["responses"]["200"]["content"]["application/json"];

export type DescribeConsumptionBillingDetailsSuccessResponse =
  paths["/2022-09-01-00/resource-instance/billing-details"]["get"]["responses"]["200"]["content"]["application/json"];

export type Invoice = components["schemas"]["Invoice"];

export type ConsumptionUsagePerDay = components["schemas"]["GetConsumptionUsageResult"];

export type ConsumptionUsage = components["schemas"]["GetConsumptionUsageResult"];

export type UsageDimension = "Memory GiB hours" | "Storage GiB hours" | "CPU core hours" | "Replica hours";

export type ConsumptionPaymentMethod = {
  id: string;
  type: string;
  displayName: string;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  bankName?: string;
  isDefault: boolean;
};

export type ListConsumptionPaymentMethodsSuccessResponse = {
  paymentMethods?: ConsumptionPaymentMethod[];
};

export type CreateConsumptionSetupIntentSuccessResponse = {
  clientSecret: string;
};

export type ConsumptionStripeConfigResponse = {
  publishableKey: string;
  stripeAccountId?: string;
};

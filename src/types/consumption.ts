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

import { UsageDimension } from "src/types/consumption";

export type BillingUsageRowField =
  | "memoryGiBHours"
  | "storageGiBHours"
  | "cpuCoreHours"
  | "replicaHours"
  | "deploymentCellHours"
  | "gpu";

export type BillingUsageTotals = Record<BillingUsageRowField, number>;
export type BillingUsageChartLabel = UsageDimension | "GPU core hours";

type UsageDimensionData = {
  dimension?: string;
  total?: number;
};

export type BillingUsageDimensionField = {
  dimension: UsageDimension;
  rowField: BillingUsageRowField;
  title: string;
  unit: string;
  tableHeader: string;
  chartColor: string;
  chartLabel?: BillingUsageChartLabel;
  chartValueDivisor?: number;
};

export const billingUsageDimensionFields = [
  {
    dimension: "Memory GiB hours",
    rowField: "memoryGiBHours",
    title: "Memory",
    unit: "GiB-hr",
    tableHeader: "Memory (GiB hrs)",
    chartColor: "#3E97FF",
  },
  {
    dimension: "Storage GiB hours",
    rowField: "storageGiBHours",
    title: "Storage",
    unit: "GiB-hr",
    tableHeader: "Storage (GiB hrs)",
    chartColor: "#10AA50",
  },
  {
    dimension: "CPU core hours",
    rowField: "cpuCoreHours",
    title: "CPU",
    unit: "Core-hr",
    tableHeader: "CPU (core hrs)",
    chartColor: "#7239EA",
  },
  {
    dimension: "Replica hours",
    rowField: "replicaHours",
    title: "Replicas",
    unit: "hr",
    tableHeader: "Replica (hrs)",
    chartColor: "#E25300",
  },
  {
    dimension: "Deployment cell hours",
    rowField: "deploymentCellHours",
    title: "Deployment cells",
    unit: "hr",
    tableHeader: "Deployment Cell (hrs)",
    chartColor: "#097A7A",
  },
  {
    dimension: "GPU millicore hours",
    rowField: "gpu",
    title: "GPU",
    unit: "millicore-hr",
    tableHeader: "GPU (millicore hrs)",
    chartColor: "#D4447E",
    chartLabel: "GPU core hours",
    chartValueDivisor: 1000,
  },
] as const satisfies readonly BillingUsageDimensionField[];

export function getBillingUsageDimensionField(dimension: UsageDimension) {
  return billingUsageDimensionFields.find((field) => field.dimension === dimension);
}

export function getEmptyBillingUsageTotals(): BillingUsageTotals {
  return billingUsageDimensionFields.reduce((acc, field) => {
    acc[field.rowField] = 0;
    return acc;
  }, {} as BillingUsageTotals);
}

/**
 * Horizontally separates overlapping line dots when multiple dimensions share the same date bucket.
 */
export function getUsageDimensionChartOffset(index: number, dimensionCount = billingUsageDimensionFields.length) {
  const offsetStep = 11;
  return (index - (dimensionCount - 1) / 2) * offsetStep;
}

export function getUsageDimensionChartLabel(field: BillingUsageDimensionField): BillingUsageChartLabel {
  return field.chartLabel ?? field.dimension;
}

export function getUsageDimensionChartValue(field: BillingUsageDimensionField, value: number): number {
  return value / (field.chartValueDivisor ?? 1);
}

export function getUsageDimensionTotals(usage: UsageDimensionData[] = []): BillingUsageTotals {
  const totals = getEmptyBillingUsageTotals();

  usage.forEach(({ dimension, total }) => {
    const field = billingUsageDimensionFields.find((field) => field.dimension === dimension);
    if (field && typeof total === "number") {
      totals[field.rowField] += total;
    }
  });

  return totals;
}

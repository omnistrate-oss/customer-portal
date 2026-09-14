import type { BuiltInUsageDimension, UsageDimension } from "src/types/consumption";

export type BillingUsageRowField =
  | "memoryGiBHours"
  | "storageGiBHours"
  | "cpuCoreHours"
  | "replicaHours"
  | "deploymentCellHours"
  | "gpu";

export type BillingUsageTotals = Record<BillingUsageRowField, number>;
export type BillingUsageChartLabel = UsageDimension | "GPU core hours";
export type UsageMetricValues = Record<string, number>;
export type UsageChartDataPoint = { date: string } & Record<string, string | number>;

type UsageDimensionData = {
  dimension?: string;
  total?: number;
};

type DailyUsageDimensionData = UsageDimensionData & {
  startTime?: string;
};

export type UsageMetricField = {
  dimension: string;
  key: string;
  title: string;
  unit: string;
  tableHeader: string;
  chartColor: string;
  chartLabel: string;
  chartValueDivisor?: number;
  isCustom: boolean;
};

export type UsageMetricRegistry = {
  builtInFields: UsageMetricField[];
  additionalFields: UsageMetricField[];
  allFields: UsageMetricField[];
};

export type BillingUsageDimensionField = UsageMetricField & {
  dimension: BuiltInUsageDimension;
  key: BillingUsageRowField;
  rowField: BillingUsageRowField;
  isCustom: false;
};

export const billingUsageDimensionFields = [
  {
    dimension: "Memory GiB hours",
    key: "memoryGiBHours",
    rowField: "memoryGiBHours",
    title: "Memory",
    unit: "GiB-hr",
    tableHeader: "Memory (GiB hrs)",
    chartColor: "#3E97FF",
    chartLabel: "Memory GiB hours",
    isCustom: false,
  },
  {
    dimension: "Storage GiB hours",
    key: "storageGiBHours",
    rowField: "storageGiBHours",
    title: "Storage",
    unit: "GiB-hr",
    tableHeader: "Storage (GiB hrs)",
    chartColor: "#10AA50",
    chartLabel: "Storage GiB hours",
    isCustom: false,
  },
  {
    dimension: "CPU core hours",
    key: "cpuCoreHours",
    rowField: "cpuCoreHours",
    title: "CPU",
    unit: "Core-hr",
    tableHeader: "CPU (core hrs)",
    chartColor: "#7239EA",
    chartLabel: "CPU core hours",
    isCustom: false,
  },
  {
    dimension: "Replica hours",
    key: "replicaHours",
    rowField: "replicaHours",
    title: "Replicas",
    unit: "hr",
    tableHeader: "Replica (hrs)",
    chartColor: "#E25300",
    chartLabel: "Replica hours",
    isCustom: false,
  },
  {
    dimension: "Deployment cell hours",
    key: "deploymentCellHours",
    rowField: "deploymentCellHours",
    title: "Deployment cells",
    unit: "hr",
    tableHeader: "Deployment Cell (hrs)",
    chartColor: "#097A7A",
    chartLabel: "Deployment cell hours",
    isCustom: false,
  },
  {
    dimension: "GPU millicore hours",
    key: "gpu",
    rowField: "gpu",
    title: "GPU",
    unit: "millicore-hr",
    tableHeader: "GPU (millicore hrs)",
    chartColor: "#D4447E",
    chartLabel: "GPU core hours",
    chartValueDivisor: 1000,
    isCustom: false,
  },
] as const satisfies readonly BillingUsageDimensionField[];

export const customMetricColors = ["#FDB022", "#6B7280", "#363F72", "#84AD16", "#B54708", "#0BA5EC", "#7A5AF8"];

const customMetricFieldPrefix = "customMetric_";

function getCustomMetricKey(dimension: string): string {
  return `${customMetricFieldPrefix}${dimension}`;
}

export function isCustomMetricFieldKey(fieldKey: string | undefined): boolean {
  return Boolean(fieldKey?.startsWith(customMetricFieldPrefix));
}

/**
 * Builds the ordered metric metadata shared by Billing and Cost Explorer.
 * Built-in metrics remain first, configured metrics keep their supplied order,
 * and metrics found only in usage data are appended alphabetically.
 */
export function getUsageMetricFields(
  configuredCustomMetricNames: readonly string[] = [],
  observedDimensions: readonly string[] = []
): UsageMetricField[] {
  const builtInDimensions = new Set<string>(billingUsageDimensionFields.map((field) => field.dimension));
  const customMetricNames: string[] = [];
  const seenCustomMetrics = new Set<string>();

  configuredCustomMetricNames.forEach((name) => {
    if (!name || builtInDimensions.has(name) || seenCustomMetrics.has(name)) return;
    seenCustomMetrics.add(name);
    customMetricNames.push(name);
  });

  Array.from(
    new Set(observedDimensions.filter((name) => name && !builtInDimensions.has(name) && !seenCustomMetrics.has(name)))
  )
    .sort((left, right) => left.localeCompare(right))
    .forEach((name) => {
      seenCustomMetrics.add(name);
      customMetricNames.push(name);
    });

  return [
    ...billingUsageDimensionFields,
    ...customMetricNames.map<UsageMetricField>((name, index) => ({
      dimension: name,
      key: getCustomMetricKey(name),
      title: name,
      unit: "",
      tableHeader: name,
      chartColor: customMetricColors[index % customMetricColors.length],
      chartLabel: name,
      isCustom: true,
    })),
  ];
}

export function getUsageMetricRegistry(
  configuredCustomMetricNames: readonly string[] = [],
  observedDimensions: readonly string[] = []
): UsageMetricRegistry {
  const allFields = getUsageMetricFields(configuredCustomMetricNames, observedDimensions);

  return {
    builtInFields: allFields.filter((field) => !field.isCustom),
    additionalFields: allFields.filter((field) => field.isCustom),
    allFields,
  };
}

/** Extends a registry with dimensions discovered in a later usage response. */
export function extendUsageMetricFields(
  metricFields: readonly UsageMetricField[],
  observedDimensions: readonly string[]
): UsageMetricField[] {
  const configuredCustomMetricNames = metricFields.filter((field) => field.isCustom).map((field) => field.dimension);
  return getUsageMetricFields(configuredCustomMetricNames, observedDimensions);
}

export function getBillingUsageDimensionField(dimension: string) {
  return billingUsageDimensionFields.find((field) => field.dimension === dimension);
}

/** Creates safe storage for arbitrary, customer-defined metric names. */
export function createUsageMetricValues(): UsageMetricValues {
  return Object.create(null) as UsageMetricValues;
}

export function getUsageTotal(usage: Pick<UsageDimensionData, "total">): number {
  return typeof usage.total === "number" && Number.isFinite(usage.total) ? usage.total : 0;
}

/** Sums backend-produced totals that share the same exact, case-sensitive dimension name. */
export function getUsageMetricValues(usage: readonly UsageDimensionData[] = []): UsageMetricValues {
  return usage.reduce<UsageMetricValues>((values, item) => {
    if (typeof item.dimension === "string" && item.dimension) {
      values[item.dimension] = (values[item.dimension] ?? 0) + getUsageTotal(item);
    }
    return values;
  }, createUsageMetricValues());
}

export function combineUsageMetricValues(metricValueSets: readonly UsageMetricValues[]): UsageMetricValues {
  return metricValueSets.reduce<UsageMetricValues>((combined, values) => {
    Object.entries(values).forEach(([dimension, value]) => {
      if (Number.isFinite(value)) {
        combined[dimension] = (combined[dimension] ?? 0) + value;
      }
    });
    return combined;
  }, createUsageMetricValues());
}

export function getUsageMetricTableValue(
  metricValues: UsageMetricValues,
  dimension: string,
  configuredMetricNames: ReadonlySet<string>
): number | "—" {
  if (Object.prototype.hasOwnProperty.call(metricValues, dimension)) {
    return metricValues[dimension];
  }

  return configuredMetricNames.has(dimension) ? 0 : "—";
}

/** Groups backend-produced totals by date and exact dimension name. */
export function aggregateUsageByDateAndDimension(
  usage: readonly DailyUsageDimensionData[] = []
): Record<string, UsageMetricValues> {
  return usage.reduce<Record<string, UsageMetricValues>>(
    (valuesByDate, item) => {
      if (
        typeof item.startTime !== "string" ||
        !item.startTime ||
        typeof item.dimension !== "string" ||
        !item.dimension
      ) {
        return valuesByDate;
      }

      valuesByDate[item.startTime] ??= createUsageMetricValues();
      valuesByDate[item.startTime][item.dimension] =
        (valuesByDate[item.startTime][item.dimension] ?? 0) + getUsageTotal(item);

      return valuesByDate;
    },
    Object.create(null) as Record<string, UsageMetricValues>
  );
}

export function getEmptyBillingUsageTotals(): BillingUsageTotals {
  return billingUsageDimensionFields.reduce((acc, field) => {
    acc[field.rowField] = 0;
    return acc;
  }, {} as BillingUsageTotals);
}

/** Horizontally separates overlapping line dots when dimensions share a date bucket. */
export function getUsageDimensionChartOffset(
  index: number,
  dimensionCount: number = billingUsageDimensionFields.length
) {
  const offsetStep = 11;
  return (index - (dimensionCount - 1) / 2) * offsetStep;
}

export function getUsageDimensionChartLabel(field: Pick<UsageMetricField, "chartLabel">): BillingUsageChartLabel {
  return field.chartLabel;
}

export function getUsageMetricChartValue(
  field: Pick<UsageMetricField, "chartValueDivisor">,
  value: number | undefined
): number {
  const normalizedValue = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return normalizedValue / (field.chartValueDivisor ?? 1);
}

type UsageChartWidthOptions = {
  barWidth?: number;
  barGap?: number;
  barCategoryGap?: number;
  marginLeft?: number;
  marginRight?: number;
};

/** Calculates the minimum width needed to keep every visible metric bar readable within each date bucket. */
export function getUsageChartMinimumWidth(
  dateBucketCount: number,
  visibleMetricCount: number,
  options: UsageChartWidthOptions = {}
): number {
  const { barWidth = 10, barGap = 1, barCategoryGap = 20, marginLeft = 0, marginRight = 0 } = options;
  const normalizedDateBucketCount = Math.max(Math.floor(dateBucketCount), 0);
  const normalizedMetricCount = Math.max(Math.floor(visibleMetricCount), 1);
  const barGroupWidth = normalizedMetricCount * barWidth + Math.max(normalizedMetricCount - 1, 0) * barGap;

  return normalizedDateBucketCount * (barGroupWidth + barCategoryGap) + marginLeft + marginRight;
}

export function getUsageChartData(
  usage: readonly DailyUsageDimensionData[] = [],
  metricFields: readonly UsageMetricField[] = billingUsageDimensionFields
): UsageChartDataPoint[] {
  const valuesByDate = aggregateUsageByDateAndDimension(usage);

  return Object.entries(valuesByDate)
    .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate))
    .map(([date, metricValues]) => {
      const dataPoint: UsageChartDataPoint = { date };

      metricFields.forEach((field) => {
        dataPoint[field.key] = getUsageMetricChartValue(field, metricValues[field.dimension]);
      });

      return dataPoint;
    });
}

export function getUsageDimensionChartValue(field: BillingUsageDimensionField, value: number): number {
  return getUsageMetricChartValue(field, value);
}

/** Legacy fixed-field projection retained while the chart is migrated to UsageMetricValues. */
export function getUsageDimensionTotals(usage: readonly UsageDimensionData[] = []): BillingUsageTotals {
  const metricValues = getUsageMetricValues(usage);

  return billingUsageDimensionFields.reduce((totals, field) => {
    totals[field.rowField] = metricValues[field.dimension] ?? 0;
    return totals;
  }, getEmptyBillingUsageTotals());
}

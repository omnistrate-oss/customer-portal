import type { UsageMetricField, UsageMetricRegistry } from "../../billing/utils/usageDimensions";

export function reconcileSelectedMetricNames(
  selectedMetricNames: readonly string[],
  availableMetricFields: readonly UsageMetricField[]
): string[] {
  const availableMetricNames = new Set(availableMetricFields.map((field) => field.dimension));
  return selectedMetricNames.filter((metricName) => availableMetricNames.has(metricName));
}

type GetVisibleMetricFieldsParams = {
  controlsEnabled: boolean;
  availableMetricRegistry: UsageMetricRegistry;
  selectableMetricRegistry: UsageMetricRegistry;
  selectedAdditionalMetricNames: readonly string[];
};

export function getVisibleMetricFields(params: GetVisibleMetricFieldsParams): UsageMetricField[] {
  const { controlsEnabled, availableMetricRegistry, selectableMetricRegistry, selectedAdditionalMetricNames } = params;

  if (!controlsEnabled) {
    return availableMetricRegistry.allFields;
  }

  const selectedMetricNames = new Set(selectedAdditionalMetricNames);
  return [
    ...selectableMetricRegistry.builtInFields,
    ...selectableMetricRegistry.additionalFields.filter((field) => selectedMetricNames.has(field.dimension)),
  ];
}

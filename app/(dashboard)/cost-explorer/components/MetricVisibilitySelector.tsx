import { FC } from "react";

import Autocomplete from "src/components/FormElementsv2/AutoComplete/AutoComplete";
import { Text } from "src/components/Typography/Typography";

import type { UsageMetricField } from "../../billing/utils/usageDimensions";

type MetricVisibilitySelectorProps = {
  metricFields: UsageMetricField[];
  selectedMetricNames: string[];
  onChange: (metricNames: string[]) => void;
};

const MetricVisibilitySelector: FC<MetricVisibilitySelectorProps> = (props) => {
  const { metricFields, selectedMetricNames, onChange } = props;
  const selectedMetricNamesSet = new Set(selectedMetricNames);
  const selectedMetricFields = metricFields.filter((field) => selectedMetricNamesSet.has(field.dimension));

  return (
    <div className="w-[320px]">
      <Text size="xsmall" weight="medium" color="#414651">
        Additional metrics
      </Text>
      <Autocomplete
        multiple
        disableCloseOnSelect
        marginTop="4px"
        options={metricFields}
        value={selectedMetricFields}
        placeholder="Select additional metrics"
        getOptionLabel={(option: UsageMetricField) => option.title}
        isOptionEqualToValue={(option: UsageMetricField, value: UsageMetricField) =>
          option.dimension === value.dimension
        }
        onChange={(_: unknown, selectedFields: UsageMetricField[]) => {
          onChange(selectedFields.map((field) => field.dimension));
        }}
      />
    </div>
  );
};

export default MetricVisibilitySelector;

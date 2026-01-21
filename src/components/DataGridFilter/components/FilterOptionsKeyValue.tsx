import { useCallback, useMemo } from "react";
import { Stack } from "@mui/material";

import FieldLabel from "src/components/FormElements/FieldLabel/FieldLabel";
import Autocomplete from "src/components/FormElementsv2/AutoComplete/AutoComplete";
import { Text } from "src/components/Typography/Typography";

type KeyValueOption = {
  label: string;
  value: string;
};

type KeyConfig = {
  key: string;
  label: string;
  possibleValues: KeyValueOption[];
};

type FilterOptionsKeyValueProps = {
  keys: KeyConfig[];
  selectedValues: string[];
  onChange: (selectedValues: string[]) => void;
};

const KEY_VALUE_SEPARATOR = ":";

const parseSelectedValues = (selectedValues: string[]): Map<string, Set<string>> => {
  const map = new Map<string, Set<string>>();

  selectedValues.forEach((kv) => {
    const separatorIndex = kv.indexOf(KEY_VALUE_SEPARATOR);
    if (separatorIndex > -1) {
      const key = kv.slice(0, separatorIndex);
      const value = kv.slice(separatorIndex + 1);
      if (!map.has(key)) {
        map.set(key, new Set());
      }
      map.get(key)!.add(value);
    }
  });

  return map;
};

const combineSelectedValues = (map: Map<string, Set<string>>): string[] => {
  const result: string[] = [];

  map.forEach((values, key) => {
    values.forEach((value) => {
      result.push(`${key}${KEY_VALUE_SEPARATOR}${value}`);
    });
  });

  return result;
};

const FilterOptionsKeyValue: React.FC<FilterOptionsKeyValueProps> = ({ keys, selectedValues, onChange }) => {
  const selectedValuesMap = useMemo(() => parseSelectedValues(selectedValues), [selectedValues]);

  const handleKeyChange = useCallback(
    (keyId: string, newValues: string[]) => {
      const newMap = new Map(selectedValuesMap);
      if (newValues.length === 0) {
        newMap.delete(keyId);
      } else {
        newMap.set(keyId, new Set(newValues));
      }
      onChange(combineSelectedValues(newMap));
    },
    [selectedValuesMap, onChange]
  );

  return (
    <Stack gap="12px">
      {keys.length === 0 && (
        <Text size="small" weight="medium" color="#717680">
          No options found
        </Text>
      )}
      {keys.map((keyConfig) => {
        const keySelectedValues = selectedValuesMap.get(keyConfig.key) || new Set<string>();
        const selectedOptions = keyConfig.possibleValues.filter((opt) => keySelectedValues.has(opt.value));

        return (
          <div key={keyConfig.key}>
            <FieldLabel>{keyConfig.label}</FieldLabel>
            <Autocomplete
              multiple
              options={keyConfig.possibleValues}
              value={selectedOptions}
              onChange={(_event: unknown, newValue: KeyValueOption[]) => {
                handleKeyChange(
                  keyConfig.key,
                  newValue.map((opt) => opt.value)
                );
              }}
              getOptionLabel={(option: KeyValueOption) => option.label}
              isOptionEqualToValue={(option: KeyValueOption, value: KeyValueOption) => option.value === value.value}
              placeholder={keyConfig.label.toLowerCase()}
              disableCloseOnSelect
            />
          </div>
        );
      })}
    </Stack>
  );
};

export default FilterOptionsKeyValue;

import { FC, useEffect, useRef } from "react";

import Tooltip from "src/components/Tooltip/Tooltip";
import { Text } from "src/components/Typography/Typography";
import { SVGIconProps } from "src/types/common/generalTypes";

import { getBillingUsageDimensionField } from "../utils/usageDimensions";

import {
  ComputeIcon,
  CustomMetricIcon,
  DeploymentCellIcon,
  GPUIcon,
  MemoryIcon,
  ReplicaIcon,
  StorageIcon,
} from "./Icons";

type UsageDimensionCardProps = {
  dimensionName: string;
  value: number;
  title: string;
  unit?: string;
  forceUnitBelow?: boolean;
  onInlineValueOverflowChange?: (dimensionName: string, overflows: boolean) => void;
};

const usageDimensionIconMap: Record<string, FC<SVGIconProps>> = {
  "Memory GiB hours": MemoryIcon,
  "Storage GiB hours": StorageIcon,
  "CPU core hours": ComputeIcon,
  "Replica hours": ReplicaIcon,
  "Deployment cell hours": DeploymentCellIcon,
  "GPU millicore hours": GPUIcon,
};

const UsageDimensionCard: FC<UsageDimensionCardProps> = (props) => {
  const {
    dimensionName,
    value,
    title,
    unit: providedUnit,
    forceUnitBelow = false,
    onInlineValueOverflowChange,
  } = props;
  const Icon = Object.prototype.hasOwnProperty.call(usageDimensionIconMap, dimensionName)
    ? usageDimensionIconMap[dimensionName]
    : CustomMetricIcon;
  const unit = providedUnit ?? getBillingUsageDimensionField(dimensionName)?.unit ?? "";
  const formattedValue = value.toLocaleString();
  const valueColumnRef = useRef<HTMLDivElement>(null);
  const inlineValueMeasurementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const valueColumn = valueColumnRef.current;
    const inlineValueMeasurement = inlineValueMeasurementRef.current;

    if (!unit || !onInlineValueOverflowChange || !valueColumn || !inlineValueMeasurement) return;

    const reportOverflow = () => {
      onInlineValueOverflowChange(
        dimensionName,
        inlineValueMeasurement.getBoundingClientRect().width - valueColumn.getBoundingClientRect().width > 0.5
      );
    };

    reportOverflow();

    const resizeObserver = new ResizeObserver(reportOverflow);
    resizeObserver.observe(valueColumn);
    resizeObserver.observe(inlineValueMeasurement);

    return () => resizeObserver.disconnect();
  }, [dimensionName, formattedValue, onInlineValueOverflowChange, unit]);

  return (
    <div
      className="flex min-h-[78px] w-full items-start rounded-[8px] border border-[#E9EAEB] bg-white p-5"
      style={{ boxShadow: "0px 1px 2px 0px #0A0D120D" }}
    >
      <div className="grid w-full min-w-0 grid-cols-[32px_minmax(0,1fr)] gap-x-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] border border-[#E9EAEB] bg-white shadow-[0px_1px_2px_0px_#0A0D120D]">
          <Icon aria-hidden="true" />
        </div>
        <Tooltip title={title}>
          <div className="min-w-0 self-start overflow-hidden">
            <Text size="xsmall" weight="medium" color="#414651" ellipsis maxWidth="100%">
              {title}
            </Text>
          </div>
        </Tooltip>
        <div ref={valueColumnRef} className="relative col-start-2 min-w-0">
          {unit && onInlineValueOverflowChange && (
            <div
              ref={inlineValueMeasurementRef}
              className="pointer-events-none invisible absolute left-0 top-0 flex w-max items-baseline gap-x-[5px] whitespace-nowrap"
              aria-hidden="true"
            >
              <Text size="xlarge" weight="bold" color="#181D27">
                {formattedValue}
              </Text>
              <Text size="xsmall" weight="medium" color="#181D27">
                {unit}
              </Text>
            </div>
          )}
          <div className={`flex min-w-0 ${forceUnitBelow ? "flex-col items-start" : "items-baseline gap-x-[5px]"}`}>
            <Text size="xlarge" weight="bold" color="#181D27">
              {formattedValue}
            </Text>
            {unit && (
              <Text size="xsmall" weight="medium" color="#181D27">
                {unit}
              </Text>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageDimensionCard;

import { FC } from "react";

import { Text } from "src/components/Typography/Typography";
import { UsageDimension } from "src/types/consumption";

import { ComputeIcon, MemoryIcon, ReplicaIcon, StorageIcon } from "./Icons";

type UsageDimensionCardProps = {
  dimensionName: UsageDimension;
  value: number;
  title: string;
};

const usageDimensionIconMap = {
  "Memory GiB hours": MemoryIcon,
  "Storage GiB hours": StorageIcon,
  "CPU core hours": ComputeIcon,
  "Replica hours": ReplicaIcon,
};

const usageDimensionUnitMap: Record<UsageDimension, string> = {
  "Memory GiB hours": "GiB",
  "Storage GiB hours": "GiB-hr",
  "CPU core hours": "Core-hr",
  "Replica hours": "hr",
};

const UsageDimensionCard: FC<UsageDimensionCardProps> = (props) => {
  const { dimensionName, value, title } = props;
  const Icon = usageDimensionIconMap[dimensionName];
  const unit = usageDimensionUnitMap[dimensionName];
  const formattedValue = value.toLocaleString();

  return (
    <div
      className="flex min-h-[78px] w-full items-center rounded-[8px] border border-[#E9EAEB] bg-white p-5"
      style={{ boxShadow: "0px 1px 2px 0px #0A0D120D" }}
    >
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] border border-[#E9EAEB] bg-white shadow-[0px_1px_2px_0px_#0A0D120D]">
          <Icon aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <Text size="xsmall" weight="medium" color="#414651">
            {title}
          </Text>
          <div className="mt-1 flex min-w-0 items-baseline gap-[5px]">
            <Text size="xlarge" weight="bold" color="#181D27">
              {formattedValue}
            </Text>
            <Text size="xsmall" weight="medium" color="#181D27" ellipsis>
              {unit}
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageDimensionCard;

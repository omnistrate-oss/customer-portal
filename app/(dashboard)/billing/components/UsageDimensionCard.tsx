import { FC } from "react";

import { Text } from "src/components/Typography/Typography";
import { UsageDimension } from "src/types/consumption";

import { getBillingUsageDimensionField } from "../utils/usageDimensions";

import { ComputeIcon, DeploymentCellIcon, MemoryIcon, ReplicaIcon, StorageIcon } from "./Icons";

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
  "Deployment cell hours": DeploymentCellIcon,
  "GPU millicore hours": ComputeIcon,
};

const UsageDimensionCard: FC<UsageDimensionCardProps> = (props) => {
  const { dimensionName, value, title } = props;
  const Icon = usageDimensionIconMap[dimensionName];
  const unit = getBillingUsageDimensionField(dimensionName)?.unit || "";
  const formattedValue = value.toLocaleString();

  return (
    <div
      className="flex min-h-[78px] w-full items-start rounded-[8px] border border-[#E9EAEB] bg-white p-5"
      style={{ boxShadow: "0px 1px 2px 0px #0A0D120D" }}
    >
      <div className="grid w-full min-w-0 grid-cols-[32px_minmax(0,1fr)] gap-x-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] border border-[#E9EAEB] bg-white shadow-[0px_1px_2px_0px_#0A0D120D]">
          <Icon aria-hidden="true" />
        </div>
        <div className="min-w-0 self-start">
          <Text size="xsmall" weight="medium" color="#414651">
            {title}
          </Text>
        </div>
        <div className="col-start-2 mt-1 flex min-w-0 items-baseline gap-[5px]">
          <Text size="xlarge" weight="bold" color="#181D27">
            {formattedValue}
          </Text>
          <Text size="xsmall" weight="medium" color="#181D27" ellipsis>
            {unit}
          </Text>
        </div>
      </div>
    </div>
  );
};

export default UsageDimensionCard;

import { useMemo } from "react";
import { Label, Legend, Pie, PieChart } from "recharts";

import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Text } from "src/components/Typography/Typography";
import { resourceInstanceStatusMap } from "src/constants/statusChipStyles/resourceInstanceStatus";
import { ResourceInstance } from "src/types/resourceInstance";

import CustomLegend from "./CustomLegend";
import { useDynamicInnerRadius } from "./useDynamicInnerRadius";

const chartConfig = {
  instances: {
    label: "Instances",
    color: "#B7C7C8",
  },
  RUNNING: {
    label: "Running",
    color: "#7BBC29",
  },
  FAILED: {
    label: "Failed",
    color: "#E1584A",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "#9AC5C1",
  },
  STOPPED: {
    label: "Stopped",
    color: "#FF8D81",
  },
  UNKNOWN: {
    label: "Unknown",
    color: "#727272",
  },
  DEPLOYING: {
    label: "Deploying",
    color: "#FF975D",
  },
  Other: {
    label: "Other",
    color: "#599BFF",
  },
} satisfies ChartConfig;

type LifecycleStatusChartProps = {
  instances: ResourceInstance[];
};

const LifecycleStatusChart: React.FC<LifecycleStatusChartProps> = ({ instances }) => {
  const { ref, radius } = useDynamicInnerRadius();

  const knownStatuses = ["RUNNING", "FAILED", "CANCELLED", "STOPPED", "UNKNOWN", "DEPLOYING"] as const; // <-- all the ones you want individual wedges for

  const chartData = useMemo(() => {
    const statusBreakdown: Record<string, number> = {}; // ✅ Define it here

    const counts = instances.reduce<Record<string, number>>((acc, { status }) => {
      if (!status) return acc;

      const isKnown = knownStatuses.includes(status as (typeof knownStatuses)[number]);
      const key = isKnown ? status : "Other";

      acc[key] = (acc[key] || 0) + 1;

      if (!isKnown) {
        const statusLabel = resourceInstanceStatusMap[status as keyof typeof resourceInstanceStatusMap];
        statusBreakdown[statusLabel?.label] = (statusBreakdown[statusLabel?.label] || 0) + 1;
      }

      return acc;
    }, {});

    return Object.entries(counts).map(([key, value]) => ({
      status: key,
      instances: value,
      fill: chartConfig[key as keyof typeof chartConfig]?.color,
      ...(key === "Other" ? { statusBreakdown } : {}), // Only attach statusBreakdown for "Other"
    }));
  }, [instances, knownStatuses]);

  if (!instances.length)
    return (
      <div className="h-[300px] flex items-center justify-center">
        <Text>No Instances</Text>
      </div>
    );

  return (
    <div ref={ref} className="w-full min-w-[200px] max-w-xl aspect-square mx-auto">
      <ChartContainer config={chartConfig} className="w-full h-full">
        <PieChart>
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Legend layout="vertical" verticalAlign="top" align="right" content={CustomLegend(chartConfig)} />
          <Pie data={chartData} dataKey="instances" nameKey="status" innerRadius={radius}>
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  // Dynamically calculate font size based on radius
                  const fontSize = "18px";
                  const fontWeight = "600";

                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{ fontSize, fontWeight }}
                      className="fill-foreground"
                    >
                      {instances?.length.toLocaleString()}
                    </text>
                  );
                }
                return null;
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>
    </div>
  );
};

export default LifecycleStatusChart;

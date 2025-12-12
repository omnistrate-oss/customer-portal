import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ResourceInstance } from "src/types/resourceInstance";

type CloudProvidersChartProps = {
  instances: ResourceInstance[];
};

const CloudProvidersChart: React.FC<CloudProvidersChartProps> = ({ instances }) => {
  const chartData = useMemo(() => {
    const awsCount = instances.filter((i) => i.cloud_provider === "aws").length;
    const gcpCount = instances.filter((i) => i.cloud_provider === "gcp").length;

    return [
      { cloud: "AWS", count: awsCount },
      { cloud: "GCP", count: gcpCount },
    ];
  }, [instances]);

  const chartConfig = {
    AWS: {
      label: "AWS",
      color: "#7F56D9",
    },
    GCP: {
      label: "GCP",
      color: "#7F560a",
    },
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ChartContainer config={chartConfig}>
        <BarChart data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="cloud" tickLine={false} tickMargin={10} axisLine={false} />
          <YAxis allowDecimals={false} axisLine={false} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={chartConfig[entry.cloud].color} />
            ))}
          </Bar>
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideLabel
                className="w-[180px]"
                formatter={(value, name, item) => (
                  <>
                    <div
                      className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[--color-bg]"
                      style={
                        {
                          "--color-bg": chartConfig[item.payload.cloud].color,
                        } as React.CSSProperties
                      }
                    />
                    {chartConfig[item.payload.cloud]?.label}
                    <div className="ml-auto font-mono font-medium tabular-nums text-foreground">{value}</div>
                  </>
                )}
              />
            }
            cursor={false}
          />
        </BarChart>
      </ChartContainer>
    </ResponsiveContainer>
  );
};

export default CloudProvidersChart;

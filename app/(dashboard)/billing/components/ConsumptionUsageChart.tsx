import React, { FC, useMemo } from "react";
import { Box, Stack } from "@mui/material";
import dayjs from "dayjs";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import LoadingSpinner from "src/components/LoadingSpinner/LoadingSpinner";
import ReChartContainer from "src/components/ReChartContainer/ReChartContainer";
import { Text } from "src/components/Typography/Typography";
import { ConsumptionUsagePerDay } from "src/types/consumption";

function formatDate(inputDate) {
  return dayjs.utc(inputDate).format("MMM DD");
}

const LegendItem = ({ title = "", bgColor }) => {
  return (
    <Box display={"flex"} justifyContent={"space-between"} alignSelf={"center"} gap={"8px"}>
      <Box alignSelf={"center"} sx={{ background: bgColor, width: "11px", height: "11px" }} />
      <Text size="xsmall" weight="medium" color="#7E8299">
        {title}
      </Text>
    </Box>
  );
};

const Legend = () => {
  return (
    <Box display={"flex"} justifyContent={"space-between"} gap={"17px"} mt="16px">
      <LegendItem bgColor="#3E97FF" title="Memory GiB hours" />
      <LegendItem bgColor="#10AA50" title="Storage GiB hours" />
      <LegendItem bgColor="#7239EA" title="CPU core hours" />
      <LegendItem bgColor="#E25300" title="Replica hours" />
    </Box>
  );
};

export function handleYAxisShift(chartID: string, e: React.UIEvent<HTMLDivElement>) {
  const allAxis = document.querySelectorAll(`#${chartID} .recharts-yAxis`);

  const xAxis = document.querySelector(`#${chartID} .recharts-xAxis`);
  const xAxisHeight = xAxis?.getBoundingClientRect().height || 0;

  allAxis?.forEach((axis) => {
    const orientation = axis.querySelector(`.recharts-cartesian-axis-tick-line`)?.getAttribute("orientation") || "hor";

    const rectElement = document.querySelector(`#${chartID} .y-axis-rect-${orientation}`);
    if (!rectElement) {
      //Adding a rect
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      const yAxisheight = axis.getBoundingClientRect().height;
      const yAxisWidth = axis.getBoundingClientRect().width;

      rect.setAttribute("x", "0");
      rect.setAttribute("y", "0");
      rect.setAttribute("width", `${Math.max(yAxisWidth + 20, 53)}px`);
      rect.setAttribute("height", `${yAxisheight + xAxisHeight}px`);
      rect.setAttribute("fill", "white");
      rect.setAttribute("class", `y-axis-rect-${orientation}`);

      axis.insertBefore(rect, axis.firstChild);
    }
  });

  const axis = document.querySelector(`#${chartID} .recharts-yAxis`);
  //@ts-ignore
  axis.style = "transform: translateX(" + e.target.scrollLeft + "px);"; //@ts-ignore
}

const chartMargins = { bottom: 20, top: 5, left: 0, right: 0 };
const barCategoryGap = 50;
const barWidth = 10;

const scrollbarStyles = {
  overflowX: "auto",
  scrollbarWidth: "thin",
  scrollbarColor: "#24273C",
  "&::-webkit-scrollbar": {
    width: "6px ",
    height: "12px",
  },
  "&::-webkit-scrollbar-thumb": {
    background: "#999a9f",
    borderRadius: "6px",
    border: "1px solid #999a9f",
  },
  "&::-webkit-scrollbar-track": {
    background: " #24273C",
    borderRadius: "6px",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    background: "#eaecf0",
  },
  overscrollBehavior: "none",
};

type ConsumptionUsageChartProps = {
  usagePerDayData: ConsumptionUsagePerDay | undefined;
  isFetchingUsagePerDay: boolean;
};

const ConsumptionUsageChart: FC<ConsumptionUsageChartProps> = (props) => {
  const { usagePerDayData, isFetchingUsagePerDay } = props;

  const billingUsagePerDay: {
    "Memory GiB hours": number;
    "Storage GiB hours": number;
    "CPU core hours": number;
    "Replica hours": number;
    date: string;
  }[] = useMemo(() => {
    const usage = usagePerDayData?.usage || [];
    const dataHashByDate: Record<
      string,
      {
        "Memory GiB hours": number;
        "Storage GiB hours": number;
        "CPU core hours": number;
        "Replica hours": number;
        date: string;
      }
    > = {};

    usage.forEach((usageDimensionData) => {
      const { startTime: date, dimension, total: value } = usageDimensionData;

      if (dataHashByDate[date as string]) {
        dataHashByDate[date as string] = {
          ...dataHashByDate[date as string],
          [dimension as string]: value,
        };
      } else {
        dataHashByDate[date as string] = {
          "Memory GiB hours": 0,
          "Storage GiB hours": 0,
          "CPU core hours": 0,
          "Replica hours": 0,
          [dimension as string]: value,
          date: date as string,
        };
      }
    });
    return Object.values(dataHashByDate).sort((itemA, itemB) => (itemA.date < itemB.date ? -1 : 1));
  }, [usagePerDayData]);

  const minChartWidth =
    billingUsagePerDay.length * barWidth +
    (billingUsagePerDay.length + 1) * barCategoryGap +
    chartMargins.left +
    chartMargins.right;

  const keys = ["Memory GiB hours", "Storage GiB hours", "CPU core hours", "Replica hours"];
  const COLORS = ["#3E97FF", "#10AA50", "#7239EA", "#E25300"];
  const translateX = [-17, -6, 5, 16];

  return isFetchingUsagePerDay ? (
    <LoadingSpinner />
  ) : (
    <Box position="relative" id="usage-per-day-chart" overflow={"hidden"}>
      <Stack direction="row" justifyContent="flex-end">
        <Legend />
      </Stack>
      <ReChartContainer mt={4} debounce={100} height={370}>
        <Box
          sx={{ overflowY: "hidden", ...scrollbarStyles }}
          onScroll={(e: React.UIEvent<HTMLDivElement>) => {
            handleYAxisShift("usage-per-day-chart", e);
          }}
        >
          <ResponsiveContainer height={350} minWidth={minChartWidth}>
            <ComposedChart
              data={billingUsagePerDay}
              barCategoryGap={50} // Controls the space between groups of bars
              barGap={1} // Ensures bars within the same group have no gap
              margin={chartMargins}
            >
              <CartesianGrid strokeDasharray="5 5" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                interval={0}
                tick={({ x, y, payload }) => (
                  <text
                    x={x}
                    y={y}
                    dy={15}
                    dx={21}
                    textAnchor="end"
                    style={{
                      fontSize: 13,
                      lineHeight: 14,
                      fontWeight: 600,
                      fill: "#7E8299",
                    }}
                  >
                    {formatDate(payload.value)}
                  </text>
                )}
              />

              <Tooltip
                animationDuration={0}
                content={({ payload, label }) => {
                  if (!payload || payload.length === 0) return null;

                  // Define keys for line chart data
                  const lineKeys = new Set(); // Use a Set for better performance

                  // Filter only line data
                  const filteredData = payload.filter((entry) => {
                    const dataKey = String(entry.dataKey);
                    if (!lineKeys.has(dataKey)) {
                      lineKeys.add(dataKey); // Add key to Set
                      return true; // Keep this entry
                    }
                    return false; // Ignore duplicates
                  });

                  if (filteredData.length === 0) return null; // Don't show tooltip if no line data

                  return (
                    <div
                      style={{
                        background: "#fff",
                        padding: "10px",
                        borderRadius: "4px",
                        boxShadow: "0px 0px 10px rgba(0,0,0,0.1)",
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontWeight: "bold",
                          fontSize: 14,
                          color: "#7E8299",
                        }}
                      >
                        {formatDate(label)}
                      </p>
                      {filteredData.map((entry) => (
                        <p
                          key={entry.dataKey}
                          style={{
                            color: entry.color,
                            margin: 0,
                            fontSize: 13,
                            fontWeight: 400,
                          }}
                        >
                          {entry.name}: {entry.value}
                        </p>
                      ))}
                    </div>
                  );
                }}
              />

              {/* Dynamically Render Bars */}
              {keys.map((key, index) => (
                <Bar
                  key={`bar-${key}`}
                  dataKey={key}
                  barSize={10}
                  fill={COLORS[index % COLORS.length]}
                  radius={[4, 4, 4, 4]}
                />
              ))}

              {/* Dynamically Render Lines with Active Dots */}
              {keys.map((key, index) => (
                <Line
                  id={`line-${key}`}
                  key={`line-${key}`}
                  type="monotone"
                  dataKey={key}
                  stroke={COLORS[index % COLORS.length]}
                  strokeDasharray="3 3"
                  dot={false}
                  activeDot={(props) => (
                    <circle
                      {...props}
                      transform={`translate(${translateX[index]}, 0)`}
                      r={4}
                      fill={COLORS[index % COLORS.length]}
                    />
                  )}
                  transform={`translate(${translateX[index]}, 0)`}
                />
              ))}
              <YAxis
                tickFormatter={(value) => `${value}`}
                domain={([, datamax]) => [0, datamax > 0 ? Math.round(datamax + 1) : 1]}
                interval={0}
                tick={({ x, y, payload }) => (
                  <text
                    x={x}
                    y={y}
                    dy={5}
                    textAnchor="end"
                    style={{
                      fontSize: 13,
                      lineHeight: 14,
                      fontWeight: 600,
                      fill: "#7E8299", // Apply color here
                    }}
                  >
                    {payload.value}
                  </text>
                )}
                tickLine={false}
                axisLine={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Box>
      </ReChartContainer>
    </Box>
  );
};

export default ConsumptionUsageChart;

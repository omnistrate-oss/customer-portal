import React from "react";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import lineChartColorPalette from "../../../utils/constants/lineChartColorPalette";
import ReChartContainer from "../../ReChartContainer/ReChartContainer";

function NetworkThroughputChart(props) {
  const { data, labels } = props;

  return (
    <ReChartContainer mt={2} debounce={100} height={320}>
      <ResponsiveContainer>
        <AreaChart
          height={320}
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 50,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" tickFormatter={() => ""} tickLine={false} />
          <YAxis
            tickFormatter={(value) => `${value} MiB/s`}
            domain={([, datamax]) => [0, datamax > 0 ? Math.round(datamax + 1) : 1]}
            style={{ fontSize: 14 }}
          />
          <Tooltip isAnimationActive={false} formatter={(value) => `${value} MiB/s`} />
          <Legend />
          {labels.map((labelName, index) => {
            return (
              <Area
                key={labelName}
                name={labelName}
                type="monotone"
                dataKey={labelName}
                stroke={lineChartColorPalette[index]}
                fill={lineChartColorPalette[index]}
                dot={false}
                isAnimationActive={false}
                label={labelName}
                strokeWidth={2}
                connectNulls
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </ReChartContainer>
  );
}

export default NetworkThroughputChart;

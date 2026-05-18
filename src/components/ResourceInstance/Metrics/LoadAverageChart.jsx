import React from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import ReChartContainer from "../../ReChartContainer/ReChartContainer";

function LoadAverageChart(props) {
  const { data } = props;

  return (
    <ReChartContainer mt={2} debounce={100}>
      <ResponsiveContainer>
        <AreaChart
          height={300}
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 50,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tickLine={false} />
          <YAxis domain={[0, 1]} tickFormatter={(value) => `${value}`} />
          <Tooltip
            formatter={(value, name, props) => {
              return `${value} | Time :${props.payload.x}`;
            }}
            isAnimationActive={false}
          />

          <Area
            name="Load Average"
            type="monotone"
            dataKey="y"
            stroke="#82ca9d"
            fill="#82ca9d"
            dot={false}
            isAnimationActive={false}
            label="Load Average"
            strokeWidth={2}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </ReChartContainer>
  );
}

export default LoadAverageChart;

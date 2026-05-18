import React from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import ReChartContainer from "../../ReChartContainer/ReChartContainer";

function MemUsagePercentChart(props) {
  const { data } = props;

  return (
    <ReChartContainer mt={2}>
      <ResponsiveContainer debounce={100}>
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
          <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
          <Tooltip
            formatter={(value, name, props) => {
              return `${value}% | Time :${props.payload.x}`;
            }}
            isAnimationActive={false}
          />

          <Area
            name="Memory Usage"
            type="monotone"
            dataKey="y"
            stroke="#82ca9d"
            fill="#82ca9d"
            dot={false}
            isAnimationActive={false}
            label="Memory Usage"
            strokeWidth={2}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </ReChartContainer>
  );
}

export default MemUsagePercentChart;

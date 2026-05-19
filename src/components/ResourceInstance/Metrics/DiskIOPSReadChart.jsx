import React from "react";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import lineChartColorPalette from "../../../utils/constants/lineChartColorPalette";
import ReChartContainer from "../../ReChartContainer/ReChartContainer";

function DiskIOPSReadChart(props) {
  const { data, labels } = props;

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
          <XAxis dataKey="time" tickFormatter={() => ""} tickLine={false} />
          <YAxis
            tickFormatter={(value) => `${value}`}
            domain={([, datamax]) => [0, datamax > 0 ? Math.round(datamax + 1) : 1]}
          />
          <Tooltip isAnimationActive={false} />
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

export default DiskIOPSReadChart;

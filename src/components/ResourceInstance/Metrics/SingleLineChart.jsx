import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import ReChartContainer from "src/components/ReChartContainer/ReChartContainer";

function SingleLineChart(props) {
  const { data, chartName } = props;
  return (
    <ReChartContainer mt={3} debounce={100}>
      <ResponsiveContainer height={300} width="100%">
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
          <XAxis dataKey="x" tickLine={false} tickFormatter={() => ""} />
          <YAxis
            tickFormatter={(value) => `${value}`}
            domain={([datamin, datamax]) => [
              datamin < 0 ? Math.round(datamin - 1) : 0,
              datamax > 0 ? Math.round(datamax + 1) : 1,
            ]}
          />
          <Tooltip
            formatter={(value, name, props) => {
              return `${value} | Time :${props.payload.x}`;
            }}
            isAnimationActive={false}
          />

          <Area
            name={chartName}
            type="monotone"
            dataKey="y"
            stroke="#82ca9d"
            fill="#82ca9d"
            dot={false}
            isAnimationActive={false}
            label={chartName}
            strokeWidth={2}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </ReChartContainer>
  );
}

export default SingleLineChart;

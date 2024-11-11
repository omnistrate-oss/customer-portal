import { Text } from "src/components/Typography/Typography";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ReChartContainer from "src/components/ReChartContainer/ReChartContainer";
import lineChartColorPalette from "src/utils/constants/lineChartColorPalette";
import { Box } from "@mui/material";

function MultiLineChart(props) {
  const { data, labels, chartName } = props;

  return (
    <Box>
      <Box sx={{ padding: "10px 20px", borderBottom: "1px solid #EAECF0" }}>
        <Text size="medium" color="#344054" weight="semibold">
          {chartName}
        </Text>
      </Box>
      <ReChartContainer mt={3} debounce={100} height={320}>
        <ResponsiveContainer>
          <LineChart
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
              tickFormatter={(value) => `${value}`}
              domain={([, datamax]) => [
                0,
                datamax > 0 ? Math.round(datamax + 1) : 1,
              ]}
              style={{ fontSize: 14 }}
            />
            <Tooltip
              isAnimationActive={false}
              formatter={(value) => `${value}`}
            />
            <Legend />
            {labels.map((labelName, index) => {
              return (
                <Line
                  key={labelName}
                  name={labelName}
                  type="monotone"
                  dataKey={labelName}
                  stroke={lineChartColorPalette[index]}
                  dot={false}
                  isAnimationActive={false}
                  label={labelName}
                  strokeWidth={2}
                  connectNulls
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </ReChartContainer>
    </Box>
  );
}

export default MultiLineChart;

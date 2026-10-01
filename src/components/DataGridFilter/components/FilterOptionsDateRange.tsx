import { Box, Stack } from "@mui/material";
import { FormikProps } from "formik";

import AbsoluteRangeView from "./AbsoluteRangeView";
import RelativeRangeView from "./RelativeRangeView";

type Tab = "relative" | "absolute";

type TimeFormValues = {
  startDate?: Date;
  endDate?: Date;
  startTime: string;
  endTime: string;
};

type FilterOptionsDateRangeProps = {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  relativeValue: number | null;
  onRelativeValueChange: (value: number | null) => void;
  dateRangeFormik: FormikProps<TimeFormValues>;
};

const getTabStyles = (isActive: boolean, position: "left" | "right") => ({
  cursor: "pointer",
  paddingX: "14px",
  paddingY: "8px",
  ...(position === "left"
    ? { borderRight: "none", borderTopLeftRadius: "8px", borderBottomLeftRadius: "8px" }
    : { borderLeft: "none", borderTopRightRadius: "8px", borderBottomRightRadius: "8px" }),
  ...(isActive
    ? { background: "#F9F5FF", color: "#53389E", border: "1px solid #D6BBFB" }
    : { border: "1px solid #d5d7da" }),
});

const FilterOptionsDateRange: React.FC<FilterOptionsDateRangeProps> = ({
  tab,
  onTabChange,
  relativeValue,
  onRelativeValueChange,
  dateRangeFormik,
}) => {
  const { values, handleChange, handleBlur, touched, errors, setFieldValue } = dateRangeFormik;

  const handleDateChange = (startDate?: Date, endDate?: Date) => {
    setFieldValue("startDate", startDate);
    setFieldValue("endDate", endDate);
  };

  return (
    <>
      <Stack
        direction="row"
        sx={{
          fontSize: "14px",
          lineHeight: "20px",
          fontWeight: 600,
          color: "#414651",
          margin: "6px auto 12px",
        }}
      >
        <Box sx={getTabStyles(tab === "relative", "left")} onClick={() => onTabChange("relative")}>
          Relative Range
        </Box>
        <Box sx={getTabStyles(tab === "absolute", "right")} onClick={() => onTabChange("absolute")}>
          Absolute Range
        </Box>
      </Stack>

      {tab === "relative" ? (
        <RelativeRangeView
          selectedValue={relativeValue}
          onChange={onRelativeValueChange}
          onTabChange={() => onTabChange("absolute")}
        />
      ) : (
        <AbsoluteRangeView
          selectedStartDate={values.startDate}
          selectedEndDate={values.endDate}
          startTime={values.startTime}
          endTime={values.endTime}
          onDateChange={handleDateChange}
          handleTimeChange={handleChange}
          handleTimeBlur={handleBlur}
          touched={touched}
          errors={errors}
        />
      )}
    </>
  );
};

export default FilterOptionsDateRange;

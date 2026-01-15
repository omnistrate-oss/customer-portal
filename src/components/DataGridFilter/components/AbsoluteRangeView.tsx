import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { Box, IconButton, Stack, styled } from "@mui/material";
import { addMonths, format, subMonths } from "date-fns";
import { FormikErrors, FormikTouched } from "formik";
import { DateRange as ReactDateRange, Range } from "react-date-range";

import FieldError from "src/components/FormElementsv2/FieldError/FieldError";
import TextField from "src/components/FormElementsv2/TextField/TextField";
import { Text } from "src/components/Typography/Typography";

import "react-date-range/dist/styles.css"; // main css file

const StyledInput = styled(TextField)({
  ".MuiOutlinedInput-root": {
    fontSize: "14px",
    [`& .MuiOutlinedInput-input`]: {
      padding: "10px",
    },
  },
});

const NavigationRenderer = (currentFocusedDate: Date, setShownDate: (shownDate: Date) => void) => {
  return (
    <Box position="relative" width="100%">
      <Stack
        direction="row"
        justifyContent="space-between"
        position="absolute"
        top="8px"
        left="0px"
        right="0px"
        px="12px"
      >
        <IconButton
          onClick={() => {
            setShownDate(subMonths(currentFocusedDate, 1));
          }}
          sx={{ color: "#667085" }}
          size="small"
        >
          <ChevronLeft />
        </IconButton>
        <IconButton
          onClick={() => {
            setShownDate(addMonths(currentFocusedDate, 1));
          }}
          sx={{ color: "#667085" }}
          size="small"
        >
          <ChevronRight />
        </IconButton>
      </Stack>
    </Box>
  );
};

type TimeFormValues = {
  startDate?: Date;
  endDate?: Date;
  startTime: string;
  endTime: string;
};

type AbsoluteRangeViewProps = {
  selectedStartDate?: Date;
  selectedEndDate?: Date;
  startTime: string;
  endTime: string;
  onDateChange: (startDate?: Date, endDate?: Date) => void;
  handleTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleTimeBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  touched: FormikTouched<TimeFormValues>;
  errors: FormikErrors<TimeFormValues>;
};

const AbsoluteRangeView: React.FC<AbsoluteRangeViewProps> = ({
  selectedStartDate,
  selectedEndDate,
  startTime,
  endTime,
  onDateChange,
  handleTimeChange,
  handleTimeBlur,
  touched,
  errors,
}) => {
  const dateRanges: Range[] = useMemo(() => {
    return [
      {
        startDate: selectedStartDate,
        endDate: selectedEndDate,
        key: "selection",
      },
    ];
  }, [selectedStartDate, selectedEndDate]);

  const handleChangeDateRange = (item: Range) => {
    onDateChange(item.startDate, item.endDate);
  };

  return (
    <>
      <Box display="flex" justifyContent="center">
        {/*@ts-expect-error This is a valid JSX component */}
        <ReactDateRange
          onChange={(item) => handleChangeDateRange(item.selection)}
          showSelectionPreview={true}
          moveRangeOnFirstSelection={false}
          months={1}
          ranges={dateRanges}
          direction="horizontal"
          color="#7F56D9"
          showMonthAndYearPickers={false}
          navigatorRenderer={NavigationRenderer}
          showDateDisplay={false}
        />
      </Box>
      <Box borderTop="2px solid #E9EAEB" pt="12px" mt="12px">
        <Stack direction={"row"} gap="12px" alignItems="center">
          <Box flex={1}>
            <Text size="small" color="#535862">
              Start Date
            </Text>
            <StyledInput value={selectedStartDate ? format(selectedStartDate, "yyyy/MM/dd") : ""} disabled />
            <Box height="18px">
              <FieldError>{touched.startDate && errors.startDate}</FieldError>
            </Box>
          </Box>

          <Box flex={1}>
            <Text size="small" color="#535862">
              Start Time
            </Text>
            <StyledInput
              name="startTime"
              placeholder="hh:mm:ss"
              value={startTime}
              onChange={handleTimeChange}
              onBlur={handleTimeBlur}
              error={Boolean(touched.startTime && errors.startTime)}
            />
            <Box height="18px">
              <FieldError>{touched.startTime && errors.startTime}</FieldError>
            </Box>
          </Box>
        </Stack>

        <Stack direction={"row"} gap="12px" alignItems="center">
          <Box flex={1}>
            <Text size="small" color="#535862">
              End Date
            </Text>
            <StyledInput value={selectedEndDate ? format(selectedEndDate, "yyyy/MM/dd") : ""} disabled />
            <Box height="18px">
              <FieldError>{touched.endDate && errors.endDate}</FieldError>
            </Box>
          </Box>

          <Box flex={1}>
            <Text size="small" color="#535862">
              End Time
            </Text>
            <StyledInput
              name="endTime"
              placeholder="hh:mm:ss"
              value={endTime}
              onChange={handleTimeChange}
              onBlur={handleTimeBlur}
              error={Boolean(touched.endTime && errors.endTime)}
            />
            <Box height="18px">
              <FieldError>{touched.endTime && errors.endTime}</FieldError>
            </Box>
          </Box>
        </Stack>
      </Box>
    </>
  );
};

export default AbsoluteRangeView;

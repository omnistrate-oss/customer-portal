import { useMemo, useState } from "react";
import { SetState } from "src/types/common/reactGenerics";
import { addMilliseconds, addMonths, format, subMonths } from "date-fns";
import { Box, IconButton, styled } from "@mui/material";
import { Stack } from "@mui/system";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Button from "../Button/Button";
import { DateRange as ReactDateRange, Range } from "react-date-range";
import "react-date-range/dist/styles.css"; // main css file
import { colors, themeConfig } from "src/themeConfig";
import { ChevronLeft } from "@mui/icons-material";
import Radio from "../FormElementsv2/Radio/Radio";
import TextField from "../FormElementsv2/TextField/TextField";
import { Text } from "../Typography/Typography";
import { useFormik } from "formik";
import { timeValidationSchema } from "./constants";
import FieldError from "../FormElementsv2/FieldError/FieldError";
import {
  getISOStringfromDateAndTime,
  getLocalStartOfDayfromISODateString,
} from "./utils";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { PopoverDynamicHeight } from "../Popover/Popover";
import CalendarIcon from "../Icons/Calendar/Calendar";
dayjs.extend(utc);

const StyledIconCard = styled(Box)({
  padding: "8px",
  borderRadius: "8px",
  border: `1px solid ${themeConfig.colors.blue700}`,
  boxShadow: `box-shadow: 0px 1px 2px 0px #0A0D120D, 0px -2px 0px 0px #0A0D120D inset, 0px 0px 0px 1px #0A0D122E inset`,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
});

const StyledInput = styled(TextField)({
  width: "130px",
  " .MuiOutlinedInput-root ": {
    fontSize: "14px",
    [`& .MuiOutlinedInput-input`]: {
      padding: "10px",
    },
  },
});

const NavigationRenderer = (
  currentFocusedDate: Date,
  setShownDate: (shownDate: Date) => void
) => {
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
          <ChevronLeftIcon />
        </IconButton>
        <IconButton
          onClick={() => {
            setShownDate(addMonths(currentFocusedDate, 1));
          }}
          sx={{ color: "#667085" }}
          size="small"
        >
          <ChevronRightIcon />
        </IconButton>
      </Stack>
    </Box>
  );
};

export type DateRange = {
  startDate?: string;
  endDate?: string;
};

type RelativeRangeProps = {
  dateRange: DateRange;
  setDateRange: SetState<DateRange>;
  handleCancel: () => void;
  handleClear: () => void;
  handleTabChange: (tab: string) => void;
};

export const initialRangeState: DateRange = {
  startDate: undefined,
  endDate: undefined,
  //   key: "selection",
};

type RelativeRangeOption = {
  label: string;
  value: number; // relative past time from now in milliseconds
};
const relativeRangeOptions: RelativeRangeOption[] = [
  {
    label: "Last 5 minutes",
    value: 5 * 60 * 1000, // relative past time in milliseconds
  },
  {
    label: "Last 30 minutes",
    value: 30 * 60 * 1000,
  },

  {
    label: "Last 1 hour",
    value: 1 * 60 * 60 * 1000,
  },
  {
    label: "Last 6 hours",
    value: 6 * 60 * 60 * 1000,
  },
  {
    label: "Last 1 day",
    value: 1 * 24 * 60 * 60 * 1000,
  },
  {
    label: "Last 3 days",
    value: 3 * 24 * 60 * 60 * 1000,
  },
];

const RelativeRange = ({
  setDateRange,
  handleCancel,
  handleClear,
  handleTabChange,
}: RelativeRangeProps) => {
  const [selectedValue, setSelectedValue] = useState<number | null>(null);

  const handleApply = () => {
    if (selectedValue) {
      const endDate = new Date();
      const startDate = addMilliseconds(endDate, -selectedValue);
      setDateRange({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
    } else {
      setDateRange({ startDate: undefined, endDate: undefined });
    }
  };

  const handleSelectOption = (value: number) => {
    setSelectedValue(value);
  };

  const onClear = () => {
    setSelectedValue(null);
    handleClear();
  };

  return (
    <Box
      sx={{
        width: "609px",
      }}
    >
      <Stack
        direction="column"
        alignItems="flex-start"
        sx={{ paddingBottom: "10px", paddingTop: "4px" }}
      >
        {relativeRangeOptions?.map((option, i) => (
          <Stack
            direction="row"
            sx={{
              marginTop: "1px",
              padding: "8px 20px",
              fontSize: "14px",
              lineHeight: "20px",
              fontWeight: 500,
              color: themeConfig.colors.gray900,
              cursor: "pointer",
            }}
            key={i}
            onClick={() => handleSelectOption(option.value)}
          >
            <Radio
              sx={{ padding: "0px", marginRight: "8px" }}
              checked={selectedValue === option.value}
            />
            {option.label}
          </Stack>
        ))}

        <Stack
          direction="row"
          alignItems={"flex-start"}
          sx={{
            marginTop: "1px",
            padding: "8px 20px",
            fontSize: "14px",
            lineHeight: "20px",
            fontWeight: 500,
            color: themeConfig.colors.gray900,
            cursor: "pointer",
          }}
          key={"custom"}
          onClick={() => handleTabChange("absolute")}
        >
          <Radio
            sx={{ padding: "0px", marginRight: "8px", paddingTop: "2px" }}
          />
          <Box>
            Custom
            <Text
              size="xsmall"
              weight="regular"
              color={themeConfig.colors.gray600}
            >
              Set a custom range in the past
            </Text>
          </Box>
        </Stack>
      </Stack>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        borderTop={`1px solid ${themeConfig.colors.gray200}`}
        padding="16px"
      >
        <Button variant="text" onClick={onClear}>
          Clear
        </Button>
        <Stack
          direction="row"
          justifyContent="flex-end"
          alignItems="center"
          gap="12px"
        >
          <Button variant="outlined" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleApply}>
            Apply
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

type AbsoluteRangeProps = {
  dateRange: DateRange;
  setDateRange: SetState<DateRange>;
  handleCancel: () => void;
  handleClear: () => void;
};

const AbsoluteRange = (props: AbsoluteRangeProps) => {
  const {
    dateRange = initialRangeState,
    setDateRange,
    handleCancel,
    handleClear,
  } = props;

  const [selectedStartDate, setSelectedStartDate] = useState(
    dateRange.startDate
      ? getLocalStartOfDayfromISODateString(dateRange.startDate)
      : undefined
  );
  const [selectedEndDate, setSelectedEndDate] = useState(
    dateRange.endDate
      ? getLocalStartOfDayfromISODateString(dateRange.endDate)
      : undefined
  );

  const timeFormik = useFormik({
    initialValues: {
      startDate: dateRange.startDate
        ? getLocalStartOfDayfromISODateString(dateRange.startDate)
        : undefined,
      endDate: dateRange.endDate
        ? getLocalStartOfDayfromISODateString(dateRange.endDate)
        : undefined,
      startTime: dateRange.startDate
        ? dayjs(new Date(dateRange.startDate)).utc().format("HH:mm:ss")
        : "00:00:00",
      endTime: dateRange.endDate
        ? dayjs(new Date(dateRange.endDate)).utc().format("HH:mm:ss")
        : "23:59:59",
    },
    enableReinitialize: true,
    onSubmit: (values) => {
      if (values.startDate && values.endDate) {
        setDateRange({
          startDate: getISOStringfromDateAndTime(
            values.startDate,
            values.startTime
          ),
          endDate: getISOStringfromDateAndTime(values.endDate, values.endTime),
        });
      } else {
        setDateRange({
          startDate: undefined,
          endDate: undefined,
        });
      }
    },
    validationSchema: timeValidationSchema,
  });

  const {
    values,
    handleChange,
    handleBlur,
    touched,
    errors,
    setFieldValue,
    handleSubmit,
  } = timeFormik;

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
    setSelectedStartDate(item.startDate);
    setSelectedEndDate(item.endDate);
    setFieldValue("startDate", item.startDate);
    setFieldValue("endDate", item.endDate);
  };

  const onClear = () => {
    setSelectedStartDate(undefined);
    setSelectedEndDate(undefined);
    setFieldValue("startDate", "");
    setFieldValue("endDate", "");
    setFieldValue("startTime", "00:00:00");
    setFieldValue("endTime", "23:59:59");
    handleClear();
  };

  return (
    <Box>
      {/*@ts-ignore */}
      <ReactDateRange
        onChange={(item) => {
          handleChangeDateRange(item.selection);
        }}
        showSelectionPreview={true}
        moveRangeOnFirstSelection={false}
        months={2}
        ranges={dateRanges}
        direction="horizontal"
        color={colors.blue700}
        showMonthAndYearPickers={false}
        navigatorRenderer={NavigationRenderer}
        showDateDisplay={false}
      />

      <Stack direction="row" gap="12px" alignItems="center" padding="12px 16px">
        <Stack direction={"row"} gap="12px" alignItems="center" flex={1}>
          <Box>
            <Text size="small" color={themeConfig.colors.gray600}>
              Start Date
            </Text>
            <StyledInput
              value={
                selectedStartDate ? format(selectedStartDate, "yyyy/MM/dd") : ""
              }
              disabled
            />
            <Box height="18px">
              <FieldError>{touched.startDate && errors.startDate}</FieldError>
            </Box>
          </Box>
          {/* - */}
          <Box>
            <Text size="small" color={themeConfig.colors.gray600}>
              Start Time
            </Text>
            <StyledInput
              name="startTime"
              placeholder="hh:mm:ss"
              value={values.startTime}
              onChange={handleChange}
              onBlur={handleBlur}
              error={Boolean(touched.startTime && errors.startTime)}
            />
            <Box height="18px">
              <FieldError>{touched.startTime && errors.startTime}</FieldError>
            </Box>
          </Box>{" "}
        </Stack>

        <Stack direction={"row"} gap="12px" alignItems="center" flex={1}>
          <Box>
            <Text size="small" color={themeConfig.colors.gray600}>
              End Date
            </Text>
            <StyledInput
              value={
                selectedEndDate ? format(selectedEndDate, "yyyy/MM/dd") : ""
              }
              disabled
            />
            <Box height="18px">
              <FieldError>{touched.endDate && errors.endDate}</FieldError>
            </Box>
          </Box>
          {/* - */}
          <Box>
            <Text size="small" color={themeConfig.colors.gray600}>
              End Time
            </Text>
            <StyledInput
              name="endTime"
              placeholder="hh:mm:ss"
              value={values.endTime}
              onChange={handleChange}
              onBlur={handleBlur}
              error={Boolean(touched.endTime && errors.endTime)}
            />
            <Box height="18px">
              <FieldError>{touched.endTime && errors.endTime}</FieldError>
            </Box>
          </Box>{" "}
        </Stack>
      </Stack>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        borderTop={`1px solid ${themeConfig.colors.gray200}`}
        padding="16px"
      >
        <Button variant="text" onClick={onClear}>
          Clear
        </Button>
        <Stack
          direction="row"
          justifyContent="flex-end"
          alignItems="center"
          gap="8px"
        >
          <Button variant="outlined" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSubmit}>
            Apply
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

type TabType = "relative" | "absolute";

type DateRangePickerStaticProps = {
  dateRange: DateRange;
  setDateRange: SetState<DateRange>;
  handleCancel: () => void;
  handleClear: () => void;
  hideBackArrow?: boolean;
};

export const DateTimeRangePickerStatic = (
  props: DateRangePickerStaticProps
) => {
  const { handleCancel, dateRange, hideBackArrow = false } = props;
  const [tab, setTab] = useState<TabType>(
    dateRange?.startDate ? "absolute" : "relative"
  );

  const handleTabChange = (value: TabType) => {
    setTab(value);
  };

  return (
    <>
      <Stack
        direction="row"
        padding="16px"
        justifyContent="flex-start"
        alignItems="center"
        gap="12px"
        borderBottom={`1px solid ${themeConfig.colors.gray200}`}
      >
        {!hideBackArrow && (
          <StyledIconCard sx={{ cursor: "pointer" }} onClick={handleCancel}>
            <ChevronLeft
              sx={{
                color: themeConfig.colors.blue700,
                fontSize: "20px",
              }}
            />
          </StyledIconCard>
        )}

        <Stack
          direction="row"
          sx={{
            fontSize: "14px",
            lineHeight: "20px",
            fontWeight: 600,
            color: themeConfig.colors.gray700,
          }}
        >
          <Box
            sx={{
              cursor: "pointer",
              paddingX: "14px",
              paddingY: "8px",
              borderRight: "none",
              borderTopLeftRadius: "9999px",
              borderBottomLeftRadius: "9999px",
              ...(tab === "relative"
                ? {
                    background: themeConfig.colors.blue50,
                    color: themeConfig.colors.blue900,
                    border: `1px solid ${themeConfig.colors.blue600}`,
                  }
                : {
                    border: `1px solid ${themeConfig.colors.gray300}`,
                  }),
            }}
            onClick={() => handleTabChange("relative")}
          >
            Relative Range
          </Box>
          <Box
            sx={{
              cursor: "pointer",
              paddingX: "14px",
              paddingY: "8px",
              borderLeft: "none",
              borderTopRightRadius: "9999px",
              borderBottomRightRadius: "9999px",
              ...(tab === "absolute"
                ? {
                    background: themeConfig.colors.blue50,
                    color: themeConfig.colors.blue900,
                    border: `1px solid ${themeConfig.colors.blue600}`,
                  }
                : {
                    border: `1px solid ${themeConfig.colors.gray300}`,
                  }),
            }}
            onClick={() => handleTabChange("absolute")}
          >
            Absolute Range
          </Box>
        </Stack>
      </Stack>

      {tab === "relative" && (
        <RelativeRange {...props} handleTabChange={handleTabChange} />
      )}
      {tab === "absolute" && <AbsoluteRange {...props} />}
    </>
  );
};

type DateTimePickerPopoverProps = {
  dateRange: DateRange;
  setDateRange: SetState<DateRange>;
};

export const DateTimePickerPopover = (props: DateTimePickerPopoverProps) => {
  const { dateRange, setDateRange } = props;

  const [anchorElem, setAnchorElem] = useState<HTMLElement | null>(null);

  const open = Boolean(anchorElem);
  const id = open ? "date-time-picker-popover" : undefined;

  //meant to be used on the button
  let formattedStartDate = "Select Start Date";
  if (dateRange?.startDate) {
    formattedStartDate = dayjs(dateRange.startDate)
      .utc()
      .format("YYYY-MM-DD HH:mm:ss");
  }

  //meant to be used on the button
  let formattedEndDate = "Select End Date";
  if (dateRange?.endDate) {
    formattedEndDate = dayjs(dateRange.endDate)
      .utc()
      .format("YYYY-MM-DD HH:mm:ss");
  }

  let buttonText = "Filter by Date";

  if (dateRange?.startDate && dateRange?.endDate) {
    buttonText = `${formattedStartDate} - ${formattedEndDate}`;
  }

  function handleButtonClick(event: React.MouseEvent<HTMLButtonElement>) {
    setAnchorElem((prev) => {
      if (prev) return null;
      else return event.currentTarget;
    });
  }

  function handleAppply(value) {
    setDateRange(value);
    setAnchorElem(null);
  }

  function handleCancel() {
    setDateRange(initialRangeState);
    setAnchorElem(null);
  }

  function handleClear() {
    setDateRange(initialRangeState);
  }

  return (
    <>
      <Button
        variant="outlined"
        startIcon={
          <CalendarIcon color="#414651" style={{ marginLeft: "4px" }} />
        }
        onClick={handleButtonClick}
        sx={{
          fontWeight: "500 !important",
          color: "#414651 !important",
          height: "40px !important",
          padding: "10px 14px !important",
          borderColor: "#D5D7DA !important",
          minWidth: "150px",
        }}
      >
        {buttonText}
      </Button>

      <PopoverDynamicHeight
        id={id}
        open={open}
        anchorEl={anchorElem}
        onClose={() => {
          setAnchorElem(null);
        }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ marginTop: "8px" }}
      >
        <Box>
          <DateTimeRangePickerStatic
            dateRange={dateRange}
            setDateRange={handleAppply}
            handleClear={handleClear}
            handleCancel={handleCancel}
            hideBackArrow={true}
          />
        </Box>
      </PopoverDynamicHeight>
    </>
  );
};

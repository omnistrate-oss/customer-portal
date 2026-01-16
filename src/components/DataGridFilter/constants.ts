import { compareAsc, isMatch } from "date-fns";
import * as yup from "yup";

import { getDateTime } from "src/utils/date-utils";

export const timeValidationSchema = yup.object({
  startDate: yup.date(),
  endDate: yup.date(),
  startTime: yup
    .string()
    .required("Start time is required")
    .test("is-valid", "Invalid time", function (time) {
      if (!time) return true;
      try {
        return isMatch(time, "HH:mm:ss");
      } catch {
        return false;
      }
    })
    .test("greater", "Start greater than end", function (startTime) {
      const startDate = this.parent.startDate;
      const endDate = this.parent.endDate;
      const endTime = this.parent.endTime;
      if (!startTime || !endTime || !startDate || !endDate) return true;
      try {
        if (
          isMatch(startTime, "HH:mm:ss") &&
          isMatch(endTime, "HH:mm:ss") &&
          compareAsc(startDate, endDate) === 0 // compare only when two dates are same
        ) {
          const startDateTime = getDateTime(startDate, startTime);
          const endDateTime = getDateTime(endDate, endTime);
          // return false if end is less than start
          return compareAsc(endDateTime, startDateTime) >= 0;
        } else {
          return true;
        }
      } catch {
        return true;
      }
    }),
  endTime: yup
    .string()
    .required("End time is required")
    .test("is-valid", "Invalid format", function (time) {
      if (!time) return true;
      try {
        return isMatch(time, "HH:mm:ss");
      } catch {
        return false;
      }
    }),
});

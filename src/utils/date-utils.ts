import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export const formatDateMMM_DD_YYYY = (inputDate: string) => {
  return dayjs.utc(inputDate).format("MMM DD, YYYY");
};

export const getDateTime = (date: Date, time: string) => {
  const timeArr = time.split(":");
  const hours = parseInt(timeArr[0], 10);
  const minutes = parseInt(timeArr[1], 10);
  const seconds = parseInt(timeArr[2], 10);

  const dateTime = new Date(date);
  dateTime.setHours(hours);
  dateTime.setMinutes(minutes);
  dateTime.setSeconds(seconds);

  return dateTime;
};

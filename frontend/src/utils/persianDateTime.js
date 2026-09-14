const PERSIAN_DATE_FORMATTER =
  new Intl.DateTimeFormat(
    "fa-IR-u-ca-persian",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );


const PERSIAN_DAY_MONTH_FORMATTER =
  new Intl.DateTimeFormat(
    "fa-IR-u-ca-persian",
    {
      day: "numeric",
      month: "long",
    }
  );


const PERSIAN_TIME_FORMATTER =
  new Intl.DateTimeFormat(
    "fa-IR",
    {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }
  );


export const formatPersianFullDate = (
  date
) => {
  const dateParts =
    PERSIAN_DATE_FORMATTER.formatToParts(
      date
    );

  const getPart = (type) =>
    dateParts.find(
      (part) => part.type === type
    )?.value || "";

  const weekday = getPart("weekday");

  const dateText = [
    getPart("day"),
    getPart("month"),
    getPart("year"),
  ].join(" ");

  return `${weekday}، ${dateText}`;
};


export const formatPersianDayMonth = (
  date
) =>
  PERSIAN_DAY_MONTH_FORMATTER.format(
    date
  );


export const formatPersianTime = (
  date
) =>
  PERSIAN_TIME_FORMATTER.format(
    date
  );

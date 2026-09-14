import {
  formatPersianFullDate,
  formatPersianTime,
} from "../../utils/persianDateTime";

import "./CurrentDateTimeCard.css";


function CurrentDateTimeCard({
  value,
  className = "",
}) {
  const formattedDate =
    formatPersianFullDate(value);

  const formattedTime =
    formatPersianTime(value);

  const cardClassName = [
    "current-date-time-card",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={cardClassName}
      aria-label={
        `${formattedDate}، ساعت ${formattedTime}`
      }
    >
      <div>
        <strong>
          {formattedDate}
        </strong>
      </div>

      <time
        dateTime={value.toISOString()}
        dir="ltr"
      >
        {formattedTime}
      </time>
    </div>
  );
}


export default CurrentDateTimeCard;

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getPublicScheduleAvailability,
} from "../../services/schedule";
import CurrentDateTimeCard from "../../Components/CurrentDateTimeCard/CurrentDateTimeCard";
import {
  formatPersianDayMonth,
} from "../../utils/persianDateTime";

import "./PublicSchedule.css";


const DAYS = [
  {
    value: "saturday",
    label: "شنبه",
  },
  {
    value: "sunday",
    label: "یکشنبه",
  },
  {
    value: "monday",
    label: "دوشنبه",
  },
  {
    value: "tuesday",
    label: "سه‌شنبه",
  },
  {
    value: "wednesday",
    label: "چهارشنبه",
  },
  {
    value: "thursday",
    label: "پنجشنبه",
  },
  {
    value: "friday",
    label: "جمعه",
    isHoliday: true,
  },
];


const toLocalDateKey = (date) => {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};


const TIME_SLOTS = Array.from(
  {
    length: 25,
  },
  (_, index) => {
    const totalMinutes =
      7 * 60 + index * 30;

    const hour = String(
      Math.floor(totalMinutes / 60)
    ).padStart(2, "0");

    const minute = String(
      totalMinutes % 60
    ).padStart(2, "0");

    return `${hour}:${minute}`;
  }
);


const getSlotDetails = (slotStatus) => {
  const isBooked =
    slotStatus === "booked";

  const isUnavailable =
    slotStatus !== "free";

  return {
    isBooked,
    isUnavailable,
    statusLabel: isBooked
      ? "ظرفیت تکمیل"
      : isUnavailable
        ? "غیرقابل رزرو"
        : "ظرفیت آزاد",
  };
};


function PublicSchedule({
  onRegister,
}) {
  const [bookings, setBookings] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    currentDateTime,
    setCurrentDateTime,
  ] = useState(() => new Date());

  const [
    selectedMobileDay,
    setSelectedMobileDay,
  ] = useState(
    () => DAYS[
      (new Date().getDay() + 1) % 7
    ].value
  );


  const loadAvailability = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const data =
          await getPublicScheduleAvailability();

        setBookings(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (loadError) {
        setError(
          loadError.message ||
          "دریافت برنامه کلاس‌ها انجام نشد."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );


  useEffect(() => {
    const timeoutId =
      window.setTimeout(() => {
        loadAvailability();
      }, 0);

    return () => {
      window.clearTimeout(
        timeoutId
      );
    };
  }, [loadAvailability]);


  useEffect(() => {
    const intervalId =
      window.setInterval(() => {
        setCurrentDateTime(
          new Date()
        );
      }, 30000);

    return () => {
      window.clearInterval(
        intervalId
      );
    };
  }, []);


  const datedDays = useMemo(
    () => {
      const weekStart =
        new Date(currentDateTime);

      weekStart.setHours(
        0,
        0,
        0,
        0
      );

      const daysSinceSaturday =
        (weekStart.getDay() + 1) % 7;

      weekStart.setDate(
        weekStart.getDate()
        - daysSinceSaturday
      );

      const todayKey =
        toLocalDateKey(
          currentDateTime
        );

      return DAYS.map(
        (day, index) => {
          const date =
            new Date(weekStart);

          date.setDate(
            weekStart.getDate()
            + index
          );

          const dateKey =
            toLocalDateKey(date);

          return {
            ...day,
            date,
            dateKey,
            isToday:
              dateKey === todayKey,
          };
        }
      );
    },
    [currentDateTime]
  );


  const slotStatuses = useMemo(
    () =>
      new Map(
        bookings.map(
          (slot) => [
            `${slot.day}-${slot.startTime}`,
            slot.status ||
              (
                slot.isBooked
                  ? "booked"
                  : "closed"
              ),
          ]
        )
      ),
    [bookings]
  );


  const activeMobileDay =
    datedDays.find(
      (day) =>
        day.value === selectedMobileDay
    ) || datedDays[0];


  return (
    <main
      className="public-schedule-page"
      dir="rtl"
    >
      <header className="public-schedule-header">
        <h1>
          برنامه کلاس‌ها
        </h1>

        <CurrentDateTimeCard
          value={currentDateTime}
          className="public-schedule-date-card"
        />
      </header>


      {error ? (
        <section className="public-schedule-message error">
          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={loadAvailability}
          >
            تلاش دوباره
          </button>
        </section>
      ) : loading ? (
        <section className="public-schedule-message">
          در حال دریافت برنامه کلاس‌ها...
        </section>
      ) : (
        <div className="public-schedule-content">
          <section className="public-schedule-card public-schedule-desktop">
            <div className="public-schedule-table-wrapper">
              <table className="public-schedule-table">
                <thead>
                  <tr>
                    <th>
                      ساعت
                    </th>

                    {datedDays.map((day) => (
                      <th
                        key={day.value}
                        className={
                          [
                            day.isHoliday
                              ? "holiday-column"
                              : "",
                            day.isToday
                              ? "today-column"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")
                        }
                      >
                        <span className="public-schedule-day-name">
                          {day.label}
                        </span>

                        <span className="public-schedule-day-date">
                          {formatPersianDayMonth(
                            day.date
                          )}
                        </span>

                        {day.isToday && (
                          <em>
                            امروز
                          </em>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {TIME_SLOTS.map((time) => (
                    <tr key={time}>
                      <th className="public-schedule-time">
                        {time}
                      </th>

                      {datedDays.map((day) => {
                        const slotStatus =
                          slotStatuses.get(
                            `${day.value}-${time}`
                          ) || "free";

                        const {
                          isBooked,
                          isUnavailable,
                          statusLabel,
                        } = getSlotDetails(
                          slotStatus
                        );

                        return (
                          <td
                            key={`${day.value}-${time}`}
                          >
                            <button
                              type="button"
                              className={
                                `public-schedule-slot ${
                                  isBooked
                                    ? "is-full"
                                    : isUnavailable
                                      ? "is-closed"
                                      : "is-free"
                                }`
                              }
                              disabled={isUnavailable}
                              onClick={() =>
                                onRegister({
                                  day: day.value,
                                  dayLabel: day.label,
                                  startTime: time,
                                })
                              }
                              aria-label={
                                `${day.label} ساعت ${time} - ${statusLabel}`
                              }
                            >
                              <span>
                                {statusLabel}
                              </span>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section
            className="public-schedule-mobile"
            aria-label="برنامه هفتگی کلاس‌ها"
          >
            <div
              className="public-mobile-day-tabs"
              role="tablist"
              aria-label="انتخاب روز هفته"
            >
              {datedDays.map((day) => (
                <button
                  type="button"
                  role="tab"
                  key={day.dateKey}
                  className={[
                    day.value === activeMobileDay?.value
                      ? "active"
                      : "",
                    day.isHoliday
                      ? "holiday"
                      : "",
                    day.isToday
                      ? "today"
                      : "",
                  ].filter(Boolean).join(" ")}
                  aria-selected={
                    day.value === activeMobileDay?.value
                  }
                  onClick={() =>
                    setSelectedMobileDay(
                      day.value
                    )
                  }
                >
                  <strong>{day.label}</strong>
                  <span>
                    {formatPersianDayMonth(
                      day.date
                    )}
                  </span>
                  {day.isToday && (
                    <small>امروز</small>
                  )}
                </button>
              ))}
            </div>

            {activeMobileDay && (
              <article
                className={
                  `public-mobile-day-panel ${
                    activeMobileDay.isHoliday
                      ? "holiday"
                      : ""
                  }`
                }
                role="tabpanel"
              >
                <header className="public-mobile-day-header">
                  <div>
                    <span>زمان‌های قابل رزرو</span>
                    <h2>
                      {activeMobileDay.label}،{" "}
                      {formatPersianDayMonth(
                        activeMobileDay.date
                      )}
                    </h2>
                  </div>

                  {activeMobileDay.isToday && (
                    <em>امروز</em>
                  )}
                </header>

                <div className="public-mobile-slots">
                  {TIME_SLOTS.map((time) => {
                    const slotStatus =
                      slotStatuses.get(
                        `${activeMobileDay.value}-${time}`
                      ) || "free";

                    const {
                      isBooked,
                      isUnavailable,
                      statusLabel,
                    } = getSlotDetails(
                      slotStatus
                    );

                    return (
                      <div
                        className="public-mobile-slot-row"
                        key={time}
                      >
                        <time dateTime={time}>
                          {time}
                        </time>

                        <button
                          type="button"
                          className={
                            `public-schedule-slot ${
                              isBooked
                                ? "is-full"
                                : isUnavailable
                                  ? "is-closed"
                                  : "is-free"
                            }`
                          }
                          disabled={isUnavailable}
                          onClick={() =>
                            onRegister({
                              day: activeMobileDay.value,
                              dayLabel: activeMobileDay.label,
                              startTime: time,
                            })
                          }
                          aria-label={
                            `${activeMobileDay.label} ساعت ${time} - ${statusLabel}`
                          }
                        >
                          <span>{statusLabel}</span>
                          {!isUnavailable && (
                            <small>
                              انتخاب این ساعت
                            </small>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </article>
            )}
          </section>
        </div>
      )}
    </main>
  );
}


export default PublicSchedule;
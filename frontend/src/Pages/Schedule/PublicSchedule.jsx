import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getPublicScheduleAvailability,
} from "../../services/schedule";

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
];


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


const PERSIAN_DATE_FORMATTER =
  new Intl.DateTimeFormat(
    "fa-IR-u-ca-persian",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );


const PERSIAN_WEEKDAY_FORMATTER =
  new Intl.DateTimeFormat(
    "fa-IR-u-ca-persian",
    {
      weekday: "long",
    }
  );


const PERSIAN_TIME_FORMATTER =
  new Intl.DateTimeFormat(
    "fa-IR",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }
  );


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


  const bookedSlots = useMemo(
    () =>
      new Set(
        bookings
          .filter(
            (booking) =>
              booking.isBooked
          )
          .map(
            (booking) =>
              `${booking.day}-${booking.startTime}`
          )
      ),
    [bookings]
  );


  return (
    <main
      className="public-schedule-page"
      dir="rtl"
    >
      <header className="public-schedule-header">
        <h1>
          برنامه کلاس‌ها
        </h1>

        <div className="public-schedule-date-card">
          <div className="public-schedule-date-details">
            <span>
              امروز،{" "}
              {PERSIAN_WEEKDAY_FORMATTER.format(
                currentDateTime
              )}
            </span>

            <strong>
              {PERSIAN_DATE_FORMATTER.format(
                currentDateTime
              )}
            </strong>
          </div>

          <time>
            {PERSIAN_TIME_FORMATTER.format(
              currentDateTime
            )}
          </time>
        </div>
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
        <section className="public-schedule-card">
          <div className="public-schedule-table-wrapper">
            <table className="public-schedule-table">
              <thead>
                <tr>
                  <th>
                    ساعت
                  </th>

                  {DAYS.map((day) => (
                    <th key={day.value}>
                      {day.label}
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

                    {DAYS.map((day) => {
                      const isBooked =
                        bookedSlots.has(
                          `${day.value}-${time}`
                        );

                      return (
                        <td
                          key={`${day.value}-${time}`}
                        >
                          <button
                            type="button"
                            className={
                              isBooked
                                ? "public-schedule-slot is-full"
                                : "public-schedule-slot is-free"
                            }
                            disabled={isBooked}
                            onClick={() =>
                              onRegister({
                                day: day.value,
                                dayLabel: day.label,
                                startTime: time,
                              })
                            }
                            aria-label={
                              `${day.label} ساعت ${time} - ${
                                isBooked
                                  ? "ظرفیت تکمیل"
                                  : "ظرفیت آزاد"
                              }`
                            }
                          >
                            <span>
                              {isBooked
                                ? "ظرفیت تکمیل"
                                : "ظرفیت آزاد"}
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
      )}
    </main>
  );
}


export default PublicSchedule;
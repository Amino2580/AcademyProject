import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createScheduleBooking,
  deleteScheduleBooking,
  getPublicScheduleAvailability,
  getScheduleBookings,
  updateScheduleBooking,
} from "../../../services/schedule";
import { useNavigate } from "react-router-dom";
import "./Schedule.css";
import AvailabilityManager from "./AvailabilityManager";

const DAY_ITEMS = [
  {
    value: "saturday",
    label: "شنبه",
    offset: 0,
  },
  {
    value: "sunday",
    label: "یکشنبه",
    offset: 1,
  },
  {
    value: "monday",
    label: "دوشنبه",
    offset: 2,
  },
  {
    value: "tuesday",
    label: "سه‌شنبه",
    offset: 3,
  },
  {
    value: "wednesday",
    label: "چهارشنبه",
    offset: 4,
  },
  {
    value: "thursday",
    label: "پنجشنبه",
    offset: 5,
  },
  {
    value: "friday",
    label: "جمعه",
    offset: 6,
    isHoliday: true,
  },
];


const DAYS = DAY_ITEMS.map(
  (day) => day.label
);


const DAY_VALUES = Object.fromEntries(
  DAY_ITEMS.map(
    (day) => [
      day.label,
      day.value,
    ]
  )
);


const DAY_LABELS = Object.fromEntries(
  DAY_ITEMS.map(
    (day) => [
      day.value,
      day.label,
    ]
  )
);

const TIMES = [];

for (let h = 7; h <= 19; h++) {
  TIMES.push(`${String(h).padStart(2, "0")}:00`);

  if (h < 19) {
    TIMES.push(`${String(h).padStart(2, "0")}:30`);
  }
}

const makeId = (day, time) =>
  `${day}|${time}`;


const CURRENT_DATE_FORMATTER =
  new Intl.DateTimeFormat(
    "fa-IR-u-ca-persian",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );


const CURRENT_TIME_FORMATTER =
  new Intl.DateTimeFormat(
    "fa-IR",
    {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }
  );


const DAY_MONTH_FORMATTER =
  new Intl.DateTimeFormat(
    "fa-IR-u-ca-persian",
    {
      day: "numeric",
      month: "long",
    }
  );


const toLocalIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};


const addDays = (date, days) => {
  const result = new Date(date);

  result.setDate(
    result.getDate() + days
  );
  result.setHours(12, 0, 0, 0);

  return result;
};


const getSaturdayStart = (date) => {
  const result = new Date(date);
  const daysSinceSaturday = (
    result.getDay() + 1
  ) % 7;

  result.setDate(
    result.getDate()
    - daysSinceSaturday
  );
  result.setHours(12, 0, 0, 0);

  return result;
};


const createWeekDays = (weekStart) =>
  DAY_ITEMS.map((day) => {
    const date = addDays(
      weekStart,
      day.offset
    );

    return {
      ...day,
      date,
      isoDate: toLocalIsoDate(date),
    };
  });


const formatDayMonth = (date) =>
  DAY_MONTH_FORMATTER.format(date);


const formatWeekRange = (weekDays) => {
  const firstDay = weekDays[0]?.date;
  const lastDay = weekDays.at(-1)?.date;

  if (!firstDay || !lastDay) {
    return "";
  }

  return `${formatDayMonth(
    firstDay
  )} تا ${formatDayMonth(lastDay)}`;
};


const formatCurrentDate = (date) => {
  const dateParts =
    CURRENT_DATE_FORMATTER.formatToParts(
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


function Schedule() {
  const navigate = useNavigate();

  const [
    currentDateTime,
    setCurrentDateTime,
  ] = useState(() => new Date());

  const [bookings, setBookings] = useState({});

  const [dayFilter, setDayFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [selectedId, setSelectedId] = useState(null);
  const [modal, setModal] = useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    instrument: "",
    notes: "",
  });
  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [
    selectedWeekIndex,
    setSelectedWeekIndex,
  ] = useState(0);

  const [
    unavailableSlotIds,
    setUnavailableSlotIds,
  ] = useState(() => new Set());

  const [
    availabilityLoading,
    setAvailabilityLoading,
  ] = useState(false);

  const todayIsoDate =
    toLocalIsoDate(currentDateTime);

  const weekOptions = useMemo(
    () => {
      const currentWeekStart =
        getSaturdayStart(
          currentDateTime
        );

      return [
        {
          index: 0,
          title: "این هفته",
          days: createWeekDays(
            currentWeekStart
          ),
        },
        {
          index: 1,
          title: "هفته آینده",
          days: createWeekDays(
            addDays(
              currentWeekStart,
              7
            )
          ),
        },
      ];
    },
    [currentDateTime]
  );

  const selectedWeek =
    weekOptions[selectedWeekIndex];

  const weekDays =
    selectedWeek?.days || [];

  const weekStartIso =
    weekDays[0]?.isoDate || "";

  /* ================= LOAD API ================= */

  const loadBookings = useCallback(
    async () => {
      setLoading(true);
      setError("");

    try {
      const data =
        await getScheduleBookings();

      const bookingMap = {};

      const bookingList =
        Array.isArray(data)
          ? data
          : [];

      bookingList.forEach((booking) => {
        const slotId = makeId(
          booking.dayLabel,
          booking.startTime
        );

        bookingMap[slotId] = booking;
      });

      setBookings(bookingMap);
    } catch (loadError) {
      if (loadError.status === 401) {
        navigate(
          "/admin/login",
          {
            replace: true,
          }
        );

        return;
      }

      setError(
        loadError.message ||
        "دریافت برنامه کلاس‌ها انجام نشد."
      );
    } finally {
      setLoading(false);
    }
  },
  [navigate]
);


const loadWeekAvailability = useCallback(
  async () => {
    if (!weekStartIso) return;

    setAvailabilityLoading(true);
    setUnavailableSlotIds(new Set());

    try {
      const data =
        await getPublicScheduleAvailability(
          weekStartIso
        );

      const unavailableItems =
        Array.isArray(data)
          ? data
          : [];

      setUnavailableSlotIds(
        new Set(
          unavailableItems.map(
            (item) =>
              makeId(
                DAY_LABELS[item.day]
                  || item.dayLabel,
                item.startTime
              )
          )
        )
      );
    } catch (loadError) {
      setError(
        loadError.message ||
        "دریافت وضعیت زمان‌های قابل رزرو انجام نشد."
      );
    } finally {
      setAvailabilityLoading(false);
    }
  },
  [weekStartIso]
);


useEffect(() => {
  const timeoutId = window.setTimeout(() => {
    loadBookings();
  }, 0);

  return () => {
    window.clearTimeout(timeoutId);
  };
}, [loadBookings]);


useEffect(() => {
  const timeoutId = window.setTimeout(
    () => {
      loadWeekAvailability();
    },
    0
  );

  return () => {
    window.clearTimeout(timeoutId);
  };
}, [loadWeekAvailability]);


useEffect(() => {
  const intervalId = window.setInterval(
    () => {
      setCurrentDateTime(new Date());
    },
    30000
  );

  return () => {
    window.clearInterval(intervalId);
  };
}, []);

  /* ================= BOOKING ================= */

  const openBooking = (id) => {
    setSelectedId(id);

    setForm({
      name: "",
      phone: "",
      instrument: "",
      notes: "",
    });

    setModal("booking");
  };

  /* ================= DETAILS ================= */

  const showDetails = (id) => {
    setSelectedId(id);
    setModal("details");
  };

  /* ================= SUBMIT ================= */

  const submitBooking = async (e) => {
  e.preventDefault();

  if (!selectedId) return;

  setSaving(true);
  setError("");

  const bookingData = {
    name: form.name.trim(),
    phone: form.phone.trim(),
    instrument: form.instrument.trim(),
    notes: form.notes.trim(),
  };

  try {
    if (selectedBooking) {
      await updateScheduleBooking(
        selectedBooking.id,
        bookingData
      );
    } else {
      await createScheduleBooking({
        day: DAY_VALUES[selectedDay],
        startTime: selectedTime,
        ...bookingData,
      });
    }

    await Promise.all([
      loadBookings(),
      loadWeekAvailability(),
    ]);
    setModal(null);
  } catch (submitError) {
    setError(
      submitError.message ||
      "ذخیره برنامه کلاس انجام نشد."
    );
  } finally {
    setSaving(false);
  }
};
  /* ================= EDIT ================= */

  const editBooking = () => {
    const booking = bookings[selectedId];

    if (!booking) return;

    setForm({
      name: booking.name || "",
      phone: booking.phone || "",
      instrument: booking.instrument || "",
      notes: booking.notes || "",
    });

    setModal("booking");
  };

  /* ================= CANCEL ================= */

 const cancelBooking = async () => {
  if (!selectedBooking) return;

  const confirmed = window.confirm(
    "آیا مطمئن هستید که می‌خواهید این رزرو را لغو کنید؟"
  );

  if (!confirmed) return;

  setSaving(true);
  setError("");

  try {
    await deleteScheduleBooking(
      selectedBooking.id
    );

    await Promise.all([
      loadBookings(),
      loadWeekAvailability(),
    ]);
    setModal(null);
  } catch (deleteError) {
    setError(
      deleteError.message ||
      "لغو رزرو انجام نشد."
    );
  } finally {
    setSaving(false);
  }
};

  /* ================= FILTER ================= */

  const filteredWeekDays =
    dayFilter === "all"
      ? weekDays
      : weekDays.filter(
          (day) =>
            day.label === dayFilter
        );

  const matchesSearch = (booking) => {
    if (!search.trim()) return true;

    const text = `
      ${booking?.name || ""}
      ${booking?.phone || ""}
      ${booking?.instrument || ""}
      ${booking?.notes || ""}
    `.toLowerCase();

    return text.includes(search.toLowerCase());
  };

  const isSlotUnavailable = (
    day,
    time,
  ) => {
    const id = makeId(day, time);

    return (
      !bookings[id]
      && unavailableSlotIds.has(id)
    );
  };


  const isVisible = (day, time) => {
    const id = makeId(day, time);
    const booking = bookings[id];
    const isUnavailable =
      isSlotUnavailable(day, time);

    if (
      statusFilter === "booked"
      && !booking
    ) {
      return false;
    }

    if (
      statusFilter === "free"
      && (
        booking
        || isUnavailable
      )
    ) {
      return false;
    }

    if (
      statusFilter === "closed"
      && !isUnavailable
    ) {
      return false;
    }

    if (
      booking
      && !matchesSearch(booking)
    ) {
      return false;
    }

    if (
      !booking
      && search.trim()
    ) {
      return false;
    }

    return true;
  };

  /* ================= STATS ================= */

  const totalSlots =
    DAYS.length * TIMES.length;

  const bookedSlots =
    Object.keys(bookings).length;

  const closedSlots = Array.from(
    unavailableSlotIds
  ).filter(
    (slotId) => !bookings[slotId]
  ).length;

  const freeSlots = Math.max(
    0,
    totalSlots
    - bookedSlots
    - closedSlots
  );

  /* ================= SELECTED BOOKING ================= */

  const selectedBooking =
    selectedId && bookings[selectedId]
      ? bookings[selectedId]
      : null;

  const selectedDay =
    selectedId?.split("|")[0];

  const selectedTime =
    selectedId?.split("|")[1];

  const selectedDate =
    weekDays.find(
      (day) =>
        day.label === selectedDay
    )?.date;

  const selectedDateLabel =
    selectedDate
      ? formatCurrentDate(selectedDate)
      : selectedDay;

  return (
    <div className="schedule-page">

      {/* ================= HEADER ================= */}

      <header className="schedule-top">
        <div className="schedule-navigation">
          <button
            type="button"
            className="back-home-btn"
            onClick={() => navigate("/")}
          >
            بازگشت به صفحه اصلی
          </button>

          <button
            type="button"
            className="back-home-btn"
            onClick={() => navigate("/admin")}
          >
            بازگشت به داشبورد
          </button>
        </div>

        <div className="schedule-title">
          <h1>برنامه کلاسی میلاد طریقت</h1>

          <p>
            مدیریت برنامه کلاس‌ها و رزرو هنرجویان
          </p>
        </div>

        <div className="schedule-current-date">
          <div>
            <strong>
              {formatCurrentDate(
                currentDateTime
              )}
            </strong>
          </div>

          <time dir="ltr">
            {CURRENT_TIME_FORMATTER.format(
              currentDateTime
            )}
          </time>
        </div>

      </header>

      {loading && (
        <div className="schedule-api-message">
         در حال دریافت برنامه کلاس‌ها...
        </div>
      )}

      {error && (
        <div className="schedule-api-message error">
          {error}
        </div>
      )}
      <AvailabilityManager
        onAvailabilityChanged={
          loadWeekAvailability
        }
      />

      <section
        className="schedule-week-navigation"
        aria-label="انتخاب هفته برنامه"
      >
        <div className="schedule-week-copy">
          <span>نمای دو هفته آینده</span>
          <strong>
            {formatWeekRange(weekDays)}
          </strong>
        </div>

        <div
          className="schedule-week-switcher"
          role="group"
          aria-label="هفته برنامه"
        >
          {weekOptions.map((week) => (
            <button
              type="button"
              key={week.index}
              className={
                selectedWeekIndex
                  === week.index
                  ? "active"
                  : ""
              }
              aria-pressed={
                selectedWeekIndex
                === week.index
              }
              onClick={() => {
                setSelectedWeekIndex(
                  week.index
                );
                setSelectedId(null);
                setModal(null);
              }}
            >
              <span>{week.title}</span>
              <small>
                {formatWeekRange(
                  week.days
                )}
              </small>
            </button>
          ))}
        </div>

        <div
          className={
            availabilityLoading
              ? "week-loading visible"
              : "week-loading"
          }
          aria-live="polite"
        >
          در حال به‌روزرسانی…
        </div>
      </section>

      {/* ================= TOOLBAR ================= */}

      <section className="schedule-toolbar">

        <div className="filters">

          <div className="filter-group">
            <label>روز</label>

            <select
              value={dayFilter}
              onChange={(e) =>
                setDayFilter(e.target.value)
              }
            >
              <option value="all">
                همه روزها
              </option>

              {DAYS.map((day) => (
                <option
                  key={day}
                  value={day}
                >
                  {day}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>وضعیت</label>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
            >
              <option value="all">
                همه
              </option>

              <option value="free">
                آزاد
              </option>

              <option value="booked">
                رزرو شده
              </option>

              <option value="closed">
                بسته
              </option>
            </select>
          </div>

          <div className="filter-group search-group">
            <label>جستجو</label>

            <input
              type="search"
              placeholder="نام هنرجو، شماره یا ساز..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>

        </div>

        {/* ================= STATS ================= */}

        <div className="stats">

          <div className="stat-box">
            <strong>{totalSlots}</strong>
            <span>کل زمان‌ها</span>
          </div>

          <div className="stat-box free-stat">
            <strong>{freeSlots}</strong>
            <span>آزاد</span>
          </div>

          <div className="stat-box booked-stat">
            <strong>{bookedSlots}</strong>
            <span>رزرو شده</span>
          </div>

          <div className="stat-box closed-stat">
            <strong>{closedSlots}</strong>
            <span>بسته</span>
          </div>

        </div>

      </section>

      {/* ================= LEGEND ================= */}

      <div className="schedule-legend">

        <span>
          <i className="legend-dot free-dot"></i>
          زمان آزاد
        </span>

        <span>
          <i className="legend-dot booked-dot"></i>
          رزرو شده
        </span>

        <span>
          <i className="legend-dot closed-dot"></i>
          خارج از زمان تدریس
        </span>

      </div>

      {/* ================= DESKTOP TABLE ================= */}

      <section className="schedule-card">

        <div className="table-wrapper">

          <table className="schedule-table">

            <thead>
              <tr>

                <th className="time-header">
                  ساعت
                </th>

                {weekDays.map((day) => (
                  <th
                    key={day.isoDate}
                    className={[
                      day.isHoliday
                        ? "holiday-column"
                        : "",
                      day.isoDate === todayIsoDate
                        ? "today-column"
                        : "",
                      dayFilter !== "all"
                      && day.label !== dayFilter
                        ? "muted-column"
                        : "",
                    ].filter(Boolean).join(" ")}
                  >
                    <span className="schedule-day-name">
                      {day.label}
                    </span>
                    <small className="schedule-day-date">
                      {formatDayMonth(day.date)}
                    </small>
                    {day.isoDate === todayIsoDate && (
                      <em>امروز</em>
                    )}
                  </th>
                ))}

              </tr>
            </thead>

            <tbody>

              {TIMES.map((time) => (

                <tr key={time}>

                  <th className="time-cell">
                    {time}
                  </th>

                  {weekDays.map((day) => {

                    const id =
                      makeId(day.label, time);

                    const booking =
                      bookings[id];

                    const unavailable =
                      isSlotUnavailable(
                        day.label,
                        time
                      );

                    const visible =
                      isVisible(
                        day.label,
                        time
                      );

                    return (
                      <td
                        key={id}
                        className={`
                          schedule-slot
                          ${booking
                            ? "booked"
                            : unavailable
                              ? "unavailable"
                              : "free"}
                          ${!visible
                            ? "filtered"
                            : ""}
                        `}
                      >

                        {visible ? (
                          unavailable ? (
                            <div
                              className="slot-button unavailable-slot"
                              aria-label={
                                `${day.label} ${time} بسته است`
                              }
                            >
                              <span>—</span>
                              <small>بسته</small>
                            </div>
                          ) : (
                          <button
                            className="slot-button"
                            onClick={() =>
                              booking
                                ? showDetails(id)
                                : openBooking(id)
                            }
                          >

                            {booking ? (
                              <>
                                <strong>
                                  {booking.name}
                                </strong>

                                <small>
                                  {booking.instrument ||
                                    "کلاس پیانو"}
                                </small>
                              </>
                            ) : (
                              <>
                                <span>
                                  +
                                </span>

                                <small>
                                  آزاد
                                </small>
                              </>
                            )}

                          </button>
                          )
                        ) : (
                          <span className="hidden-slot">
                            —
                          </span>
                        )}

                      </td>
                    );
                  })}

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </section>

      {/* ================= MOBILE ================= */}

      <section className="mobile-schedule">

        {filteredWeekDays.map((day) => {

          const daySlots = TIMES.filter(
            (time) =>
              isVisible(day.label, time)
          );

          if (!daySlots.length) {
            return null;
          }

          return (
            <div
              className={`mobile-day ${
                day.isHoliday ? "holiday" : ""
              }`}
              key={day.isoDate}
            >
              <div className="mobile-day-heading">
                <h2>{day.label}</h2>
                <span>
                  {formatDayMonth(day.date)}
                </span>
              </div>

              {daySlots.map((time) => {

                const id =
                  makeId(day.label, time);

                const booking =
                  bookings[id];

                const unavailable =
                  isSlotUnavailable(
                    day.label,
                    time
                  );

                return (
                  <button
                    type="button"
                    className={`
                      mobile-slot
                      ${booking
                        ? "booked"
                        : unavailable
                          ? "unavailable"
                          : "free"}
                    `}
                    key={id}
                    disabled={unavailable}
                    onClick={() => {
                      if (unavailable) return;

                      booking
                        ? showDetails(id)
                        : openBooking(id);
                    }}
                  >
                    <span>
                      {time}
                    </span>

                    <strong>
                      {booking
                        ? booking.name
                        : unavailable
                          ? "بسته"
                          : "آزاد"}
                    </strong>
                  </button>
                );

              })}

            </div>
          );
        })}

      </section>

      {/* ================= BOOKING MODAL ================= */}

      {modal === "booking" && (

        <div
          className="schedule-modal-overlay"
          onClick={() => setModal(null)}
        >

          <div
            className="schedule-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className="schedule-close"
              onClick={() => setModal(null)}
            >
              ×
            </button>

            <h2>
              {selectedBooking
                ? "ویرایش رزرو"
                : "رزرو کلاس"}
            </h2>

            <p className="modal-slot">
              {selectedDateLabel} — {selectedTime}
            </p>

            <form
              onSubmit={submitBooking}
            >

              <div className="form-field">

                <label>
                  نام هنرجو
                </label>

                <input
                  required
                  maxLength="60"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  placeholder="نام و نام خانوادگی"
                />

              </div>

              <div className="form-field">

                <label>
                  شماره تماس
                </label>

                <input
                  required
                  type="tel"
                  maxLength="30"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone: e.target.value,
                    })
                  }
                  placeholder="09xxxxxxxxx"
                />

              </div>

              <div className="form-field">

                <label>
                  ساز / نوع کلاس
                </label>

                <input
                  value={form.instrument}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      instrument: e.target.value,
                    })
                  }
                  placeholder="مثلاً پیانو"
                />

              </div>

              <div className="form-field">

                <label>
                  توضیحات
                </label>

                <textarea
                  rows="4"
                  maxLength="300"
                  value={form.notes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      notes: e.target.value,
                    })
                  }
                  placeholder="توضیحات..."
                />

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() =>
                    setModal(null)
                  }
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "در حال ذخیره..."
                    : selectedBooking
                      ? "ذخیره تغییرات"
                      : "ثبت رزرو"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ================= DETAILS MODAL ================= */}

      {modal === "details" &&
        selectedBooking && (

          <div
            className="schedule-modal-overlay"
            onClick={() => setModal(null)}
          >

            <div
              className="schedule-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <button
                className="schedule-close"
                onClick={() =>
                  setModal(null)
                }
              >
                ×
              </button>

              <h2>
                جزئیات کلاس
              </h2>

              <div className="details-list">

                <div>
                  <span>
                    روز و ساعت
                  </span>

                  <strong>
                    {selectedDateLabel} — {selectedTime}
                  </strong>
                </div>

                <div>
                  <span>
                    هنرجو
                  </span>

                  <strong>
                    {selectedBooking.name}
                  </strong>
                </div>

                <div>
                  <span>
                    شماره تماس
                  </span>

                  <strong>
                    {selectedBooking.phone}
                  </strong>
                </div>

                <div>
                  <span>
                    ساز / کلاس
                  </span>

                  <strong>
                    {selectedBooking.instrument ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    توضیحات
                  </span>

                  <strong>
                    {selectedBooking.notes ||
                      "—"}
                  </strong>
                </div>

              </div>

              <div className="modal-actions">

                <button
                  className="danger-btn"
                  onClick={cancelBooking}
                  disabled={saving}
                >
                  {saving
                    ? "در حال لغو..."
                    : "لغو رزرو"}
                </button>

                <button
                  className="primary-btn"
                  onClick={editBooking}
                >
                  ویرایش
                </button>

                <button
                  className="secondary-btn"
                  onClick={() =>
                    setModal(null)
                  }
                >
                  بستن
                </button>

              </div>

            </div>

          </div>

        )}

    </div>
  );
}

export default Schedule;
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  createScheduleBooking,
  deleteScheduleBooking,
  getScheduleBookings,
  updateScheduleBooking,
} from "../../../services/schedule";
import { useNavigate } from "react-router-dom";
import "./Schedule.css";

const DAYS = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
];

const DAY_VALUES = {
  "شنبه": "saturday",
  "یکشنبه": "sunday",
  "دوشنبه": "monday",
  "سه‌شنبه": "tuesday",
  "چهارشنبه": "wednesday",
  "پنجشنبه": "thursday",
};

const TIMES = [];

for (let h = 7; h <= 19; h++) {
  TIMES.push(`${String(h).padStart(2, "0")}:00`);

  if (h < 19) {
    TIMES.push(`${String(h).padStart(2, "0")}:30`);
  }
}

const makeId = (day, time) =>
  `${day}|${time}`;

function Schedule() {
  const navigate = useNavigate();

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


useEffect(() => {
  const timeoutId = window.setTimeout(() => {
    loadBookings();
  }, 0);

  return () => {
    window.clearTimeout(timeoutId);
  };
}, [loadBookings]);

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

    await loadBookings();
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

    await loadBookings();
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

  const filteredDays =
    dayFilter === "all"
      ? DAYS
      : DAYS.filter((day) => day === dayFilter);

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

  const isVisible = (day, time) => {
    const id = makeId(day, time);
    const booking = bookings[id];

    if (
      statusFilter === "booked" &&
      !booking
    ) {
      return false;
    }

    if (
      statusFilter === "free" &&
      booking
    ) {
      return false;
    }

    if (booking && !matchesSearch(booking)) {
      return false;
    }

    if (!booking && search.trim()) {
      return false;
    }

    return true;
  };

  /* ================= STATS ================= */

  const totalSlots = DAYS.length * TIMES.length;

  const bookedSlots = Object.keys(bookings).length;

  const freeSlots = totalSlots - bookedSlots;

  /* ================= SELECTED BOOKING ================= */

  const selectedBooking =
    selectedId && bookings[selectedId]
      ? bookings[selectedId]
      : null;

  const selectedDay =
    selectedId?.split("|")[0];

  const selectedTime =
    selectedId?.split("|")[1];

  /* ================= TODAY ================= */

  const goToToday = () => {
    const map = [
      "یکشنبه",
      "دوشنبه",
      "سه‌شنبه",
      "چهارشنبه",
      "پنجشنبه",
      "جمعه",
      "شنبه",
    ];

    const today = map[new Date().getDay()];

    if (DAYS.includes(today)) {
      setDayFilter(today);
    }
  };

  return (
    <div className="schedule-page">

      {/* ================= HEADER ================= */}

      <header className="schedule-top">

        <button
          className="back-home-btn"
          onClick={() => navigate("/")}
        >
         بازگشت به صفحه اصلی
        </button>

        <div className="schedule-title">
          <h1>برنامه کلاسی میلاد طریقت</h1>

          <p>
            مدیریت برنامه کلاس‌ها و رزرو هنرجویان
          </p>
        </div>

        <button
          className="today-btn"
          onClick={goToToday}
        >
          امروز
        </button>

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

                {DAYS.map((day) => (
                  <th
                    key={day}
                    className={
                      dayFilter !== "all" &&
                      day !== dayFilter
                        ? "muted-column"
                        : ""
                    }
                  >
                    {day}
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

                  {DAYS.map((day) => {

                    const id =
                      makeId(day, time);

                    const booking =
                      bookings[id];

                    const visible =
                      isVisible(day, time);

                    return (
                      <td
                        key={id}
                        className={`
                          schedule-slot
                          ${booking
                            ? "booked"
                            : "free"}
                          ${!visible
                            ? "filtered"
                            : ""}
                        `}
                      >

                        {visible ? (

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

        {filteredDays.map((day) => {

          const daySlots = TIMES.filter(
            (time) =>
              isVisible(day, time)
          );

          if (!daySlots.length) {
            return null;
          }

          return (
            <div
              className="mobile-day"
              key={day}
            >

              <h2>{day}</h2>

              {daySlots.map((time) => {

                const id =
                  makeId(day, time);

                const booking =
                  bookings[id];

                return (
                  <button
                    className={`
                      mobile-slot
                      ${booking
                        ? "booked"
                        : "free"}
                    `}
                    key={id}
                    onClick={() =>
                      booking
                        ? showDetails(id)
                        : openBooking(id)
                    }
                  >

                    <span>
                      {time}
                    </span>

                    <strong>
                      {booking
                        ? booking.name
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
              {selectedDay} — {selectedTime}
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
                    {selectedDay} — {selectedTime}
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
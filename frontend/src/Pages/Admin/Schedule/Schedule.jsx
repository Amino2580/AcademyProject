import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createClassOffering,
  createScheduleBooking,
  deleteScheduleBooking,
  getPublicScheduleAvailability,
  getScheduleBookings,
  updateScheduleBooking,
} from "../../../services/schedule";
import { useNavigate } from "react-router-dom";
import CurrentDateTimeCard from "../../../Components/CurrentDateTimeCard/CurrentDateTimeCard";
import {
  formatPersianFullDate,
} from "../../../utils/persianDateTime";
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

const CLASS_TYPE_LABELS = {
  private: "کلاس خصوصی",
  group: "کلاس گروهی",
  online: "کلاس آنلاین",
};

const addThirtyMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  const total = hours * 60 + minutes + 30;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};


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
  const [editingBookingId, setEditingBookingId] =
    useState(null);
  const [modal, setModal] = useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    instrument: "",
    classType: "private",
    endTime: "",
    capacity: 1,
    offeringId: null,
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
    selectedMobileDay,
    setSelectedMobileDay,
  ] = useState(
    () => DAY_ITEMS[
      (new Date().getDay() + 1) % 7
    ].value
  );

  const [
    unavailableSlotIds,
    setUnavailableSlotIds,
  ] = useState(() => new Set());

  const [slotMetadata, setSlotMetadata] =
    useState(() => new Map());

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
        await getScheduleBookings(
          weekStartIso
        );

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

        if (!bookingMap[slotId]) {
          bookingMap[slotId] = [];
        }

        bookingMap[slotId].push(booking);
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
  [navigate, weekStartIso]
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
          unavailableItems
            .filter((item) =>
              ["booked", "closed", "continuation"].includes(
                item.status || (item.isBooked ? "booked" : "closed")
              )
            )
            .map(
            (item) =>
              makeId(
                DAY_LABELS[item.day]
                  || item.dayLabel,
                item.startTime
              )
          )
        )
      );

      setSlotMetadata(
        new Map(
          unavailableItems.map((item) => [
            makeId(
              DAY_LABELS[item.day] || item.dayLabel,
              item.startTime,
            ),
            item,
          ])
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
    setEditingBookingId(null);

    const time = id.split("|")[1];
    const metadata = slotMetadata.get(id);
    const existingBooking =
      bookings[id]?.[0];

    const classType =
      metadata?.classType
      || existingBooking?.classType
      || "private";

    setForm({
      name: "",
      phone: "",
      instrument: "پیانو",
      classType,
      endTime:
        metadata?.endTime
        || existingBooking?.endTime
        || addThirtyMinutes(time),
      capacity:
        metadata?.capacity
        || existingBooking?.capacity
        || (classType === "group" ? 2 : 1),
      offeringId:
        metadata?.offeringId
        || existingBooking?.offeringId
        || null,
      notes: "",
    });

    setModal("booking");
  };

  /* ================= DETAILS ================= */

  const showDetails = (id) => {
    setSelectedId(id);
    setEditingBookingId(null);
    setModal("details");
  };

  /* ================= SUBMIT ================= */

  const submitBooking = async (e) => {
  e.preventDefault();

  if (!selectedId) return;

  setSaving(true);
  setError("");

  try {
    let offeringId = form.offeringId;

    if (!offeringId && !editingBooking) {
      const offering = await createClassOffering({
        day: DAY_VALUES[selectedDay],
        classType: form.classType,
        startTime: selectedTime,
        endTime: form.endTime,
        capacity:
          form.classType === "group"
            ? Number(form.capacity)
            : 1,
        isActive: true,
      });

      offeringId = offering.id;

      setForm((current) => ({
        ...current,
        offeringId: offering.id,
        capacity: offering.capacity,
      }));
    }

    const bookingData = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      instrument: form.instrument.trim(),
      classType: form.classType,
      endTime: form.endTime,
      offeringId,
      notes: form.notes.trim(),
    };

    if (editingBooking) {
      await updateScheduleBooking(
        editingBooking.id,
        bookingData
      );
    } else {
      const firstClassDate =
        weekDays.find(
          (day) =>
            day.label === selectedDay
        )?.isoDate;

      await createScheduleBooking({
        day: DAY_VALUES[selectedDay],
        startTime: selectedTime,
        firstClassDate,
        ...bookingData,
      });
    }

    await Promise.all([
      loadBookings(),
      loadWeekAvailability(),
    ]);
    setEditingBookingId(null);
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

  const editBooking = (booking) => {
    if (!booking) return;

    setEditingBookingId(booking.id);

    setForm({
      name: booking.name || "",
      phone: booking.phone || "",
      instrument: booking.instrument || "",
      classType: booking.classType || "private",
      endTime: booking.endTime || addThirtyMinutes(booking.startTime),
      capacity: booking.capacity || 1,
      offeringId: booking.offeringId || null,
      notes: booking.notes || "",
    });

    setModal("booking");
  };

  /* ================= CANCEL ================= */

 const cancelBooking = async (booking) => {
  if (!booking) return;

  const confirmed = window.confirm(
    `رزرو ${booking.name} لغو شود؟`
  );

  if (!confirmed) return;

  setSaving(true);
  setError("");

  try {
    await deleteScheduleBooking(
      booking.id
    );

    await Promise.all([
      loadBookings(),
      loadWeekAvailability(),
    ]);
    setEditingBookingId(null);
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

  const activeMobileDay =
    filteredWeekDays.find(
      (day) =>
        day.value === selectedMobileDay
    ) || filteredWeekDays[0] || null;


  const matchesSearch = (slotBookings) => {
    if (!search.trim()) return true;

    return slotBookings.some((booking) => {
      const text = `
        ${booking?.name || ""}
        ${booking?.phone || ""}
        ${booking?.instrument || ""}
        ${booking?.classTypeLabel || ""}
        ${booking?.notes || ""}
      `.toLowerCase();

      return text.includes(
        search.toLowerCase()
      );
    });
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
    const slotBookings = bookings[id] || [];
    const hasBookings =
      slotBookings.length > 0;
    const isUnavailable =
      isSlotUnavailable(day, time);

    if (
      statusFilter === "booked"
      && !hasBookings
    ) {
      return false;
    }

    if (
      statusFilter === "free"
      && (
        hasBookings
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
      hasBookings
      && !matchesSearch(slotBookings)
    ) {
      return false;
    }

    if (
      !hasBookings
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

  const selectedBookings =
    selectedId
      ? bookings[selectedId] || []
      : [];

  const selectedMetadata =
    selectedId
      ? slotMetadata.get(selectedId)
      : null;

  const editingBooking =
    selectedBookings.find(
      (booking) =>
        booking.id === editingBookingId
    ) || null;

  const selectedPrimaryBooking =
    selectedBookings[0] || null;

  const selectedClassType =
    selectedMetadata?.classType
    || selectedPrimaryBooking?.classType
    || "private";

  const selectedClassTypeLabel =
    selectedMetadata?.classTypeLabel
    || selectedPrimaryBooking?.classTypeLabel
    || CLASS_TYPE_LABELS[selectedClassType];

  const selectedCapacity = Number(
    selectedMetadata?.capacity
    || selectedPrimaryBooking?.capacity
    || 1
  );

  const selectedBookedCount =
    selectedBookings.length;

  const selectedRemainingCapacity =
    Math.max(
      0,
      selectedCapacity - selectedBookedCount
    );

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
      ? formatPersianFullDate(
          selectedDate
        )
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

        <CurrentDateTimeCard
          value={currentDateTime}
          className="schedule-current-date"
        />

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

                    const slotBookings =
                      bookings[id] || [];

                    const booking =
                      slotBookings[0] || null;

                    const metadata =
                      slotMetadata.get(id);

                    const hasBookings =
                      slotBookings.length > 0;

                    const hasOffering = Boolean(
                      metadata?.offeringId
                    );

                    const hasClass =
                      hasBookings || hasOffering;

                    const classType =
                      metadata?.classType
                      || booking?.classType
                      || "private";

                    const classTypeLabel =
                      metadata?.classTypeLabel
                      || booking?.classTypeLabel
                      || CLASS_TYPE_LABELS[classType];

                    const capacity = Number(
                      metadata?.capacity
                      || booking?.capacity
                      || 1
                    );

                    const endTime =
                      metadata?.endTime
                      || booking?.endTime
                      || addThirtyMinutes(time);

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
                          ${hasBookings
                            ? "booked"
                            : hasOffering
                              ? "offering"
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
                              hasBookings
                                ? showDetails(id)
                                : openBooking(id)
                            }
                          >

                            {hasClass ? (
                              <>
                                <strong>
                                  {classType === "group"
                                    ? classTypeLabel
                                    : booking?.name
                                      || classTypeLabel}
                                </strong>

                                <small>
                                  {classType === "group"
                                    ? `${slotBookings.length} از ${capacity} هنرجو · `
                                    : booking
                                      ? `${classTypeLabel} · `
                                      : ""}
                                  {time} تا {endTime}
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
        <div
          className="admin-mobile-day-tabs"
          role="tablist"
          aria-label="انتخاب روز برنامه"
        >
          {filteredWeekDays.map((day) => (
            <button
              type="button"
              role="tab"
              key={day.isoDate}
              className={[
                day.value === activeMobileDay?.value
                  ? "active"
                  : "",
                day.isHoliday
                  ? "holiday"
                  : "",
                day.isoDate === todayIsoDate
                  ? "today"
                  : "",
              ].filter(Boolean).join(" ")}
              aria-selected={
                day.value === activeMobileDay?.value
              }
              onClick={() => {
                setSelectedMobileDay(
                  day.value
                );
                setSelectedId(null);
                setModal(null);
              }}
            >
              <strong>{day.label}</strong>
              <span>
                {formatDayMonth(day.date)}
              </span>
              {day.isoDate === todayIsoDate && (
                <small>امروز</small>
              )}
            </button>
          ))}
        </div>

        {activeMobileDay ? (
          <div
            className={
              `mobile-day ${
                activeMobileDay.isHoliday
                  ? "holiday"
                  : ""
              }`
            }
          >
            <div className="mobile-day-heading">
              <div>
                <span>برنامه روز</span>
                <h2>
                  {activeMobileDay.label}،{" "}
                  {formatDayMonth(
                    activeMobileDay.date
                  )}
                </h2>
              </div>

              {activeMobileDay.isoDate
                === todayIsoDate && (
                <em>امروز</em>
              )}
            </div>

            <div className="mobile-day-slots">
              {TIMES.filter(
                (time) =>
                  isVisible(
                    activeMobileDay.label,
                    time
                  )
              ).map((time) => {
                const id = makeId(
                  activeMobileDay.label,
                  time
                );

                const slotBookings =
                  bookings[id] || [];

                const booking =
                  slotBookings[0] || null;

                const metadata =
                  slotMetadata.get(id);

                const hasBookings =
                  slotBookings.length > 0;

                const hasOffering = Boolean(
                  metadata?.offeringId
                );

                const classType =
                  metadata?.classType
                  || booking?.classType
                  || "private";

                const classTypeLabel =
                  metadata?.classTypeLabel
                  || booking?.classTypeLabel
                  || CLASS_TYPE_LABELS[classType];

                const capacity = Number(
                  metadata?.capacity
                  || booking?.capacity
                  || 1
                );

                const endTime =
                  metadata?.endTime
                  || booking?.endTime
                  || addThirtyMinutes(time);

                const unavailable =
                  isSlotUnavailable(
                    activeMobileDay.label,
                    time
                  );

                return (
                  <button
                    type="button"
                    className={
                      `mobile-slot ${
                        hasBookings
                          ? "booked"
                          : hasOffering
                            ? "offering"
                          : unavailable
                            ? "unavailable"
                            : "free"
                      }`
                    }
                    key={id}
                    disabled={unavailable}
                    onClick={() => {
                      if (unavailable) return;

                      hasBookings
                        ? showDetails(id)
                        : openBooking(id);
                    }}
                    aria-label={
                      `${activeMobileDay.label} ساعت ${time} - ${
                        hasBookings
                          ? classType === "group"
                            ? classTypeLabel
                            : booking.name
                          : hasOffering
                            ? classTypeLabel
                          : unavailable
                            ? "بسته"
                            : "آزاد"
                      }`
                    }
                  >
                    <span className="mobile-slot-time">
                      {time}
                    </span>

                    <span className="mobile-slot-copy">
                      <strong>
                        {hasBookings
                          ? classType === "group"
                            ? classTypeLabel
                            : booking.name
                          : hasOffering
                            ? classTypeLabel
                          : unavailable
                            ? "بسته"
                            : "زمان آزاد"}
                      </strong>

                      <small>
                        {hasBookings || hasOffering
                          ? classType === "group"
                            ? `${slotBookings.length} از ${capacity} هنرجو · ${time} تا ${endTime}`
                            : `${classTypeLabel} · ${time} تا ${endTime}`
                          : unavailable
                            ? "خارج از زمان تدریس"
                            : "برای ثبت رزرو لمس کنید"}
                      </small>
                    </span>
                  </button>
                );
              })}

              {!TIMES.some(
                (time) =>
                  isVisible(
                    activeMobileDay.label,
                    time
                  )
              ) && (
                <div className="mobile-schedule-empty">
                  نتیجه‌ای با فیلترهای فعلی پیدا نشد.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mobile-schedule-empty">
            روزی برای نمایش وجود ندارد.
          </div>
        )}
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
              {editingBooking
                ? "ویرایش هنرجو"
                : selectedBookings.length
                  ? "افزودن هنرجو به کلاس"
                  : "تعریف کلاس و ثبت هنرجو"}
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
                  نوع کلاس
                </label>

                <select
                  value={form.classType}
                  disabled={Boolean(form.offeringId)}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      classType: e.target.value,
                      capacity:
                        e.target.value === "group"
                          ? Math.max(
                              2,
                              Number(current.capacity)
                              || 2
                            )
                          : 1,
                    }))
                  }
                >
                  {Object.entries(CLASS_TYPE_LABELS).map(
                    ([value, label]) => (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    )
                  )}
                </select>

              </div>

              {form.classType === "group" && (
                <div className="form-field">

                  <label>
                    ظرفیت کلاس گروهی
                  </label>

                  <input
                    required
                    type="number"
                    min="2"
                    max="50"
                    value={form.capacity}
                    disabled={Boolean(form.offeringId)}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        capacity: e.target.value,
                      })
                    }
                  />

                  <small className="form-field-note">
                    {form.offeringId
                      ? "ظرفیت این کلاس از بخش نوع و ساعت کلاس‌ها مدیریت می‌شود."
                      : "حداکثر تعداد هنرجوهای این کلاس را مشخص کنید."}
                  </small>

                </div>
              )}

              <div className="form-field">

                <label>ساعت پایان</label>

                <select
                  value={form.endTime}
                  disabled={Boolean(form.offeringId)}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      endTime: e.target.value,
                    })
                  }
                >
                  {TIMES.filter(
                    (time) => time > selectedTime
                  ).map((time) => (
                    <option value={time} key={time}>
                      {time}
                    </option>
                  ))}
                  <option value="19:30">19:30</option>
                </select>

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
                    : editingBooking
                      ? "ذخیره تغییرات"
                      : "ثبت هنرجو"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ================= DETAILS MODAL ================= */}

      {modal === "details" &&
        selectedBookings.length > 0 && (

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
                    {selectedDateLabel} — {selectedTime} تا {selectedMetadata?.endTime || selectedPrimaryBooking.endTime}
                  </strong>
                </div>

                <div>
                  <span>
                    نوع کلاس
                  </span>

                  <strong>
                    {selectedClassTypeLabel}
                  </strong>
                </div>

                <div>
                  <span>
                    ظرفیت
                  </span>

                  <strong>
                    {selectedBookedCount} از {selectedCapacity} نفر
                  </strong>
                </div>

                <div>
                  <span>
                    ظرفیت باقی‌مانده
                  </span>

                  <strong>
                    {selectedRemainingCapacity} نفر
                  </strong>
                </div>

              </div>

              <section className="class-members">
                <header>
                  <div>
                    <span>اعضای این کلاس</span>
                    <strong>هنرجویان ثبت‌شده</strong>
                  </div>
                  <b>{selectedBookedCount}</b>
                </header>

                <div className="class-members-list">
                  {selectedBookings.map((booking) => (
                    <article
                      className="class-member"
                      key={booking.id}
                    >
                      <div className="class-member-info">
                        <strong>{booking.name}</strong>
                        <span dir="ltr">{booking.phone}</span>
                        {booking.notes && (
                          <small>{booking.notes}</small>
                        )}
                      </div>

                      <div className="class-member-actions">
                        <button
                          type="button"
                          className="member-edit-button"
                          onClick={() =>
                            editBooking(booking)
                          }
                        >
                          ویرایش
                        </button>
                        <button
                          type="button"
                          className="member-delete-button"
                          disabled={saving}
                          onClick={() =>
                            cancelBooking(booking)
                          }
                        >
                          حذف
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <div className="modal-actions">

                {selectedRemainingCapacity > 0 && (
                  <button
                    className="primary-btn"
                    onClick={() =>
                      openBooking(selectedId)
                    }
                  >
                    افزودن هنرجو
                  </button>
                )}

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

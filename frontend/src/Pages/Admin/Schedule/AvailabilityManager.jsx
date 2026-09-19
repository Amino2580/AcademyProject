import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  createAvailabilityException,
  createClassOffering,
  createWeeklyAvailability,
  deleteAvailabilityException,
  deleteClassOffering,
  deleteWeeklyAvailability,
  getAvailabilityExceptions,
  getClassOfferings,
  getWeeklyAvailability,
  updateClassOffering,
  updateWeeklyAvailability,
} from "../../../services/schedule";

import "./AvailabilityManager.css";


const DAYS = [
  { value: "saturday", label: "شنبه" },
  { value: "sunday", label: "یکشنبه" },
  { value: "monday", label: "دوشنبه" },
  { value: "tuesday", label: "سه‌شنبه" },
  { value: "wednesday", label: "چهارشنبه" },
  { value: "thursday", label: "پنجشنبه" },
  { value: "friday", label: "جمعه", isHoliday: true },
];


const TIME_OPTIONS = Array.from(
  { length: 26 },
  (_, index) => {
    const minutes = 7 * 60 + index * 30;
    const hour = String(
      Math.floor(minutes / 60)
    ).padStart(2, "0");
    const minute = String(
      minutes % 60
    ).padStart(2, "0");

    return `${hour}:${minute}`;
  }
);


const CLASS_TYPES = [
  {
    value: "private",
    label: "کلاس خصوصی",
  },
  {
    value: "group",
    label: "کلاس گروهی",
  },
  {
    value: "online",
    label: "کلاس آنلاین",
  },
];


const INITIAL_OFFERING_FORM = {
  id: null,
  day: "saturday",
  classType: "private",
  startTime: "09:00",
  endTime: "09:30",
  capacity: 1,
  isActive: true,
};


const PERSIAN_DATE_FORMATTER =
  new Intl.DateTimeFormat(
    "fa-IR-u-ca-persian",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );


const PERSIAN_DATE_KEY_FORMATTER =
  new Intl.DateTimeFormat(
    "en-US-u-ca-persian",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  );


// منبع: تقویم رسمی ۱۴۰۵ مرکز تقویم دانشگاه تهران
const OFFICIAL_HOLIDAYS = {
  "1405-01-01": "عید سعید فطر و آغاز نوروز",
  "1405-01-02": "تعطیل عید سعید فطر و عید نوروز",
  "1405-01-03": "عید نوروز",
  "1405-01-04": "عید نوروز",
  "1405-01-12": "روز جمهوری اسلامی ایران",
  "1405-01-13": "روز طبیعت",
  "1405-01-25": "شهادت امام جعفر صادق (ع)",
  "1405-03-06": "عید سعید قربان",
  "1405-03-14": "عید سعید غدیر خم و رحلت امام خمینی (ره)",
  "1405-03-15": "قیام پانزده خرداد",
  "1405-04-03": "تاسوعای حسینی",
  "1405-04-04": "عاشورای حسینی",
  "1405-05-13": "اربعین حسینی",
  "1405-05-21": "رحلت پیامبر اکرم (ص) و شهادت امام حسن مجتبی (ع)",
  "1405-05-22": "شهادت امام رضا (ع)",
  "1405-05-30": "شهادت امام حسن عسکری (ع)",
  "1405-06-08": "ولادت پیامبر اکرم (ص) و امام جعفر صادق (ع)",
  "1405-08-22": "شهادت حضرت فاطمه زهرا (س)",
  "1405-10-02": "ولادت امام علی (ع) و روز پدر",
  "1405-10-16": "مبعث پیامبر اکرم (ص)",
  "1405-11-04": "ولادت حضرت قائم (عج)",
  "1405-11-22": "پیروزی انقلاب اسلامی ایران",
  "1405-12-09": "شهادت امام علی (ع)",
  "1405-12-19": "عید سعید فطر",
  "1405-12-20": "تعطیل عید سعید فطر",
  "1405-12-29": "ملی شدن صنعت نفت ایران",
};


function toLocalIsoDate(date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function parseLocalDate(value) {
  const [year, month, day] = value
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day,
    12,
  );
}


function partsToObject(formatter, date) {
  return formatter
    .formatToParts(date)
    .reduce((result, part) => {
      if (part.type !== "literal") {
        result[part.type] = part.value;
      }

      return result;
    }, {});
}


function getPersianDateMeta(value) {
  const date = parseLocalDate(value);
  const displayParts = partsToObject(
    PERSIAN_DATE_FORMATTER,
    date,
  );
  const keyParts = partsToObject(
    PERSIAN_DATE_KEY_FORMATTER,
    date,
  );
  const dateKey = [
    keyParts.year,
    keyParts.month,
    keyParts.day,
  ].join("-");
  const officialHoliday =
    OFFICIAL_HOLIDAYS[dateKey] || "";
  const isFriday = date.getDay() === 5;

  return {
    label:
      `${displayParts.weekday}، `
      + `${displayParts.day} `
      + `${displayParts.month} `
      + displayParts.year,
    officialHoliday,
    persianYear: keyParts.year,
    isFriday,
    isHoliday:
      isFriday || Boolean(officialHoliday),
  };
}


function formatPersianDate(value) {
  return getPersianDateMeta(value).label;
}


function createDateOptions() {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const firstValue = toLocalIsoDate(today);
  const currentPersianYear =
    getPersianDateMeta(firstValue).persianYear;
  const options = [];

  for (
    let index = 0;
    index < 370;
    index += 1
  ) {
    const date = new Date(today);
    date.setDate(today.getDate() + index);

    const value = toLocalIsoDate(date);
    const dateMeta = getPersianDateMeta(value);

    if (
      dateMeta.persianYear
      !== currentPersianYear
    ) {
      break;
    }

    options.push({
      value,
      ...dateMeta,
      isToday: index === 0,
    });
  }

  return options;
}


function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}


function errorText(error, fallback) {
  return error instanceof Error
    ? error.message
    : fallback;
}


function TimeSelect({
  value,
  onChange,
  disabled,
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      dir="ltr"
    >
      {TIME_OPTIONS.map((time) => (
        <option value={time} key={time}>
          {time}
        </option>
      ))}
    </select>
  );
}


function PersianDateSelect({
  options,
  value,
  onChange,
  disabled,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const selectedOptionRef = useRef(null);

  const selectedOption =
    options.find((option) => option.value === value)
    || options[0];


  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (
        !containerRef.current?.contains(
          event.target
        )
      ) {
        setIsOpen(false);
      }
    };

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      "pointerdown",
      closeOnOutsideClick,
    );
    document.addEventListener(
      "keydown",
      closeOnEscape,
    );

    const frameId = window.requestAnimationFrame(
      () => {
        selectedOptionRef.current?.scrollIntoView({
          block: "nearest",
        });
      }
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        closeOnOutsideClick,
      );
      document.removeEventListener(
        "keydown",
        closeOnEscape,
      );
      window.cancelAnimationFrame(frameId);
    };
  }, [isOpen]);


  const chooseDate = (date) => {
    onChange(date);
    setIsOpen(false);
  };


  return (
    <div
      className={`persian-date-select ${
        isOpen ? "open" : ""
      } ${
        selectedOption?.isHoliday
          ? "holiday"
          : ""
      }`}
      ref={containerRef}
    >
      <button
        type="button"
        className="persian-date-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={(event) => {
          if (
            event.key === "ArrowDown"
            || event.key === "ArrowUp"
          ) {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
      >
        <span className="persian-date-value">
          <strong>{selectedOption?.label}</strong>

          {selectedOption?.isHoliday && (
            <small>
              {selectedOption.officialHoliday
                ? `تعطیل رسمی · ${selectedOption.officialHoliday}`
                : "تعطیل هفتگی"}
            </small>
          )}
        </span>

        <svg
          className="persian-date-chevron"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="persian-date-options"
          role="listbox"
          aria-label="تاریخ‌های پیش رو"
        >
          {options.map((option) => {
            const isSelected =
              option.value === value;

            return (
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`persian-date-option ${
                  isSelected ? "selected" : ""
                } ${
                  option.isHoliday ? "holiday" : ""
                }`}
                ref={
                  isSelected
                    ? selectedOptionRef
                    : undefined
                }
                key={option.value}
                onClick={() =>
                  chooseDate(option.value)
                }
              >
                <span className="date-option-copy">
                  <strong>{option.label}</strong>

                  {option.isHoliday && (
                    <small>
                      {option.officialHoliday
                        ? `تعطیل رسمی · ${option.officialHoliday}`
                        : "تعطیل هفتگی"}
                    </small>
                  )}
                </span>

                {option.isToday && (
                  <span className="date-option-today">
                    امروز
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}


function AvailabilityManager({
  onAvailabilityChanged,
}) {
  const dateOptions = useMemo(
    () => createDateOptions(),
    []
  );

  const [activeTab, setActiveTab] =
    useState("weekly");
  const [weeklyRanges, setWeeklyRanges] =
    useState([]);
  const [exceptions, setExceptions] =
    useState([]);
  const [offerings, setOfferings] =
    useState([]);
  const [loading, setLoading] =
    useState(true);
  const [savingKey, setSavingKey] =
    useState("");
  const [error, setError] =
    useState("");
  const [success, setSuccess] =
    useState("");

  const [exceptionForm, setExceptionForm] =
    useState(() => ({
      date: toLocalIsoDate(new Date()),
      isFullDay: true,
      startTime: "07:00",
      endTime: "07:30",
      reason: "",
    }));

  const [offeringForm, setOfferingForm] =
    useState(INITIAL_OFFERING_FORM);


  const refreshData = useCallback(
    async () => {
      const [
        weeklyData,
        exceptionData,
        offeringData,
      ] =
        await Promise.all([
          getWeeklyAvailability(),
          getAvailabilityExceptions(),
          getClassOfferings(),
        ]);

      setWeeklyRanges(
        normalizeList(weeklyData)
      );
      setExceptions(
        normalizeList(exceptionData)
      );
      setOfferings(
        normalizeList(offeringData)
      );
    },
    []
  );


  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => {
        refreshData()
          .catch((loadError) => {
            setError(
              errorText(
                loadError,
                "دریافت برنامه حضور استاد انجام نشد."
              )
            );
          })
          .finally(() => {
            setLoading(false);
          });
      },
      0,
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [refreshData]);


  const activeDaysCount = useMemo(
    () =>
      new Set(
        weeklyRanges.map(
          (range) => range.day
        )
      ).size,
    [weeklyRanges]
  );


  const runAction = async ({
    key,
    action,
    successMessage,
    fallbackMessage,
  }) => {
    setSavingKey(key);
    setError("");
    setSuccess("");

    try {
      await action();
      await refreshData();

      if (onAvailabilityChanged) {
        await onAvailabilityChanged();
      }

      setSuccess(successMessage);
      return true;
    } catch (actionError) {
      setError(
        errorText(
          actionError,
          fallbackMessage,
        )
      );
      return false;
    } finally {
      setSavingKey("");
    }
  };


  const rangesForDay = (dayValue) =>
    weeklyRanges.filter(
      (range) => range.day === dayValue
    );


  const changeRange = (
    rangeId,
    field,
    value,
  ) => {
    setWeeklyRanges((currentRanges) =>
      currentRanges.map((range) =>
        range.id === rangeId
          ? {
              ...range,
              [field]: value,
            }
          : range
      )
    );
    setError("");
    setSuccess("");
  };


  const toggleDay = async (day) => {
    const ranges = rangesForDay(day.value);

    if (ranges.length) {
      const confirmed = window.confirm(
        `روز ${day.label} غیرفعال شود؟ `
        + "رزروهای قبلی حذف نخواهند شد."
      );

      if (!confirmed) return;

      await runAction({
        key: `toggle-${day.value}`,
        action: () =>
          Promise.all(
            ranges.map((range) =>
              deleteWeeklyAvailability(
                range.id
              )
            )
          ),
        successMessage:
          `${day.label} غیرفعال شد.`,
        fallbackMessage:
          "غیرفعال‌کردن روز انجام نشد.",
      });

      return;
    }

    await runAction({
      key: `toggle-${day.value}`,
      action: () =>
        createWeeklyAvailability({
          day: day.value,
          startTime: "07:00",
          endTime: "19:30",
        }),
      successMessage:
        `${day.label} فعال شد.`,
      fallbackMessage:
        "فعال‌کردن روز انجام نشد.",
    });
  };


  const saveRange = async (range) => {
    if (range.startTime >= range.endTime) {
      setError(
        "ساعت پایان باید بعد از ساعت شروع باشد."
      );
      return;
    }

    await runAction({
      key: `range-${range.id}`,
      action: () =>
        updateWeeklyAvailability(
          range.id,
          {
            day: range.day,
            startTime: range.startTime,
            endTime: range.endTime,
          }
        ),
      successMessage:
        "ساعات حضور استاد ذخیره شد.",
      fallbackMessage:
        "ویرایش ساعات حضور انجام نشد.",
    });
  };


  const resetOfferingForm = () => {
    setOfferingForm(INITIAL_OFFERING_FORM);
  };


  const changeOfferingField = (
    field,
    value,
  ) => {
    setOfferingForm((current) => {
      const nextForm = {
        ...current,
        [field]: value,
      };

      if (
        field === "classType"
        && value === "private"
      ) {
        nextForm.capacity = 1;
      }

      if (
        field === "classType"
        && value === "group"
        && Number(current.capacity) < 2
      ) {
        nextForm.capacity = 2;
      }

      return nextForm;
    });
    setError("");
    setSuccess("");
  };


  const submitOffering = async (event) => {
    event.preventDefault();

    if (
      offeringForm.startTime
      >= offeringForm.endTime
    ) {
      setError(
        "ساعت پایان باید بعد از ساعت شروع باشد."
      );
      return;
    }

    const payload = {
      day: offeringForm.day,
      classType: offeringForm.classType,
      startTime: offeringForm.startTime,
      endTime: offeringForm.endTime,
      capacity: Number(offeringForm.capacity),
      isActive: offeringForm.isActive,
    };

    const isEditing = Boolean(offeringForm.id);
    const saved = await runAction({
      key: isEditing
        ? `offering-${offeringForm.id}`
        : "new-offering",
      action: () =>
        isEditing
          ? updateClassOffering(
              offeringForm.id,
              payload,
            )
          : createClassOffering(payload),
      successMessage: isEditing
        ? "برنامهٔ کلاس ویرایش شد."
        : "برنامهٔ کلاس جدید ثبت شد.",
      fallbackMessage:
        "ذخیره برنامهٔ نوع کلاس انجام نشد.",
    });

    if (saved) {
      resetOfferingForm();
    }
  };


  const editOffering = (offering) => {
    setOfferingForm({
      id: offering.id,
      day: offering.day,
      classType: offering.classType,
      startTime: offering.startTime,
      endTime: offering.endTime,
      capacity: offering.capacity,
      isActive: offering.isActive,
    });
    setError("");
    setSuccess("");
  };


  const removeOffering = async (offering) => {
    const confirmed = window.confirm(
      "این برنامهٔ کلاس حذف شود؟"
    );

    if (!confirmed) return;

    const removed = await runAction({
      key: `offering-${offering.id}`,
      action: () =>
        deleteClassOffering(offering.id),
      successMessage: "برنامهٔ کلاس حذف شد.",
      fallbackMessage:
        "حذف برنامهٔ کلاس انجام نشد.",
    });

    if (
      removed
      && offeringForm.id === offering.id
    ) {
      resetOfferingForm();
    }
  };


  const submitException = async (event) => {
    event.preventDefault();

    if (
      !exceptionForm.isFullDay
      && exceptionForm.startTime
        >= exceptionForm.endTime
    ) {
      setError(
        "ساعت پایان باید بعد از ساعت شروع باشد."
      );
      return;
    }

    const created = await runAction({
      key: "new-exception",
      action: () =>
        createAvailabilityException({
          date: exceptionForm.date,
          startTime:
            exceptionForm.isFullDay
              ? null
              : exceptionForm.startTime,
          endTime:
            exceptionForm.isFullDay
              ? null
              : exceptionForm.endTime,
          reason: exceptionForm.reason.trim(),
        }),
      successMessage:
        "عدم حضور استاد ثبت شد.",
      fallbackMessage:
        "ثبت عدم حضور انجام نشد.",
    });

    if (created) {
      setExceptionForm((currentForm) => ({
        ...currentForm,
        isFullDay: true,
        startTime: "07:00",
        endTime: "07:30",
        reason: "",
      }));
    }
  };


  const removeException = async (item) => {
    const confirmed = window.confirm(
      "این محدودیت حذف شود؟"
    );

    if (!confirmed) return;

    await runAction({
      key: `exception-${item.id}`,
      action: () =>
        deleteAvailabilityException(item.id),
      successMessage:
        "محدودیت تاریخ انتخابی حذف شد.",
      fallbackMessage:
        "حذف محدودیت انجام نشد.",
    });
  };


  if (loading) {
    return (
      <section
        className="availability-manager loading"
        dir="rtl"
      >
        در حال دریافت برنامه حضور استاد...
      </section>
    );
  }


  return (
    <section
      className="availability-manager"
      dir="rtl"
    >
      <header className="availability-header">
        <div>
          <span className="availability-kicker">
            مدیریت حضور استاد
          </span>
          <h2>زمان‌های قابل رزرو</h2>
          <p>
            روزهای تدریس و عدم حضورهای موردی
            را از این بخش تنظیم کنید.
          </p>
        </div>

        <div className="availability-count">
          <strong>{activeDaysCount}</strong>
          <span>روز فعال در هفته</span>
        </div>
      </header>

      <div
        className="availability-tabs"
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "weekly"}
          className={
            activeTab === "weekly"
              ? "active"
              : ""
          }
          onClick={() => setActiveTab("weekly")}
        >
          برنامه ثابت هفتگی
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "offerings"}
          className={
            activeTab === "offerings"
              ? "active"
              : ""
          }
          onClick={() => setActiveTab("offerings")}
        >
          نوع و ساعت کلاس‌ها
          {offerings.length > 0 && (
            <span>{offerings.length}</span>
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={
            activeTab === "exceptions"
          }
          className={
            activeTab === "exceptions"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("exceptions")
          }
        >
          عدم حضور موردی
          {exceptions.length > 0 && (
            <span>{exceptions.length}</span>
          )}
        </button>
      </div>

      {error && (
        <div className="availability-message error">
          {error}
        </div>
      )}

      {success && (
        <div className="availability-message success">
          {success}
        </div>
      )}

      {activeTab === "weekly" ? (
        <>
          <p className="availability-swipe-hint">
            برای دیدن روزهای دیگر، کارت‌ها را بکشید.
          </p>

          <div className="weekly-days-grid">
          {DAYS.map((day) => {
            const ranges = rangesForDay(day.value);
            const isActive = ranges.length > 0;

            return (
              <article
                className={`weekly-day-card ${
                  isActive ? "enabled" : "disabled"
                } ${day.isHoliday ? "holiday" : ""}`}
                key={day.value}
              >
                <div className="weekly-day-head">
                  <div>
                    <strong>{day.label}</strong>
                    <span>
                      {isActive
                        ? "آماده رزرو"
                        : "تعطیل"}
                    </span>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={isActive}
                    className={`day-switch ${
                      isActive ? "on" : "off"
                    }`}
                    disabled={Boolean(savingKey)}
                    onClick={() => toggleDay(day)}
                  >
                    <span />
                  </button>
                </div>

                {isActive ? (
                  <div className="day-ranges">
                    {ranges.map((range) => (
                      <div
                        className="day-range-row"
                        key={range.id}
                      >
                        <label>
                          <span>از</span>
                          <TimeSelect
                            value={range.startTime}
                            disabled={Boolean(savingKey)}
                            onChange={(event) =>
                              changeRange(
                                range.id,
                                "startTime",
                                event.target.value,
                              )
                            }
                          />
                        </label>

                        <label>
                          <span>تا</span>
                          <TimeSelect
                            value={range.endTime}
                            disabled={Boolean(savingKey)}
                            onChange={(event) =>
                              changeRange(
                                range.id,
                                "endTime",
                                event.target.value,
                              )
                            }
                          />
                        </label>

                        <button
                          type="button"
                          className="save-day-button"
                          disabled={Boolean(savingKey)}
                          onClick={() => saveRange(range)}
                        >
                          {savingKey === `range-${range.id}`
                            ? "..."
                            : "ذخیره"}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="day-off-text">
                    تمام ساعت‌های این روز برای
                    کاربران غیرفعال است.
                  </p>
                )}
              </article>
            );
          })}
          </div>
        </>
      ) : activeTab === "offerings" ? (
        <div className="offerings-layout">
          <form
            className="offering-form"
            onSubmit={submitOffering}
          >
            <div className="exception-form-title">
              <span>
                {offeringForm.id
                  ? "ویرایش برنامه"
                  : "برنامه جدید"}
              </span>
              <h3>نوع و ساعت کلاس</h3>
              <p>
                نوع کلاس، روز و بازهٔ دقیق برگزاری
                را مشخص کنید.
              </p>
            </div>

            <label className="availability-field">
              <span>نوع کلاس</span>
              <select
                value={offeringForm.classType}
                disabled={Boolean(savingKey)}
                onChange={(event) =>
                  changeOfferingField(
                    "classType",
                    event.target.value,
                  )
                }
              >
                {CLASS_TYPES.map((classType) => (
                  <option
                    value={classType.value}
                    key={classType.value}
                  >
                    {classType.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="availability-field">
              <span>روز برگزاری</span>
              <select
                value={offeringForm.day}
                disabled={Boolean(savingKey)}
                onChange={(event) =>
                  changeOfferingField(
                    "day",
                    event.target.value,
                  )
                }
              >
                {DAYS.map((day) => (
                  <option
                    value={day.value}
                    key={day.value}
                  >
                    {day.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="offering-time-row">
              <label className="availability-field">
                <span>ساعت شروع</span>
                <TimeSelect
                  value={offeringForm.startTime}
                  disabled={Boolean(savingKey)}
                  onChange={(event) =>
                    changeOfferingField(
                      "startTime",
                      event.target.value,
                    )
                  }
                />
              </label>

              <label className="availability-field">
                <span>ساعت پایان</span>
                <TimeSelect
                  value={offeringForm.endTime}
                  disabled={Boolean(savingKey)}
                  onChange={(event) =>
                    changeOfferingField(
                      "endTime",
                      event.target.value,
                    )
                  }
                />
              </label>
            </div>

            <label className="availability-field">
              <span>ظرفیت کلاس</span>
              <input
                type="number"
                min={
                  offeringForm.classType === "group"
                    ? 2
                    : 1
                }
                max={50}
                value={offeringForm.capacity}
                disabled={
                  Boolean(savingKey)
                  || offeringForm.classType
                    === "private"
                }
                onChange={(event) =>
                  changeOfferingField(
                    "capacity",
                    event.target.value,
                  )
                }
              />
              <small className="offering-field-note">
                {offeringForm.classType === "private"
                  ? "ظرفیت کلاس خصوصی همیشه یک نفر است."
                  : "حداکثر تعداد هنرجوهای هم‌زمان را وارد کنید."}
              </small>
            </label>

            <label className="full-day-check">
              <div>
                <strong>نمایش برای ثبت‌نام</strong>
                <span>
                  در برنامه عمومی قابل انتخاب باشد.
                </span>
              </div>
              <input
                type="checkbox"
                checked={offeringForm.isActive}
                disabled={Boolean(savingKey)}
                onChange={(event) =>
                  changeOfferingField(
                    "isActive",
                    event.target.checked,
                  )
                }
              />
            </label>

            <div className="offering-form-actions">
              <button
                type="submit"
                className="add-exception-button"
                disabled={Boolean(savingKey)}
              >
                {savingKey
                  ? "در حال ذخیره..."
                  : offeringForm.id
                    ? "ذخیره تغییرات"
                    : "ثبت برنامه کلاس"}
              </button>

              {offeringForm.id && (
                <button
                  type="button"
                  className="cancel-offering-edit"
                  disabled={Boolean(savingKey)}
                  onClick={resetOfferingForm}
                >
                  انصراف
                </button>
              )}
            </div>
          </form>

          <div className="offerings-list-card">
            <div className="exceptions-list-head">
              <div>
                <span>برنامه قابل ثبت‌نام</span>
                <h3>کلاس‌های تعریف‌شده</h3>
              </div>
              <strong>{offerings.length}</strong>
            </div>

            {offerings.length ? (
              <div className="offerings-list">
                {offerings.map((offering) => (
                  <article
                    className={`offering-item ${
                      offering.isActive
                        ? "active"
                        : "inactive"
                    }`}
                    key={offering.id}
                  >
                    <div className="offering-item-main">
                      <span
                        className={`offering-type ${
                          offering.classType
                        }`}
                      >
                        {offering.classTypeLabel}
                      </span>
                      <strong>
                        {offering.dayLabel}، {" "}
                        {offering.startTime} تا {" "}
                        {offering.endTime}
                      </strong>
                      <small>
                        {offering.bookedCount} نفر ثبت‌شده
                        {" · "}
                        {offering.remainingCapacity} ظرفیت باقی‌مانده
                      </small>
                    </div>

                    <div className="offering-item-actions">
                      <button
                        type="button"
                        disabled={Boolean(savingKey)}
                        onClick={() =>
                          editOffering(offering)
                        }
                      >
                        ویرایش
                      </button>
                      <button
                        type="button"
                        className="danger"
                        disabled={Boolean(savingKey)}
                        onClick={() =>
                          removeOffering(offering)
                        }
                      >
                        حذف
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-exceptions">
                <strong>
                  هنوز نوع کلاسی تعریف نشده است
                </strong>
                <p>
                  اولین برنامه را از فرم کنار ثبت کنید.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="exceptions-layout">
          <form
            className="exception-form"
            onSubmit={submitException}
          >
            <div className="exception-form-title">
              <span>عدم حضور جدید</span>
              <h3>بستن یک تاریخ مشخص</h3>
              <p>
                این تنظیم فقط برای تاریخ انتخابی
                اعمال می‌شود.
              </p>
            </div>

            <div className="availability-field">
              <span>تاریخ شمسی</span>

              <PersianDateSelect
                options={dateOptions}
                value={exceptionForm.date}
                disabled={Boolean(savingKey)}
                onChange={(date) =>
                  setExceptionForm((current) => ({
                    ...current,
                    date,
                  }))
                }
              />

              <small className="date-field-note">
                <i />
                روزهای قرمز فقط نشانگر تعطیلی تقویم‌اند.
              </small>
            </div>

            <label className="full-day-check">
              <div>
                <strong>تمام روز حضور ندارم</strong>
                <span>
                  همه ساعت‌های این تاریخ بسته می‌شوند.
                </span>
              </div>
              <input
                type="checkbox"
                checked={exceptionForm.isFullDay}
                disabled={Boolean(savingKey)}
                onChange={(event) =>
                  setExceptionForm((current) => ({
                    ...current,
                    isFullDay: event.target.checked,
                  }))
                }
              />
            </label>

            {!exceptionForm.isFullDay && (
              <div className="exception-time-row">
                <label className="availability-field">
                  <span>از ساعت</span>
                  <TimeSelect
                    value={exceptionForm.startTime}
                    disabled={Boolean(savingKey)}
                    onChange={(event) =>
                      setExceptionForm((current) => ({
                        ...current,
                        startTime: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="availability-field">
                  <span>تا ساعت</span>
                  <TimeSelect
                    value={exceptionForm.endTime}
                    disabled={Boolean(savingKey)}
                    onChange={(event) =>
                      setExceptionForm((current) => ({
                        ...current,
                        endTime: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            )}

            <label className="availability-field">
              <span>یادداشت داخلی (اختیاری)</span>
              <input
                type="text"
                maxLength={200}
                value={exceptionForm.reason}
                disabled={Boolean(savingKey)}
                placeholder="مثلاً جلسه دانشگاه"
                onChange={(event) =>
                  setExceptionForm((current) => ({
                    ...current,
                    reason: event.target.value,
                  }))
                }
              />
            </label>

            <button
              type="submit"
              className="add-exception-button"
              disabled={Boolean(savingKey)}
            >
              {savingKey === "new-exception"
                ? "در حال ثبت..."
                : "ثبت عدم حضور"}
            </button>
          </form>

          <div className="exceptions-list-card">
            <div className="exceptions-list-head">
              <div>
                <span>تقویم عدم حضور</span>
                <h3>تاریخ‌های ثبت‌شده</h3>
              </div>
              <strong>{exceptions.length}</strong>
            </div>

            {exceptions.length ? (
              <div className="exceptions-list">
                {exceptions.map((item) => (
                  <article
                    className="exception-item"
                    key={item.id}
                  >
                    <div className="exception-item-main">
                      <strong>
                        {formatPersianDate(item.date)}
                      </strong>
                      <span>
                        {item.isFullDay
                          ? "تعطیلی کامل"
                          : `${item.startTime} تا ${item.endTime}`}
                      </span>
                      {item.reason && (
                        <small>{item.reason}</small>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={Boolean(savingKey)}
                      onClick={() => removeException(item)}
                    >
                      {savingKey === `exception-${item.id}`
                        ? "..."
                        : "حذف"}
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-exceptions">
                <strong>محدودیتی ثبت نشده است</strong>
                <p>
                  برنامه طبق ساعات ثابت هفتگی
                  نمایش داده می‌شود.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}


export default AvailabilityManager;

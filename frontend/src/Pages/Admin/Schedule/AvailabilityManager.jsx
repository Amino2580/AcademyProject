import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createAvailabilityException,
  createWeeklyAvailability,
  deleteAvailabilityException,
  deleteWeeklyAvailability,
  getAvailabilityExceptions,
  getWeeklyAvailability,
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


function formatPersianDate(value) {
  return PERSIAN_DATE_FORMATTER.format(
    parseLocalDate(value)
  );
}


function createDateOptions() {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  return Array.from(
    { length: 180 },
    (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() + index);

      const value = toLocalIsoDate(date);

      return {
        value,
        label: formatPersianDate(value),
      };
    }
  );
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


  const refreshData = useCallback(
    async () => {
      const [weeklyData, exceptionData] =
        await Promise.all([
          getWeeklyAvailability(),
          getAvailabilityExceptions(),
        ]);

      setWeeklyRanges(
        normalizeList(weeklyData)
      );
      setExceptions(
        normalizeList(exceptionData)
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

            <label className="availability-field">
              <span>تاریخ شمسی</span>
              <select
                value={exceptionForm.date}
                disabled={Boolean(savingKey)}
                onChange={(event) =>
                  setExceptionForm((current) => ({
                    ...current,
                    date: event.target.value,
                  }))
                }
              >
                {dateOptions.map((option) => (
                  <option
                    value={option.value}
                    key={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

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
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import CurrentDateTimeCard from "../../Components/CurrentDateTimeCard/CurrentDateTimeCard";
import {
  getMySchedule,
} from "../../services/schedule";
import {
  formatPersianFullDate,
} from "../../utils/persianDateTime";

import "./MySchedule.css";


function parseLocalDate(value) {
  if (!value) return null;

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


function formatSessionDate(value) {
  const date = parseLocalDate(value);

  return date
    ? formatPersianFullDate(date)
    : "تاریخ مشخص نشده";
}


function MySchedule() {
  const navigate = useNavigate();

  const [
    currentDateTime,
    setCurrentDateTime,
  ] = useState(() => new Date());

  const [classes, setClasses] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const loadMySchedule = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const data =
          await getMySchedule();

        setClasses(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (loadError) {
        if (loadError.status === 401) {
          navigate(
            "/login",
            {
              replace: true,
            }
          );

          return;
        }

        setError(
          loadError.message ||
          "دریافت کلاس‌های شما انجام نشد."
        );
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );


  useEffect(() => {
    const timeoutId =
      window.setTimeout(() => {
        loadMySchedule();
      }, 0);

    return () => {
      window.clearTimeout(
        timeoutId
      );
    };
  }, [loadMySchedule]);


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


  const termExpiresOn =
    classes[0]?.termExpiresOn;


  return (
    <main
      className="my-schedule-page"
      dir="rtl"
    >
      <header className="my-schedule-header">
        <div>
          <span>حساب هنرجو</span>

          <h1>کلاس‌های من</h1>

          <p>
            تمام جلسه‌های دوره یک‌ماهه شما
            {termExpiresOn && (
              <>
                {" — "}
                اعتبار تا {formatSessionDate(
                  termExpiresOn
                )}
              </>
            )}
          </p>
        </div>

        <div className="my-schedule-header-actions">
          <button
            type="button"
            onClick={() =>
              navigate("/schedule")
            }
          >
            مشاهده برنامه عمومی
          </button>

          <CurrentDateTimeCard
            value={currentDateTime}
            className="my-schedule-current-date"
          />
        </div>
      </header>


      {error ? (
        <section className="my-schedule-message error">
          <p>{error}</p>

          <button
            type="button"
            onClick={loadMySchedule}
          >
            تلاش دوباره
          </button>
        </section>
      ) : loading ? (
        <section className="my-schedule-message">
          در حال دریافت کلاس‌های شما...
        </section>
      ) : classes.length === 0 ? (
        <section className="my-schedule-message">
          <h2>
            هنوز کلاسی برای شما ثبت نشده است
          </h2>

          <p>
            می‌توانید زمان‌های آزاد را در برنامه
            کلاسی مشاهده کنید.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/schedule")
            }
          >
            مشاهده زمان‌های آزاد
          </button>
        </section>
      ) : (
        <section className="my-schedule-grid">
          {classes.map(
            (classItem) => (
              <article
                className={`my-schedule-card ${
                  classItem.status === "cancelled"
                    ? "cancelled"
                    : ""
                }`}
                key={classItem.id}
              >
                <div
                  className="my-schedule-card-shine"
                  aria-hidden="true"
                />

                <div className="my-schedule-card-heading">
                  <div className="my-schedule-day">
                    <span>
                      جلسه برنامه‌ریزی‌شده
                    </span>

                    <time
                      dateTime={classItem.date}
                    >
                      {formatSessionDate(
                        classItem.date
                      )}
                    </time>
                  </div>

                  <div className="my-schedule-time-box">
                    <span>
                      ساعت کلاس
                    </span>

                    <time>
                      {classItem.startTime}
                      {" تا "}
                      {classItem.endTime}
                    </time>
                  </div>
                </div>

                <div
                  className={`my-schedule-active-status ${
                    classItem.status === "cancelled"
                      ? "cancelled"
                      : ""
                  }`}
                >
                  <i aria-hidden="true" />

                  {classItem.statusLabel}
                </div>

                <div className="my-schedule-details">
                  <div className="my-schedule-detail-item">
                    <div>
                      <small>
                        نوع کلاس
                      </small>

                      <strong>
                        {classItem.classTypeLabel ||
                          "کلاس خصوصی"}
                      </strong>
                    </div>
                  </div>

                  <div className="my-schedule-detail-item">
                    <div>
                      <small>بازه برگزاری</small>

                      <strong dir="ltr">
                        {classItem.startTime}
                        {" تا "}
                        {classItem.endTime}
                      </strong>
                    </div>
                  </div>
                </div>

                {classItem.notes && (
                  <div className="my-schedule-notes">
                    <span>
                      توضیحات کلاس
                    </span>

                    <p>
                      {classItem.notes}
                    </p>
                  </div>
                )}

                {classItem.cancellationReason && (
                  <div className="my-schedule-cancellation">
                    <span>دلیل لغو جلسه</span>

                    <p>
                      {classItem.cancellationReason}
                    </p>
                  </div>
                )}
              </article>
            )
          )}
        </section>
      )}
    </main>
  );
}


export default MySchedule;

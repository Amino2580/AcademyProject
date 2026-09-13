import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import {
  logout,
} from "../../services/auth";

import {
  getMySchedule,
} from "../../services/schedule";

import "./MySchedule.css";


function MySchedule() {
  const navigate = useNavigate();

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


  const handleLogout = async () => {
    await logout();

    navigate(
      "/",
      {
        replace: true,
      }
    );
  };


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
            برنامه هفتگی کلاس‌های ثبت‌شده شما
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

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            خروج از حساب
          </button>
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
                className="my-schedule-card"
                key={classItem.id}
              >
                <div
                  className="my-schedule-card-shine"
                  aria-hidden="true"
                />

                <div className="my-schedule-card-heading">
                  <div className="my-schedule-day">
                    <span>
                      جلسه هفتگی
                    </span>

                    <strong>
                      {classItem.dayLabel}
                    </strong>
                  </div>

                  <div className="my-schedule-time-box">
                    <span>
                      ساعت شروع
                    </span>

                    <time>
                      {classItem.startTime}
                    </time>
                  </div>
                </div>

                <div className="my-schedule-active-status">
                  <i aria-hidden="true" />

                  کلاس فعال
                </div>

                <div className="my-schedule-details">
                  <div className="my-schedule-detail-item">
                    <div>
                      <small>
                        نام هنرجو
                      </small>

                      <strong>
                        {classItem.name}
                      </strong>
                    </div>
                  </div>

                  <div className="my-schedule-detail-item">
                    <div>
                      <small>ساز</small>

                      <strong>
                        {classItem.instrument ||
                          "مشخص نشده"}
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
              </article>
            )
          )}
        </section>
      )}
    </main>
  );
}


export default MySchedule;
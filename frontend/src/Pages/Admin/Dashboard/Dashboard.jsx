import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import AdminLayout from "../../../Components/Admin/AdminLayout/AdminLayout";
import {
  getDashboardSummary,
} from "../../../services/dashboard";

import "./Dashboard.css";


const STATUS_LABELS = {
  new: "جدید",
  contacted: "تماس گرفته شد",
  approved: "تأیید شده",
  rejected: "رد شده",
};


const LEVEL_LABELS = {
  beginner: "مبتدی",
  intermediate: "متوسط",
  advanced: "پیشرفته",
};


const CLASS_TYPE_LABELS = {
  private: "خصوصی",
  group: "گروهی",
  online: "آنلاین",
};


const CLASS_STATUS_LABELS = {
  passed: "گذشته",
  next: "کلاس بعدی",
  upcoming: "در پیش",
};


const CURRENT_DATE_FORMATTER = new Intl.DateTimeFormat(
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


function Dashboard() {
  const navigate = useNavigate();

  const [
    currentDateTime,
    setCurrentDateTime,
  ] = useState(() => new Date());

  const [dashboardData, setDashboardData] =
    useState({
      totalStudents: 0,
      activeClasses: 0,
      newRegistrations: 0,
      todayClasses: 0,
      todaySchedule: [],
      recentRegistrations: [],
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const loadDashboard = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const data =
          await getDashboardSummary();

        setDashboardData(data);
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
          "دریافت اطلاعات داشبورد انجام نشد."
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
        loadDashboard();
      }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadDashboard]);


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


  const todaySchedule = useMemo(
    () =>
      dashboardData.todaySchedule || [],
    [dashboardData.todaySchedule]
  );

  const recentRegistrations =
    dashboardData.recentRegistrations || [];

  const nextClass = useMemo(
    () =>
      todaySchedule.find(
        (item) => item.status === "next"
      ) || null,
    [todaySchedule]
  );

  const remainingClasses = useMemo(
    () =>
      todaySchedule.filter(
        (item) => item.status !== "passed"
      ).length,
    [todaySchedule]
  );

  const passedClasses =
    todaySchedule.length - remainingClasses;

  const summaryCards = [
    {
      key: "students",
      icon: "◎",
      label: "هنرجوی فعال",
      value: dashboardData.totalStudents,
    },
    {
      key: "classes",
      icon: "♫",
      label: "کلاس فعال",
      value: dashboardData.activeClasses,
    },
    {
      key: "requests",
      icon: "▣",
      label: "درخواست جدید",
      value: dashboardData.newRegistrations,
    },
    {
      key: "today",
      icon: "◷",
      label: "کلاس امروز",
      value: dashboardData.todayClasses,
    },
  ];


  return (
    <AdminLayout>
      <div className="dashboard">
        <header className="admin-page-header">
          <div>
            <span>پنل مدیریت</span>

            <h1>داشبورد</h1>

            <p>
              یک نگاه سریع به وضعیت آموزشگاه
            </p>
          </div>

          <div className="dashboard-date">
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


        {error && (
          <div className="dashboard-alert">
            <span>{error}</span>

            <button
              type="button"
              onClick={loadDashboard}
            >
              تلاش دوباره
            </button>
          </div>
        )}


        <section
          className="dashboard-cards"
          aria-label="خلاصه وضعیت"
        >
          {summaryCards.map((card) => (
            <article
              className={`dashboard-card ${card.key}`}
              key={card.key}
            >
              <div
                className="dashboard-card-icon"
                aria-hidden="true"
              >
                {card.icon}
              </div>

              <div>
                <span>{card.label}</span>

                <strong>
                  {loading ? "..." : card.value}
                </strong>
              </div>
            </article>
          ))}
        </section>


        <section className="today-dashboard">
          <article className="next-class-panel">
            <div className="today-panel-heading">
              <div>
                <span>برنامه امروز</span>
                <h2>نزدیک‌ترین کلاس</h2>
              </div>

              {!loading && nextClass && (
                <span className="live-badge">
                  <i />
                  در پیش
                </span>
              )}
            </div>

            {loading ? (
              <div className="next-class-loading">
                <span />
                <span />
                <span />
              </div>
            ) : nextClass ? (
              <div className="next-class-content">
                <div className="next-class-time">
                  <span>ساعت شروع</span>
                  <strong dir="ltr">
                    {nextClass.startTime}
                  </strong>
                </div>

                <div className="next-class-student">
                  <span>هنرجو</span>
                  <h3>{nextClass.studentName}</h3>
                  <p>
                    {nextClass.instrument ||
                      "ساز مشخص نشده"}
                  </p>
                </div>

                <div className="next-class-actions">
                  <a href={`tel:${nextClass.phone}`}>
                    تماس با هنرجو
                  </a>

                  <button
                    type="button"
                    onClick={() =>
                      navigate("/admin/schedule")
                    }
                  >
                    مشاهده برنامه
                  </button>
                </div>
              </div>
            ) : (
              <div className="next-class-empty">
                <div aria-hidden="true">✓</div>

                <strong>
                  {todaySchedule.length
                    ? "کلاس دیگری باقی نمانده"
                    : "امروز کلاسی ثبت نشده"}
                </strong>

                <p>
                  {todaySchedule.length
                    ? "برنامه امروز به پایان رسیده است."
                    : "برای امروز برنامه‌ای در تقویم وجود ندارد."}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/admin/schedule")
                  }
                >
                  مشاهده برنامه هفتگی
                </button>
              </div>
            )}
          </article>


          <article className="today-list-panel">
            <div className="today-panel-heading">
              <div>
                <span>به‌ترتیب ساعت</span>
                <h2>کلاس‌های امروز</h2>
              </div>

              <div className="today-progress">
                <strong>
                  {loading ? "..." : remainingClasses}
                </strong>
                <span>باقی‌مانده</span>
              </div>
            </div>

            {loading ? (
              <div className="today-list-loading">
                <span />
                <span />
                <span />
              </div>
            ) : todaySchedule.length ? (
              <>
                <div className="today-class-list">
                  {todaySchedule.map((classItem) => (
                    <div
                      className={`today-class-row ${
                        classItem.status
                      }`}
                      key={classItem.id}
                    >
                      <time dir="ltr">
                        {classItem.startTime}
                      </time>

                      <div className="class-row-person">
                        <strong>
                          {classItem.studentName}
                        </strong>
                        <span>
                          {classItem.instrument ||
                            "ساز مشخص نشده"}
                        </span>
                      </div>

                      <span className="class-row-status">
                        {CLASS_STATUS_LABELS[
                          classItem.status
                        ]}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="today-list-footer">
                  <span>
                    {passedClasses} کلاس گذشته
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      navigate("/admin/schedule")
                    }
                  >
                    برنامه کامل
                  </button>
                </div>
              </>
            ) : (
              <div className="today-list-empty">
                برنامه‌ای برای امروز وجود ندارد.
              </div>
            )}
          </article>
        </section>


        <section className="dashboard-section">
          <div className="dashboard-section-title">
            <div>
              <span>میان‌برها</span>
              <h2>دسترسی سریع</h2>
            </div>
          </div>

          <div className="quick-actions">
            <button
              type="button"
              onClick={() =>
                navigate("/admin/students")
              }
            >
              <span aria-hidden="true">◎</span>
              <div>
                <strong>هنرجوها</strong>
                <small>مشاهده و مدیریت اطلاعات</small>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/admin/registrations")
              }
            >
              <span aria-hidden="true">▣</span>
              <div>
                <strong>درخواست‌ها</strong>
                <small>بررسی ثبت‌نام‌های جدید</small>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/admin/schedule")
              }
            >
              <span aria-hidden="true">♫</span>
              <div>
                <strong>برنامه کلاس‌ها</strong>
                <small>رزروها و ساعات حضور</small>
              </div>
            </button>
          </div>
        </section>


        <section className="dashboard-section">
          <div className="dashboard-section-title">
            <div>
              <span>آخرین فعالیت‌ها</span>
              <h2>درخواست‌های ثبت‌نام اخیر</h2>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/admin/registrations")
              }
            >
              مشاهده همه
            </button>
          </div>


          <div className="recent-table">
            <div className="table-row table-head">
              <span>نام متقاضی</span>
              <span>سطح</span>
              <span>نوع کلاس</span>
              <span>وضعیت</span>
            </div>


            {loading ? (
              <div className="table-row table-message">
                <span>در حال دریافت اطلاعات...</span>
              </div>
            ) : recentRegistrations.length === 0 ? (
              <div className="table-row table-message">
                <span>درخواست جدیدی وجود ندارد.</span>
              </div>
            ) : (
              recentRegistrations.map(
                (registration) => (
                  <div
                    className="table-row"
                    key={registration.id}
                  >
                    <span className="applicant-name">
                      {registration.fullName}
                    </span>

                    <span>
                      {LEVEL_LABELS[
                        registration.level
                      ] || registration.level || "—"}
                    </span>

                    <span>
                      {CLASS_TYPE_LABELS[
                        registration.classType
                      ] || registration.classType || "—"}
                    </span>

                    <span
                      className={`registration-status ${
                        registration.status
                      }`}
                    >
                      {STATUS_LABELS[
                        registration.status
                      ] || registration.status}
                    </span>
                  </div>
                )
              )
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}


export default Dashboard;
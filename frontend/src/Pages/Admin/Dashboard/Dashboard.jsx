import {
  useCallback,
  useEffect,
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


function Dashboard() {
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] =
    useState({
      totalStudents: 0,
      activeClasses: 0,
      newRegistrations: 0,
      todayClasses: 0,
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


  const recentRegistrations =
    dashboardData.recentRegistrations || [];


  return (
    <AdminLayout>

      <div className="dashboard">

        <div className="admin-page-header">
          <div>
            <span>پنل مدیریت</span>

            <h1>داشبورد</h1>

            <p>
              مدیریت هنرجوها و برنامه کلاس‌های موسیقی
            </p>
          </div>
        </div>


        {error && (
          <div className="dashboard-section">
            <p>{error}</p>
          </div>
        )}


        <div className="dashboard-cards">

          <div className="dashboard-card">
            <div className="dashboard-card-icon">
              ♟
            </div>

            <div>
              <span>تعداد هنرجوها</span>

              <strong>
                {loading
                  ? "..."
                  : dashboardData.totalStudents}
              </strong>
            </div>
          </div>


          <div className="dashboard-card">
            <div className="dashboard-card-icon">
              ♫
            </div>

            <div>
              <span>کلاس‌های فعال</span>

              <strong>
                {loading
                  ? "..."
                  : dashboardData.activeClasses}
              </strong>
            </div>
          </div>


          <div className="dashboard-card">
            <div className="dashboard-card-icon">
              ★
            </div>

            <div>
              <span>درخواست جدید</span>

              <strong>
                {loading
                  ? "..."
                  : dashboardData.newRegistrations}
              </strong>
            </div>
          </div>


          <div className="dashboard-card">
            <div className="dashboard-card-icon">
              ◷
            </div>

            <div>
              <span>کلاس امروز</span>

              <strong>
                {loading
                  ? "..."
                  : dashboardData.todayClasses}
              </strong>
            </div>
          </div>

        </div>


        <div className="dashboard-section">

          <div className="section-title">
            <h2>دسترسی سریع</h2>
          </div>

          <div className="quick-actions">

            <button
              type="button"
              onClick={() =>
                navigate("/admin/students")
              }
            >
              <span>♟</span>
              مدیریت هنرجوها
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/admin/registrations")
              }
            >
              <span>▣</span>
              درخواست‌های ثبت‌نام
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/admin/schedule")
              }
            >
              <span>♫</span>
              برنامه کلاس‌ها
            </button>

          </div>

        </div>


        <div className="dashboard-section">

          <div className="section-title">
            <h2>درخواست‌های ثبت‌نام اخیر</h2>

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
              <div className="table-row">
                <span>در حال دریافت اطلاعات...</span>
              </div>
            ) : recentRegistrations.length === 0 ? (
              <div className="table-row">
                <span>درخواست جدیدی وجود ندارد.</span>
              </div>
            ) : (
              recentRegistrations.map(
                (registration) => (
                  <div
                    className="table-row"
                    key={registration.id}
                  >
                    <span>
                      {registration.fullName}
                    </span>

                    <span>
                      {registration.level || "—"}
                    </span>

                    <span>
                      {registration.classType || "—"}
                    </span>

                    <span
                      className={`status ${
                        registration.status === "approved"
                          ? "success"
                          : ""
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

        </div>

      </div>

    </AdminLayout>
  );
}


export default Dashboard;
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../Components/Admin/AdminLayout/AdminLayout";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

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

        <div className="dashboard-cards">

          <div className="dashboard-card">
            <div className="dashboard-card-icon">
              ♟
            </div>

            <div>
              <span>تعداد هنرجوها</span>
              <strong>24</strong>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-icon">
              ♫
            </div>

            <div>
              <span>کلاس‌های فعال</span>
              <strong>8</strong>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-icon">
              ★
            </div>

            <div>
              <span>ثبت‌نام جدید</span>
              <strong>5</strong>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-icon">
              ◷
            </div>

            <div>
              <span>کلاس امروز</span>
              <strong>4</strong>
            </div>
          </div>

        </div>

        <div className="dashboard-section">

          <div className="section-title">
            <h2>دسترسی سریع</h2>
          </div>

          <div className="quick-actions">

            <button
              onClick={() => navigate("/admin/students")}
            >
              <span>♟</span>
              مدیریت هنرجوها
            </button>

            <button
              onClick={() => navigate("/admin/schedule")}
            >
              <span>♫</span>
              برنامه کلاس‌ها
            </button>

          </div>

        </div>

        <div className="dashboard-section">

          <div className="section-title">
            <h2>ثبت‌نام‌های اخیر</h2>

            <button
              onClick={() => navigate("/admin/students")}
            >
              مشاهده همه
            </button>
          </div>

          <div className="recent-table">

            <div className="table-row table-head">
              <span>نام هنرجو</span>
              <span>سطح</span>
              <span>نوع کلاس</span>
              <span>وضعیت</span>
            </div>

            <div className="table-row">
              <span>آرین محمدی</span>
              <span>مبتدی</span>
              <span>حضوری</span>
              <span className="status success">جدید</span>
            </div>

            <div className="table-row">
              <span>سارا احمدی</span>
              <span>متوسط</span>
              <span>آنلاین</span>
              <span className="status success">جدید</span>
            </div>

            <div className="table-row">
              <span>کیان رضایی</span>
              <span>پیشرفته</span>
              <span>حضوری</span>
              <span className="status">بررسی شده</span>
            </div>

          </div>

        </div>

      </div>

    </AdminLayout>
  );
}

export default Dashboard;
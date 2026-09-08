import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";
import {
  logout,
} from "../../../services/auth";

function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();

    navigate(
      "/admin/login",
    {
      replace: true,
    }
  );
};

  return (
    <aside className="admin-sidebar">

      <div className="admin-logo">
        <div className="admin-logo-name">
          میلاد طریقت
        </div>

        <span>پنل مدیریت</span>
      </div>

      <nav className="admin-menu">

        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            isActive ? "admin-menu-item active" : "admin-menu-item"
          }
        >
          <span>⌂</span>
          داشبورد
        </NavLink>

        <NavLink
          to="/admin/students"
          className={({ isActive }) =>
            isActive ? "admin-menu-item active" : "admin-menu-item"
          }
        >
          <span>♟</span>
          هنرجوها
        </NavLink>

        <NavLink
          to="/admin/schedule"
          className={({ isActive }) =>
            isActive ? "admin-menu-item active" : "admin-menu-item"
          }
        >
          <span>♫</span>
          برنامه کلاس‌ها
        </NavLink>

      </nav>

      <button
        className="admin-logout"
        onClick={handleLogout}
      >
        <span>↪</span>
        خروج از پنل
      </button>

    </aside>
  );
}

export default Sidebar;
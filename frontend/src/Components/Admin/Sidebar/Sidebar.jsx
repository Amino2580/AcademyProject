import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  logout,
} from "../../../services/auth";

import "./Sidebar.css";


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


  const getMenuClass = ({ isActive }) =>
    isActive
      ? "admin-menu-item active"
      : "admin-menu-item";


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
          className={getMenuClass}
        >
          <span>⌂</span>
          داشبورد
        </NavLink>


        <NavLink
          to="/admin/students"
          className={getMenuClass}
        >
          <span>♟</span>
          هنرجوها
        </NavLink>


        <NavLink
          to="/admin/registrations"
          className={getMenuClass}
        >
          <span>▣</span>
          درخواست‌های ثبت‌نام
        </NavLink>


        <NavLink
          to="/admin/schedule"
          className={getMenuClass}
        >
          <span>♫</span>
          برنامه کلاس‌ها
        </NavLink>

      </nav>


      <button
        type="button"
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
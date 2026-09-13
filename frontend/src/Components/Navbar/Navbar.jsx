import {
  Link,
  useLocation,
} from "react-router-dom";

import {
  getAuthUser,
  isAuthenticated,
} from "../../services/auth";

import mt from "../../assets/MT.jpg";

import "./Navbar.css";


function Navbar() {
  const location = useLocation();

  const authUser = getAuthUser();
  const authenticated = isAuthenticated();

  const accountItem = {
    title: authenticated
      ? authUser?.role === "admin"
        ? "پنل مدیریت"
        : "کلاس‌های من"
      : "ورود هنرجو",

    path: authenticated
      ? authUser?.role === "admin"
        ? "/admin"
        : "/my-schedule"
      : "/login",
  };


  const rightMenuItems = [
    {
      title: "خانه",
      path: "/",
    },
    {
      title: "درباره استاد",
      path: "/about",
    },
    {
      title: "ثبت نام در کلاس",
      path: "/register",
    },
    accountItem,
  ];


  const leftMenuItems = [
    {
      title: "تصاویر",
      path: "/gallery",
    },
    {
      title: "ویدئوها",
      path: "/videos",
    },
    {
      title: "برنامه کلاسی",
      path: "/schedule",
    },
    {
      title: "تماس با ما",
      path: "/contact",
    },
  ];


  const getLinkClassName = (
    path
  ) => {
    return location.pathname === path
      ? "nav-link active"
      : "nav-link";
  };


  return (
    <header className="navbar-wrapper">
      <nav className="navbar">
        <div className="navbar-side navbar-right">
          {rightMenuItems.map(
            (item) => (
              <Link
                key={item.path}
                to={item.path}
                className={
                  getLinkClassName(
                    item.path
                  )
                }
              >
                {item.title}
              </Link>
            )
          )}
        </div>

        <Link
          to="/"
          className="navbar-logo"
        >
          <img
            src={mt}
            alt="Milad Tarighat"
          />
        </Link>

        <div className="navbar-side navbar-left">
          {leftMenuItems.map(
            (item) => (
              <Link
                key={item.path}
                to={item.path}
                className={
                  getLinkClassName(
                    item.path
                  )
                }
              >
                {item.title}
              </Link>
            )
          )}
        </div>
      </nav>
    </header>
  );
}


export default Navbar;
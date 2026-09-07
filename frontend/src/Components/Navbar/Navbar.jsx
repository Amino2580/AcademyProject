import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

import mt from "../../assets/MT.jpg";

function Navbar() {
  const location = useLocation();

  const menuItems = [
    { title: "خانه", path: "/" },
    { title: "درباره استاد", path: "/about" },
    { title: "ثبت نام در کلاس", path: "/register" },
    { title: "تصاویر", path: "/gallery" },
    { title: "ویدئوها", path: "/videos" },
    { title: "برنامه کلاسی", path: "/schedule" },
    { title: "تماس با ما", path: "/contact" },
  ];

  return (
    <header className="navbar-wrapper">
      <nav className="navbar">

        {/* منوی سمت راست */}
        <div className="navbar-side navbar-right">
          {menuItems.slice(0, 3).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={
                location.pathname === item.path
                  ? "nav-link active"
                  : "nav-link"
              }
            >
              {item.title}
            </Link>
          ))}
        </div>

        {/* لوگو */}
        <Link to="/" className="navbar-logo">
          <img src={mt} alt="Milad Tarighat" />
        </Link>

        {/* منوی سمت چپ */}
        <div className="navbar-side navbar-left">
          {menuItems.slice(3).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={
                location.pathname === item.path
                  ? "nav-link active"
                  : "nav-link"
              }
            >
              {item.title}
            </Link>
          ))}
        </div>

      </nav>
    </header>
  );
}

export default Navbar;
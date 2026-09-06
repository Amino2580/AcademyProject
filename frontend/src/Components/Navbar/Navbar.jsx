import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
const [musicOpen, setMusicOpen] = useState(false);
const [galleryOpen, setGalleryOpen] = useState(false);

const closeMenus = () => {
setMusicOpen(false);
setGalleryOpen(false);
};

return ( <nav className="navbar">

```
  <div className="navbar-content">

    {/* خانه و درباره استاد */}

    <div className="navbar-right">

      <NavLink
        to="/"
        className="nav-link"
        onClick={closeMenus}
      >
        خانه
      </NavLink>

      <NavLink
        to="/about"
        className="nav-link"
        onClick={closeMenus}
      >
        درباره استاد
      </NavLink>

    </div>


    {/* لوگوی وسط */}

    <Link
      to="/"
      className="navbar-logo"
      onClick={closeMenus}
    >
      <span className="logo-small">
        PIANO
      </span>

      <span className="logo-name">
        میلاد طریقت
      </span>

      <span className="logo-line"></span>
    </Link>


    {/* موسیقی - گالری - تماس */}

    <div className="navbar-left">

      {/* موسیقی */}

      <div className="nav-dropdown">

        <button
          type="button"
          className="nav-link nav-button"
          onClick={() => {
            setMusicOpen(!musicOpen);
            setGalleryOpen(false);
          }}
        >
          همراه با موسیقی

          <span className="arrow">
            {musicOpen ? "⌃" : "⌄"}
          </span>
        </button>

        {musicOpen && (
          <div className="submenu">

            <Link
              to="/schedule"
              onClick={closeMenus}
            >
              برنامه کلاسی
            </Link>

            <Link
              to="/register"
              onClick={closeMenus}
            >
              ثبت‌نام در کلاس‌ها
            </Link>

          </div>
        )}

      </div>


      {/* گالری */}

      <div className="nav-dropdown">

        <button
          type="button"
          className="nav-link nav-button"
          onClick={() => {
            setGalleryOpen(!galleryOpen);
            setMusicOpen(false);
          }}
        >
          گالری

          <span className="arrow">
            {galleryOpen ? "⌃" : "⌄"}
          </span>
        </button>

        {galleryOpen && (
          <div className="submenu">

            <Link
              to="/gallery"
              onClick={closeMenus}
            >
              تصاویر
            </Link>

            <Link
              to="/videos"
              onClick={closeMenus}
            >
              ویدئوها
            </Link>

          </div>
        )}

      </div>


      {/* تماس با ما */}

      <NavLink
        to="/contact"
        className="nav-link"
        onClick={closeMenus}
      >
        تماس با ما
      </NavLink>

    </div>

  </div>

</nav>


);
}

export default Navbar;

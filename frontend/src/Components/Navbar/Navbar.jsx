import { useState } from "react";
import {
  Link,
  useLocation,
} from "react-router-dom";

import {
  getAuthUser,
  isAuthenticated,
} from "../../services/auth";

import mt from "../../assets/MT.jpg";
import insta from "../../assets/insta.png";
import youtube from "../../assets/youtube.svg";
import telegram from "../../assets/telegram.png";
import phone from "../../assets/phone.svg";

import "./Navbar.css";


function Navbar() {
  const location = useLocation();

  const [
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  ] = useState(false);

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


  const mobileMenuItems = [
    ...rightMenuItems,
    ...leftMenuItems,
  ];


  const mobileSocialItems = [
    {
      title: "اینستاگرام",
      href: "https://milad.tarighat",
      icon: insta,
      external: true,
    },
    {
      title: "یوتیوب",
      href: "https://youtube.com/",
      icon: youtube,
      external: true,
    },
    {
      title: "تلگرام",
      href: "https://telegram.me/milad_tarighat",
      icon: telegram,
      external: true,
    },
    {
      title: "تماس",
      href: "tel:+989383894114",
      icon: phone,
      external: false,
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

        <button
          type="button"
          className={
            `navbar-mobile-toggle ${
              isMobileMenuOpen
                ? "open"
                : ""
            }`
          }
          aria-label={
            isMobileMenuOpen
              ? "بستن منوی سایت"
              : "باز کردن منوی سایت"
          }
          aria-expanded={isMobileMenuOpen}
          aria-controls="navbar-mobile-menu"
          onClick={() =>
            setIsMobileMenuOpen(
              (isOpen) => !isOpen
            )
          }
        >
          <span />
          <span />
          <span />
        </button>

        <div
          id="navbar-mobile-menu"
          className={
            `navbar-mobile-menu ${
              isMobileMenuOpen
                ? "open"
                : ""
            }`
          }
        >
          <div className="navbar-mobile-links">
            {mobileMenuItems.map(
              (item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={
                    getLinkClassName(
                      item.path
                    )
                  }
                  onClick={() =>
                    setIsMobileMenuOpen(false)
                  }
                >
                  {item.title}
                </Link>
              )
            )}
          </div>

          <div className="navbar-mobile-socials">
            <span className="navbar-mobile-socials-title">
              ارتباط با استاد
            </span>

            <div>
              {mobileSocialItems.map(
                (item) => (
                  <a
                    key={item.title}
                    href={item.href}
                    target={
                      item.external
                        ? "_blank"
                        : undefined
                    }
                    rel={
                      item.external
                        ? "noreferrer"
                        : undefined
                    }
                    onClick={() =>
                      setIsMobileMenuOpen(false)
                    }
                  >
                    <img
                      src={item.icon}
                      alt=""
                    />
                    <span>{item.title}</span>
                  </a>
                )
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}


export default Navbar;
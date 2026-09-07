import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">

      <div className="footer-container">

        <div className="footer-brand">

          <h2>
            میلاد طریقت
          </h2>

          <p>
            آموزش پیانو و موسیقی
          </p>

          <span>
            موسیقی، آموزش و عشق به هنر
          </span>

        </div>


        <div className="footer-links">

          <h3>
            دسترسی سریع
          </h3>

          <Link to="/">
            خانه
          </Link>

          <Link to="/about">
            درباره استاد
          </Link>

          <Link to="/contact">
            تماس با ما
          </Link>

        </div>


        <div className="footer-links">

          <h3>
            کلاس‌ها
          </h3>

          <Link to="/courses">
            برنامه کلاسی
          </Link>

          <Link to="/register">
            ثبت‌نام در کلاس‌ها
          </Link>

        </div>


        <div className="footer-links">

          <h3>
            رسانه
          </h3>

          <Link to="/gallery">
            تصاویر
          </Link>

          <Link to="/videos">
            ویدئوهای استاد
          </Link>

        </div>

      </div>


      <div className="footer-bottom">

        <span>
          © {new Date().getFullYear()} Milad Tariqat
        </span>

        <span>
          طراحی و توسعه با نبض تک
        </span>

      </div>

    </footer>
  );
}

export default Footer;
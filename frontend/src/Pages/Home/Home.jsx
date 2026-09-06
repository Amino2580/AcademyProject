import { Link } from "react-router-dom";

import insta from "../../assets/insta.png";
import youtube from "../../assets/youtube.svg";
import phone from "../../assets/phone.svg";
import telegram from "../../assets/telegram.png";

import "./Home.css";


function Home() {
  return (
    <div className="home">
      {/* ================= LEFT SOCIAL LINKS ================= */}

      <div className="social-links">
        <a
          href="https://milad.tarighat"
          target="_blank"
          rel="noreferrer"
        >
          <img
            src={insta}
            alt="Instagram"
            className="instagram"
          />
          <span>Instagram</span>
        </a>

        <a
          href="https://wa.me/"
          target="_blank"
          rel="noreferrer"
        >
          <img
            src={youtube}
            alt="Youtube"
            className="youtube"
          />
          <span>Youtube</span>
        </a>

        <a
          href="https://telegram.me/milad_tarighat"
          target="_blank"
          rel="noreferrer"
        >
          <img
            src={telegram}
            alt="Telegram"
            className="telegram"
          />
          <span>Telegram</span>
        </a>

        <a href="tel:+989383894114">
          <img
            src={phone}
            alt="Phone"
            className="phone"
          />
          <span>Call</span>
        </a>
      </div>

      {/* ================= HERO ================= */}

      <main className="hero">
        <div className="hero-overlay"></div>

        <div className="hero-content">
          <p className="hero-subtitle">
            PIANO & MUSIC
          </p>

          <h1>استاد طریقت</h1>

          <p className="hero-description">
            موسیقی را احساس کن،
            <br />
            بنواز و زندگی کن.
          </p>

          <Link
            to="/courses"
            className="hero-button"
          >
            شروع یادگیری
          </Link>
        </div>
      </main>
    </div>
  );
}

export default Home;
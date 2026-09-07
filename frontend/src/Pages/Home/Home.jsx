import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  return (
    <div className="home">

      

      {/* ================= HERO ================= */}

      <main className="hero">

        <div className="hero-overlay"></div>

        <div className="hero-content">

          <p className="hero-subtitle">
            PIANO TEACHER
          </p>

          <h1>
            استاد طریقت
          </h1>

          <p className="hero-description">
            موسیقی را احساس کن،
            <br />
            بنواز و زندگی کن.
          </p>

          <Link
            to="/Register"
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
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      /*
        ==========================================
        API LOGIN - بعداً با Swagger تکمیل می‌شود
        ==========================================

        const API_URL = "اینجا API ورود قرار میگیرد";

        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
          }),
        });

        const data = await response.json();

        localStorage.setItem("adminToken", data.token);
      */

      // موقتاً برای تست پنل
      await new Promise((resolve) => setTimeout(resolve, 700));

      localStorage.setItem("adminToken", "temporary-admin-token");

      navigate("/admin");

    } catch {
      setError("ورود انجام نشد. دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">

      <div className="login-box">

        <div className="login-header">
          <div className="login-logo">
            میلاد طریقت
          </div>

          <span>پنل مدیریت</span>

          <h1>ورود به حساب مدیریت</h1>

          <p>
            برای مدیریت هنرجوها و برنامه کلاس‌ها وارد شوید.
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          <div className="login-field">
            <label>نام کاربری</label>

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="نام کاربری را وارد کنید"
              required
            />
          </div>

          <div className="login-field">
            <label>رمز عبور</label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="رمز عبور را وارد کنید"
              required
            />
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "در حال ورود..." : "ورود به پنل"}
          </button>

        </form>

        <div className="login-back">
          <button onClick={() => navigate("/")}>
            بازگشت به سایت
          </button>
        </div>

      </div>

    </main>
  );
}

export default Login;
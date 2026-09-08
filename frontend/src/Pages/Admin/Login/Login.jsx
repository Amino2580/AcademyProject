import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  clearAuth,
  requestOtp,
  saveAuth,
  verifyOtp,
} from "../../../services/auth";

import "./Login.css";


function Login() {
  const navigate = useNavigate();

  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isOtpStep = step === "otp";


  const handleRequestOtp = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await requestOtp(phone);

      setStep("otp");

      setMessage(
        "کد تأیید برای شماره واردشده ارسال شد."
      );
    } catch (requestError) {
      setError(
        requestError.message ||
        "ارسال کد تأیید انجام نشد."
      );
    } finally {
      setLoading(false);
    }
  };


  const handleVerifyOtp = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const authData = await verifyOtp(
        phone,
        code
      );

      if (authData.user?.role !== "admin") {
        clearAuth();

        setError(
          "این شماره اجازه ورود به پنل مدیریت را ندارد."
        );

        return;
      }

      saveAuth(authData);

      navigate(
        "/admin",
        {
          replace: true,
        }
      );
    } catch (verifyError) {
      setError(
        verifyError.message ||
        "کد تأیید نامعتبر است."
      );
    } finally {
      setLoading(false);
    }
  };


  const handleChangePhone = () => {
    setStep("phone");
    setCode("");
    setError("");
    setMessage("");
  };


  return (
    <main className="admin-login-page">
      <div className="login-box">
        <div className="login-header">
          <div className="login-logo">
            میلاد طریقت
          </div>

          <span>پنل مدیریت</span>

          <h1>
            {isOtpStep
              ? "تأیید شماره موبایل"
              : "ورود به حساب مدیریت"
            }
          </h1>

          <p>
            {isOtpStep
              ? "کد پیامک‌شده را وارد کنید."
              : "شماره موبایل مدیر را وارد کنید."
            }
          </p>
        </div>

        <form
          onSubmit={
            isOtpStep
              ? handleVerifyOtp
              : handleRequestOtp
          }
        >
          {!isOtpStep ? (
            <div className="login-field">
              <label>شماره موبایل</label>

              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                placeholder="09123456789"
                dir="ltr"
                required
              />
            </div>
          ) : (
            <>
              <div className="login-field">
                <label>شماره موبایل</label>

                <input
                  type="tel"
                  value={phone}
                  dir="ltr"
                  disabled
                />
              </div>

              <div className="login-field">
                <label>کد تأیید</label>

                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(event) =>
                    setCode(
                      event.target.value.replace(
                        /\D/g,
                        ""
                      )
                    )
                  }
                  placeholder="کد ۶ رقمی"
                  maxLength="6"
                  dir="ltr"
                  required
                  autoFocus
                />
              </div>
            </>
          )}

          {message && (
            <div className="login-success">
              {message}
            </div>
          )}

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
            {loading
              ? "لطفاً صبر کنید..."
              : isOtpStep
                ? "تأیید و ورود"
                : "دریافت کد تأیید"
            }
          </button>
        </form>

        {isOtpStep && (
          <div className="login-back">
            <button
              type="button"
              onClick={handleChangePhone}
            >
              تغییر شماره موبایل
            </button>
          </div>
        )}

        <div className="login-back">
          <button
            type="button"
            onClick={() => navigate("/")}
          >
            بازگشت به سایت
          </button>
        </div>
      </div>
    </main>
  );
}


export default Login;
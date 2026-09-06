import { useState } from "react";
import "./Register.css";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function Register() {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    age: "",
    level: "",
    instrument: "پیانو",
    classType: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/registrations/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone,
          age: formData.age ? Number(formData.age) : null,
          level: formData.level,
          instrument: formData.instrument,
          classType: formData.classType,
          message: formData.message,
        }),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        const apiError = responseData?.metaData?.status?.message;

        throw new Error(apiError || "خطا در ارسال اطلاعات");
      }

      setMessage("درخواست ثبت‌نام شما با موفقیت ارسال شد.");

      setFormData({
        fullName: "",
        phone: "",
        age: "",
        level: "",
        instrument: "پیانو",
        classType: "",
        message: "",
      });
    } catch (error) {
      console.error(error);

      setMessage(
        error.message ||
          "ارسال اطلاعات با مشکل مواجه شد. لطفاً دوباره تلاش کنید.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="register-page">
      <section className="register-container">
        <div className="register-heading">
          <span>ثبت‌نام در کلاس‌ها</span>

          <h1>شروع مسیر موسیقی</h1>

          <div className="register-line"></div>

          <p>
            اطلاعات خود را وارد کنید تا برای هماهنگی و ثبت‌نام کلاس با شما تماس
            بگیریم.
          </p>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>نام و نام خانوادگی</label>

              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="نام و نام خانوادگی"
                required
              />
            </div>

            <div className="form-group">
              <label>شماره موبایل</label>

              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="09123456789"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>سن</label>

              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="سن"
              />
            </div>

            <div className="form-group">
              <label>سطح نوازندگی</label>

              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                required
              >
                <option value="">انتخاب سطح</option>

                <option value="beginner">مبتدی</option>

                <option value="intermediate">متوسط</option>

                <option value="advanced">پیشرفته</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>ساز</label>

              <select
                name="instrument"
                value={formData.instrument}
                onChange={handleChange}
              >
                <option value="پیانو">پیانو</option>

                <option value="موسیقی">موسیقی</option>
              </select>
            </div>

            <div className="form-group">
              <label>نوع کلاس</label>

              <select
                name="classType"
                value={formData.classType}
                onChange={handleChange}
                required
              >
                <option value="">انتخاب کلاس</option>

                <option value="private">کلاس خصوصی</option>

                <option value="group">کلاس گروهی</option>

                <option value="online">کلاس آنلاین</option>
              </select>
            </div>
          </div>

          <div className="form-group full">
            <label>توضیحات</label>

            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="توضیحات یا درخواست خود را بنویسید..."
              rows="5"
            />
          </div>

          <button type="submit" className="register-button" disabled={loading}>
            {loading ? "در حال ارسال..." : "ارسال درخواست ثبت‌نام"}

            {!loading && <span>←</span>}
          </button>

          {message && <p className="register-status">{message}</p>}
        </form>
      </section>
    </main>
  );
}

export default Register;

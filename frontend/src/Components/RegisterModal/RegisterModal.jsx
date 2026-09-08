import { useState } from "react";
import "./RegisterModal.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const INITIAL_FORM = {
  fullName: "",
  phone: "",
  level: "",
  message: "",
};

function RegisterModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({
    type: "",
    text: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setStatusMessage({
      type: "",
      text: "",
    });
  };

  const handleClose = () => {
    if (loading) return;

    setFormData(INITIAL_FORM);
    setStatusMessage({
      type: "",
      text: "",
    });

    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setStatusMessage({
      type: "",
      text: "",
    });

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/registrations/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullName: formData.fullName,
            phone: formData.phone,
            age: null,
            level: formData.level,
            instrument: "پیانو",
            classType: "",
            message: formData.message,
          }),
        },
      );

      const responseData = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        const apiError =
          responseData?.metaData?.status?.message;

        throw new Error(
          apiError || "ارسال درخواست با خطا مواجه شد.",
        );
      }

      setFormData(INITIAL_FORM);

      setStatusMessage({
        type: "success",
        text: "درخواست ثبت‌نام شما با موفقیت ارسال شد.",
      });
    } catch (error) {
      setStatusMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "ارسال درخواست با خطا مواجه شد.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={handleClose}
    >
      <div
        className="register-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          onClick={handleClose}
          disabled={loading}
        >
          ×
        </button>

        <h2>ثبت‌نام در کلاس پیانو</h2>

        <p className="modal-description">
          اطلاعات خود را وارد کنید تا با شما تماس بگیریم.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>نام و نام خانوادگی</label>

            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="نام خود را وارد کنید"
              maxLength="150"
              required
            />
          </div>

          <div className="form-group">
            <label>شماره تماس</label>

            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="09xxxxxxxxx"
              maxLength="13"
              required
            />
          </div>

          <div className="form-group">
            <label>سطح نوازندگی</label>

            <select
              name="level"
              value={formData.level}
              onChange={handleChange}
            >
              <option value="">انتخاب کنید</option>
              <option value="beginner">مبتدی</option>
              <option value="intermediate">متوسط</option>
              <option value="advanced">پیشرفته</option>
            </select>
          </div>

          <div className="form-group">
            <label>توضیحات</label>

            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows="3"
              maxLength="500"
              placeholder="اگر توضیحی دارید بنویسید..."
            />
          </div>

          <button
            type="submit"
            className="submit-register"
            disabled={loading}
          >
            {loading ? "در حال ارسال..." : "ارسال درخواست"}
          </button>

          {statusMessage.text && (
            <p
              className={`register-modal-status ${statusMessage.type}`}
            >
              {statusMessage.text}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default RegisterModal;
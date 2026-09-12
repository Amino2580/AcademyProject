import { useState } from "react";

import {
  publicApiRequest,
} from "../../services/api";

import "./RegisterModal.css";


const INITIAL_FORM = {
  fullName: "",
  phone: "",
  level: "",
  message: "",
};


function RegisterModal({
  isOpen,
  onClose,
  selectedSlot,
}) {
  const [formData, setFormData] =
    useState(INITIAL_FORM);

  const [loading, setLoading] =
    useState(false);

  const [
    statusMessage,
    setStatusMessage,
  ] = useState({
    type: "",
    text: "",
  });


  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

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
      await publicApiRequest(
        "/api/registrations/",
        {
          method: "POST",
          body: {
            fullName: formData.fullName,
            phone: formData.phone,
            age: null,
            level: formData.level,
            instrument: "پیانو",
            classType: "",
            preferredDay:
              selectedSlot?.day || "",
            preferredTime:
              selectedSlot?.startTime || null,
            message: formData.message,
          },
        }
      );

      setFormData(INITIAL_FORM);

      setStatusMessage({
        type: "success",
        text: (
          "درخواست ثبت‌نام شما با "
          + "موفقیت ارسال شد."
        ),
      });
    } catch (error) {
      setStatusMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : (
                "ارسال درخواست با "
                + "خطا مواجه شد."
              ),
      });
    } finally {
      setLoading(false);
    }
  };


  if (!isOpen) {
    return null;
  }


  return (
    <div
      className="modal-overlay"
      onClick={handleClose}
    >
      <div
        className="register-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <button
          type="button"
          className="modal-close"
          onClick={handleClose}
          disabled={loading}
          aria-label="بستن فرم"
        >
          ×
        </button>

        <h2>
          ثبت‌نام در کلاس پیانو
        </h2>

        <p className="modal-description">
          اطلاعات خود را وارد کنید تا
          با شما تماس بگیریم.
        </p>


        {selectedSlot && (
          <div className="register-selected-slot">
            <span>
              زمان درخواستی
            </span>

            <strong>
              {selectedSlot.dayLabel}
              {"، ساعت "}
              {selectedSlot.startTime}
            </strong>

            <small>
              ثبت نهایی این زمان پس از
              تأیید مدیریت انجام می‌شود.
            </small>
          </div>
        )}


        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="register-full-name">
              نام و نام خانوادگی
            </label>

            <input
              id="register-full-name"
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="نام خود را وارد کنید"
              maxLength={150}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-phone">
              شماره تماس
            </label>

            <input
              id="register-phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="09xxxxxxxxx"
              maxLength={13}
              dir="ltr"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-level">
              سطح نوازندگی
            </label>

            <select
              id="register-level"
              name="level"
              value={formData.level}
              onChange={handleChange}
            >
              <option value="">
                انتخاب کنید
              </option>

              <option value="beginner">
                مبتدی
              </option>

              <option value="intermediate">
                متوسط
              </option>

              <option value="advanced">
                پیشرفته
              </option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="register-message">
              توضیحات
            </label>

            <textarea
              id="register-message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={3}
              maxLength={500}
              placeholder="اگر توضیحی دارید بنویسید..."
            />
          </div>

          <button
            type="submit"
            className="submit-register"
            disabled={loading}
          >
            {loading
              ? "در حال ارسال..."
              : "ارسال درخواست"}
          </button>

          {statusMessage.text && (
            <p
              className={
                `register-modal-status ${
                  statusMessage.type
                }`
              }
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
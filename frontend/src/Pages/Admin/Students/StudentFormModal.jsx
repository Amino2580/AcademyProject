import {
  useState,
} from "react";


function StudentFormModal({
  student,
  loading,
  error,
  onSubmit,
  onClose,
}) {
  const [formData, setFormData] = useState({
    name: student?.name || "",
    phone: student?.phone || "",
    age: student?.age ?? "",
    level: student?.level || "",
    notes: student?.notes || "",
  });


  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };


  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      age:
        formData.age === ""
          ? null
          : Number(formData.age),
      level: formData.level,
      notes: formData.notes.trim(),
    });
  };


  return (
    <div
      className="student-modal-overlay"
      onMouseDown={onClose}
    >
      <div
        className="student-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-modal-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="student-modal-header">
          <div>
            <span>
              مدیریت هنرجو
            </span>

            <h2 id="student-modal-title">
              {student
                ? "ویرایش هنرجو"
                : "افزودن هنرجو"
              }
            </h2>
          </div>

          <button
            type="button"
            className="student-modal-close"
            onClick={onClose}
            disabled={loading}
            aria-label="بستن"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="student-form-grid">
            <div className="student-form-field">
              <label htmlFor="student-name">
                نام و نام خانوادگی
              </label>

              <input
                id="student-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="student-form-field">
              <label htmlFor="student-phone">
                شماره موبایل
              </label>

              <input
                id="student-phone"
                type="tel"
                inputMode="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="09123456789"
                dir="ltr"
                required
              />
            </div>

            <div className="student-form-field">
              <label htmlFor="student-age">
                سن
              </label>

              <input
                id="student-age"
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="1"
                max="120"
              />
            </div>

            <div className="student-form-field">
              <label htmlFor="student-level">
                سطح نوازندگی
              </label>

              <select
                id="student-level"
                name="level"
                value={formData.level}
                onChange={handleChange}
              >
                <option value="">
                  مشخص نشده
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

            <div className="student-form-field student-form-full">
              <label htmlFor="student-notes">
                توضیحات
              </label>

              <textarea
                id="student-notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="4"
                placeholder="توضیحات مربوط به هنرجو..."
              />
            </div>
          </div>

          {error && (
            <div className="student-form-error">
              {error}
            </div>
          )}

          <div className="student-form-actions">
            <button
              type="button"
              className="student-form-cancel"
              onClick={onClose}
              disabled={loading}
            >
              انصراف
            </button>

            <button
              type="submit"
              className="student-form-submit"
              disabled={loading}
            >
              {loading
                ? "در حال ذخیره..."
                : student
                  ? "ذخیره تغییرات"
                  : "افزودن هنرجو"
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


export default StudentFormModal;
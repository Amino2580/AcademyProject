import "./RegisterModal.css";

function RegisterModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>

      <div
        className="register-modal"
        onClick={(e) => e.stopPropagation()}
      >

        <button
          className="modal-close"
          onClick={onClose}
        >
          ×
        </button>

        <h2>ثبت نام در کلاس پیانو</h2>

        <p className="modal-description">
          اطلاعات خود را وارد کنید تا با شما تماس بگیریم.
        </p>

        <form>

          <div className="form-group">
            <label>نام و نام خانوادگی</label>
            <input
              type="text"
              placeholder="نام خود را وارد کنید"
            />
          </div>

          <div className="form-group">
            <label>شماره تماس</label>
            <input
              type="tel"
              placeholder="09xxxxxxxxx"
            />
          </div>

          <div className="form-group">
            <label>سطح نوازندگی</label>

            <select>
              <option value="">انتخاب کنید</option>
              <option value="beginner">مبتدی</option>
              <option value="intermediate">متوسط</option>
              <option value="advanced">پیشرفته</option>
            </select>
          </div>

          <div className="form-group">
            <label>توضیحات</label>

            <textarea
              rows="3"
              placeholder="اگر توضیحی دارید بنویسید..."
            />
          </div>

          <button
            type="submit"
            className="submit-register"
          >
            ارسال درخواست
          </button>

        </form>

      </div>

    </div>
  );
}

export default RegisterModal;
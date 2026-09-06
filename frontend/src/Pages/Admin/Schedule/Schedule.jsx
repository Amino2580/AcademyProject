import { useState } from "react";
import AdminLayout from "../../../Components/Admin/AdminLayout/AdminLayout";
import "./Schedule.css";

function Schedule() {

  const [classes, setClasses] = useState([
    {
      id: 1,
      day: "شنبه",
      time: "16:00 - 17:00",
      student: "آرین محمدی",
      type: "حضوری",
      status: "فعال",
    },
    {
      id: 2,
      day: "شنبه",
      time: "17:30 - 18:30",
      student: "سارا احمدی",
      type: "آنلاین",
      status: "فعال",
    },
    {
      id: 3,
      day: "یکشنبه",
      time: "15:00 - 16:00",
      student: "کیان رضایی",
      type: "حضوری",
      status: "فعال",
    },
    {
      id: 4,
      day: "دوشنبه",
      time: "18:00 - 19:00",
      student: "نگار کریمی",
      type: "حضوری",
      status: "فعال",
    },
  ]);

  const handleDelete = (id) => {

    const confirmed = window.confirm(
      "آیا از حذف این کلاس مطمئن هستید؟"
    );

    if (!confirmed) return;

    /*
      بعداً API واقعی حذف کلاس اینجا قرار میگیرد.
    */

    setClasses(
      classes.filter((item) => item.id !== id)
    );
  };

  return (
    <AdminLayout>

      <div className="schedule-page">

        <div className="admin-page-header schedule-header">

          <div>
            <span>مدیریت</span>

            <h1>برنامه کلاس‌ها</h1>

            <p>
              مدیریت زمان‌بندی کلاس‌های هنرجویان
            </p>
          </div>

          <button className="add-class-btn">
            + افزودن کلاس
          </button>

        </div>

        <div className="schedule-box">

          <div className="schedule-title">
            <h2>برنامه هفتگی</h2>

            <select defaultValue="week">
              <option value="week">
                این هفته
              </option>

              <option value="next">
                هفته آینده
              </option>
            </select>
          </div>

          <div className="schedule-table">

            <div className="schedule-row schedule-head">
              <span>روز</span>
              <span>ساعت</span>
              <span>هنرجو</span>
              <span>نوع کلاس</span>
              <span>وضعیت</span>
              <span>عملیات</span>
            </div>

            {classes.map((item) => (

              <div
                className="schedule-row"
                key={item.id}
              >

                <span className="day-name">
                  {item.day}
                </span>

                <span className="class-time">
                  {item.time}
                </span>

                <span>{item.student}</span>

                <span>{item.type}</span>

                <span>
                  <b className="active-status">
                    {item.status}
                  </b>
                </span>

                <span className="schedule-actions">

                  <button className="edit-btn">
                    ویرایش
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() =>
                      handleDelete(item.id)
                    }
                  >
                    حذف
                  </button>

                </span>

              </div>

            ))}

          </div>

        </div>

      </div>

    </AdminLayout>
  );
}

export default Schedule;
import { useState } from "react";
import AdminLayout from "../../../Components/Admin/AdminLayout/AdminLayout";
import "./Students.css";

function Students() {

  const [students, setStudents] = useState([
    {
      id: 1,
      name: "آرین محمدی",
      phone: "09121234567",
      age: 12,
      level: "مبتدی",
      classType: "حضوری",
    },
    {
      id: 2,
      name: "سارا احمدی",
      phone: "09129876543",
      age: 17,
      level: "متوسط",
      classType: "آنلاین",
    },
    {
      id: 3,
      name: "کیان رضایی",
      phone: "09351234567",
      age: 21,
      level: "پیشرفته",
      classType: "حضوری",
    },
  ]);

  const [search, setSearch] = useState("");

  const filteredStudents = students.filter((student) =>
    student.name.includes(search) ||
    student.phone.includes(search)
  );

  const handleDelete = (id) => {
    const confirmed = window.confirm(
      "آیا از حذف این هنرجو مطمئن هستید؟"
    );

    if (!confirmed) return;

    /*
      بعداً:

      DELETE API

      const API_URL = "اینجا API حذف هنرجو قرار میگیرد";
    */

    setStudents(
      students.filter((student) => student.id !== id)
    );
  };

  return (
    <AdminLayout>

      <div className="students-page">

        <div className="admin-page-header students-header">

          <div>
            <span>مدیریت</span>

            <h1>هنرجوها</h1>

            <p>
              مشاهده و مدیریت اطلاعات هنرجویان
            </p>
          </div>

          <button className="add-student-btn">
            + افزودن هنرجو
          </button>

        </div>

        <div className="students-box">

          <div className="students-toolbar">

            <input
              type="text"
              placeholder="جستجوی نام یا شماره موبایل..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <span>
              {filteredStudents.length} هنرجو
            </span>

          </div>

          <div className="students-table">

            <div className="student-row student-head">
              <span>نام هنرجو</span>
              <span>موبایل</span>
              <span>سن</span>
              <span>سطح</span>
              <span>نوع کلاس</span>
              <span>عملیات</span>
            </div>

            {filteredStudents.map((student) => (

              <div
                className="student-row"
                key={student.id}
              >

                <span>{student.name}</span>

                <span>{student.phone}</span>

                <span>{student.age}</span>

                <span>
                  <b className="level-badge">
                    {student.level}
                  </b>
                </span>

                <span>{student.classType}</span>

                <span className="student-actions">

                  <button className="edit-btn">
                    ویرایش
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() =>
                      handleDelete(student.id)
                    }
                  >
                    حذف
                  </button>

                </span>

              </div>

            ))}

            {filteredStudents.length === 0 && (
              <div className="empty-students">
                هنرجویی پیدا نشد.
              </div>
            )}

          </div>

        </div>

      </div>

    </AdminLayout>
  );
}

export default Students;
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import AdminLayout from "../../../Components/Admin/AdminLayout/AdminLayout";

import {
  createStudent,
  deleteStudent,
  getStudents,
  updateStudent,
} from "../../../services/students";

import StudentFormModal from "./StudentFormModal";

import "./Students.css";


const LEVEL_LABELS = {
  beginner: "مبتدی",
  intermediate: "متوسط",
  advanced: "پیشرفته",
};


function Students() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);

  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] =
    useState(null);

  const [error, setError] = useState("");

  const [isFormOpen, setIsFormOpen] =
    useState(false);

  const [selectedStudent, setSelectedStudent] =
    useState(null);

  const [formLoading, setFormLoading] =
    useState(false);

  const [formError, setFormError] =
    useState("");


  const loadStudents = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getStudents({
          page,
          search,
        });

        setStudents(data.results || []);
        setCount(data.count || 0);
        setHasNext(Boolean(data.next));
        setHasPrevious(Boolean(data.previous));
      } catch (loadError) {
        if (loadError.status === 401) {
          navigate(
            "/admin/login",
            {
              replace: true,
            }
          );

          return;
        }

        setError(
          loadError.message ||
          "دریافت هنرجوها انجام نشد."
        );
      } finally {
        setLoading(false);
      }
    },
    [
      navigate,
      page,
      search,
    ]
  );


  useEffect(() => {
    const timer = setTimeout(() => {
      loadStudents();
    }, 350);

    return () => {
      clearTimeout(timer);
    };
  }, [loadStudents]);


  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };


  const handleOpenCreate = () => {
    setSelectedStudent(null);
    setFormError("");
    setIsFormOpen(true);
  };


  const handleOpenEdit = (student) => {
    setSelectedStudent(student);
    setFormError("");
    setIsFormOpen(true);
  };


  const handleCloseForm = () => {
    if (formLoading) {
      return;
    }

    setIsFormOpen(false);
    setSelectedStudent(null);
    setFormError("");
  };


  const handleSaveStudent = async (
    studentData
  ) => {
    setFormLoading(true);
    setFormError("");

    try {
      if (selectedStudent) {
        await updateStudent(
          selectedStudent.id,
          studentData
        );
      } else {
        await createStudent(studentData);
      }

      setIsFormOpen(false);
      setSelectedStudent(null);

      if (
        !selectedStudent &&
        (page !== 1 || search)
      ) {
        setPage(1);
        setSearch("");
      } else {
        await loadStudents();
      }
    } catch (saveError) {
      if (saveError.status === 401) {
        navigate(
          "/admin/login",
          {
            replace: true,
          }
        );

        return;
      }

      setFormError(
        saveError.message ||
        "ذخیره اطلاعات هنرجو انجام نشد."
      );
    } finally {
      setFormLoading(false);
    }
  };


  const handleDelete = async (studentId) => {
    const confirmed = window.confirm(
      "آیا از حذف این هنرجو مطمئن هستید؟"
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(studentId);
    setError("");

    try {
      await deleteStudent(studentId);

      if (
        students.length === 1 &&
        page > 1
      ) {
        setPage((currentPage) =>
          currentPage - 1
        );
      } else {
        await loadStudents();
      }
    } catch (deleteError) {
      if (deleteError.status === 401) {
        navigate(
          "/admin/login",
          {
            replace: true,
          }
        );

        return;
      }

      setError(
        deleteError.message ||
        "حذف هنرجو انجام نشد."
      );
    } finally {
      setDeletingId(null);
    }
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

          <button
            className="add-student-btn"
            type="button"
            onClick={handleOpenCreate}
          >
            + افزودن هنرجو
          </button>
        </div>

        <div className="students-box">
          <div className="students-toolbar">
            <input
              type="text"
              placeholder="جستجوی نام یا شماره موبایل..."
              value={search}
              onChange={handleSearchChange}
            />

            <span>
              {count} هنرجو
            </span>
          </div>

          {error && (
            <div className="students-error">
              {error}
            </div>
          )}

          <div className="students-table">
            <div className="student-row student-head">
              <span>نام هنرجو</span>
              <span>موبایل</span>
              <span>سن</span>
              <span>سطح</span>
              <span>وضعیت</span>
              <span>عملیات</span>
            </div>

            {loading && (
              <div className="empty-students">
                در حال دریافت اطلاعات...
              </div>
            )}

            {!loading &&
              students.map((student) => (
                <div
                  className="student-row"
                  key={student.id}
                >
                  <span>{student.name}</span>

                  <span>{student.phone}</span>

                  <span>
                    {student.age ?? "—"}
                  </span>

                  <span>
                    <b className="level-badge">
                      {LEVEL_LABELS[
                        student.level
                      ] || "مشخص نشده"}
                    </b>
                  </span>

                  <span>
                    {student.isActive
                      ? "فعال"
                      : "غیرفعال"
                    }
                  </span>

                  <span className="student-actions">
                    <button
                      className="edit-btn"
                      type="button"
                      onClick={() =>
                        handleOpenEdit(student)
                      }
                    >
                      ویرایش
                    </button>

                    <button
                      className="delete-btn"
                      type="button"
                      disabled={
                        deletingId === student.id
                      }
                      onClick={() =>
                        handleDelete(student.id)
                      }
                    >
                      {deletingId === student.id
                        ? "در حال حذف..."
                        : "حذف"
                      }
                    </button>
                  </span>
                </div>
              ))}

            {!loading &&
              students.length === 0 && (
                <div className="empty-students">
                  هنرجویی پیدا نشد.
                </div>
              )}
          </div>

          <div className="students-pagination">
            <button
              type="button"
              disabled={
                !hasPrevious || loading
              }
              onClick={() =>
                setPage((currentPage) =>
                  currentPage - 1
                )
              }
            >
              صفحه قبلی
            </button>

            <span>
              صفحه {page}
            </span>

            <button
              type="button"
              disabled={!hasNext || loading}
              onClick={() =>
                setPage((currentPage) =>
                  currentPage + 1
                )
              }
            >
              صفحه بعدی
            </button>
          </div>
        </div>
      </div>

      {isFormOpen && (
        <StudentFormModal
          key={
            selectedStudent?.id ||
            "new-student"
          }
          student={selectedStudent}
          loading={formLoading}
          error={formError}
          onSubmit={handleSaveStudent}
          onClose={handleCloseForm}
        />
      )}
    </AdminLayout>
  );
}


export default Students;
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import AdminLayout from "../../../Components/Admin/AdminLayout/AdminLayout";
import {
  getRegistrationRequests,
  updateRegistrationStatus,
} from "../../../services/registrations";

import "./Registrations.css";


const STATUS_LABELS = {
  new: "جدید",
  contacted: "تماس گرفته شد",
  approved: "تأیید شده",
  rejected: "رد شده",
};


function Registrations() {
  const navigate = useNavigate();

  const [requests, setRequests] =
    useState([]);

  const [page, setPage] =
    useState(1);

  const [count, setCount] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [updatingId, setUpdatingId] =
    useState(null);


  const loadRequests = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const data =
          await getRegistrationRequests(page);

        setRequests(data.results || []);
        setCount(data.count || 0);
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
          "دریافت درخواست‌ها انجام نشد."
        );
      } finally {
        setLoading(false);
      }
    },
    [navigate, page]
  );


  useEffect(() => {
    const timeoutId =
      window.setTimeout(() => {
        loadRequests();
      }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadRequests]);


  const handleStatusChange = async (
    registrationId,
    status
  ) => {
    setUpdatingId(registrationId);
    setError("");

    try {
      const updatedRequest =
        await updateRegistrationStatus(
          registrationId,
          status
        );

      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === registrationId
            ? {
                ...request,
                ...updatedRequest,
                status,
              }
            : request
        )
      );
    } catch (updateError) {
      setError(
        updateError.message ||
        "تغییر وضعیت انجام نشد."
      );
    } finally {
      setUpdatingId(null);
    }
  };


  const totalPages = Math.max(
    1,
    Math.ceil(count / 10)
  );


  const formatDate = (dateValue) => {
    if (!dateValue) return "—";

    return new Date(
      dateValue
    ).toLocaleString("fa-IR");
  };


  return (
    <AdminLayout>
      <main className="registrations-page">

        <header className="registrations-header">
          <div>
            <span>مدیریت</span>
            <h1>درخواست‌های ثبت‌نام</h1>
            <p>
              بررسی درخواست‌های ارسال‌شده از سایت
            </p>
          </div>

          <strong>
            {count} درخواست
          </strong>
        </header>


        {error && (
          <div className="registrations-error">
            {error}
          </div>
        )}


        <section className="registrations-card">

          {loading ? (
            <div className="registrations-message">
              در حال دریافت درخواست‌ها...
            </div>
          ) : requests.length === 0 ? (
            <div className="registrations-message">
              درخواستی پیدا نشد.
            </div>
          ) : (
            <div className="registrations-table-wrapper">
              <table className="registrations-table">

                <thead>
                  <tr>
                    <th>نام</th>
                    <th>موبایل</th>
                    <th>سن</th>
                    <th>سطح</th>
                    <th>ساز</th>
                    <th>نوع کلاس</th>
                    <th>توضیحات</th>
                    <th>تاریخ</th>
                    <th>وضعیت</th>
                  </tr>
                </thead>

                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id}>

                      <td>
                        {request.fullName}
                      </td>

                      <td dir="ltr">
                        {request.phone}
                      </td>

                      <td>
                        {request.age || "—"}
                      </td>

                      <td>
                        {request.level || "—"}
                      </td>

                      <td>
                        {request.instrument || "—"}
                      </td>

                      <td>
                        {request.classType || "—"}
                      </td>

                      <td className="registration-message">
                        {request.message || "—"}
                      </td>

                      <td>
                        {formatDate(
                          request.createdAt
                        )}
                      </td>

                      <td>
                        <select
                          className={`registration-status ${request.status}`}
                          value={request.status}
                          disabled={
                            updatingId === request.id
                          }
                          onChange={(event) =>
                            handleStatusChange(
                              request.id,
                              event.target.value
                            )
                          }
                        >
                          {Object.entries(
                            STATUS_LABELS
                          ).map(
                            ([
                              statusValue,
                              statusLabel,
                            ]) => (
                              <option
                                key={statusValue}
                                value={statusValue}
                              >
                                {statusLabel}
                              </option>
                            )
                          )}
                        </select>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}


          <div className="registrations-pagination">

            <button
              type="button"
              disabled={loading || page <= 1}
              onClick={() =>
                setPage((currentPage) =>
                  currentPage - 1
                )
              }
            >
              صفحه قبلی
            </button>

            <span>
              صفحه {page} از {totalPages}
            </span>

            <button
              type="button"
              disabled={
                loading ||
                page >= totalPages
              }
              onClick={() =>
                setPage((currentPage) =>
                  currentPage + 1
                )
              }
            >
              صفحه بعدی
            </button>

          </div>

        </section>

      </main>
    </AdminLayout>
  );
}


export default Registrations;
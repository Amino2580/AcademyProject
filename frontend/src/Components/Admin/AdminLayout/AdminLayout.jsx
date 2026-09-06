import Sidebar from "../Sidebar/Sidebar";
import "./AdminLayout.css";

function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      <Sidebar />

      <main className="admin-content">
        {children}
      </main>
    </div>
  );
}

export default AdminLayout;
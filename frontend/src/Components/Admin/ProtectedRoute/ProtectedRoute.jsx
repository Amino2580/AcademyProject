import {
  Navigate,
  Outlet,
} from "react-router-dom";

import {
  isAdminAuthenticated,
} from "../../../services/auth";


function ProtectedRoute() {
  if (!isAdminAuthenticated()) {
    return (
      <Navigate
        to="/admin/login"
        replace
      />
    );
  }

  return <Outlet />;
}


export default ProtectedRoute;
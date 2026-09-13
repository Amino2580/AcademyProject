import {
  Navigate,
  Outlet,
} from "react-router-dom";

import {
  isAuthenticated,
} from "../../services/auth";


function ProtectedUserRoute() {
  if (!isAuthenticated()) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Outlet />;
}


export default ProtectedUserRoute;
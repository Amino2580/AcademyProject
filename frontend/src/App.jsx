import { useState } from "react";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
} from "react-router-dom";

import About from "./Pages/About/About";
import Contact from "./Pages/Contact/Contact";
import Gallery from "./Pages/Gallery/Gallery";
import Home from "./Pages/Home/Home";
import MySchedule from "./Pages/MySchedule/MySchedule";
import Register from "./Pages/Register/Register";
import PublicSchedule from "./Pages/Schedule/PublicSchedule";
import Videos from "./Pages/Videos/Videos";

import Dashboard from "./Pages/Admin/Dashboard/Dashboard";
import Login from "./Pages/Admin/Login/Login";
import Registrations from "./Pages/Admin/Registrations/Registrations";
import AdminSchedule from "./Pages/Admin/Schedule/Schedule";
import Students from "./Pages/Admin/Students/Students";

import Footer from "./Components/Footer/Footer";
import Navbar from "./Components/Navbar/Navbar";
import ProtectedUserRoute from "./Components/ProtectedUserRoute/ProtectedUserRoute";
import RegisterModal from "./Components/RegisterModal/RegisterModal";
import SideMenu from "./Components/SideMenu/SideMenu";

import ProtectedRoute from "./Components/Admin/ProtectedRoute/ProtectedRoute.jsx";

import "./App.css";


function FloatingRegisterLink() {
  return (
    <Link
      className="floating-register-btn"
      to="/register"
    >
      ثبت‌نام کلاس
    </Link>
  );
}


function App() {
  const [
    isRegisterOpen,
    setIsRegisterOpen,
  ] = useState(false);

  const [
    selectedScheduleSlot,
    setSelectedScheduleSlot,
  ] = useState(null);


  const openRegisterModal = (
    selectedSlot
  ) => {
    setSelectedScheduleSlot(
      selectedSlot
    );

    setIsRegisterOpen(true);
  };


  const closeRegisterModal = () => {
    setIsRegisterOpen(false);
    setSelectedScheduleSlot(null);
  };


  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <SideMenu />
              <Navbar />

              <Home />

              <Footer />

              <FloatingRegisterLink />
            </>
          }
        />

        <Route
          path="/about"
          element={
            <>
              <SideMenu />
              <Navbar />

              <About />

              <Footer />

              <FloatingRegisterLink />
            </>
          }
        />

        <Route
          path="/videos"
          element={
            <>
              <SideMenu />
              <Navbar />

              <Videos />

              <Footer />

              <FloatingRegisterLink />
            </>
          }
        />

        <Route
          path="/gallery"
          element={
            <>
              <SideMenu />
              <Navbar />

              <Gallery />

              <Footer />

              <FloatingRegisterLink />
            </>
          }
        />

        <Route
          path="/contact"
          element={
            <>
              <SideMenu />
              <Navbar />

              <Contact />

              <Footer />

              <FloatingRegisterLink />
            </>
          }
        />

        <Route
          path="/register"
          element={
            <>
              <SideMenu />
              <Navbar />

              <Register />

              <Footer />
            </>
          }
        />

        <Route
          path="/schedule"
          element={
            <>
              <Navbar />

              <PublicSchedule
                onRegister={
                  openRegisterModal
                }
              />

              <Footer />

              <FloatingRegisterLink />
            </>
          }
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/admin/login"
          element={
            <Login adminOnly />
          }
        />

        <Route
          element={
            <ProtectedUserRoute />
          }
        >
          <Route
            path="/my-schedule"
            element={
              <>
                <Navbar />

                <MySchedule />

                <Footer />
              </>
            }
          />
        </Route>

        <Route
          element={<ProtectedRoute />}
        >
          <Route
            path="/admin"
            element={<Dashboard />}
          />

          <Route
            path="/admin/students"
            element={<Students />}
          />

          <Route
            path="/admin/registrations"
            element={<Registrations />}
          />

          <Route
            path="/admin/schedule"
            element={<AdminSchedule />}
          />
        </Route>
      </Routes>

      <RegisterModal
        isOpen={isRegisterOpen}
        selectedSlot={
          selectedScheduleSlot
        }
        onClose={closeRegisterModal}
      />
    </BrowserRouter>
  );
}


export default App;
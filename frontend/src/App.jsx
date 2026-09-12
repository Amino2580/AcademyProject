import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./Pages/Home/Home";
import About from "./Pages/About/About";
import Videos from "./Pages/Videos/Videos";
import Gallery from "./Pages/Gallery/Gallery";
import Contact from "./Pages/Contact/Contact";
import Register from "./Pages/Register/Register";

import Login from "./Pages/Admin/Login/Login";
import Dashboard from "./Pages/Admin/Dashboard/Dashboard";
import Students from "./Pages/Admin/Students/Students";
import AdminSchedule from "./Pages/Admin/Schedule/Schedule";
import PublicSchedule from "./Pages/Schedule/PublicSchedule";

import Navbar from "./Components/Navbar/Navbar";
import Footer from "./Components/Footer/Footer";
import SideMenu from "./Components/SideMenu/SideMenu";
import RegisterModal from "./Components/RegisterModal/RegisterModal";
import ProtectedRoute from "./Components/Admin/ProtectedRoute/ProtectedRoute.jsx";
import Registrations from "./Pages/Admin/Registrations/Registrations";
import "./App.css";

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
    selectedSlot = null
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
          path="/schedule"
          element={
            <>
              <Navbar />

              <PublicSchedule
                onRegister={openRegisterModal}
              />

              <Footer />

              <button
                className="floating-register-btn"
                onClick={() =>
                  openRegisterModal()
                }
              >
                ثبت‌نام کلاس
              </button>
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

      <button
        className="floating-register-btn"
        onClick={() =>
          openRegisterModal()
        }
       >
        ثبت نام کلاس
       </button>
        </>
         }
       />
        {/* صفحات اصلی */}
        <Route
          path="/"
          element={
            <>
              <SideMenu />
              <Navbar />

              <Home />

              <Footer />

              {/* دکمه ثبت نام */}
              <button
                className="floating-register-btn"
                onClick={() =>
                  openRegisterModal()
                }
              >
                ثبت نام کلاس
              </button>
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

              <button
                className="floating-register-btn"
                onClick={() =>
                  openRegisterModal()
                }
              >
                ثبت نام کلاس
              </button>
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

              <button
                className="floating-register-btn"
                onClick={() =>
                  openRegisterModal()
                }
              >
                ثبت نام کلاس
              </button>
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

              <button
                className="floating-register-btn"
                onClick={() =>
                  openRegisterModal()
                }
              >
                ثبت نام کلاس
              </button>
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

              <button
                className="floating-register-btn"
                onClick={() =>
                  openRegisterModal()
                }
              >
                ثبت نام کلاس
              </button>
            </>
          }
        />

        {/* پنل مدیریت */}

        <Route
          path="/admin/login"
          element={<Login />}
        />

        <Route element={<ProtectedRoute />}>
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

      {/* Modal ثبت نام */}
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
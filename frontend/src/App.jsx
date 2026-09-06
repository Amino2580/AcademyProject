import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./Pages/Home/Home";
import About from "./Pages/About/About";
import Videos from "./Pages/Videos/Videos";
import Contact from "./Pages/Contact/Contact";
import Register from "./Pages/Register/Register";

import Dashboard from "./Pages/Admin/Dashboard/Dashboard";
import Login from "./Pages/Admin/Login/Login";
import Students from "./Pages/Admin/Students/Students";
import Schedule from "./Pages/Admin/Schedule/Schedule";

import Navbar from "./Components/Navbar/Navbar";
import Footer from "./Components/Footer/Footer";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ================= سایت اصلی ================= */}

        <Route
          path="/"
          element={
            <>
              <Navbar />
              <Home />
              <Footer />
            </>
          }
        />

        <Route
          path="/about"
          element={
            <>
              <Navbar />
              <About />
              <Footer />
            </>
          }
        />

        <Route
          path="/videos"
          element={
            <>
              <Navbar />
              <Videos />
              <Footer />
            </>
          }
        />

        <Route
          path="/contact"
          element={
            <>
              <Navbar />
              <Contact />
              <Footer />
            </>
          }
        />

        <Route
          path="/register"
          element={
            <>
              <Navbar />
              <Register />
              <Footer />
            </>
          }
        />

        {/* ================= پنل ادمین ================= */}

        <Route
          path="/admin/login"
          element={<Login />}
        />

        <Route
          path="/admin"
          element={<Dashboard />}
        />

        <Route
          path="/admin/students"
          element={<Students />}
        />

        <Route
          path="/admin/schedule"
          element={<Schedule />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
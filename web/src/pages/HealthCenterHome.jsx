import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FaCalendarAlt,
  FaHospitalUser,
  FaSignOutAlt,
  FaHome,
  FaClock,
} from "react-icons/fa";
import logo from "../assets/logo.png";

export default function HealthCenterHome() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  // 🕒 Live Date and Time
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const formattedDate = currentTime.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="layout health-center-layout">
      {/* 🌿 Custom Navbar */}
      <nav className="navbar health-navbar">
        <div className="brand-wrap">
          <img src={logo} alt="MediSlot Logo" className="brand-logo-img" />
          <h1>Health Center Dashboard</h1>
        </div>

        <div className="nav-links">
          <Link to="/healthcenter/home" className="nav-link">
            <FaHome /> Home
          </Link>
          <Link to="/healthcenter/bookings" className="nav-link">
            <FaCalendarAlt /> Bookings
          </Link>
          <Link to="/healthcenter/details" className="nav-link">
            <FaHospitalUser /> Center Details
          </Link>

          {/* 🕒 Live Date & Time */}
          <div className="small-datetime-card teal-style">
            <FaClock className="clock-icon" />
            <div className="datetime-text">
              <span className="time-text">{formattedTime}</span>
              <span className="date-text">{formattedDate}</span>
            </div>
          </div>

          <button onClick={handleLogout} className="btn btn-link logout-btn">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </nav>

      {/* 🌿 Main Content */}
      <main className="health-main">
        <h2>Welcome, {user?.name || "Health Center Admin"}</h2>
        <p>Manage your center’s bookings, Lab reports, Center details here.</p>

        <div className="health-center-cards">
          <Link to="/healthcenter/bookings" className="health-card">
            <FaCalendarAlt className="icon" />
            <h3>View Bookings and Upload Lab Reports</h3>
            <p>
              Check and manage all active and completed bookings and lab reports.
            </p>
          </Link>

          <Link to="/healthcenter/details" className="health-card">
            <FaHospitalUser className="icon" />
            <h3>Center Details</h3>
            <p>Update and maintain your health center’s information.</p>
          </Link>
        </div>
      </main>

      {/* 🌿 Custom Footer */}
      <footer className="footer health-footer">
        <p>
          © {new Date().getFullYear()} <strong>MediSlot Health Centers</strong> — Empowering Better Healthcare.
        </p>
        <div className="footer-links">
          <Link to="/healthcenter/home">Home</Link>
          <span>|</span>
          <Link to="/healthcenter/bookings">Bookings</Link>
          <span>|</span>
          <Link to="/healthcenter/details">Center Details</Link>
        </div>
      </footer>
    </div>
  );
}

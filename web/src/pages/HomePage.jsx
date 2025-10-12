import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import {
  FaHospital,
  FaCalendarAlt,
  FaFlask,
  FaBookOpen,
  FaUsers,
  FaChevronLeft,
  FaChevronRight,
  FaClock,
} from "react-icons/fa";

export default function HomePage() {
  const { user } = useAuth();

  // Live time state
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

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString("default", { month: "long" });

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const today = new Date();
  const todayDate = today.getDate();
  const isCurrentMonth =
    month === today.getMonth() && year === today.getFullYear();

  const days = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++) days.push(i);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevYear = () => setCurrentDate(new Date(year - 1, month, 1));
  const nextYear = () => setCurrentDate(new Date(year + 1, month, 1));

  return (
    <div className="layout">
      <Navbar />
      <div className="content">
        <main>
          <div className="header-section">
            <h2>Welcome, {user?.name || "Admin"}</h2>

            {/* 🕒 Compact Right-Aligned Date-Time Card */}
            <div className="small-datetime-card fancy">
              <div className="clock-icon-wrap">
                <FaClock className="small-clock-icon" />
              </div>
              <div className="small-datetime-text">
                <span className="small-time">{formattedTime}</span>
                <span className="small-date">{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="grid">
            <Link to="/free-events" className="card link-card free">
              <FaUsers /> Free Events
            </Link>
            <Link to="/guidelines" className="card link-card guides">
              <FaBookOpen /> Guidelines
            </Link>
            {/*<Link to="/booking" className="card link-card booking">
              <FaCalendarAlt /> Bookings
            </Link>*/}
            <Link to="/centers" className="card link-card centers">
              <FaHospital /> Centers
            </Link>
            {/*<Link to="/labtests" className="card link-card lab">
              <FaFlask /> Lab Tests Reports For Free Events
            </Link>*/}
          </div>

          {/* 📅 Calendar */}
          <div className="calendar-container">
            <div className="calendar-header">
              <div className="calendar-nav">
                <button className="btn-nav" onClick={prevYear}>
                  <FaChevronLeft /> Year
                </button>
                <button className="btn-nav" onClick={prevMonth}>
                  <FaChevronLeft /> Month
                </button>
              </div>
              <h3>
                {monthName} {year}
              </h3>
              <div className="calendar-nav">
                <button className="btn-nav" onClick={nextMonth}>
                  Month <FaChevronRight />
                </button>
                <button className="btn-nav" onClick={nextYear}>
                  Year <FaChevronRight />
                </button>
              </div>
            </div>

            <div className="calendar-grid">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="calendar-day-header">
                  {d}
                </div>
              ))}
              {days.map((day, i) => (
                <div
                  key={i}
                  className={
                    day === todayDate && isCurrentMonth
                      ? "calendar-day today"
                      : "calendar-day"
                  }
                >
                  {day || ""}
                </div>
              ))}
            </div>
          </div>

          <Footer />
        </main>
      </div>
    </div>
  );
}

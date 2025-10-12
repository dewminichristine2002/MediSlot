import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FaCalendarAlt,
  FaHospitalUser,
  FaSignOutAlt,
  FaHome,
  FaClock,
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhoneAlt,
} from "react-icons/fa";
import { api } from "../api"; // ✅ ensure this points to your backend API instance
import logo from "../assets/logo.png";

export default function HealthCenterHome() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  // 🧩 Local states
  const [center, setCenter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  // 🚀 Fetch Health Center Info from DB
  useEffect(() => {
    const fetchCenter = async () => {
      try {
        const id = user?.centerId || user?._id; // ✅ based on your backend token data
        if (!id) return setError("No center ID found.");

        const { data } = await api.get(`/centers/${id}`);
        setCenter(data);
        setError("");
      } catch (err) {
        console.error("Failed to fetch center:", err);
        setError("Failed to load center details.");
      } finally {
        setLoading(false);
      }
    };

    fetchCenter();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="layout health-center-layout">
      {/* Main content - header/footer provided by HCLayout */}
      <main className="health-main">
        {loading ? (
          <p className="loading-text">Loading center details...</p>
        ) : error ? (
          <p className="error-text">{error}</p>
        ) : (
          <>
            <h2>
              Welcome,{" "}
              <span className="highlight-text">
                {center?.name || user?.name || "Health Center"}
              </span>
            </h2>
            <p>
              Manage your center’s bookings, lab reports, and information here.
            </p>

            {/* 🔹 Info Card */}
            <div className="center-info-card">
              <div className="info-line">
                <FaMapMarkerAlt className="info-icon" />
                <span>
                  {center?.address?.city}, {center?.address?.district},{" "}
                  {center?.address?.province}
                </span>
              </div>
              <div className="info-line">
                <FaPhoneAlt className="info-icon" />
                <span>{center?.contact?.phone || "N/A"}</span>
              </div>
              <div className="info-line">
                <FaEnvelope className="info-icon" />
                <span>{center?.contact?.email || "N/A"}</span>
              </div>
            </div>

            {/* 🔹 Action Cards */}
            <div className="health-center-cards">
              <Link to={`/healthcenter/${center?._id}/bookings`} className="health-card">
                <FaCalendarAlt className="icon" />
                <h3>View Bookings & Upload Lab Reports</h3>
                <p>
                  Manage all your ongoing and completed bookings and upload lab
                  reports directly.
                </p>
              </Link>

              <Link to={`/healthcenter/${center?._id}/details`} className="health-card">
                <FaHospitalUser className="icon" />
                <h3>Center Details</h3>
                <p>Update and maintain your health center’s information.</p>
              </Link>
              
              <Link to={`/healthcenter/${center?._id}/tests`} className="health-card">
                <FaHospitalUser className="icon" />
                <h3>Manage Tests</h3>
                <p>View, edit and remove tests offered by your center.</p>
              </Link>
            </div>
          </>
        )}
      </main>

      {/* footer rendered by HCLayout */}

      {/* 🌈 Inline Styles (optional enhancement for layout polish) */}
      <style>{`
        .center-info-card {
          margin: 20px auto;
          background: #ffffffee;
          border-radius: 16px;
          padding: 16px 24px;
          max-width: 450px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          text-align: left;
        }
        .info-line {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          color: #334155;
          font-size: 0.95rem;
        }
        .info-icon {
          color: #0284c7;
        }
        .highlight-text {
          color: #0284c7;
          font-weight: 600;
        }
        .loading-text, .error-text {
          margin-top: 50px;
          font-size: 1.1rem;
          color: #475569;
        }
        .error-text {
          color: #dc2626;
        }
      `}</style>
    </div>
  );
}

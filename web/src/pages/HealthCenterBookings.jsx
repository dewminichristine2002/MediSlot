import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaSignOutAlt, FaUpload, FaArrowLeft, FaFileMedical } from "react-icons/fa";
import logo from "../assets/logo.png";

export default function HealthCenterBookings() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [selectedFile, setSelectedFile] = useState(null);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      alert(`File "${file.name}" uploaded successfully!`);
    }
  };

  return (
    <div className="layout health-center-layout">
      {/* 🌿 Navbar */}
      <nav className="navbar health-navbar">
        <div className="brand-wrap">
          <img src={logo} alt="MediSlot Logo" className="brand-logo-img" />
          <h1>Health Center Dashboard</h1>
        </div>

        <div className="nav-links">
          <Link to="/healthcenter/home" className="nav-link">
            <FaArrowLeft /> Back
          </Link>
          <Link to="/healthcenter/details" className="nav-link">
            Center Details
          </Link>
          <button onClick={handleLogout} className="btn btn-link logout-btn">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </nav>

      {/* 🌿 Main Content */}
      <main className="health-main">
        <h2>Bookings & Lab Reports</h2>
        <p>View your active bookings and upload lab reports below.</p>

        <div className="booking-table">
          <table>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Patient Name</th>
                <th>Date</th>
                <th>Status</th>
                <th>Upload Report</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>#BKG001</td>
                <td>John Doe</td>
                <td>Oct 10, 2025</td>
                <td>Pending</td>
                <td>
                  <label className="upload-btn">
                    <FaUpload /> Upload
                    <input
                      type="file"
                      accept=".pdf,.jpg,.png"
                      onChange={handleFileUpload}
                      hidden
                    />
                  </label>
                </td>
              </tr>
              <tr>
                <td>#BKG002</td>
                <td>Jane Smith</td>
                <td>Oct 11, 2025</td>
                <td>Completed</td>
                <td>
                  <button className="view-btn">
                    <FaFileMedical /> View Report
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>

      {/* 🌿 Footer */}
      <footer className="footer health-footer">
        <p>© {new Date().getFullYear()} MediSlot Health Centers</p>
      </footer>
    </div>
  );
}

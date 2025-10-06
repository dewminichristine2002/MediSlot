import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaSignOutAlt, FaSave, FaArrowLeft, FaHospital } from "react-icons/fa";
import logo from "../assets/logo.png";

export default function HealthCenterDetails() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const [centerInfo, setCenterInfo] = useState({
    name: user?.name || "MediSlot Health Center",
    address: "123 Main Street, Colombo",
    phone: "0771234567",
    email: user?.email || "info@medislot.lk",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCenterInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    alert("Center details updated successfully!");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
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
          <Link to="/healthcenter/bookings" className="nav-link">
            Bookings
          </Link>
          <button onClick={handleLogout} className="btn btn-link logout-btn">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </nav>

      {/* 🌿 Main Content */}
      <main className="health-main">
        <h2>
          <FaHospital /> Center Details
        </h2>
        <p>View or update your health center’s information below.</p>

        <div className="details-form">
          <label>Center Name</label>
          <input
            name="name"
            value={centerInfo.name}
            onChange={handleChange}
            type="text"
          />

          <label>Address</label>
          <input
            name="address"
            value={centerInfo.address}
            onChange={handleChange}
            type="text"
          />

          <label>Contact Number</label>
          <input
            name="phone"
            value={centerInfo.phone}
            onChange={handleChange}
            type="text"
          />

          <label>Email</label>
          <input
            name="email"
            value={centerInfo.email}
            onChange={handleChange}
            type="email"
          />

          <button onClick={handleSave} className="btn save-btn">
            <FaSave /> Save Changes
          </button>
        </div>
      </main>

      {/* 🌿 Footer */}
      <footer className="footer health-footer">
        <p>© {new Date().getFullYear()} MediSlot Health Centers</p>
      </footer>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaSignOutAlt, FaSave, FaArrowLeft, FaHospital } from "react-icons/fa";
import logo from "../assets/logo.png";
import { api } from "../api";

export default function HealthCenterDetails() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const outlet = useOutletContext();
  const center = outlet?.center;

  const [centerInfo, setCenterInfo] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    if (!center) return;
    setCenterInfo({
      name: center.name || "",
      // prefer address.line1 but fall back to concatenated address
      address:
        center.address?.line1 ||
        [center.address?.city, center.address?.district, center.address?.province]
          .filter(Boolean)
          .join(", ") ||
        "",
      phone: center.contact?.phone || center.contact?.phone || "",
      email: center.contact?.email || center.email || "",
    });
  }, [center]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCenterInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    (async () => {
      try {
        if (!center?._id) return alert("Center not loaded");
        const payload = {
          name: centerInfo.name,
          // store the entered address into address.line1
          address: { ...(center.address || {}), line1: centerInfo.address },
          contact: { ...(center.contact || {}), phone: centerInfo.phone, email: centerInfo.email },
          email: centerInfo.email,
        };
        await api.put(`/centers/${center._id}`, payload);
        alert("Center details updated successfully!");
      } catch (e) {
        console.error(e);
        alert("Failed to save center details");
      }
    })();
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="layout health-center-layout">
      {/* Main content - header/footer provided by HCLayout */}
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

      {/* footer rendered by HCLayout */}
    </div>
  );
}

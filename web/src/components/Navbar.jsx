import React from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png"; // ✅ correct way to load image

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="brand-wrap">
        {/* ✅ use imported logo variable */}
        <img
          src={logo}
          alt="MediSlot Logo"
          className="brand-logo-img"
        />
        <h1>MediSlot Admin</h1>
      </div>

      <div className="nav-links">
        <NavLink to="/home" className="nav-link">
          Home
        </NavLink>

        <NavLink to="/register" className="nav-link">
          Register
        </NavLink>

        <button className="btn btn-link" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

// src/pages/HCLayout.jsx
import { useEffect, useState } from "react";
import { Outlet, useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import { FaHome, FaCalendarAlt, FaHospitalUser, FaSignOutAlt } from "react-icons/fa";
import logo from "../assets/logo.png";

export default function HCLayout() {
  const { centerId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [center, setCenter] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get(`/centers/${centerId}`);
        if (!mounted) return;

        const isAdmin = user?.user_category === "admin";
        const isOwner =
          user?.user_category === "healthCenterAdmin" &&
          (user?.center === data._id || user?.centerId === data._id);

        if (!isAdmin && !isOwner) {
          setErr("You are not allowed to access this center.");
          return;
        }

        setCenter(data);
      } catch (e) {
        setErr(
          e?.response?.data?.error ||
            e?.response?.data?.message ||
            "Failed to load center."
        );
      }
    })();
    return () => (mounted = false);
  }, [centerId, user]);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  if (err) return <p style={{ padding: 24, color: "#b91c1c" }}>{err}</p>;
  if (!center) return <p style={{ padding: 24 }}>Loading center…</p>;

  return (
    <div className="layout health-center-layout">
      <nav className="navbar health-navbar">
        <div className="brand-wrap">
          <img src={logo} alt="MediSlot" className="brand-logo-img" />
          <h1>Health Center Dashboard</h1>
        </div>
        <div className="nav-links">
          <Link to={`/healthcenter/${center._id}/home`} className="nav-link">
            <FaHome /> Home
          </Link>
          <Link to={`/healthcenter/${center._id}/bookings`} className="nav-link">
            <FaCalendarAlt /> Bookings
          </Link>
          <Link to={`/healthcenter/${center._id}/details`} className="nav-link">
            <FaHospitalUser /> Center Details
          </Link>
          <button onClick={handleLogout} className="btn btn-link logout-btn">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </nav>

      {/* Pass the center down to child pages */}
      <Outlet context={{ center }} />

      <footer className="footer health-footer">
        <p>
          © {new Date().getFullYear()} <strong>MediSlot Health Centers</strong> — Empowering Better Healthcare.
        </p>
      </footer>
    </div>
  );
}

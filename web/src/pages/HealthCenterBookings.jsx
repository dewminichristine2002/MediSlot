// src/pages/HealthCenterBookings.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FaSignOutAlt,
  FaArrowLeft,
  FaFileMedical,
  FaSearch,
  FaPrint,
  FaDownload,
} from "react-icons/fa";
import logo from "../assets/logo.png";
import { api } from "../api";
import * as XLSX from "xlsx";
import "../styles/healthCenterBookings.css";

export default function HealthCenterBookings() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const formatDate = (d) => {
    const dt = new Date(d);
    return isNaN(dt) ? "-" : dt.toLocaleDateString();
  };

  const isOnline = (b) =>
    String(b.paymentStatus || b.payment?.method || "")
      .toLowerCase()
      .trim() === "online";

  const loadBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/bookings/lab", { params: { search } });
      setBookings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error loading bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const updateStatus = async (id, newStatus) => {
    try {
      // optimistic UI
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status: newStatus } : b))
      );

      await api.patch(`/bookings/lab/${id}/status`, { status: newStatus });

      // optional: reconcile with server after brief delay
      // setTimeout(() => loadBookings(), 400);
    } catch (err) {
      const msg = err?.response?.data?.message || err.message;
      console.error("Failed to update booking:", msg);
      alert(`Failed to update booking status: ${msg}`);
      // revert optimistic update on failure
      loadBookings();
    }
  };

  const exportCSV = () => {
    const worksheet = XLSX.utils.json_to_sheet(bookings);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings");
    XLSX.writeFile(workbook, "Bookings_List.xlsx");
  };

  const statusColor = (status) => {
    switch (status) {
      case "Pending":
        return "status pending";
      case "Completed":
        return "status completed";
      case "Cancelled":
        return "status cancelled";
      default:
        return "";
    }
  };

  return (
    <div className="hc-layout">
      {/* 🌿 Navbar (unchanged) */}
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
      <main className="hc-main">
        <h2 className="hc-title">📋 Bookings</h2>

        <div className="hc-toolbar">
          <div className="hc-search">
            <FaSearch className="hc-icon" />
            <input
              type="text"
              placeholder="Search by patient/test..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="hc-actions">
            <button onClick={exportCSV} className="hc-btn success">
              <FaDownload /> Export
            </button>
            <button onClick={() => window.print()} className="hc-btn gray">
              <FaPrint /> Print
            </button>
          </div>
        </div>

        <div className="hc-table-wrap">
          <table className="hc-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>Test</th>
                <th>Price</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center">
                    Loading...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center">
                    No bookings found
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b._id}>
                    <td>{formatDate(b.date)}</td>
                    <td>{b.patientName}</td>
                    <td>{b.testName}</td>
                    <td>Rs. {Number(b.price || 0).toLocaleString("en-LK")}</td>
                    <td>
                      {isOnline(b) ? (
                        <span className="text-green">Online</span>
                      ) : (
                        <span className="text-orange">Pay @ Center</span>
                      )}
                    </td>
                    <td>
                      <span className={statusColor(b.status)}>{b.status}</span>
                    </td>
                    <td>
                      {b.status !== "Completed" && (
                        <button
                          onClick={() => updateStatus(b._id, "Completed")}
                          className="mini-btn green"
                        >
                          Complete
                        </button>
                      )}
                      {b.status !== "Cancelled" && (
                        <button
                          onClick={() => updateStatus(b._id, "Cancelled")}
                          className="mini-btn red"
                        >
                          Cancel
                        </button>
                      )}
                      {b.reportUrl && (
                        <a
                          href={b.reportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mini-link"
                        >
                          <FaFileMedical /> View
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      <footer className="hc-footer">
        © {new Date().getFullYear()} MediSlot Health Centers
      </footer>
    </div>
  );
}

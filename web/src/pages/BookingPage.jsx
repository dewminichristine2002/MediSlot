import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { api } from "../api";

export default function BookingPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/bookings", { params: { limit: 200 } }); // adjust to your API
      const data = res.data?.items || res.data || [];
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load bookings");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = rows.filter((b) => {
    const patient = (b.patient_name || b.user?.name || "").toLowerCase();
    const center = (b.center?.name || b.center_name || "").toLowerCase();
    const status = (b.status || "").toLowerCase();
    const needle = q.toLowerCase();
    return patient.includes(needle) || center.includes(needle) || status.includes(needle);
  });

  return (
    <div className="layout">
      <Navbar />
      <div className="content">
        <Sidebar />
        <main>
          <div className="header-row">
            <h2>Bookings</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                placeholder="Search by patient/center/status…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button className="btn" onClick={load}>Reload</button>
            </div>
          </div>

          {loading ? (
            <div className="center">Loading…</div>
          ) : err ? (
            <div className="card" style={{ color: "#b91c1c" }}>{err}</div>
          ) : (
            <div className="card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Center</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => (
                    <tr key={b._id}>
                      <td>{b.patient_name || b.user?.name || "-"}</td>
                      <td>{b.center?.name || b.center_name || "-"}</td>
                      <td>{b.date ? new Date(b.date).toLocaleString() : "-"}</td>
                      <td>{b.status || "-"}</td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr><td colSpan={4} className="muted">No bookings found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer sticks to bottom via CSS rules provided earlier */}
          <Footer />
        </main>
      </div>
    </div>
  );
}

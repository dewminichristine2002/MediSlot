import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { api } from "../api";

export default function FreeEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/freeevents");
      setEvents(res.data?.items || res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load free events");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="layout">
      <Navbar />
      <div className="content">
        <Sidebar />
        <main>
          <div className="header-row">
            <h2>Free Events</h2>
            <button className="btn" onClick={load}>Reload</button>
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
                    <th>Title</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e._id}>
                      <td>{e.title || "-"}</td>
                      <td>{e.date ? new Date(e.date).toLocaleDateString() : "-"}</td>
                    </tr>
                  ))}
                  {!events.length && (
                    <tr>
                      <td colSpan={2} className="muted">No events found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer at the bottom */}
          <Footer />
        </main>
      </div>
    </div>
  );
}

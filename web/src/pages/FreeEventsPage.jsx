import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { api } from "../api"; // Axios instance

export default function FreeEventsPage() {
  const [tab, setTab] = useState("list");
  const [events, setEvents] = useState([]);
  const [healthCenters, setHealthCenters] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    date: "",
    time: "",
    location: "",
    slots_total: "",
  });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  // ✅ Load health centers
  const loadHealthCenters = async () => {
    try {
      const res = await api.get("/healthcenters/names");
      setHealthCenters(res.data || []);
    } catch (e) {
      console.error("Failed to load health centers:", e);
    }
  };

  // ✅ Load all events
  const loadEvents = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/events");
      setEvents(res.data?.items || res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load free events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    loadHealthCenters();
  }, []);

  // ✅ Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setSuccess("");

    try {
      const res = await api.post("/events", form);

      if (res.status === 201) {
        // Show success AFTER switching to list tab
        setSuccess("✅ Event created successfully!");
        setForm({
          name: "",
          description: "",
          date: "",
          time: "",
          location: "",
          slots_total: "",
        });

        // Reload event list
        await loadEvents();

        // Switch tab AFTER short delay
        setTimeout(() => {
          setTab("list");
        }, 500);

        // Automatically clear success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setErr("Something went wrong while saving the event.");
      }
    } catch (error) {
      console.error("Event creation error:", error);
      setErr(error?.response?.data?.message || "Failed to create event");
    }
  };

  return (
    <div className="layout">
      <Navbar />
      <div className="content">
        <Sidebar />
        <main>
          <div className="header-row">
            <h2>Free Events</h2>
          </div>

          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab-btn ${tab === "list" ? "active" : ""}`}
              onClick={() => setTab("list")}
            >
              Event List
            </button>
            <button
              className={`tab-btn ${tab === "register" ? "active" : ""}`}
              onClick={() => setTab("register")}
            >
              Event Registration
            </button>
          </div>

          {/* ✅ Success message visible on BOTH tabs */}
          {success && (
            <div
              className="alert success"
              style={{ marginBottom: "10px", fontWeight: 500 }}
            >
              {success}
            </div>
          )}

          {/* ===== Event Registration Form ===== */}
          {tab === "register" ? (
            <div className="card stylish-form">
              <h3>Create a New Event</h3>
              <p className="muted">Fill in the details below to add a new event.</p>

              {err && <div className="alert error">{err}</div>}

              <form onSubmit={handleSubmit} className="event-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Event Name</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter event title"
                    />
                  </div>

                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      name="date"
                      value={form.date}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Time</label>
                    <input
                      type="time"
                      name="time"
                      value={form.time}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Total Slots</label>
                    <input
                      type="number"
                      name="slots_total"
                      value={form.slots_total}
                      onChange={handleChange}
                      required
                      min="0"
                      placeholder="e.g. 50"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Location (Health Center)</label>
                    <select
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Health Center</option>
                      {healthCenters.map((hc) => (
                        <option key={hc._id} value={hc.name}>
                          {hc.name}
                          {hc.city ? ` — ${hc.city}` : ""}
                          {hc.district ? `, ${hc.district}` : ""}
                          {hc.province ? `, ${hc.province}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                      name="description"
                      rows="3"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="Describe the event..."
                    ></textarea>
                  </div>
                </div>

                <button type="submit" className="btn-submit">
                  Register Event
                </button>
              </form>
            </div>
          ) : (
            // ===== Event List =====
            <div className="card">
              <div className="header-row">
                <h3>Event List</h3>
                <button className="btn" onClick={loadEvents}>
                  Reload
                </button>
              </div>

              {loading ? (
                <div className="center">Loading…</div>
              ) : err ? (
                <div className="alert error">{err}</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Date</th>
                      <th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((e) => (
                      <tr key={e._id}>
                        <td>{e.name || "-"}</td>
                        <td>
                          {e.date
                            ? new Date(e.date).toLocaleDateString()
                            : "-"}
                        </td>
                        <td>{e.location || "-"}</td>
                      </tr>
                    ))}
                    {!events.length && (
                      <tr>
                        <td colSpan={3} className="muted">
                          No events found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}

          <Footer />
        </main>
      </div>
    </div>
  );
}

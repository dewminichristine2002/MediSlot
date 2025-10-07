import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { api } from "../api";

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
  const [editId, setEditId] = useState(null);
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
      setErr(e?.response?.data?.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    loadHealthCenters();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Create or update event
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setSuccess("");

    try {
      if (editId) {
        await api.patch(`/events/${editId}`, form);
        setSuccess("✅ Event updated successfully!");
      } else {
        await api.post("/events", form);
        setSuccess("✅ Event created successfully!");
      }

      setForm({
        name: "",
        description: "",
        date: "",
        time: "",
        location: "",
        slots_total: "",
      });
      setEditId(null);
      await loadEvents();
      setTab("list");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Event save error:", error);
      setErr(error?.response?.data?.message || "Failed to save event");
    }
  };

  // ✅ Edit event
  const handleEdit = (event) => {
    setForm({
      name: event.name || "",
      description: event.description || "",
      date: event.date ? event.date.substring(0, 10) : "",
      time: event.time || "",
      location: event.location || "",
      slots_total: event.slots_total || "",
    });
    setEditId(event._id);
    setTab("register");
  };

  // ✅ Delete event
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await api.delete(`/events/${id}`);
      setSuccess("🗑️ Event deleted successfully!");
      await loadEvents();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setErr("Failed to delete event");
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
              onClick={() => {
                setEditId(null);
                setTab("list");
              }}
            >
              Event List
            </button>
            <button
              className={`tab-btn ${tab === "register" ? "active" : ""}`}
              onClick={() => setTab("register")}
            >
              {editId ? "Update Event" : "Event Registration"}
            </button>
          </div>

          {/* Alerts */}
          {success && (
            <div className="alert success" style={{ marginBottom: "10px" }}>
              {success}
            </div>
          )}
          {err && (
            <div className="alert error" style={{ marginBottom: "10px" }}>
              {err}
            </div>
          )}

          {/* ===== Event Form ===== */}
          {tab === "register" ? (
            <div className="card stylish-form">
              <h3>{editId ? "Update Event" : "Create a New Event"}</h3>
              <p className="muted">
                {editId
                  ? "Modify the event details below and save changes."
                  : "Fill in the details below to add a new event."}
              </p>

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
                  {editId ? "Save Changes" : "Register Event"}
                </button>
              </form>
            </div>
          ) : (
            // ===== Event List =====
            <div className="card event-table">
              <h3 style={{ marginBottom: "15px" }}>All Events</h3>

              {loading ? (
                <div className="center">Loading…</div>
              ) : (
                <table className="styled-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Location</th>
                      <th>Slots</th>
                      <th>Description</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((e) => (
                      <tr key={e._id}>
                        <td>{e.name}</td>
                        <td>
                          {e.date
                            ? new Date(e.date).toLocaleDateString()
                            : "-"}
                        </td>
                        <td>{e.time}</td>
                        <td>{e.location}</td>
                        <td>
                          {e.slots_filled ?? 0}/{e.slots_total}
                        </td>
                        <td style={{ maxWidth: "220px" }}>
                          {e.description || "-"}
                        </td>
                        <td>
                          <button
                            className="btn-edit"
                            onClick={() => handleEdit(e)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDelete(e._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!events.length && (
                      <tr>
                        <td colSpan={7} className="muted">
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

import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { api } from "../api";

export default function FreeEventsPage() {
  const [tab, setTab] = useState("patients");
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
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  const loadEvents = async () => {
    try {
      const res = await api.get("/events");
      setEvents(res.data?.items || res.data || []);
    } catch (e) {
      console.error("Failed to load events:", e);
    }
  };

  const loadHealthCenters = async () => {
    try {
      const res = await api.get("/healthcenters/names");
      setHealthCenters(res.data || []);
    } catch (e) {
      console.error("Failed to load health centers:", e);
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
      setErr(error?.response?.data?.message || "Failed to save event");
    }
  };

  const handleEdit = (event) => {
    setForm({
      name: event.name,
      description: event.description,
      date: event.date ? event.date.substring(0, 10) : "",
      time: event.time,
      location: event.location,
      slots_total: event.slots_total,
    });
    setEditId(event._id);
    setTab("register");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await api.delete(`/events/${id}`);
      setSuccess("🗑️ Event deleted successfully!");
      await loadEvents();
      setTimeout(() => setSuccess(""), 3000);
    } catch {
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
              onClick={() => setTab("list")}
            >
              Event List
            </button>
            <button
              className={`tab-btn ${tab === "register" ? "active" : ""}`}
              onClick={() => setTab("register")}
            >
              {editId ? "Update Event" : "Event Registration"}
            </button>
            <button
              className={`tab-btn ${tab === "patients" ? "active" : ""}`}
              onClick={() => setTab("patients")}
            >
              View Patients
            </button>
          </div>

          {success && <div className="alert success">{success}</div>}
          {err && <div className="alert error">{err}</div>}

          {tab === "register" ? (
            <div className="card stylish-form">
              <h3>{editId ? "Update Event" : "Create a New Event"}</h3>
              <form onSubmit={handleSubmit} className="event-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Event Name</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter event name"
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
                      min="0"
                      required
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
                      placeholder="Describe the event"
                    ></textarea>
                  </div>
                </div>
                <button type="submit" className="btn-submit">
                  {editId ? "Save Changes" : "Register Event"}
                </button>
              </form>
            </div>
          ) : tab === "list" ? (
            <div className="card event-table">
              <h3>All Events</h3>
              {events.length === 0 ? (
                <p className="muted">No events found.</p>
              ) : (
                <div className="table-scroll-container">
                  <table className="styled-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Location</th>
                        <th>Slots</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((e) => (
                        <tr key={e._id}>
                          <td>{e.name}</td>
                          <td>{new Date(e.date).toLocaleDateString()}</td>
                          <td>{e.time}</td>
                          <td>{e.location}</td>
                          <td>
                            {e.slots_filled ?? 0}/{e.slots_total}
                          </td>
                          <td>
                            <button className="btn-edit" onClick={() => handleEdit(e)}>
                              Edit
                            </button>
                            <button className="btn-delete" onClick={() => handleDelete(e._id)}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              )}
            </div>
          ) : (
            <div className="event-grid">
              {events.map((ev) => (
                <EventCard key={ev._id} event={ev} />
              ))}
            </div>
          )}

          <Footer />
        </main>
      </div>
    </div>
  );
}

/* 🌟 EVENT CARD WITH UPLOAD FEATURE 🌟 */
function EventCard({ event }) {
  const [showModal, setShowModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/event-registrations?event_id=${event._id}`);
      setPatients(res.data || []);
    } catch (e) {
      console.error("Failed to load patients:", e);
    } finally {
      setLoading(false);
    }
  };

  const openModal = async () => {
    await loadPatients();
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  // ✅ Upload Lab Report
  const handleUpload = async (patient, file) => {
    if (!file) return alert("Please select a file first.");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", patient.user_id || patient._id);
    formData.append("testOrEvent_name", event.name);

    try {
      await api.post("/lab-tests", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("✅ Report uploaded and patient notified!");
      await loadPatients(); // reload after upload
    } catch (err) {
      alert("❌ Failed to upload report");
      console.error(err);
    }
  };

  return (
    <>
      <div className="event-card">
        <div className="event-card-header">
          <div>
            <h4>{event.name}</h4>
            <p>
              📅 {new Date(event.date).toLocaleDateString()} | 🕒 {event.time}
            </p>
            <p>📍 {event.location}</p>
          </div>
          <div className="slot-badge">
            {event.slots_filled ?? 0}/{event.slots_total} filled
          </div>
        </div>

        <div className="event-card-footer">
          <button className="btn-view" onClick={openModal}>
            View Patients
          </button>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{event.name} — Registered Patients</h3>
              <button className="modal-close" onClick={closeModal}>
                ✖
              </button>
            </div>
            <div className="modal-body">
              {loading ? (
                <p className="muted">Loading patients...</p>
              ) : patients.length === 0 ? (
                <p className="muted">No patients registered yet.</p>
              ) : (
                <table className="styled-table clearer-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>NIC</th>
                      <th>Gender</th>
                      <th>Age</th>
                      <th>Contact</th>
                      <th>Status</th>
                      <th>Report</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((p) => (
                      <tr key={p._id}>
                        <td>{p.name}</td>
                        <td>{p.nic}</td>
                        <td>{p.gender || "-"}</td>
                        <td>{p.age}</td>
                        <td>{p.contact}</td>
                        <td className={`status ${p.status}`}>
                          {p.status === "waitlist" && p.waitlist_position
                            ? `Waitlist - No ${p.waitlist_position}`
                            : p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                        </td>
                        <td>
                          {p.status === "confirmed" ? (
                            p.reportUploaded ? (
                              <a
                                href={p.reportPath}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-view"
                              >
                                View Report
                              </a>
                            ) : (
                              <label className="btn-upload">
                                Upload PDF
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  hidden
                                  onChange={(e) =>
                                    handleUpload(p, e.target.files[0])
                                  }
                                />
                              </label>
                            )
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

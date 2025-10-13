import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { api } from "../api";

export default function FreeEventsPage() {
  const [tab, setTab] = useState("patients");
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
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

  // ✅ Existing filters (Event List tab)
  const [search, setSearch] = useState("");
  const [selectedCenter, setSelectedCenter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // ✅ New filters for “View Patients” tab
  const [patientEventSearch, setPatientEventSearch] = useState("");
  const [patientCenterFilter, setPatientCenterFilter] = useState("");

  // ✅ Load Events
  const loadEvents = async () => {
    try {
      const res = await api.get("/events");
      const allEvents = res.data?.items || res.data || [];

      const now = new Date();

      const upcoming = allEvents
        .filter((e) => new Date(e.date) >= now)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      const past = allEvents
        .filter((e) => new Date(e.date) < now)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      const combined = [...upcoming, ...past];
      setEvents(combined);
      setFilteredEvents(combined);
    } catch (e) {
      console.error("Failed to load events:", e);
    }
  };

  // ✅ Load Centers
  const loadHealthCenters = async () => {
    try {
      const res = await api.get("/centers/names");
      setHealthCenters(res.data || []);
    } catch (e) {
      console.error("Failed to load health centers:", e);
    }
  };

  useEffect(() => {
    loadEvents();
    loadHealthCenters();
  }, []);

  // ✅ Filtering for Event List tab
  useEffect(() => {
    let filtered = [...events];
    if (search.trim()) {
      filtered = filtered.filter((e) =>
        e.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (selectedCenter) filtered = filtered.filter((e) => e.location === selectedCenter);
    if (fromDate) filtered = filtered.filter((e) => new Date(e.date) >= new Date(fromDate));
    if (toDate) filtered = filtered.filter((e) => new Date(e.date) <= new Date(toDate));
    setFilteredEvents(filtered);
  }, [search, selectedCenter, fromDate, toDate, events]);

  // ✅ Filtering for “View Patients” tab
  const filteredPatientEvents = events.filter((e) => {
    const byName = patientEventSearch
      ? e.name.toLowerCase().includes(patientEventSearch.toLowerCase())
      : true;
    const byCenter = patientCenterFilter
      ? e.location === patientCenterFilter
      : true;
    return byName && byCenter;
  });

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

  const getFileUrl = (path) => {
    const backendBase = api.defaults.baseURL?.replace(/\/api\/?$/, "") || "";
    return `${backendBase}${path}`;
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
            <button className={`tab-btn ${tab === "list" ? "active" : ""}`} onClick={() => setTab("list")}>
              Event List
            </button>
            <button className={`tab-btn ${tab === "register" ? "active" : ""}`} onClick={() => setTab("register")}>
              {editId ? "Update Event" : "Event Registration"}
            </button>
            <button className={`tab-btn ${tab === "patients" ? "active" : ""}`} onClick={() => setTab("patients")}>
              View Patients & Upload Lab Test Reports
            </button>
          </div>

          {success && <div className="alert success">{success}</div>}
          {err && <div className="alert error">{err}</div>}

          {/* ---------- EVENT REGISTRATION ---------- */}
          {tab === "register" ? (
            <div className="card stylish-form">
              <h3>{editId ? "Update Event" : "Create a New Event"}</h3>
              <form onSubmit={handleSubmit} className="event-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Event Name</label>
                    <input name="name" value={form.name} onChange={handleChange} required placeholder="Enter event name" />
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <input type="date" name="date" value={form.date} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Time</label>
                    <input type="time" name="time" value={form.time} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Total Slots</label>
                    <input type="number" name="slots_total" value={form.slots_total} onChange={handleChange} min="0" required />
                  </div>
                  <div className="form-group full-width">
                    <label>Location (Health Center)</label>
                    <select name="location" value={form.location} onChange={handleChange} required>
                      <option value="">Select Health Center</option>
                      {healthCenters.map((hc) => (
                        <option key={hc._id} value={hc.name}>{hc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea name="description" rows="3" value={form.description} onChange={handleChange} placeholder="Describe the event"></textarea>
                  </div>
                </div>
                <button type="submit" className="btn-submit">{editId ? "Save Changes" : "Register Event"}</button>
              </form>
            </div>
          ) : tab === "list" ? (
            /* ---------- EVENT LIST ---------- */
            <div className="card event-table">
              <br></br>
              {/* existing filter bar (unchanged) */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "15px" }}>
                <input type="text" placeholder="Search by event name..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: "0 0 200px", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ccc" }} />
                <select value={selectedCenter} onChange={(e) => setSelectedCenter(e.target.value)} style={{ flex: "0 0 200px", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ccc" }}>
                  <option value="">All Centers</option>
                  {healthCenters.map((hc) => (
                    <option key={hc._id} value={hc.name}>{hc.name}</option>
                  ))}
                </select>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ flex: "0 0 180px", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ccc" }} />
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ flex: "0 0 180px", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ccc" }} />
                <button onClick={() => { setSearch(""); setSelectedCenter(""); setFromDate(""); setToDate(""); }} style={{ background: "#f3f4f6", border: "1px solid #d1d5db", color: "#374151", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>Clear</button>
              </div>

              {filteredEvents.length === 0 ? (
                <p className="muted">No events found.</p>
              ) : (
                <div className="table-scroll-container">
                  <table className="styled-table">
                    <thead>
                      <tr><th>Event Name</th><th>Date</th><th>Time</th><th>Location</th><th>Slots</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {filteredEvents.map((e) => (
                        <tr key={e._id}>
                          <td>{e.name}</td>
                          <td>{new Date(e.date).toLocaleDateString()}</td>
                          <td>{e.time}</td>
                          <td>{e.location}</td>
                          <td>{e.slots_filled ?? 0}/{e.slots_total}</td>
                          <td>
                            <button className="btn-edit" onClick={() => handleEdit(e)}>Edit</button>
                            <button className="btn-delete" onClick={() => handleDelete(e._id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* ---------- VIEW PATIENTS ---------- */
            <>
              <br></br>
              <div className="view-patient-filter-bar">
                <input
                  type="text"
                  placeholder="Search by Event Name..."
                  value={patientEventSearch}
                  onChange={(e) => setPatientEventSearch(e.target.value)}
                />
                <select
                  value={patientCenterFilter}
                  onChange={(e) => setPatientCenterFilter(e.target.value)}
                >
                  <option value="">All Centers</option>
                  {healthCenters.map((hc) => (
                    <option key={hc._id} value={hc.name}>
                      {hc.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    setPatientEventSearch("");
                    setPatientCenterFilter("");
                  }}
                  className="clear-btn"
                >
                  Clear
                </button>
              </div>


              <div className="event-grid">
                {filteredPatientEvents.length === 0 ? (
                  <p className="muted">No events match your filter.</p>
                ) : (
                  filteredPatientEvents.map((ev) => (
                    <EventCard key={ev._id} event={ev} getFileUrl={getFileUrl} />
                  ))
                )}
              </div>
            </>
          )}

          <Footer />
        </main>
      </div>
    </div>
  );
}

/* 🌟 EVENT CARD COMPONENT 🌟 */
function EventCard({ event }) {
  const [showModal, setShowModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // ✅ Converts backend file_path into a full Cloudinary URL
  const getFileUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path; // already full URL
    return `https://res.cloudinary.com/dt9el8znk/raw/upload/${path}`;
  };

  // 🧩 Load all patients registered for this event
  const loadPatients = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/event-registrations?event_id=${event._id}`);
      const patientsData = res.data || [];

      const enriched = await Promise.all(
        patientsData.map(async (p) => {
          try {
            const check = await api.get(
              `/lab-tests?user_id=${p.patient_id?._id || p.patient_id}&q=${encodeURIComponent(
                event.name
              )}`
            );

            const hasReport = check.data?.items?.length > 0;
            if (hasReport) {
              const report = check.data.items[0];
              const filePath = getFileUrl(report.file_path);
              return {
                ...p,
                reportUploaded: true,
                reportPath: filePath,
                reportId: report._id,
              };
            }
            return { ...p, reportUploaded: false };
          } catch {
            return { ...p, reportUploaded: false };
          }
        })
      );

      setPatients(enriched);
      setFilteredPatients(enriched);
    } catch (e) {
      console.error("Failed to load patients:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientSearch.trim()) {
      const term = patientSearch.toLowerCase();
      setFilteredPatients(
        patients.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.nic.toLowerCase().includes(term)
        )
      );
    } else {
      setFilteredPatients(patients);
    }
  }, [patientSearch, patients]);

  const openModal = async () => {
    await loadPatients();
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  // ✅ Upload PDF to backend (which stores in Cloudinary)
  const handleUpload = async (patient, file) => {
    if (!file) return alert("Please select a file first.");
    if (patient.reportUploaded)
      return alert("This report has already been uploaded.");

    const formData = new FormData();
    formData.append("user_id", patient.patient_id?._id || patient.patient_id);
    formData.append("file", file);
    formData.append("testOrEvent_name", event.name);

    try {
      setUploadingId(patient._id);
      const res = await api.post("/lab-tests", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const filePath = getFileUrl(res.data.file_path);

      setPatients((prev) =>
        prev.map((p) =>
          p._id === patient._id
            ? {
                ...p,
                reportUploaded: true,
                reportPath: filePath,
                reportId: res.data._id,
              }
            : p
        )
      );

      alert("✅ Report uploaded successfully and patient notified!");
    } catch (err) {
      console.error("Upload error:", err);
      alert(
        err?.response?.data?.message ||
          "❌ Failed to upload or notify the patient"
      );
    } finally {
      setUploadingId(null);
    }
  };

  // ✅ Delete report from Cloudinary + backend
  const handleDeleteReport = async (patient) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;

    try {
      setDeletingId(patient._id);
      const reportId = patient.reportId;
      if (!reportId) return alert("No report found.");

      await api.delete(`/lab-tests/${reportId}`);

      setPatients((prev) =>
        prev.map((p) =>
          p._id === patient._id
            ? { ...p, reportUploaded: false, reportPath: null, reportId: null }
            : p
        )
      );

      alert("🗑️ Report deleted successfully!");
    } catch (err) {
      console.error("Delete error:", err);
      alert("❌ Failed to delete report");
    } finally {
      setDeletingId(null);
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

            {/* 🔍 Patient search filter */}
            <div className="patient-search-container">
              <input
                type="text"
                placeholder="Filter by NIC or Name..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="patient-search-input"
              />
              <button
                onClick={() => setPatientSearch("")}
                className="patient-search-clear"
              >
                Clear
              </button>
            </div>

            <div className="modal-body">
              {loading ? (
                <p className="muted">Loading patients...</p>
              ) : filteredPatients.length === 0 ? (
                <p className="muted">No patients found.</p>
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
                    {filteredPatients.map((p) => (
                      <tr key={p._id}>
                        <td>{p.name}</td>
                        <td>{p.nic}</td>
                        <td>{p.gender || "-"}</td>
                        <td>{p.age}</td>
                        <td>{p.contact}</td>
                        <td className={`status ${p.status}`}>
                          {p.status === "waitlist" && p.waitlist_position
                            ? `Waitlist - No ${p.waitlist_position}`
                            : p.status.charAt(0).toUpperCase() +
                              p.status.slice(1)}
                        </td>
                        <td>
                          {p.status === "attended" ? (
                            uploadingId === p._id ? (
                              <span className="muted">Uploading...</span>
                            ) : p.reportUploaded ? (
                              <div className="report-actions">
                                <a
                                  href={p.reportPath}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-view"
                                >
                                  View Report
                                </a>
                                <button
                                  className="btn-delete-report"
                                  disabled={deletingId === p._id}
                                  onClick={() => handleDeleteReport(p)}
                                >
                                  {deletingId === p._id
                                    ? "Deleting..."
                                    : "Delete"}
                                </button>
                              </div>
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
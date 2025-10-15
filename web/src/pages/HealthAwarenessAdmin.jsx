import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";

export default function HealthAwarenessAdmin() {
  const API_URL = "http://localhost:5000/api/health-awareness";

  const [list, setList] = useState([]);
  const [form, setForm] = useState({
    _id: "",
    title: "",
    summary: "",
    description: "",
    category: "",
    region: "",
    type: "article",
    severity: "info",
    mediaUrl: "",
    activeFrom: "",
    activeTo: "",
    image: null,
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await axios.get(API_URL);
      setList(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm({ ...form, [name]: files ? files[0] : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(form).forEach((key) => {
      if (form[key]) formData.append(key, form[key]);
    });

    try {
      if (isEditing) await axios.put(`${API_URL}/${form._id}`, formData);
      else await axios.post(API_URL, formData);
      setForm({
        _id: "",
        title: "",
        summary: "",
        description: "",
        category: "",
        region: "",
        type: "article",
        severity: "info",
        mediaUrl: "",
        activeFrom: "",
        activeTo: "",
        image: null,
      });
      setIsEditing(false);
      load();
    } catch (err) {
      alert("Error saving data!");
      console.error(err);
    }
  };

  const handleEdit = (item) => {
    setForm({ ...item, image: null });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      await axios.delete(`${API_URL}/${id}`);
      load();
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <Navbar />
      <div style={styles.mainLayout}>
        <Sidebar />
        <div style={styles.contentWrapper}>
          <div style={styles.contentArea}>
            <h1 style={styles.header}>🩺 Health Awareness Management</h1>

            {/* Form Section */}
            <form style={styles.form} onSubmit={handleSubmit}>
              <div style={styles.row}>
                <input
                  style={styles.input}
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Title"
                  required
                />
                <input
                  style={styles.input}
                  name="summary"
                  value={form.summary}
                  onChange={handleChange}
                  placeholder="Summary"
                />
              </div>

              <textarea
                style={{ ...styles.input, minHeight: 70 }}
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Description"
              ></textarea>

              <div style={styles.row}>
                <input
                  style={styles.input}
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="Category"
                />
                <input
                  style={styles.input}
                  name="region"
                  value={form.region}
                  onChange={handleChange}
                  placeholder="Region"
                />
              </div>

              <div style={styles.row}>
                <select
                  style={styles.input}
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                >
                  <option value="article">Article</option>
                  <option value="video">Video</option>
                </select>
                <select
                  style={styles.input}
                  name="severity"
                  value={form.severity}
                  onChange={handleChange}
                >
                  <option value="info">Info</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div style={styles.row}>
                <input
                  style={styles.input}
                  type="date"
                  name="activeFrom"
                  value={form.activeFrom?.slice(0, 10)}
                  onChange={handleChange}
                />
                <input
                  style={styles.input}
                  type="date"
                  name="activeTo"
                  value={form.activeTo?.slice(0, 10)}
                  onChange={handleChange}
                />
              </div>

              <div style={styles.row}>
                <input
                  style={styles.input}
                  name="mediaUrl"
                  value={form.mediaUrl}
                  onChange={handleChange}
                  placeholder="Media URL (optional)"
                />
                <input
                  style={styles.input}
                  type="file"
                  name="image"
                  onChange={handleChange}
                />
              </div>

              <button style={styles.submitBtn} type="submit">
                {isEditing ? "Update" : "Add New"}
              </button>
            </form>

            {/* Table Section */}
            <h2 style={{ marginTop: 25, color: "#0077b6" }}>📋 All Awareness Records</h2>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Title</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Region</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Active From</th>
                    <th style={styles.th}>Active To</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((item) => (
                    <tr key={item._id}>
                      <td style={styles.td}>{item.title}</td>
                      <td style={styles.td}>{item.category}</td>
                      <td style={styles.td}>{item.region}</td>
                      <td style={styles.td}>{item.type}</td>
                      <td style={styles.td}>{item.activeFrom?.slice(0, 10)}</td>
                      <td style={styles.td}>{item.activeTo?.slice(0, 10)}</td>
                      <td style={styles.td}>
                        <button style={styles.editBtn} onClick={() => handleEdit(item)}>
                          Edit
                        </button>
                        <button
                          style={styles.deleteBtn}
                          onClick={() => handleDelete(item._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
}

// Inline CSS styles
const styles = {
  pageWrapper: {
    background: "#f0f4f8",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto", // ✅ page scroll
  },
  mainLayout: {
    display: "flex",
    flex: 1,
    overflow: "hidden", // prevent double scrollbars
  },
  contentWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    height: "calc(100vh - 60px)", // Navbar height adjustment
    overflow: "hidden",
  },
  contentArea: {
    flex: 1,
    overflowY: "auto", // ✅ main content scroll
    padding: "20px",
    background: "#f9fafb",
    margin: "10px 20px",
    borderRadius: "10px",
    boxShadow: "0 0 8px rgba(0,0,0,0.1)",
  },
  header: {
    color: "#0077b6",
    textAlign: "center",
    marginBottom: "25px",
  },
  form: {
    background: "#fff",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "25px",
    border: "1px solid #ddd",
  },
  row: {
    display: "flex",
    gap: "10px",
    marginBottom: "10px",
  },
  input: {
    flex: 1,
    padding: "8px 10px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "14px",
  },
  submitBtn: {
    display: "block",
    background: "#0077b6",
    color: "white",
    padding: "10px 18px",
    border: "none",
    borderRadius: "6px",
    margin: "10px auto",
    cursor: "pointer",
    transition: "0.3s",
  },
  tableContainer: {
    overflowY: "auto",
    maxHeight: "60vh",
    borderRadius: "8px",
    border: "1px solid #ddd",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
  },
  th: {
    padding: "10px",
    textAlign: "left",
    borderBottom: "1px solid #eee",
    background: "#0077b6",
    color: "white",
    position: "sticky",
    top: 0,
    zIndex: 1,
  },
  td: {
    padding: "10px",
    borderBottom: "1px solid #eee",
  },
  editBtn: {
    background: "#ffd166",
    color: "#333",
    padding: "5px 10px",
    border: "none",
    borderRadius: "6px",
    marginRight: "5px",
    cursor: "pointer",
  },
  deleteBtn: {
    background: "#ef476f",
    color: "white",
    padding: "5px 10px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

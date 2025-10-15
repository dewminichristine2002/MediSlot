import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { api } from "../api";

export default function GuidelinesPage() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // ---------- Inline styles (no global CSS changes) ----------
  const styles = {
    headerTight: { marginBottom: 4 }, // tighter gap below the heading
    wrap: {
      maxWidth: 1200,
      width: "calc(100vw - 520px)", // leaves room for sidebar
      minWidth: 900,
      margin: "8px auto 24px auto",
    },
    card: { padding: 12, borderRadius: 12 },
    controlsCard: { padding: "6px 12px", borderRadius: 12 }, // slimmer bar
    controlsRow: {
      display: "flex",
      alignItems: "center", // vertical align
      justifyContent: "space-between",
      gap: 10,
      flexWrap: "nowrap", // keep on one line
    },
    search: {
      flex: "1 1 auto",
      minWidth: 420,
      height: 40, // same height as button
      padding: "0 12px",
      border: "1px solid #cfd4dc",
      borderRadius: 10,
      fontSize: 14,
      boxSizing: "border-box",
      margin: 0,
      background: "#fff",
    },
    addBtn: {
      height: 40,            // matches input height
      lineHeight: "40px",    // centers label
      padding: "0 16px",
      borderRadius: 10,
      fontWeight: 600,
      whiteSpace: "nowrap",
    },
    tableWrapper: { overflowX: "auto" },
    table: { width: "100%", borderCollapse: "separate", borderSpacing: 0 },
    theadTh: {
      height: 48,
      verticalAlign: "middle",
      textAlign: "left",
      padding: "0 12px",
    },
    row: { height: 72 },
    cell: { verticalAlign: "middle", padding: "12px" },
    imgCell: { width: 120 },
    categoryCell: { width: 200 },
    actionsCell: {
      width: 240,
      textAlign: "right",
      whiteSpace: "nowrap",
      paddingRight: 12,
    },
    img: {
      width: 56,
      height: 56,
      borderRadius: 10,
      objectFit: "cover",
      border: "1px solid #e5e7eb",
    },
    nameText: { fontWeight: 600 },
    badge: {
      display: "inline-block",
      background: "#dbeafe",
      color: "#1d4ed8",
      padding: "4px 10px",
      borderRadius: 999,
      fontSize: 12,
    },
    actBtn: {
      minWidth: 64,
      height: 36,
      lineHeight: "36px",
      padding: "0 12px",
      borderRadius: 10,
      marginLeft: 12, // even spacing between View/Edit/Delete
    },
  };
  // -----------------------------------------------------------

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get("/labtests");
        setTests(res.data || []);
        setFiltered(res.data || []);
      } catch {
        setErr("Failed to load guidelines");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // search by EN name / category
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      tests.filter(
        (t) =>
          t?.name?.toLowerCase().includes(q) ||
          t?.category?.toLowerCase().includes(q)
      )
    );
  }, [search, tests]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this guideline?")) return;
    try {
      await api.delete(`/labtests/${id}`);
      const res = await api.get("/labtests");
      setTests(res.data || []);
      setFiltered(res.data || []);
    } catch {
      alert("Error deleting guideline");
    }
  };

  return (
    <div className="layout">
      <Navbar />
      <div className="content">
        <Sidebar />
        <main>
          {/* Title with tight spacing */}
          <div className="header-row" style={styles.headerTight}>
            <h2>Guidelines</h2>
          </div>

          {/* Centered content area */}
          <div style={styles.wrap}>
            {/* Controls: Search + Add New (aligned on same row) */}
            <div className="card" style={styles.controlsCard}>
              <div style={styles.controlsRow}>
                <input
                  type="text"
                  placeholder="Search by name / category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={styles.search}
                />
                <button
                  className="btn-submit"
                  style={styles.addBtn}
                  onClick={() => navigate("/guideline-form")}
                >
                  + Add New
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="card event-table" style={styles.card}>
              {loading ? (
                <p className="muted">Loading...</p>
              ) : err ? (
                <div className="alert error">{err}</div>
              ) : filtered.length === 0 ? (
                <p className="muted">No guidelines found.</p>
              ) : (
                <div style={styles.tableWrapper}>
                  <table className="styled-table" style={styles.table}>
                    <colgroup>
                      <col style={styles.imgCell} />
                      <col /> {/* Name grows */}
                      <col style={styles.categoryCell} />
                      <col style={styles.actionsCell} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th style={styles.theadTh}>Image</th>
                        <th style={styles.theadTh}>Name</th>
                        <th style={styles.theadTh}>Category</th>
                        <th style={{ ...styles.theadTh, textAlign: "right" }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((t) => (
                        <tr key={t._id} style={styles.row}>
                          <td style={{ ...styles.cell }}>
                            {t.mediaUrl ? (
                              <img src={t.mediaUrl} alt="" style={styles.img} />
                            ) : (
                              <span className="muted">No image</span>
                            )}
                          </td>
                          <td style={{ ...styles.cell, ...styles.nameText }}>
                            {t.name || "-"}
                          </td>
                          <td style={styles.cell}>
                            {t.category ? (
                              <span style={styles.badge}>{t.category}</span>
                            ) : (
                              <span className="muted">N/A</span>
                            )}
                          </td>
                          <td style={styles.actionsCell}>
                            <button
                              className="btn-view"
                              style={styles.actBtn}
                              onClick={() => navigate(`/guidelines/${t._id}`)}
                            >
                              View
                            </button>
                            <button
                              className="btn-edit"
                              style={styles.actBtn}
                              onClick={() => navigate(`/guideline-form/${t._id}`)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn-delete"
                              style={styles.actBtn}
                              onClick={() => handleDelete(t._id)}
                            >
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
          </div>

          <Footer />
        </main>
      </div>
    </div>
  );
}

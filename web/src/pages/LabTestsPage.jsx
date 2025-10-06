import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { api } from "../api";

export default function LabTestsPage() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/labtests"); // or "/LabTests" if your backend is cased that way
      const data = res.data?.items || res.data || [];
      setTests(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load lab tests");
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const categories = Array.from(new Set(tests.map((t) => t.category).filter(Boolean)));

  const filtered = tests.filter((t) => {
    const name = (t.test_name || t.name || "").toLowerCase();
    const desc = (t.description || "").toLowerCase();
    const okQ = name.includes(q.toLowerCase()) || desc.includes(q.toLowerCase());
    const okCat = category ? (t.category || "").toLowerCase() === category.toLowerCase() : true;
    return okQ && okCat;
  });

  return (
    <div className="layout">
      <Navbar />
      <div className="content">
        <Sidebar />
        <main>
          <div className="header-row">
            <h2>Lab Tests</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                placeholder="Search name/description…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
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
                    <th>Test Name</th>
                    <th>Category</th>
                    <th>Price (Rs.)</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t._id}>
                      <td>{t.test_name || t.name || "-"}</td>
                      <td>{t.category || "-"}</td>
                      <td>{typeof t.price === "number" ? t.price.toFixed(2) : t.price || "-"}</td>
                      <td>{t.description || "-"}</td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr>
                      <td colSpan={4} className="muted">No lab tests found.</td>
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

import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { api } from "../api";

export default function GuidelinesPage() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/guidelines"); // change to /healthawareness if needed
      setItems(res.data?.items || res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load guidelines");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = items.filter((g) => {
    const t = (g.title || g.heading || "").toLowerCase();
    const d = (g.description || g.content || "").toLowerCase();
    return t.includes(q.toLowerCase()) || d.includes(q.toLowerCase());
  });

  return (
    <div className="layout">
      <Navbar />
      <div className="content">
        <Sidebar />
        <main>
          <div className="header-row">
            <h2>Guidelines</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                placeholder="Search…"
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
            <div className="card list">
              {filtered.map((g) => (
                <div key={g._id} className="list-item">
                  <div className="list-title">{g.title || g.heading || "Untitled"}</div>
                  <div className="muted">{g.description || g.content || "-"}</div>
                </div>
              ))}
              {!filtered.length && <div className="muted">No items found.</div>}
            </div>
          )}

          {/* Footer at the bottom */}
          <Footer />
        </main>
      </div>
    </div>
  );
}

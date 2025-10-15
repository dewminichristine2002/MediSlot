import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { api } from "../api";

export default function GuidelineDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("en");
  const [loading, setLoading] = useState(false);
  const [doc, setDoc] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/labtests/${id}`);
        setDoc(data || null);
      } catch {
        alert("Failed to load details");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const renderSection = (label, content) => (
    <div className="detail-section">
      <h4>{label}</h4>
      {Array.isArray(content) ? (
        content.length ? (
          <ul className="bullet-list">
            {content.map((line, i) => <li key={i}>{line}</li>)}
          </ul>
        ) : (
          <p className="muted">—</p>
        )
      ) : content ? <p>{content}</p> : <p className="muted">—</p>}
    </div>
  );

  const getLangView = (lang) => {
    if (!doc) return {};
    if (lang === "si" && doc.translations?.si) {
      return {
        name: doc.translations.si.name || doc.name,
        category: doc.translations.si.category || doc.category,
        what: doc.translations.si.what || doc.what,
        why: doc.translations.si.why || doc.why,
        preparation: doc.translations.si.preparation?.length ? doc.translations.si.preparation : doc.preparation,
        during: doc.translations.si.during?.length ? doc.translations.si.during : doc.during,
        after: doc.translations.si.after?.length ? doc.translations.si.after : doc.after,
        checklist: doc.translations.si.checklist?.length ? doc.translations.si.checklist : doc.checklist,
        mediaUrl: doc.translations.si.mediaUrl || doc.mediaUrl,
      };
    }
    return {
      name: doc.name,
      category: doc.category,
      what: doc.what,
      why: doc.why,
      preparation: doc.preparation,
      during: doc.during,
      after: doc.after,
      checklist: doc.checklist,
      mediaUrl: doc.mediaUrl,
    };
  };

  const view = getLangView(tab);

  return (
    <div className="layout">
      <Navbar />
      <div className="content">
        <Sidebar />
        <main>
          <div className="header-row">
            <h2>Guideline Details</h2>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button className="btn-secondary" onClick={() => navigate("/guidelines")}>← Back</button>
              <button className="btn-edit" onClick={() => navigate(`/guideline-form/${id}`)}>Edit</button>
            </div>
          </div>

          {loading || !doc ? (
            <div className="card"><p className="muted">{loading ? "Loading..." : "No data"}</p></div>
          ) : (
            <div className="card details-card">
              <div className="tabs" style={{ marginBottom: 16 }}>
                <button className={`tab-btn ${tab === "en" ? "active" : ""}`} onClick={() => setTab("en")}>English</button>
                <button className={`tab-btn ${tab === "si" ? "active" : ""}`} onClick={() => setTab("si")}>Sinhala</button>
              </div>

              <div className="details-header">
                <div className="details-header-text">
                  <h3>{view.name || "-"}</h3>
                  <div className="meta-row">
                    <span className="badge badge-blue">{view.category || "Uncategorized"}</span>
                  </div>
                </div>
                {view.mediaUrl ? (
                  <img
                    src={view.mediaUrl}
                    alt=""
                    style={{ width: 110, height: 110, borderRadius: 14, objectFit: "cover", border: "1px solid #e5e7eb" }}
                  />
                ) : null}
              </div>

              {renderSection("What", view.what)}
              {renderSection("Why", view.why)}
              {renderSection("Preparation", view.preparation || [])}
              {renderSection("During", view.during || [])}
              {renderSection("After", view.after || [])}

              <div className="detail-section">
                <h4>Checklist</h4>
                {Array.isArray(view.checklist) && view.checklist.length ? (
                  <ul className="checklist-static">
                    {view.checklist.map((c, i) => (
                      <li key={i}>
                        <input type="checkbox" checked={!!c.isMandatory} disabled />{" "}
                        <span className="key">{c.key}</span> — <span className="lbl">{c.label}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">—</p>
                )}
              </div>
            </div>
          )}

          <Footer />
        </main>
      </div>
    </div>
  );
}

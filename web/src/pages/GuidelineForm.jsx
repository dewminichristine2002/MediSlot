import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { api } from "../api";

export default function GuidelineForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState("en");

  const blankChecklistItem = { key: "", label: "", isMandatory: false };

  const [form, setForm] = useState({
    name: "",
    category: "",
    what: "",
    why: "",
    preparation: "",
    mediaUrl: "",
    checklist: [],                 // NEW (EN)
    translations: {
      si: {
        name: "",
        category: "",
        what: "",
        why: "",
        preparation: "",
        mediaUrl: "",
        checklist: [],             // NEW (SI)
      },
    },
  });

  // fetch for edit
  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/labtests/${id}`);
        // ensure checklist arrays exist
        const safe = {
          ...data,
          checklist: Array.isArray(data.checklist) ? data.checklist : [],
          translations: {
            si: {
              name: data?.translations?.si?.name || "",
              category: data?.translations?.si?.category || "",
              what: data?.translations?.si?.what || "",
              why: data?.translations?.si?.why || "",
              preparation: Array.isArray(data?.translations?.si?.preparation)
                ? data.translations.si.preparation.join("\n")
                : (data?.translations?.si?.preparation || ""),
              mediaUrl: data?.translations?.si?.mediaUrl || "",
              checklist: Array.isArray(data?.translations?.si?.checklist)
                ? data.translations.si.checklist
                : [],
            },
          },
          // flatten base preparation for textarea
          preparation: Array.isArray(data.preparation) ? data.preparation.join("\n") : (data.preparation || "")
        };
        setForm(safe);
      } catch {
        alert("Failed to load guideline");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // image upload
  const handleFileUpload = async (e, lang = "en") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    try {
      const { data } = await api.post("/uploads", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = data?.url;
      if (!url) throw new Error("No URL returned");
      if (lang === "si") {
        setForm((p) => ({ ...p, translations: { ...p.translations, si: { ...p.translations.si, mediaUrl: url } } }));
      } else {
        setForm((p) => ({ ...p, mediaUrl: url }));
      }
    } catch (err) {
      console.error(err);
      alert("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  // checklist helpers
  const addChecklist = (lang = "en") => {
    if (lang === "si") {
      setForm((p) => ({
        ...p,
        translations: { ...p.translations, si: { ...p.translations.si, checklist: [...(p.translations.si.checklist || []), { ...blankChecklistItem }] } }
      }));
    } else {
      setForm((p) => ({ ...p, checklist: [...(p.checklist || []), { ...blankChecklistItem }] }));
    }
  };
  const updateChecklist = (idx, field, value, lang = "en") => {
    if (lang === "si") {
      const next = [...(form.translations.si.checklist || [])];
      next[idx] = { ...next[idx], [field]: value };
      setForm((p) => ({ ...p, translations: { ...p.translations, si: { ...p.translations.si, checklist: next } } }));
    } else {
      const next = [...(form.checklist || [])];
      next[idx] = { ...next[idx], [field]: value };
      setForm((p) => ({ ...p, checklist: next }));
    }
  };
  const removeChecklist = (idx, lang = "en") => {
    if (lang === "si") {
      const next = [...(form.translations.si.checklist || [])];
      next.splice(idx, 1);
      setForm((p) => ({ ...p, translations: { ...p.translations, si: { ...p.translations.si, checklist: next } } }));
    } else {
      const next = [...(form.checklist || [])];
      next.splice(idx, 1);
      setForm((p) => ({ ...p, checklist: next }));
    }
  };

  // save
  const save = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      // split textarea by lines into arrays for backend
      preparation: form.preparation
        ? form.preparation.split("\n").map((s) => s.trim()).filter(Boolean)
        : [],
      translations: {
        si: {
          ...form.translations.si,
          preparation: form.translations.si.preparation
            ? form.translations.si.preparation.split("\n").map((s) => s.trim()).filter(Boolean)
            : [],
        },
      },
    };
    try {
      if (isEditing) await api.put(`/labtests/${id}`, payload);
      else await api.post("/labtests", payload);
      alert("✅ Saved successfully!");
      navigate("/guidelines");
    } catch (err) {
      console.error(err);
      alert("Error saving guideline");
    }
  };

  return (
    <div className="layout">
      <Navbar />
      <div className="content">
        <Sidebar />
        <main>
          <div className="header-row">
            <h2>{isEditing ? "Edit Guideline" : "Add New Guideline"}</h2>
            <div style={{ marginLeft: "auto" }}>
              <button className="btn-secondary" onClick={() => navigate("/guidelines")}>← Back</button>
            </div>
          </div>

          {loading ? (
            <div className="card"><p className="muted">Loading guideline…</p></div>
          ) : (
            <div className="card stylish-form">
              <div className="tabs" style={{ marginBottom: 16 }}>
                <button className={`tab-btn ${tab === "en" ? "active" : ""}`} onClick={() => setTab("en")}>English</button>
                <button className={`tab-btn ${tab === "si" ? "active" : ""}`} onClick={() => setTab("si")}>Sinhala</button>
              </div>

              <form onSubmit={save} className="event-form">
                {tab === "en" ? (
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Test Name (EN)</label>
                      <input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                        placeholder="Enter test name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Category (EN)</label>
                      <input
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        placeholder="Enter category"
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>What (EN)</label>
                      <textarea
                        rows="3"
                        value={form.what}
                        onChange={(e) => setForm({ ...form, what: e.target.value })}
                        placeholder="What is the test?"
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Why (EN)</label>
                      <textarea
                        rows="3"
                        value={form.why}
                        onChange={(e) => setForm({ ...form, why: e.target.value })}
                        placeholder="Why is the test done?"
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Preparation (EN) — one per line</label>
                      <textarea
                        rows="3"
                        value={form.preparation}
                        onChange={(e) => setForm({ ...form, preparation: e.target.value })}
                        placeholder="e.g.\nFasting 8–10 hours\nBring previous reports"
                      />
                    </div>

                    {/* Checklist (EN) */}
                    <div className="form-group full-width">
                      <label>Checklist (EN)</label>
                      <div className="checklist-editor">
                        {(form.checklist || []).map((it, idx) => (
                          <div className="checklist-row" key={`en-${idx}`}>
                            <input
                              placeholder="Key (e.g., fasting)"
                              value={it.key}
                              onChange={(e) => updateChecklist(idx, "key", e.target.value, "en")}
                            />
                            <input
                              placeholder="Label (shown to users)"
                              value={it.label}
                              onChange={(e) => updateChecklist(idx, "label", e.target.value, "en")}
                            />
                            <label className="chk">
                              <input
                                type="checkbox"
                                checked={Boolean(it.isMandatory)}
                                onChange={(e) => updateChecklist(idx, "isMandatory", e.target.checked, "en")}
                              />
                              Mandatory
                            </label>
                            <button type="button" className="btn-delete sm" onClick={() => removeChecklist(idx, "en")}>
                              Remove
                            </button>
                          </div>
                        ))}
                        <button type="button" className="btn-secondary" onClick={() => addChecklist("en")}>
                          + Add item
                        </button>
                      </div>
                    </div>

                    <div className="form-group full-width">
                      <label>Upload English Image</label>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "en")} />
                      {form.mediaUrl ? (
                        <img
                          src={form.mediaUrl}
                          alt=""
                          style={{ width: 96, height: 96, borderRadius: 12, marginTop: 8, objectFit: "cover", border: "1px solid #e5e7eb" }}
                        />
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Test Name (සිංහල)</label>
                      <input
                        value={form.translations.si.name}
                        onChange={(e) => setForm((p) => ({ ...p, translations: { ...p.translations, si: { ...p.translations.si, name: e.target.value } } }))}
                        placeholder="පරීක්ෂණ නාමය"
                      />
                    </div>
                    <div className="form-group">
                      <label>Category (සිංහල)</label>
                      <input
                        value={form.translations.si.category}
                        onChange={(e) => setForm((p) => ({ ...p, translations: { ...p.translations, si: { ...p.translations.si, category: e.target.value } } }))}
                        placeholder="ප්‍රවර්ගය"
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>What (සිංහල)</label>
                      <textarea
                        rows="3"
                        value={form.translations.si.what}
                        onChange={(e) => setForm((p) => ({ ...p, translations: { ...p.translations, si: { ...p.translations.si, what: e.target.value } } }))}
                        placeholder="පරීක්ෂණය කුමක්ද?"
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Why (සිංහල)</label>
                      <textarea
                        rows="3"
                        value={form.translations.si.why}
                        onChange={(e) => setForm((p) => ({ ...p, translations: { ...p.translations, si: { ...p.translations.si, why: e.target.value } } }))}
                        placeholder="මක් නිසාද?"
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Preparation (සිංහල) — line by line</label>
                      <textarea
                        rows="3"
                        value={form.translations.si.preparation}
                        onChange={(e) => setForm((p) => ({ ...p, translations: { ...p.translations, si: { ...p.translations.si, preparation: e.target.value } } }))}
                        placeholder="e.g.\nආහාර විරාමය පැය 8–10\nපෙර වාර්තා ගෙන එන්න"
                      />
                    </div>

                    {/* Checklist (SI) */}
                    <div className="form-group full-width">
                      <label>Checklist (සිංහල)</label>
                      <div className="checklist-editor">
                        {(form.translations.si.checklist || []).map((it, idx) => (
                          <div className="checklist-row" key={`si-${idx}`}>
                            <input
                              placeholder="Key (e.g., fasting)"
                              value={it.key}
                              onChange={(e) => updateChecklist(idx, "key", e.target.value, "si")}
                            />
                            <input
                              placeholder="Label (shown to users)"
                              value={it.label}
                              onChange={(e) => updateChecklist(idx, "label", e.target.value, "si")}
                            />
                            <label className="chk">
                              <input
                                type="checkbox"
                                checked={Boolean(it.isMandatory)}
                                onChange={(e) => updateChecklist(idx, "isMandatory", e.target.checked, "si")}
                              />
                              අනිවාර්යයි
                            </label>
                            <button type="button" className="btn-delete sm" onClick={() => removeChecklist(idx, "si")}>
                              Remove
                            </button>
                          </div>
                        ))}
                        <button type="button" className="btn-secondary" onClick={() => addChecklist("si")}>
                          + Add item
                        </button>
                      </div>
                    </div>

                    <div className="form-group full-width">
                      <label>Upload Sinhala Image</label>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "si")} />
                      {form.translations.si.mediaUrl ? (
                        <img
                          src={form.translations.si.mediaUrl}
                          alt=""
                          style={{ width: 96, height: 96, borderRadius: 12, marginTop: 8, objectFit: "cover", border: "1px solid #e5e7eb" }}
                        />
                      ) : null}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button type="button" className="btn-secondary" onClick={() => navigate("/guidelines")}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit" disabled={uploading}>
                    {uploading ? "Uploading..." : isEditing ? "Update Guideline" : "Save Guideline"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <Footer />
        </main>
      </div>
    </div>
  );
}

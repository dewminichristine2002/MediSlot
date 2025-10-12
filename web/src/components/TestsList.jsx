import React, { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { api } from "../api";
import { FaTrash, FaEdit, FaSave, FaMapMarkerAlt } from "react-icons/fa";

export default function TestsList() {
  const { center } = useOutletContext() || {};
  const { centerId } = useParams();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ price: "", capacity: "", daily_count: "" });

  useEffect(() => {
    const fetch = async () => {
      try {
        const id = center?._id || centerId;
        const { data } = await api.get(`/centers/${id}/tests`);
        setTests(data || []);
      } catch (e) {
        console.error("Failed to load tests", e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [center, centerId]);

  const handleDeactivate = async (serviceId) => {
    if (!window.confirm("Remove this test from your center?")) return;
    try {
      await api.put(`/center-services/${serviceId}`, { isActive: false });
      setTests((t) => t.filter((x) => x.center_service_id !== serviceId));
    } catch (e) {
      console.error(e);
      alert("Failed to remove test");
    }
  };

  const startEdit = (t) => {
    setEditingId(t.center_service_id);
    setForm({ price: t.price || "", capacity: t.capacity || "", daily_count: t.daily_count || "" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ price: "", capacity: "", daily_count: "" });
  };

  const saveEdit = async (serviceId) => {
    try {
      const payload = {
        price_override: form.price === "" ? null : Number(form.price),
        capacity: form.capacity === "" ? null : Number(form.capacity),
        daily_count: form.daily_count === "" ? null : Number(form.daily_count),
      };
      await api.put(`/center-services/${serviceId}`, payload);
      setTests((prev) => prev.map((it) => (it.center_service_id === serviceId ? { ...it, price: payload.price_override, capacity: payload.capacity, daily_count: payload.daily_count } : it)));
      cancelEdit();
    } catch (e) {
      console.error(e);
      alert("Failed to save");
    }
  };

  if (loading) return <p style={{ padding: 16 }}>Loading tests…</p>;
  if (!tests.length) return <p style={{ padding: 16 }}>No tests attached to this center.</p>;

  const coords = center?.location?.coordinates; // [lng, lat]
  const mapElement = coords && coords.length === 2 ? (
    <div style={{ width: 260, height: 140, borderRadius: 8, overflow: "hidden", boxShadow: "0 6px 18px rgba(0,0,0,0.08)" }}>
      <iframe
        title="center-map"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        src={`https://www.google.com/maps?q=${coords[1]},${coords[0]}&z=15&output=embed`}
      />
    </div>
  ) : (
    <div style={{ color: "#6b7280" }}>Location not available</div>
  );

  return (
    <main className="health-main">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <h2>Tests offered by this center</h2>
          <p style={{ marginTop: 6, color: '#555' }}>Manage the diagnostic tests your center provides.</p>
        </div>

        {coords && coords.length === 2 ? (
          <div style={{ width: 260, height: 140, borderRadius: 8, overflow: "hidden", boxShadow: "0 6px 18px rgba(0,0,0,0.08)" }}>
            <iframe
              title="center-map"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              src={`https://www.google.com/maps?q=${coords[1]},${coords[0]}&z=15&output=embed`}
            />
          </div>
        ) : (
          <div style={{ color: "#6b7280" }}>Location not available</div>
        )}
      </div>

      <div className="health-center-cards">
        {tests.map((t) => (
          <div key={t.center_service_id} className="health-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0 }}>{t.name}</h3>
                <p style={{ color: '#575f6a', marginTop: 6 }}>{t.category || 'General'}</p>

                <div style={{ marginTop: 8, color: '#374151' }}>
                  <div><strong>Price:</strong> {t.price != null ? ('Rs ' + t.price) : '—'}</div>
                  <div><strong>Capacity:</strong> {t.capacity != null ? t.capacity : '—'}</div>
                  <div><strong>Daily count:</strong> {t.daily_count != null ? t.daily_count : '—'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {editingId === t.center_service_id ? (
                  <>
                    <input placeholder="Price" value={form.price} onChange={(e)=>setForm(f=>({...f, price:e.target.value}))} style={{ padding:6, borderRadius:6, border:'1px solid #e6edf3' }} />
                    <input placeholder="Capacity" value={form.capacity} onChange={(e)=>setForm(f=>({...f, capacity:e.target.value}))} style={{ padding:6, borderRadius:6, border:'1px solid #e6edf3' }} />
                    <input placeholder="Daily count" value={form.daily_count} onChange={(e)=>setForm(f=>({...f, daily_count:e.target.value}))} style={{ padding:6, borderRadius:6, border:'1px solid #e6edf3' }} />
                    <div style={{ display:'flex', gap:8 }}>
                      <button className="btn btn-primary" onClick={()=>saveEdit(t.center_service_id)}><FaSave /> Save</button>
                      <button className="btn" onClick={cancelEdit}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <button className="btn btn-primary" onClick={()=>startEdit(t)}><FaEdit /> Edit</button>
                    <button className="btn btn-danger" onClick={()=>handleDeactivate(t.center_service_id)}><FaTrash /> Remove</button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

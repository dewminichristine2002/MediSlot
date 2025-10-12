import React, { useEffect, useState } from "react";
import {
  FaFlask,
  FaTrash,
  FaClinicMedical,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaSearch,
  FaStethoscope,
} from "react-icons/fa";
import { api } from "../api";
import "../styles/centers.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function CentersPage() {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [testsByCenter, setTestsByCenter] = useState({});
  const [testsLoading, setTestsLoading] = useState({});
  const [totalActiveServices, setTotalActiveServices] = useState(0);
  const [provincesCovered, setProvincesCovered] = useState(0);

  useEffect(() => {
    fetchCenters();
  }, []);

  const fetchCenters = async () => {
    try {
      const response = await api.get("/centers");
      const data = response.data || [];
      setCenters(data);

      // ✅ compute provinces covered
      const provinces = new Set(
        data.map((c) => c.address?.province).filter(Boolean)
      );
      setProvincesCovered(provinces.size);

      // ✅ preload tests counts for stats
      const promises = data.map((c) =>
        api.get(`/centers/${c._id}/tests`).then((r) => r.data).catch(() => [])
      );
      const results = await Promise.all(promises);
      const map = {};
      let total = 0;
      results.forEach((arr, i) => {
        const id = data[i]._id;
        map[id] = arr || [];
        total += (arr || []).length;
      });
      setTestsByCenter(map);
      setTotalActiveServices(total);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching centers:", error);
      setLoading(false);
    }
  };

  const fetchCenterTests = async (centerId) => {
    if (testsByCenter[centerId] || testsLoading[centerId]) return;
    setTestsLoading((s) => ({ ...s, [centerId]: true }));
    try {
      const { data } = await api.get(`/centers/${centerId}/tests`);
      setTestsByCenter((s) => ({ ...s, [centerId]: data }));
    } catch (e) {
      console.error("Failed to load center tests:", e);
      setTestsByCenter((s) => ({ ...s, [centerId]: [] }));
    } finally {
      setTestsLoading((s) => ({ ...s, [centerId]: false }));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this center?")) {
      try {
        await api.delete(`/centers/${id}`);
        setCenters(centers.filter((center) => center._id !== id));
      } catch (error) {
        console.error("Error deleting center:", error);
      }
    }
  };

  const filteredCenters = centers.filter((center) => {
    const matchesSearch = center.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesProvince =
      !selectedProvince ||
      (center.address && center.address.province === selectedProvince);
    return matchesSearch && matchesProvince;
  });

  const provinces = [
    "Northern",
    "North Western",
    "Western",
    "North Central",
    "Central",
    "Sabaragamuwa",
    "Eastern",
    "Uva",
    "Southern",
  ];

  const stats = [
    {
      value: centers.length,
      label: "Total Centers",
      icon: <FaClinicMedical />,
    },
    {
      value: totalActiveServices,
      label: "Active Services",
      icon: <FaStethoscope />,
    },
    {
      value: provincesCovered,
      label: "Provinces Covered",
      icon: <FaMapMarkerAlt />,
    },
  ];

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="centers-page">
          <div className="skeleton-loader">Loading...</div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="centers-page">
        {/* 🔍 Search Section */}
        <div
          className="search-section"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "24px",
          }}
        >
          <div
            className="search-bar"
            style={{
              display: "flex",
              alignItems: "center",
              background: "#fff",
              border: "1px solid #CBD5E1",
              borderRadius: "12px",
              padding: "6px 12px",
              width: "100%",
              maxWidth: "350px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            }}
          >
            <FaSearch
              className="search-icon"
              style={{ marginRight: "8px", color: "#64748B" }}
            />
            <input
              type="text"
              placeholder="Search centers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "0.95rem",
                background: "transparent",
              }}
            />
          </div>

          <select
            className="province-select"
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            style={{
              borderRadius: "12px",
              border: "1px solid #CBD5E1",
              padding: "8px 12px",
              fontSize: "0.95rem",
              color: "#333",
              background: "#fff",
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            }}
          >
            <option value="">All Provinces</option>
            {provinces.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </div>

        {/* 📊 Stats */}
        <div className="stats-section">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              {stat.icon}
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* 🏥 Centers Grid */}
        <div className="centers-grid">
          {filteredCenters.map((center) => (
            <div key={center._id} className="center-card">
              <h3 className="center-name">
                <FaClinicMedical /> {center.name}
              </h3>
              <div className="center-location">
                <FaMapMarkerAlt /> {center.address?.city || ""},{" "}
                {center.address?.province || ""}
              </div>
              <div className="center-services">
                <FaStethoscope />{" "}
                {testsByCenter[center._id]?.length ??
                  (center.services ? center.services.length : 0)}{" "}
                Services
              </div>
              <div className="center-contact">
                <span>
                  <FaPhoneAlt /> {center.contact?.phone || center.phone || "N/A"}
                </span>
                <span>
                  <FaEnvelope />{" "}
                  {center.contact?.email || center.email || "N/A"}
                </span>
              </div>

              <div className="center-actions">
                <button
                  onClick={() => {
                    const next = expanded === center._id ? null : center._id;
                    setExpanded(next);
                    if (next) fetchCenterTests(center._id);
                  }}
                  className="btn btn-primary"
                >
                  <FaFlask />
                  {expanded === center._id ? "Hide Tests" : "View Tests"}
                </button>
                <button
                  onClick={() => handleDelete(center._id)}
                  className="btn btn-danger"
                >
                  <FaTrash /> Delete
                </button>
              </div>

              {expanded === center._id && (
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: "1px solid #eef2f8",
                  }}
                >
                  {testsLoading[center._id] ? (
                    <div>Loading tests...</div>
                  ) : (
                    <div>
                      {(testsByCenter[center._id] || []).length === 0 ? (
                        <div style={{ color: "#6b7280" }}>
                          No tests for this center.
                        </div>
                      ) : (
                        <div style={{ overflowX: "auto" }}>
                          <table
                            style={{ width: "100%", borderCollapse: "collapse" }}
                          >
                            <thead>
                              <tr
                                style={{
                                  textAlign: "left",
                                  borderBottom: "1px solid #e6eef9",
                                }}
                              >
                                <th style={{ padding: "8px 6px" }}>Test Name</th>
                                <th style={{ padding: "8px 6px" }}>Category</th>
                                <th style={{ padding: "8px 6px" }}>Price</th>
                                <th style={{ padding: "8px 6px" }}>Capacity</th>
                                <th style={{ padding: "8px 6px" }}>Daily</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(testsByCenter[center._id] || []).map((t) => (
                                <tr
                                  key={t.test_id}
                                  style={{
                                    borderBottom: "1px solid #f1f5f9",
                                  }}
                                >
                                  <td style={{ padding: "10px 6px" }}>
                                    {t.name}
                                  </td>
                                  <td style={{ padding: "10px 6px" }}>
                                    {t.category || "General"}
                                  </td>
                                  <td style={{ padding: "10px 6px" }}>
                                    {t.price != null ? `Rs ${t.price}` : "—"}
                                  </td>
                                  <td style={{ padding: "10px 6px" }}>
                                    {t.capacity ?? "—"}
                                  </td>
                                  <td style={{ padding: "10px 6px" }}>
                                    {t.daily_count ?? "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}

import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { api } from "../api";

export default function CentersPage() {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/centers"); // change to "/Centers" if your backend uses uppercase
      setCenters(res.data?.items || res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load centers");
      setCenters([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="layout">
      <Navbar />
      <div className="content">
        <Sidebar />
        <main>
          <div className="header-row">
            <h2>Welcome to Centers</h2>
            <button className="btn" onClick={load}>Reload</button>
          </div>

          <Footer />
        </main>
      </div>
    </div>
  );
}

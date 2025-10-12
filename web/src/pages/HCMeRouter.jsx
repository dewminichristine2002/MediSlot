// src/pages/HCMeRouter.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function HCMeRouter() {
  const navigate = useNavigate();
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get("/centers/me");
        if (!mounted) return;
        navigate(`/healthcenter/${data._id}/home`, { replace: true });
      } catch (e) {
        setErr(
          e?.response?.data?.error ||
            e?.response?.data?.message ||
            "Unable to resolve your health center."
        );
      }
    })();
    return () => (mounted = false);
  }, [navigate]);

  if (err) return <p style={{ padding: 24, color: "#b91c1c" }}>{err}</p>;
  return <p style={{ padding: 24 }}>Loading your center…</p>;
}

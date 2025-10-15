// src/api/healthAwareness.js
import { getApiBaseUrl } from "../api/config";

const BASE = `${getApiBaseUrl().replace(/\/$/, "")}/api/health-awareness`;

// ✅ SAFE: absolute URL builder (handles Cloudinary or local)
export const toAbsolute = (u) => {
  if (!u) return null;
  const url = String(u).trim();

  // If already absolute (Cloudinary or external)
  if (/^https?:\/\//i.test(url)) return url;

  // Otherwise prefix backend base
  const base = getApiBaseUrl()?.trim().replace(/\/$/, "");
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
};

export async function listHealthAwareness(params = {}) {
  const url = new URL(BASE);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to load health awareness");
  return res.json();
}

export async function getHealthAwarenessOne(id) {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error("Health awareness item not found");
  return res.json();
}

// src/api/healthAwareness.js
import { getApiBaseUrl } from "../api/config";

const BASE = `${getApiBaseUrl()}/api/health-awareness`;

// Make "/uploads/xxx.png" absolute; pass through full URLs unchanged
export const toAbsolute = (u) => {
  if (!u) return null;
  return u.startsWith("/") ? `${getApiBaseUrl()}${u}` : u;
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

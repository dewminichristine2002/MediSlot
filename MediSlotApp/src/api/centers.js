// src/api/centers.js
import { getApiBaseUrl } from "../api/config";

/** Normalize centers so UI can always rely on c.coords = {lat, lng} when present */
export function normalizeCenter(c) {
  const lat = c?.coords?.lat ?? c?.latitude ?? null;
  const lng = c?.coords?.lng ?? c?.longitude ?? null;
  return {
    ...c,
    coords: lat != null && lng != null ? { lat, lng } : undefined,
  };
}

export async function fetchCenters(token) {
  const res = await fetch(`${getApiBaseUrl()}/api/centers`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error(`Centers fetch failed: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data.map(normalizeCenter) : [];
}

export async function fetchCenterTests(centerId, token) {
  const res = await fetch(`${getApiBaseUrl()}/api/centers/${centerId}/tests`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error(`Tests fetch failed: ${res.status}`);
  return res.json();
}

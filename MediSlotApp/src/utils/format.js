// src/utils/format.js
export function formatAddress(addr = {}) {
  const parts = [addr.line1, addr.city, addr.district, addr.province, addr.postalCode].filter(Boolean);
  return parts.join(", ");
}

export function formatHour(h) {
  if (!h) return "";
  if (h.closed) return `${h.day}: Closed`;
  if (h.open && h.close) return `${h.day}: ${h.open}–${h.close}`;
  return `${h.day}`;
}

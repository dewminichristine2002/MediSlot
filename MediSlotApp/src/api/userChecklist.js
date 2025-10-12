import { getApiBaseUrl } from "./config";
const BASE = `${getApiBaseUrl()}/api/user-checklist`;

export async function saveChecklistForTest({ userId, testId }) {
  const res = await fetch(`${BASE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, testId }),
  });
  if (!res.ok) throw new Error("Failed to save checklist");
  return res.json();
}

export async function getMyChecklists(userId) {
  const res = await fetch(`${BASE}?userId=${userId}`);
  if (!res.ok) throw new Error("Failed to fetch checklists");
  return res.json();
}

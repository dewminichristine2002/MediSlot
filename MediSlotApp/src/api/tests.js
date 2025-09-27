// src/api/tests.js
import { getApiBaseUrl } from "../api/config";

const BASE = `${getApiBaseUrl()}/api/tests`;

export async function fetchCategories() {
  const res = await fetch(`${BASE}/categories`);
  if (!res.ok) throw new Error("Failed to load categories");
  return res.json();
}

export async function fetchTests(category, q) {
  const url = new URL(`${BASE}/`);
  if (category) url.searchParams.set("category", category);
  if (q) url.searchParams.set("q", q);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to load tests");
  return res.json();
}

export async function fetchTestById(id) {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error("Test not found");
  return res.json();
}

// src/api/tests.js
import { getApiBaseUrl } from "../api/config";
const BASE = `${getApiBaseUrl()}/api/labtests`;

export const fetchCategories = async (lang = "en") => {
  const res = await fetch(`${BASE}/categories?lang=${lang}`);
  if (!res.ok) throw new Error("Failed to load categories");
  return res.json();
};

export async function fetchTests({ category, category_si, q, lang } = {}) {
  const url = new URL(`${BASE}/`);
  if (category) url.searchParams.set("category", category);
  if (category_si) url.searchParams.set("category_si", category_si);
  if (q) url.searchParams.set("q", q);
  if (lang) url.searchParams.set("lang", lang);   // <— important for localization
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to load tests");
  return res.json();
}

export async function fetchTestById(id) {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error("Test not found");
  return res.json();
}

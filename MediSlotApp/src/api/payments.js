// src/api/payments.js
import api from "./client";


// Hosted Checkout used for “Pay now”
export const createCheckoutSessionApi = (bookingId) =>
  api.post("/api/payments/checkout", { bookingId });

// (kept for future native flow; not used now)(Optional)
export const createIntentApi = (bookingId) =>
  api.post("/api/payments/intent", { bookingId });

// OPTIONAL: only if you add a route for this on the server
export const markPaidApi = (bookingId, payload = {}) =>
  api.post("/api/payments/mark-paid", { bookingId, ...payload });
